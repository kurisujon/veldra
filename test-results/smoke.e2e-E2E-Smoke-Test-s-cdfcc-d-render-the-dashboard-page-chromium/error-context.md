# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.e2e.spec.ts >> E2E Smoke Test >> should log in programmatically and render the dashboard page
- Location: tests/smoke.e2e.spec.ts:24:7

# Error details

```
AuthApiError: Invalid API key
```

```
AuthApiError: Invalid API key
```

# Test source

```ts
  1   | import { createClient } from '@supabase/supabase-js';
  2   | import type { User } from '@supabase/supabase-js';
  3   | import type { Database } from '../../src/types/database';
  4   | import dotenv from 'dotenv';
  5   | import path from 'path';
  6   | 
  7   | dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
  8   | dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
  9   | 
  10  | const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  11  | const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  12  | 
  13  | if (!supabaseUrl) {
  14  |   throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.');
  15  | }
  16  | if (!serviceRoleKey) {
  17  |   throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please check your environment variables.');
  18  | }
  19  | 
  20  | // Admin client that bypasses RLS
  21  | export const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  22  |   auth: {
  23  |     persistSession: false,
  24  |     autoRefreshToken: false,
  25  |   },
  26  | });
  27  | 
  28  | /**
  29  |  * Find a user by their email address using pagination.
  30  |  */
  31  | export async function findUserByEmail(email: string): Promise<User | null> {
  32  |   let page = 1;
  33  |   const limit = 100;
  34  | 
  35  |   while (true) {
> 36  |     const { data, error } = await adminSupabase.auth.admin.listUsers({
      |                             ^ AuthApiError: Invalid API key
  37  |       page,
  38  |       perPage: limit,
  39  |     });
  40  | 
  41  |     if (error) {
  42  |       throw error;
  43  |     }
  44  | 
  45  |     const users = data?.users || [];
  46  |     if (users.length === 0) {
  47  |       break;
  48  |     }
  49  | 
  50  |     const found = users.find(u => u.email === email);
  51  |     if (found) {
  52  |       return found;
  53  |     }
  54  | 
  55  |     if (users.length < limit) {
  56  |       break;
  57  |     }
  58  | 
  59  |     page++;
  60  |   }
  61  | 
  62  |   return null;
  63  | }
  64  | 
  65  | /**
  66  |  * Creates a test user in auth.users and assigns a role in public.user_roles.
  67  |  */
  68  | export async function createTestUser(email: string, password: string, role: 'Admin' | 'Reviewer') {
  69  |   // Check if user already exists
  70  |   const existingUser = await findUserByEmail(email);
  71  | 
  72  |   let userId: string;
  73  | 
  74  |   if (existingUser) {
  75  |     userId = existingUser.id;
  76  |   } else {
  77  |     const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
  78  |       email,
  79  |       password,
  80  |       email_confirm: true,
  81  |     });
  82  |     if (createError) throw createError;
  83  |     if (!newUser.user) throw new Error('Failed to create user object');
  84  |     userId = newUser.user.id;
  85  |   }
  86  | 
  87  |   // Assign role (UPSERT to avoid conflicts)
  88  |   const { error: roleError } = await adminSupabase
  89  |     .from('user_roles')
  90  |     .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
  91  |     
  92  |   if (roleError) throw roleError;
  93  | 
  94  |   return userId;
  95  | }
  96  | 
  97  | /**
  98  |  * Deletes a test user by their email address.
  99  |  */
  100 | export async function deleteUserByEmail(email: string) {
  101 |   const targetUser = await findUserByEmail(email);
  102 |   if (targetUser) {
  103 |     // Delete role first
  104 |     await adminSupabase.from('user_roles').delete().eq('user_id', targetUser.id);
  105 |     
  106 |     // Delete authentication user record
  107 |     const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(targetUser.id);
  108 |     if (deleteError) throw deleteError;
  109 |   }
  110 | }
  111 | 
  112 | /**
  113 |  * Deletes all database records and storage files associated with a case ID.
  114 |  */
  115 | export async function cleanUpTestCase(caseId: string) {
  116 |   // 1. Delete storage files under the case prefix
  117 |   try {
  118 |     const { data: docs, error: queryError } = await adminSupabase
  119 |       .from('documents')
  120 |       .select('file_path')
  121 |       .eq('case_id', caseId);
  122 | 
  123 |     if (queryError) {
  124 |       console.error(`Failed to query documents for case ${caseId}:`, queryError);
  125 |     } else if (docs && docs.length > 0) {
  126 |       const pathsToDelete = docs.map(d => d.file_path);
  127 |       const { error: removeError } = await adminSupabase.storage
  128 |         .from('documents')
  129 |         .remove(pathsToDelete);
  130 |       if (removeError) {
  131 |         console.error(`Failed to remove storage files for case ${caseId}:`, removeError);
  132 |       }
  133 |     }
  134 |   } catch (err) {
  135 |     console.error(`Failed to clean up storage files for case ${caseId}:`, err);
  136 |   }
```