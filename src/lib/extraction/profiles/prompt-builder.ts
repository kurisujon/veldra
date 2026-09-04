import { DocumentProfile } from './types';
import { ANTI_HALLUCINATION_RULES, EVIDENCE_FIELD_SCHEMA, PSA_BIRTH_PROFILE_GUIDANCE, buildCanonicalEvidenceContext } from '../../ai/prompts';

export function buildProfilePrompt(profile: DocumentProfile<any>, ocrText?: string): string {
  const profileGuidance = profile.documentType === 'PSA Birth Certificate'
    ? `\n${PSA_BIRTH_PROFILE_GUIDANCE}\n`
    : '';
  const fieldsJson: Record<string, string> = {};
  
  for (const [key, field] of Object.entries(profile.fields)) {
    let instruction = `{evidence object}`;
    if (field.normalization === 'DATE') {
      instruction += ` (format as YYYY-MM-DD if clear, otherwise verbatim)`;
    }
    if (field.key === 'documentType') {
      instruction = `{"value": "${profile.documentType}", "state": "candidate", "evidenceSpanIds": []}`;
    }
    fieldsJson[key] = instruction;
  }

  const jsonSnippet = Object.entries(fieldsJson)
    .map(([k, v]) => `  "${k}": ${v}`)
    .join(',\n');

  return `You are a high-precision document extraction agent for ${profile.documentType} documents.

${ANTI_HALLUCINATION_RULES}
${profileGuidance}

${EVIDENCE_FIELD_SCHEMA}

Return a JSON object with this structure (do NOT include markdown formatting or backticks):
{
${jsonSnippet}
}
${buildCanonicalEvidenceContext(ocrText)}`;
}
