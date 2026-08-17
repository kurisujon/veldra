/**
 * Returns a document-type-aware extraction prompt template.
 * Instructs Gemini 2.5 Flash to extract values as a strict JSON object conforming to the schema.
 */
export function getExtractionPrompt(documentType: string): string {
  const type = documentType.toLowerCase();

  if (type.includes('birth') || type === 'psabirth') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Philippine PSA Birth Certificate (Certificate of Live Birth).
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks (e.g., do NOT wrap the response in \`\`\`json ... \`\`\`).

IMPORTANT FIELD LOCATION GUIDE for Philippine PSA Birth Certificates:
- The CHILD's name (the person whose birth is registered) is at the TOP of the form (Sections 1-3: First Name, Middle Name, Last Name).
- The MOTHER's maiden name is in the MIDDLE section of the form (Sections 6-9). The mother's maiden name is the name she had BEFORE marriage. This is a DIFFERENT person from the child.
- The FATHER's name is in the LOWER section of the form (Sections 13-17). This is also a DIFFERENT person from the child.
- "firstName", "middleName", and "lastName" below refer ONLY to the CHILD (the subject of the birth certificate), NOT the mother or father.
- "motherMaidenFirstName", "motherMaidenMiddleName", "motherMaidenLastName" refer ONLY to the MOTHER's maiden name.
- "fatherFirstName", "fatherMiddleName", "fatherLastName" refer ONLY to the FATHER's name.
- These three sets of names (child, mother, father) are ALWAYS different people. They must NEVER have the same values unless the document genuinely shows identical names.

Schema:
{
  "documentType": "PSABirth",
  "certificateNumber": string or null,
  "registryNumber": string or null,
  "firstName": string or null (CHILD's first name - Section 1),
  "middleName": string or null (CHILD's middle name - Section 2),
  "lastName": string or null (CHILD's last name - Section 3),
  "suffix": string or null,
  "sex": string or null,
  "dateOfBirth": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "placeOfBirth": string or null,
  "fatherFirstName": string or null (FATHER's first name - Section 13),
  "fatherMiddleName": string or null (FATHER's middle name - Section 14),
  "fatherLastName": string or null (FATHER's last name - Section 15),
  "motherMaidenFirstName": string or null (MOTHER's maiden first name - Section 6),
  "motherMaidenMiddleName": string or null (MOTHER's maiden middle name - Section 7),
  "motherMaidenLastName": string or null (MOTHER's maiden last name - Section 8),
  "dateOfRegistration": string or null,
  "issuingOffice": string or null,
  "remarks": string or null
}`;
  }

  if (type.includes('marriage') || type === 'psamarriage') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Marriage Certificate.
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks.

Schema:
{
  "documentType": "PSAMarriage",
  "certificateNumber": string or null,
  "husbandFirstName": string or null,
  "husbandMiddleName": string or null,
  "husbandLastName": string or null,
  "wifeFirstName": string or null,
  "wifeMiddleName": string or null,
  "wifeLastName": string or null,
  "dateOfMarriage": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "placeOfMarriage": string or null,
  "husbandCitizenship": string or null,
  "wifeCitizenship": string or null,
  "issuingOffice": string or null,
  "remarks": string or null
}`;
  }

  if (type.includes('tor') || type.includes('transcript') || type === 'tor') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Transcript of Records (TOR).
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks.

Schema:
{
  "documentType": "TOR",
  "studentFirstName": string or null,
  "studentMiddleName": string or null,
  "studentLastName": string or null,
  "studentSuffix": string or null,
  "institutionName": string or null,
  "institutionAddress": string or null,
  "program": string or null,
  "degree": string or null,
  "studentNumber": string or null,
  "dateOfGraduation": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "honors": string or null,
  "academicEntries": Array of:
    {
      "schoolYear": string or null,
      "term": string or null,
      "subjectCode": string or null,
      "subjectTitle": string or null,
      "grade": string or null,
      "units": string or null
    } or null/empty array if not found
}`;
  }

  if (type === 'sf10' || type.includes('sf10')) {
    return `You are a high-precision document extraction agent. Extract structured information from the provided SF10 (formerly Form 137 / Student Permanent Record).
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks.

Schema:
{
  "documentType": "SF10",
  "studentFirstName": string or null,
  "studentMiddleName": string or null,
  "studentLastName": string or null,
  "dateOfBirth": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "schoolName": string or null,
  "schoolAddress": string or null,
  "lrn": string or null,
  "gradeLevelEntries": Array of:
    {
      "gradeLevel": string or null,
      "schoolYear": string or null,
      "schoolName": string or null,
      "generalAverage": string or null
    } or null/empty array if not found,
  "remarks": string or null
}`;
  }

  if (type.includes('diploma') || type === 'diploma') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Diploma.
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks.

Schema:
{
  "documentType": "Diploma",
  "studentFirstName": string or null,
  "studentMiddleName": string or null,
  "studentLastName": string or null,
  "studentSuffix": string or null,
  "institutionName": string or null,
  "degree": string or null,
  "program": string or null,
  "dateAwarded": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "honors": string or null,
  "remarks": string or null
}`;
  }

  if (type.includes('bank') || type.includes('statement') || type === 'bankstatement') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Bank Statement.
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks.

Schema:
{
  "documentType": "BankStatement",
  "accountHolderName": string or null,
  "accountNumber": string or null,
  "bankName": string or null,
  "bankAddress": string or null,
  "statementDate": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "currency": string or null,
  "closingBalance": string or null,
  "remarks": string or null
}`;
  }

  if (type.includes('billing') || type === 'proofofbilling') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Proof of Billing (e.g. utility bill).
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks.

Schema:
{
  "documentType": "ProofOfBilling",
  "billerName": string or null,
  "customerName": string or null,
  "billingAddress": string or null,
  "accountNumber": string or null,
  "statementDate": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "dueDate": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "amountDue": string or null,
  "remarks": string or null
}`;
  }

  throw new Error(`Unsupported document type for prompt template: ${documentType}`);
}
