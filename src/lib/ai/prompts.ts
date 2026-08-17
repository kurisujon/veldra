/**
 * Extraction prompts for the Veldra pipeline.
 *
 * Each prompt instructs Gemini to extract structured fields with evidence,
 * following strict anti-hallucination rules. Every extracted field must include
 * source evidence from the document.
 *
 * The prompts are constructed from:
 * 1. Universal anti-hallucination system instructions
 * 2. Document-specific field schemas with evidence
 * 3. Few-shot examples (for documents with extraction profiles)
 * 4. OCR context text (when available)
 */

import { getExtractionProfile } from './profiles';

// ---------------------------------------------------------------------------
// Anti-Hallucination System Instructions
// ---------------------------------------------------------------------------

const ANTI_HALLUCINATION_RULES = `
STRICT EXTRACTION RULES — YOU MUST FOLLOW ALL OF THESE:

1. Extract ONLY information explicitly visible in the document. Do NOT invent, infer, or assume any values.
2. NEVER infer a person's name from context, common knowledge, or other fields.
3. NEVER infer a date that is not explicitly printed on the document.
4. NEVER infer a registry number or certificate number.
5. NEVER "correct" a name to a more common spelling. Preserve the EXACT spelling as visible.
6. Preserve ALL spaces, hyphens, apostrophes, suffixes (Jr., Sr., III), and punctuation exactly as they appear.
7. If a character is unreadable or ambiguous, set the field's status to "uncertain" and include what you can read.
8. If multiple interpretations are possible (e.g., "SANT0S" could be "SANTOS"), extract what you see literally and mark as "uncertain".
9. If a field is not present or completely blank, set value to null and status to "missing".
10. Every extracted field MUST include "sourceText" — the exact text you read from the document for that field.
11. sourceText must come ONLY from what is visible in the document. Do not fabricate source evidence.
12. Do NOT use external knowledge to fill missing document information.
13. Do NOT use gender-based name heuristics to determine which section a name belongs to.
14. Use document LAYOUT (section labels, form position) to determine which field a value belongs to, NOT name guessing.

PRIORITY ORDER: DOCUMENT LABELS > FORM LAYOUT POSITION > EXPLICIT TEXT > NOTHING

IMPORTANT: It is ALWAYS better to return null with status "missing" than to guess a value.
`.trim();

// ---------------------------------------------------------------------------
// Evidence Schema Template
// ---------------------------------------------------------------------------

const EVIDENCE_FIELD_SCHEMA = `
For EVERY field, return an object with:
{
  "value": <extracted value as string, or null if not found>,
  "sourceText": <the exact text you read from the document for this field, or null>,
  "page": <page number where found (1-indexed), or null>,
  "confidence": <your confidence 0.0-1.0 in the extraction accuracy>,
  "status": <one of: "verified", "uncertain", "missing", "unreadable">
}

Status meanings:
- "verified": You can clearly read the field and are confident in the extraction.
- "uncertain": The field exists but is ambiguous, partially illegible, or you are not fully confident.
- "missing": The field does not appear on the document or is intentionally left blank.
- "unreadable": The field location is identified but the text cannot be read at all.
`.trim();

// ---------------------------------------------------------------------------
// Main Prompt Generator
// ---------------------------------------------------------------------------

/**
 * Generates an evidence-grounded extraction prompt for the specified document type.
 * Optionally includes OCR context text for cross-referencing.
 */
export function getExtractionPrompt(documentType: string, ocrText?: string): string {
  const type = documentType.toLowerCase();
  let prompt: string;

  if (type.includes('birth') || type === 'psabirth') {
    prompt = buildPSABirthPrompt(ocrText);
  } else if (type.includes('marriage') || type === 'psamarriage') {
    prompt = buildMarriageCertificatePrompt(ocrText);
  } else if (type.includes('tor') || type.includes('transcript') || type === 'tor') {
    prompt = buildTORPrompt(ocrText);
  } else if (type === 'sf10' || type.includes('sf10')) {
    prompt = buildSF10Prompt(ocrText);
  } else if (type.includes('diploma') || type === 'diploma') {
    prompt = buildDiplomaPrompt(ocrText);
  } else if (type.includes('bank') || type === 'bankstatement') {
    prompt = buildBankStatementPrompt(ocrText);
  } else if (type.includes('billing') || type === 'proofofbilling') {
    prompt = buildProofOfBillingPrompt(ocrText);
  } else if (type.includes('sponsorvalidid') || type === 'validid') {
    prompt = buildSponsorValidIDPrompt(ocrText);
  } else if (type.includes('sponsorcoe') || type === 'coe') {
    prompt = buildSponsorCOEPrompt(ocrText);
  } else if (type.includes('sponsoritr') || type === 'itr') {
    prompt = buildSponsorITRPrompt(ocrText);
  } else if (type.includes('affidavit') || type === 'affidavitofsupport') {
    prompt = buildAffidavitPrompt(ocrText);
  } else {
    throw new Error(`Unsupported document type for prompt template: ${documentType}`);
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// OCR Context Section
// ---------------------------------------------------------------------------

function buildOCRContext(ocrText?: string): string {
  if (!ocrText || ocrText.trim().length === 0) return '';

  return `
OCR REFERENCE TEXT:
The following text was separately extracted from this document via OCR.
Use it as a cross-reference to verify your readings. If your visual reading
differs from the OCR text, note the discrepancy with "uncertain" status.

---BEGIN OCR TEXT---
${ocrText.substring(0, 8000)}
---END OCR TEXT---
`;
}

// ---------------------------------------------------------------------------
// PSA Birth Certificate
// ---------------------------------------------------------------------------

function buildPSABirthPrompt(ocrText?: string): string {
  const profile = getExtractionProfile('PSABirth');
  const examplesSection = profile ? buildExamplesSection(profile.examples) : '';

  return `You are a high-precision document extraction agent for Philippine PSA Birth Certificates (Certificate of Live Birth).

${ANTI_HALLUCINATION_RULES}

DOCUMENT LAYOUT GUIDE for Philippine PSA Birth Certificates:
- The CHILD's name (the person whose birth is registered) is at the TOP of the form (Sections 1-3).
- The MOTHER's maiden name is in the MIDDLE section (Sections 6-9). Her maiden name is the name she had BEFORE marriage.
- The FATHER's name is in the LOWER section (Sections 13-17). This is a DIFFERENT person from the child and mother.
- "firstName", "middleName", "lastName" refer ONLY to the CHILD, NOT the parents.
- These three sets of names (child, mother, father) are ALWAYS different people.

CRITICAL RULE FOR BLANK FATHER SECTIONS:
In the Philippines, children born out of wedlock often have Sections 13-17 left COMPLETELY BLANK with dashes, "N/A", or empty fields. If the father section is blank, empty, contains only dashes/lines/"N/A", you MUST return null for ALL father fields with status "missing". Do NOT guess, infer, or copy any name from other sections.

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "PSABirth", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "certificateNumber": {evidence object},
  "registryNumber": {evidence object},
  "firstName": {evidence object} (CHILD's first name - Section 1),
  "middleName": {evidence object} (CHILD's middle name - Section 2),
  "lastName": {evidence object} (CHILD's last name - Section 3),
  "suffix": {evidence object},
  "sex": {evidence object},
  "dateOfBirth": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "placeOfBirth": {evidence object},
  "fatherFirstName": {evidence object} (FATHER's first name - Section 13),
  "fatherMiddleName": {evidence object} (FATHER's middle name - Section 14),
  "fatherLastName": {evidence object} (FATHER's last name - Section 15),
  "motherMaidenFirstName": {evidence object} (MOTHER's maiden first name - Section 6),
  "motherMaidenMiddleName": {evidence object} (MOTHER's maiden middle name - Section 7),
  "motherMaidenLastName": {evidence object} (MOTHER's maiden last name - Section 8),
  "dateOfRegistration": {evidence object},
  "issuingOffice": {evidence object},
  "remarks": {evidence object}
}
${examplesSection}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Marriage Certificate
// ---------------------------------------------------------------------------

function buildMarriageCertificatePrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Marriage Certificates.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "PSAMarriage", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "certificateNumber": {evidence object},
  "husbandFirstName": {evidence object},
  "husbandMiddleName": {evidence object},
  "husbandLastName": {evidence object},
  "wifeFirstName": {evidence object},
  "wifeMiddleName": {evidence object},
  "wifeLastName": {evidence object},
  "dateOfMarriage": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "placeOfMarriage": {evidence object},
  "husbandCitizenship": {evidence object},
  "wifeCitizenship": {evidence object},
  "issuingOffice": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Transcript of Records (TOR)
// ---------------------------------------------------------------------------

function buildTORPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Transcripts of Records (TOR).

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

For array fields like "academicEntries", wrap the entire array in an evidence object where
the "value" is the JSON array string.

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "TOR", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "studentFirstName": {evidence object},
  "studentMiddleName": {evidence object},
  "studentLastName": {evidence object},
  "studentSuffix": {evidence object},
  "institutionName": {evidence object},
  "institutionAddress": {evidence object},
  "program": {evidence object},
  "degree": {evidence object},
  "studentNumber": {evidence object},
  "dateOfGraduation": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "honors": {evidence object},
  "academicEntries": {evidence object where value is JSON array string or null}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// SF10 Student Permanent Record
// ---------------------------------------------------------------------------

function buildSF10Prompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for SF10 (formerly Form 137 / Student Permanent Record).

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "SF10", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "studentFirstName": {evidence object},
  "studentMiddleName": {evidence object},
  "studentLastName": {evidence object},
  "dateOfBirth": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "schoolName": {evidence object},
  "schoolAddress": {evidence object},
  "lrn": {evidence object},
  "gradeLevelEntries": {evidence object where value is JSON array string or null},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Diploma
// ---------------------------------------------------------------------------

function buildDiplomaPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Diplomas.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "Diploma", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "studentFirstName": {evidence object},
  "studentMiddleName": {evidence object},
  "studentLastName": {evidence object},
  "studentSuffix": {evidence object},
  "institutionName": {evidence object},
  "degree": {evidence object},
  "program": {evidence object},
  "dateAwarded": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "honors": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Bank Statement
// ---------------------------------------------------------------------------

function buildBankStatementPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Bank Statements.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "BankStatement", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "accountHolderName": {evidence object},
  "accountNumber": {evidence object},
  "bankName": {evidence object},
  "bankAddress": {evidence object},
  "statementDate": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "currency": {evidence object},
  "closingBalance": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Proof of Billing
// ---------------------------------------------------------------------------

function buildProofOfBillingPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Proof of Billing documents.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "ProofOfBilling", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "billerName": {evidence object},
  "customerName": {evidence object},
  "billingAddress": {evidence object},
  "accountNumber": {evidence object},
  "statementDate": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "dueDate": {evidence object} (format as YYYY-MM-DD if clear, otherwise verbatim),
  "amountDue": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Sponsor Valid ID
// ---------------------------------------------------------------------------

function buildSponsorValidIDPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Valid IDs / Passports.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "SponsorValidID", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "idType": {evidence object},
  "idNumber": {evidence object},
  "firstName": {evidence object},
  "middleName": {evidence object},
  "lastName": {evidence object},
  "suffix": {evidence object},
  "fullName": {evidence object},
  "dateOfBirth": {evidence object},
  "sex": {evidence object},
  "address": {evidence object},
  "issueDate": {evidence object},
  "expiryDate": {evidence object},
  "issuingAuthority": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Sponsor COE
// ---------------------------------------------------------------------------

function buildSponsorCOEPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Certificates of Employment.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "SponsorCOE", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "sponsorFullName": {evidence object},
  "sponsorFirstName": {evidence object},
  "sponsorLastName": {evidence object},
  "employerName": {evidence object},
  "employerAddress": {evidence object},
  "position": {evidence object},
  "employmentStatus": {evidence object},
  "employmentStartDate": {evidence object},
  "monthlySalary": {evidence object},
  "annualSalary": {evidence object},
  "issueDate": {evidence object},
  "signatoryName": {evidence object},
  "signatoryPosition": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Sponsor ITR
// ---------------------------------------------------------------------------

function buildSponsorITRPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Income Tax Returns (ITR).

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "SponsorITR", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "taxpayerFullName": {evidence object},
  "taxpayerFirstName": {evidence object},
  "taxpayerLastName": {evidence object},
  "tin": {evidence object},
  "taxYear": {evidence object},
  "employerName": {evidence object},
  "grossCompensationIncome": {evidence object},
  "taxableIncome": {evidence object},
  "address": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Affidavit of Support
// ---------------------------------------------------------------------------

function buildAffidavitPrompt(ocrText?: string): string {
  return `You are a high-precision document extraction agent for Affidavits of Support.

${ANTI_HALLUCINATION_RULES}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
  "documentType": {"value": "AffidavitOfSupport", "sourceText": null, "page": null, "confidence": 1.0, "status": "verified"},
  "sponsorFullName": {evidence object},
  "sponsorFirstName": {evidence object},
  "sponsorLastName": {evidence object},
  "sponsorAddress": {evidence object},
  "applicantFullName": {evidence object},
  "applicantFirstName": {evidence object},
  "applicantLastName": {evidence object},
  "declaredRelationship": {evidence object},
  "supportDeclaration": {evidence object},
  "executionDate": {evidence object},
  "notaryName": {evidence object},
  "notaryRollNumber": {evidence object},
  "remarks": {evidence object}
}
${buildOCRContext(ocrText)}`;
}

// ---------------------------------------------------------------------------
// Few-Shot Examples Section
// ---------------------------------------------------------------------------

function buildExamplesSection(examples: readonly { description: string; input: string; output: Record<string, unknown> }[]): string {
  if (examples.length === 0) return '';

  const formattedExamples = examples
    .slice(0, 3) // Limit to avoid excessive prompt size
    .map((ex, i) => {
      const outputSnippet = Object.entries(ex.output)
        .slice(0, 4) // Show max 4 fields per example
        .map(([key, val]) => `    "${key}": ${JSON.stringify(val)}`)
        .join(',\n');

      return `Example ${i + 1}: ${ex.description}
Document text: "${ex.input}"
Expected extraction (partial):
{
${outputSnippet}
}`;
    })
    .join('\n\n');

  return `

EXTRACTION EXAMPLES:
${formattedExamples}
`;
}
