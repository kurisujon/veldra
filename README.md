# Veldra

A Smart Document Verification Platform tailored for checking student visa application documents. It automates the extraction and cross-referencing of critical data across documents (PSA Birth Certificates, Transcripts, and Diplomas), flagging inconsistencies and generating necessary legal drafts. Built with Next.js and Supabase.

## Features
- **Document Ingestion:** Securely upload and categorize applicant documents.
- **Cross-Document Comparison Engine:** Automatically evaluate data points (names, dates, addresses, timelines) across multiple documents.
- **Findings Generation:** Automatically flag discrepancies with severity levels and exact document sources.
- **Automated Legal Drafts:** Generate Affidavits of Discrepancy and Explanation Letters based on findings.
- **Export & Reporting:** Generate comprehensive summary reports and finalized document packages.

## Tech Stack
- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS (Custom Design System)
- **Validation:** Zod
