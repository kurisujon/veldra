# Handoff Report: TypeScript Type Check Error Investigation

## 1. Observation
- **Command Run**: `npx tsc --noEmit`
- **Primary Error Output**:
  ```
  src/features/cases/actions/index.ts:30:97 - error TS2345: Argument of type '{ p_first_name: string; p_last_name: string; p_date_of_birth: string; }' is not assignable to parameter of type 'undefined'.

  30   const { data: newCaseId, error: rpcError } = await supabase.rpc('create_case_with_applicant', {
                                                                                                      ~
  31     p_first_name: parsed.data.firstName,
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  ```
- **Secondary Cascading Errors (Examples)**:
  - `src/features/documents/actions/index.ts:55:76` - `Argument of type '{ p_case_id: string; ... }' is not assignable to parameter of type 'undefined'.`
  - `src/features/drafts/actions/index.ts:30:30` - `Property 'role' does not exist on type 'never'.`
  - `src/features/drafts/actions/index.ts:86:17` - `Object literal may only specify known properties, and 'case_id' does not exist in type 'never[]'.`
  - `tests/helpers/db-utils.ts:90:15` - `Object literal may only specify known properties, and 'user_id' does not exist in type 'never[]'.`
- **File Content of `src/types/database.ts`**:
  - The `Database['public']['Tables']` interface defines table objects (`cases`, `applicants`, `documents`, `findings`, `generated_drafts`, `draft_findings`, `export_packages`). However, none of these table objects contain a `Relationships` property (e.g. lines 6–28 in `src/types/database.ts` only list `Row`, `Insert`, and `Update`).
  - The `user_roles` table is entirely missing from `Database['public']['Tables']`.
  - The functions `upload_document_record` and `delete_document` are entirely missing from `Database['public']['Functions']`.
- **SDK Type Definitions (from `node_modules/@supabase/supabase-js/src/lib/rest/types/common/common.ts`)**:
  - `GenericTable` is defined as:
    ```typescript
    export type GenericTable = {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
      Relationships: GenericRelationship[]
    }
    ```
    Note that the `Relationships` property is **mandatory** (not marked optional via `?`).
  - `GenericSchema` is defined as:
    ```typescript
    export type GenericSchema = {
      Tables: Record<string, GenericTable>
      Views: Record<string, GenericView>
      Functions: Record<string, GenericFunction>
    }
    ```

---

## 2. Logic Chain
1. **Generic Type Mismatch**:
   - `createServerClient<Database>(...)` and `createBrowserClient<Database>(...)` yield a `SupabaseClient<Database, SchemaName, Schema>` instance.
   - The third type parameter `Schema` is inferred as:
     `Omit<Database, '__InternalSupabase'>[SchemaName] extends GenericSchema ? Omit<Database, '__InternalSupabase'>[SchemaName] : never`.
   - Since `SchemaName` defaults to `'public'`, TS checks if `Database['public'] extends GenericSchema`.
   - To extend `GenericSchema`, every table under `Database['public']['Tables']` must satisfy `GenericTable` (which mandates `Relationships: GenericRelationship[]`).
   - Because all tables in the current `src/types/database.ts` lack the `Relationships` property, `Database['public'] extends GenericSchema` evaluates to `false`.
   - As a result, the `Schema` generic falls back to `never`.
2. **Schema Invalidation to `never`**:
   - Once `Schema` is resolved as `never`, all properties of tables and functions inside Supabase client calls (`supabase.from(...)` and `supabase.rpc(...)`) resolve as `never` or `never[]`.
   - In `src/features/cases/actions/index.ts` (line 30), `supabase.rpc(...)` looks up arguments in `never['Functions']`.
   - Since `never['Functions']` is invalid/empty, the arguments expected fallback to `undefined`, making the object `{ p_first_name: ... }` invalid and producing the compilation error `Argument of type '{...}' is not assignable to parameter of type 'undefined'`.
3. **Missing Schema Objects**:
   - Actions like `generateDrafts` and `uploadDocument` make queries referencing `user_roles`, `upload_document_record`, and `delete_document` which are absent from `src/types/database.ts`. Even if the `never` type collapse is fixed, these specific calls will fail type-checking because they do not exist in the schema definitions.

---

## 3. Caveats
- No caveats. The root cause is fully accounted for by the typescript type definitions and compiler behavior.

---

## 4. Conclusion
The compilation failure is caused by a corrupted/incomplete `src/types/database.ts` file which:
1. Lacks the `Relationships` property on its tables, causing the client types to fall back to `never`.
2. Lacks the `user_roles` table, `upload_document_record` function, and `delete_document` function entirely.

### Actionable Fix Strategy:
We can solve this issue strictly without using type bypasses (`as any`, `@ts-ignore`, etc.) using one of two methods:

#### Method A (Command-based Recovery - Recommended)
Since the project has built-in scripts to manage database types, run:
```bash
npm run restore-db
```
This runs `git restore src/types/database.ts` to retrieve the committed production-ready type definitions. Alternatively, if the local DB is running and linked, run:
```bash
npm run gen-types
```
to regenerate correct types from the live schema.

#### Method B (Manual Types Enrichment)
If recovering from git/CLI is not desired, we can edit `src/types/database.ts` to be fully compliant with the SDK:
1. **Add `Relationships` to all tables**:
   Add `Relationships: [];` (or accurate relationship configurations) to all tables.
2. **Add `user_roles` Table**:
   Add the following object under `Tables`:
   ```typescript
   user_roles: {
     Row: {
       user_id: string;
       role: 'Admin' | 'Reviewer';
     };
     Insert: {
       user_id: string;
       role: 'Admin' | 'Reviewer';
     };
     Update: {
       user_id?: string;
       role?: 'Admin' | 'Reviewer';
     };
     Relationships: [];
   };
   ```
3. **Add Missing RPC Functions**:
   Add `upload_document_record` and `delete_document` under `Functions`:
   ```typescript
   upload_document_record: {
     Args: {
       p_case_id: string;
       p_type: 'PSABirth' | 'PSAMarriage' | 'TOR' | 'SF10' | 'Diploma';
       p_file_path: string;
       p_file_name: string;
       p_file_size: number;
       p_mime_type: string;
     };
     Returns: string;
   };
   delete_document: {
     Args: {
       p_document_id: string;
     };
     Returns: unknown;
   };
   ```

---

## 5. Verification Method
1. Apply either Method A or Method B to update `src/types/database.ts`.
2. Run TypeScript compilation to check if it compiles clean:
   ```bash
   npx tsc --noEmit
   ```
3. Run the Next.js build script:
   ```bash
   npm run build
   ```
   Verify that the compiler errors in `src/features/cases/actions/index.ts`, `src/features/drafts/actions/index.ts`, and test files are resolved.
