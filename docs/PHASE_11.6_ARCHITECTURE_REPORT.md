# Phase 11.6: Zero-Trust Philippine Document Extraction Architecture

## A. Current Architecture Assessment (Phase 11.5)
The Phase 11.5 implementation successfully decoupled the OCR process from the structuring step. For native PDFs, it uses `pdf-parse`; for scans, it uses a zero-temperature `gemini-2.5-flash` pass. The extracted JSON is then cross-referenced against the OCR string by a deterministic `evidence-validator`, and all fields are forced into a `NeedsReview` state. 

**Strengths**: Separation of reading and structuring, strict Zod-schema constraints, cross-reference validation, hit-in-the-loop (HITL) enforcement.
**Critical Weaknesses**: 
1. **Generative OCR Weakness**: The first-pass OCR for scans still relies on Gemini. Because Gemini is a generative LLM, the foundational evidence layer can hallucinate text before validation even occurs.
2. **AI-Generated Evidence**: The AI is currently trusted to generate `sourceText`, `pageNumber`, and `boundingBox`. It could fabricate a bounding box or source string that matches its own generated OCR output.
3. **Single String OCR**: OCR text is stored as one massive string (`ocrText`) instead of structured spans, making precise bounding box alignment impossible without AI guessing.
4. **Binary Absence**: Relies on `null` for missing values, encouraging AI guessing instead of explicit states (`not_present`, `unreadable`).

## B. Phase 11.6 Gap Analysis
To achieve a Zero-Trust architecture, Veldra must cross the following gaps:
- **Gap 1: Authoritative OCR Layer**: Replace Gemini OCR for scans with a deterministic layout/OCR engine (e.g., Google Cloud Document AI) that natively emits immutable bounding boxes and text spans.
- **Gap 2: Canonical Evidence Map**: Move away from a single `ocrText` string to a structured `ocr_spans` mapping. The AI must reference immutable span IDs instead of returning arbitrary strings.
- **Gap 3: Document Profiles**: Move from generic schemas to a strict registry of Philippine-specific document profiles (`src/lib/extraction/profiles/`) detailing exact field rules, validations, and evidence requirements.
- **Gap 4: Multi-Dimensional Confidence**: Deconstruct the single percentage confidence into a `FieldReliability` interface (`ocrConfidence`, `evidenceStrength`, `schemaValid`, `extractionAgreement`).

## C. Proposed Architecture
The new architecture enforces a strict **Three-Layer Trust System**:
- **LAYER 1 — OBSERVED EVIDENCE**: Deterministically captured by the OCR Provider. Immutable blocks of text, spans, and bounding boxes.
- **LAYER 2 — INTERPRETED CANDIDATE**: AI proposals. The AI acts only as an indexer, proposing that a specific semantic field (e.g., `sponsorFullName`) is supported by a specific array of Layer 1 `evidenceSpanIds`.
- **LAYER 3 — VERIFIED DATA**: Candidate data that has passed deterministic schema/profile validation and explicit human review. Only Layer 3 data is allowed to enter the cross-reference and finding engine.

## D. Proposed Database / Data Model
The database will be enhanced to support canonical evidence mapping:

**New Tables**:
- `ocr_pages` (page metadata, dimensions)
- `ocr_spans` (id, extraction_id, page_number, text, normalized_text, bounding_box, ocr_confidence, block_type)
- `field_evidence` (join table mapping `document_fields.id` to `ocr_spans.id` with an `evidence_role`)

**Modified Tables**:
- `document_fields`: Add `state` (`observed`, `not_present`, `unreadable`, `ambiguous`). Remove `source_text` (replaced by `field_evidence` mapping).
- `document_extractions`: Update to track `ocr_provider` and multi-dimensional reliability stats.

## E. Proposed Extraction Workflow
1. **Document Inspector**: Classifies file (Native PDF vs Scan) and evaluates base quality (PASS, DEGRADED, REJECT).
2. **OCR Provider Abstraction**: Routes to deterministic `pdf-parse` or dedicated OCR/Layout engine. Outputs structured `EvidenceSpan`s.
3. **Canonical Evidence Map**: Stores the spans immutably in the database.
4. **Candidate Extraction (Gemini)**: Reads the Evidence Map and Document Profile. Returns `{ field, value, state, evidenceSpanIds }`.
5. **Deterministic Evidence Validator**: Validates that the AI-proposed `evidenceSpanIds` actually exist, belong to the document, and semantically match the value.
6. **Multi-Dimensional Scoring**: Evaluates `ocrConfidence`, `evidenceStrength`, `schemaValid`, and triggers dual-extraction (Flash + Pro) for high-risk field conflicts.
7. **Human Review**: UI highlights the exact canonical bounding boxes for the reviewer to approve.

## F. Philippine Document Profile Plan
Establish a registry (`src/lib/extraction/profiles/`) mapping documents to specialized profiles. 
Initial implementation priorities (Tier 1):
1. **Applicant/Sponsor PSA Birth Certificate**: Schema focused explicitly on parent/child relationships.
2. **Sponsor Valid ID**: Specialized parsers per subtype (Philippine Passport, UMID, Driver's License, PRC ID).
3. **Affidavit of Support**: Clause-level extraction targeting the relationship phrase and support commitment sentences.

Subsequent Tiers (Tier 2 & 3):
- Employment/Income (COE, ITR - form-aware parsing based on BIR versions like 1700/1701).
- Address/Financial (Proof of Billing, Bank Statements - strict separation of observed balances vs. derived income).

## G. Security / Trust-Boundary Analysis
- **AI Boundary**: AI is restricted entirely to Layer 2. It can never instantiate Layer 1 evidence. It cannot generate coordinates. 
- **Comparison Engine Boundary**: The comparison engine is isolated from Layer 1 and Layer 2. It only accepts Layer 3 (human-approved) fields.
- **RAG/Orchestration**: Expressly excluded from the extraction core. Extraction is a functional, deterministic pipeline mapping observed pixels to semantic fields. RAG is unnecessary for this process.

## H. Testing and Evaluation Strategy
Move away from basic unit tests and implement a rigorous benchmark suite:
- Create `tests/extraction-fixtures/` containing sanitized, real-world Philippine document PDFs/images.
- Define gold-standard expected JSON outputs (mapping specific bounding boxes and values).
- Track specific metrics:
  - Exact field accuracy (Target: ≥ 99% for critical IDs/Names).
  - False hallucination rate (Target: < 0.5%).
  - OCR character error rate.
- Testing success is defined by dataset precision/recall, not just `next build`.

## I. Migration Plan from Phase 11.5
1. Build the new `OCRProvider` interfaces and implement a deterministic provider (e.g., Google Document AI).
2. Execute DB migrations to create `ocr_spans` and `field_evidence`, deprecating `source_text`.
3. Build the `DocumentProfile` registry and port the existing Zod schemas over.
4. Refactor the `extractDocumentGrounded` pipeline to output Layer 2 candidates referencing spans.
5. Update `ExtractionWorkspace.tsx` to render bounding boxes strictly from the `ocr_spans` table.

## J. Risks and Unresolved Decisions
- **OCR Provider Selection**: Google Document AI is highly capable but requires cloud infrastructure setup. A decision must be made on the initial production provider.
- **Legacy Migrations**: Existing `document_fields` in the DB that use the old `source_text` format will lack `field_evidence` spans. A strategy for backfilling or archiving legacy extractions is required.
- **Performance Overhead**: Dual-extraction on high-risk fields and large `ocr_spans` inserts will increase database load and processing duration per document.

## Phase 11.6 Zero-Trust Canonical Evidence

11.6-C establishes: Observed Evidence -> Canonical Evidence Map -> future Candidate Extraction. The AI has NO authority over the observed evidence layer.

## Phase 11.6-F: Document Profile Registry

Implemented strongly-typed Profile Registry replacing generic validation. 
- Profiles (PSA Birth Certificate, Sponsor Valid ID, Affidavit of Support) define exact field metadata.
- Zod validation and normalization boundaries strictly separate document semantics from evidence validation.
- AI is dynamically prompted based on the profile, enforcing candidate states and zero-trust limits.
- **Phase 11.6-G Complete:** Field Reliability & Dual Extraction implemented. Evaluates deterministic FieldReliability on a per-field basis (escalating high-risk or low-confidence to Gemini 2.5 Pro). Pro extraction strictly inherits EvidenceMap authority and conflicts are handled deterministically.

## Phase 11.6-H: Human Verification Workspace & RPC Security

Implemented strict RPC boundary for human verification, resolving a deadlock where the generic Server Action could not mutate the verified state required by the Comparison Engine.

- **RPC Implementation**: Created `verify_document_field` PL/pgSQL function to execute transitions (candidate -> verified, correct -> verified) using `SECURITY DEFINER` privileges.
- **RLS Lockdown**: Revoked generic `UPDATE` privileges on `document_fields` for standard reviewers, forcing state mutations to happen exclusively through the audited RPC.
- **UI Integration**: Refactored `ExtractionWorkspace.tsx` to visualize the new canonical `field.state` and strictly present the multi-dimensional `FieldReliability` matrix (OCR Confidence, Profile Risk, Evidence Coverage) instead of legacy `evidence_status`.
