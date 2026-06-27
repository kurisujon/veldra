export * from './types';
export * from './pdf';
export * from './paddle';
export * from './router';

import { GoogleGenAI } from '@google/genai'

export async function extractFieldsWithAI(text: string, documentType: string, attempt: number = 0) {
  if (!text) return [];

  // Parse keys from env, fallback to single key
  const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const apiKeys = envKeys.split(',').map(k => k.trim()).filter(Boolean);
  
  if (apiKeys.length === 0) {
    console.warn('No GEMINI_API_KEYS found, falling back to heuristics.');
    return extractFieldsFromText(text, documentType);
  }

  // Select a key via simple round-robin or random selection (using attempt to cycle through)
  const keyIndex = attempt % apiKeys.length;
  const currentKey = apiKeys[keyIndex];

  const ai = new GoogleGenAI({ apiKey: currentKey });
  
  const schemaInstruction = `
    You are an expert document extraction AI for an educational institute.
    Your task is to extract structured data from the following raw OCR text of a "${documentType}" document.
    
    Return ONLY a raw JSON array of objects. Do not include markdown formatting or backticks.
    Each object must have exactly two keys: "field_name" and "raw_value".
    
    If the document type is PSABirth, extract at least: FIRSTNAME, LASTNAME, DATEOFBIRTH, GENDER, MOTHER_NAME.
    If the document type is Diploma, extract at least: FULLNAME, DEGREE, DATE_ISSUED.
    If the document type is Transcript, extract at least: FULLNAME, STUDENT_ID, GPA.
    
    If a field is missing, omit it or return "Not Found".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${schemaInstruction}\n\nRAW TEXT:\n${text}`,
      config: {
        temperature: 0.1,
      }
    });

    const responseText = response.text?.replace(/```json/gi, '').replace(/```/g, '').trim() || '[]';
    const parsedFields = JSON.parse(responseText);
    
    if (Array.isArray(parsedFields)) {
      return parsedFields.map(f => ({
        field_name: String(f.field_name).toUpperCase(),
        raw_value: String(f.raw_value)
      }));
    }
  } catch (error: any) {
    console.error(`Gemini Extraction Error on key ${keyIndex + 1}/${apiKeys.length}:`, error.message);
    
    // If it's a quota limit (429) or internal error, and we haven't exhausted our keys
    if (attempt < apiKeys.length - 1) {
      console.log(`Rotating to next API key (Attempt ${attempt + 2})...`);
      return extractFieldsWithAI(text, documentType, attempt + 1);
    }
  }

  // Fallback to heuristic parser if AI fails on all keys
  return extractFieldsFromText(text, documentType);
}

export function extractFieldsFromText(text: string, documentType: string = 'Unknown') {
  if (!text) return [];

  const cleanText = text.replace(/\n/g, ' ');
  const fields: Array<{ field_name: string, raw_value: string }> = [];

  // Helper to safely extract with regex
  const extractWithRegex = (regex: RegExp, fallback: string = '') => {
    const match = cleanText.match(regex);
    return match && match[1] ? match[1].trim() : fallback;
  };

  if (documentType.toLowerCase().includes('psabirth')) {
    fields.push({
      field_name: 'FIRSTNAME',
      raw_value: extractWithRegex(/(?:First|NAME).*?([A-Z][a-zA-Z\s,]+)/i, 'Unknown')
    });
    fields.push({
      field_name: 'LASTNAME',
      raw_value: extractWithRegex(/(?:Last|Maiden).*?([A-Z][a-zA-Z\s]+)/i, 'Unknown')
    });
    fields.push({
      field_name: 'DATEOFBIRTH',
      raw_value: extractWithRegex(/(?:DATE OF BIRTH|DOB).*?([\d]{1,2}[/-][A-Za-z\d]+[/-][\d]{2,4})/i, 'Unknown')
    });
    fields.push({
      field_name: 'GENDER',
      raw_value: extractWithRegex(/(?:SEX|GENDER).*?(Male|Female|M|F)/i, 'Unknown')
    });
    fields.push({
      field_name: 'MOTHER_NAME',
      raw_value: extractWithRegex(/(?:MOTHER|Maiden Name).*?([A-Z][a-zA-Z\s,]+)/i, 'Unknown')
    });

  } else if (documentType.toLowerCase().includes('diploma')) {
    fields.push({
      field_name: 'FULLNAME',
      raw_value: extractWithRegex(/(?:This certifies that|certify that|Name)[:\s]*([A-Z][a-zA-Z\s,]+)/i, 'Unknown')
    });
    fields.push({
      field_name: 'DEGREE',
      raw_value: extractWithRegex(/(?:Degree of|Bachelor of|Master of)([\sA-Za-z]+)/i, 'Unknown')
    });
    fields.push({
      field_name: 'DATE_ISSUED',
      raw_value: extractWithRegex(/(?:Date|Given this|Issued on).*?([\d]{1,2}[/-][A-Za-z\d]+[/-][\d]{2,4})/i, 'Unknown')
    });

  } else {
    // Generic fallback for unknown types
    const nameMatch = cleanText.match(/(?:Name|Full Name)[:\s]*([A-Z][a-zA-Z\s,]+)/i);
    let firstName = 'Unknown', lastName = 'Unknown';
    if (nameMatch && nameMatch[1]) {
      const parts = nameMatch[1].split(',').map(p => p.trim());
      if (parts.length > 1) {
        lastName = parts[0]; firstName = parts[1];
      } else {
        const spaceParts = parts[0].split(' ');
        if (spaceParts.length > 1) {
          lastName = spaceParts[spaceParts.length - 1];
          firstName = spaceParts.slice(0, spaceParts.length - 1).join(' ');
        } else {
          firstName = parts[0];
        }
      }
    }
    
    fields.push({ field_name: 'FIRSTNAME', raw_value: firstName.substring(0, 50) });
    fields.push({ field_name: 'LASTNAME', raw_value: lastName.substring(0, 50) });
    fields.push({ 
      field_name: 'DATEOFBIRTH', 
      raw_value: extractWithRegex(/([\d]{1,2}[/-][\d]{1,2}[/-][\d]{2,4})/, 'Unknown') 
    });
  }

  return fields;
}
