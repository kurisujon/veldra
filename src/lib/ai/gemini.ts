import { GoogleGenAI } from '@google/genai';

/**
 * Returns the Gemini model name configured in environment variables,
 * or defaults to 'gemini-2.5-flash'.
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

/**
 * Returns a configured GoogleGenAI client using api keys from the environment.
 * Supports api key rotation/fallback when an attempt index is provided.
 */
export function getGeminiClient(attempt: number = 0): GoogleGenAI {
  const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  const apiKeys = envKeys.split(',').map((k) => k.trim()).filter(Boolean);

  if (apiKeys.length === 0) {
    throw new Error(
      'Missing Gemini API Key. Please set GEMINI_API_KEY or GEMINI_API_KEYS in environment variables.'
    );
  }

  const keyIndex = attempt % apiKeys.length;
  const apiKey = apiKeys[keyIndex];

  return new GoogleGenAI({ apiKey });
}

/**
 * Returns the total number of configured Gemini API keys.
 */
export function getGeminiApiKeysCount(): number {
  const envKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
  return envKeys.split(',').map((k) => k.trim()).filter(Boolean).length;
}
