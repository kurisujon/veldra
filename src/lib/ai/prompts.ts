/**
 * Returns a document-type-aware extraction prompt template.
 * Instructs Gemini 2.5 Flash to extract values as a strict JSON object conforming to the schema.
 */
export function getExtractionPrompt(documentType: string): string {
  const type = documentType.toLowerCase();

  if (type.includes('birth') || type === 'psabirth') {
    return `You are a high-precision document extraction agent. Extract structured information from the provided Birth Certificate.
Return a single JSON object matching this schema exactly. Use null for missing, unreadable, or not present values. Do not invent any data. Do not include markdown formatting or backticks (e.g., do NOT wrap the response in \`\`\`json ... \`\`\`).

Schema:
{
  "documentType": "PSABirth",
  "certificateNumber": string or null,
  "registryNumber": string or null,
  "firstName": string or null,
  "middleName": string or null,
  "lastName": string or null,
  "suffix": string or null,
  "sex": string or null,
  "dateOfBirth": string or null (preferably formatted as YYYY-MM-DD if clear, otherwise verbatim),
  "placeOfBirth": string or null,
  "fatherFirstName": string or null,
  "fatherMiddleName": string or null,
  "fatherLastName": string or null,
  "motherMaidenFirstName": string or null,
  "motherMaidenMiddleName": string or null,
  "motherMaidenLastName": string or null,
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

  throw new Error(`Unsupported document type for prompt template: ${documentType}`);
}
