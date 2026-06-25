import { BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Logs in programmatically and injects session cookies into the Playwright context.
 */
export async function loginAs(
  context: BrowserContext,
  email: string,
  password: string,
  baseURL?: string
) {
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.');
  }
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Please check your environment variables.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('No session returned from sign in.');

  const { access_token, refresh_token } = data.session;

  // Next.js Supabase SSR constructs the cookie name as `sb-${projectRef}-auth-token`
  const url = new URL(supabaseUrl);
  const isSupabaseHost = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.net');
  const projectRef = isSupabaseHost ? url.hostname.split('.')[0] : url.hostname;
  const cookieName = `sb-${projectRef}-auth-token`;

  const sessionData = [access_token, refresh_token];

  // Set the cookie domain dynamically from baseURL
  const domain = baseURL ? new URL(baseURL).hostname : 'localhost';

  // Set the cookie directly on the browser context
  await context.addCookies([
    {
      name: cookieName,
      value: JSON.stringify(sessionData),
      domain,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}
