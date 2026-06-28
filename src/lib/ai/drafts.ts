import { getGeminiClient, getGeminiModel, getGeminiApiKeysCount } from './gemini';

export async function generateDraftContentWithAI(
  draftType: 'Affidavit' | 'AddressLetter' | 'GapLetter',
  applicantName: string,
  discrepancies: string[]
): Promise<string> {
  const maxAttempts = getGeminiApiKeysCount();
  let lastError: any = null;

  const prompt = `
You are a legal document generator for a background verification platform.
Your task is to write a formal legal draft for an applicant.
Do not use HTML tags or markdown formatting. Output plain text only.
Make it sound professional, formal, and legally sound. Do not include signature lines at the bottom, just the body of the document.

Applicant Name: ${applicantName}
Draft Type: ${draftType === 'Affidavit' ? 'Affidavit of Discrepancy' : draftType === 'AddressLetter' ? 'Letter of Explanation for Address Mismatch' : 'Letter of Explanation for School Gap'}

Discrepancies to address in this document:
${discrepancies.map(d => `- ${d}`).join('\n')}

Based on the draft type, write the document from the perspective of the applicant explaining the discrepancies or swearing under oath that the differing records pertain to them. Explain that this was due to clerical errors or differing institutional formats and that the applicant is indeed the same person. Provide a fluent, readable narrative rather than a simple "vs" list.
  `.trim();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const client = getGeminiClient(attempt);
      const response = await client.models.generateContent({
        model: getGeminiModel(),
        contents: [prompt],
        config: {
          temperature: 0.2,
        }
      });

      if (!response.text) {
        throw new Error('Gemini returned empty response for draft generation');
      }

      return response.text;
    } catch (error: any) {
      console.warn(`Draft generation failed on attempt ${attempt + 1}: ${error.message}`);
      lastError = error;
    }
  }

  throw new Error(`Failed to generate draft with AI after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}
