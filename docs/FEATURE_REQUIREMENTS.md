# Feature Requirements

## 1. Document Ingestion
- Support PDF, JPG, PNG formats.
- Specific categorization for: PSA Birth Certificate, PSA Marriage Certificate, TOR, SF10, Diploma.

## 2. Cross-Document Comparison Engine
The core intelligence of Veldra. Once data is extracted, the engine actively compares data points across the document suite.

### Explicit Comparisons
The engine performs strict evaluations between the following document pairs:
- **Birth Certificate ↔ Marriage Certificate**
- **Birth Certificate ↔ TOR**
- **Birth Certificate ↔ Diploma**
- **Marriage Certificate ↔ TOR**
- **Marriage Certificate ↔ Diploma**
- **TOR ↔ Diploma**

### Fields Compared
- **First Name, Middle Name, Last Name**: Exact match and fuzzy match for common typos.
- **Date of Birth**: Strict match across all documents.
- **Address**: Semantic comparison for logical matches despite formatting differences.
- **Institution**: Name matching between TOR and Diploma.
- **Dates**: Chronological validation (e.g., Enrollment dates).
- **Academic Timeline**: Continuous year-over-year progression checking.

### Discrepancy to Finding Generation
Any failure in the comparison engine automatically generates a structured `Finding` (see `FINDINGS_SYSTEM.md`), assigning severity and category, and linking the exact source documents that conflict.

## 3. Document Generation
- Generate "Draft Affidavit of Discrepancy" based on High-severity Name findings.
- Generate "Address Explanation Letters" based on Medium-severity Address findings.
- Generate "School Gap Explanation Letters" based on Timeline findings.
- Allow inline editing of generated drafts via DraftEditor.

## 4. Export and Reporting
- Export finalized documents as PDF or Word.
- Generate a summary report of all detected discrepancies.
