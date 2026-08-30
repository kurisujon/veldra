import { GoogleGenAI } from '@google/genai';

/**
 * Returns the Gemini model name configured in environment variables,
 * or defaults to 'gemini-2.5-pro'.
 */
export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-pro';
}

/**
 * Returns the Flash model name for cheaper operations (OCR, simple extraction).
 */
export function getFlashModel(): string {
  return process.env.GEMINI_FLASH_MODEL || 'gemini-2.5-flash';
}

/**
 * Returns the Pro model name for escalated extraction on difficult documents.
 */
export function getProModel(): string {
  return process.env.GEMINI_PRO_MODEL || 'gemini-2.5-pro';
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

/**
 * Determines whether an error is a rate-limit (429) or quota error
 * that should trigger API key rotation.
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('429') ||
      message.includes('rate limit') ||
      message.includes('quota') ||
      message.includes('resource_exhausted')
    );
  }
  return false;
}

/**
 * Determines whether an error is a transient server error that may resolve on retry.
 */
export function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('500') ||
      message.includes('503') ||
      message.includes('internal') ||
      message.includes('unavailable') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused')
    );
  }
  return false;
}
