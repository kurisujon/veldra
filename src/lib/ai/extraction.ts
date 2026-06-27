import { getGeminiClient, getGeminiModel, getGeminiApiKeysCount } from './gemini';
import { getExtractionPrompt } from './prompts';
import {
  BirthCertificateSchema,
  MarriageCertificateSchema,
  TorSchema,
  Sf10Schema,
  DiplomaSchema,
  type ExtractedDocumentData,
} from './schemas';

interface ExtractionInput {
  documentId: string;
  caseId: string;
  documentType: string;
  fileBuffer: Buffer;
  mimeType: string;
  fileName: string;
}

interface ExtractionResult {
  rawResponse: string;
  normalizedJson: ExtractedDocumentData;
  modelUsed: string;
}

/**
 * Maps the documentType string to the corresponding Zod validation schema.
 */
function getSchemaForType(documentType: string) {
  const type = documentType.toLowerCase();
  if (type.includes('birth') || type === 'psabirth') {
    return BirthCertificateSchema;
  }
  if (type.includes('marriage') || type === 'psamarriage') {
    return MarriageCertificateSchema;
  }
  if (type.includes('tor') || type.includes('transcript') || type === 'tor') {
    return TorSchema;
  }
  if (type === 'sf10' || type.includes('sf10')) {
    return Sf10Schema;
  }
  if (type.includes('diploma') || type === 'diploma') {
    return DiplomaSchema;
  }
  throw new Error(`No schema defined for document type: ${documentType}`);
}

/**
 * Extracts structured data from a document using Gemini 2.5 Flash.
 * Supports API key rotation on failure, parses JSON response, and validates it with Zod.
 */
export async function extractDocumentWithAI(
  input: ExtractionInput,
  attempt: number = 0
): Promise<ExtractionResult> {
  const model = getGeminiModel();
  const client = getGeminiClient(attempt);
  const prompt = getExtractionPrompt(input.documentType);
  const base64Data = input.fileBuffer.toString('base64');

  try {
    const response = await client.models.generateContent({
      model: model,
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: input.mimeType,
          },
        },
        prompt,
      ],
      config: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    // Clean up potential markdown formatting just in case it wraps response despite JSON mode
    const cleanJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    const parsedJson = JSON.parse(cleanJson);
    const schema = getSchemaForType(input.documentType);
    const validatedJson = schema.parse(parsedJson);

    return {
      rawResponse: responseText,
      normalizedJson: validatedJson,
      modelUsed: model,
    };
  } catch (error) {
    const apiKeysCount = getGeminiApiKeysCount();
    // If we have remaining API keys to rotate and try, proceed recursively
    if (attempt < apiKeysCount - 1) {
      console.warn(
        `Gemini extraction attempt ${attempt + 1} failed: ${
          error instanceof Error ? error.message : String(error)
        }. Rotating API key...`
      );
      return extractDocumentWithAI(input, attempt + 1);
    }

    // Exhausted all key rotation attempts, throw the final error
    throw new Error(
      `Gemini extraction failed after ${apiKeysCount} attempt(s): ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
