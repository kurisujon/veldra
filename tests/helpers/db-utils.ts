import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Database } from '../../src/types/database';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please check your environment variables.');
}
if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Please check your environment variables.');
}

// Admin client that bypasses RLS
export const adminSupabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Find a user by their email address using pagination.
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  let page = 1;
  const limit = 100;

  while (true) {
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (error) {
      throw error;
    }

    const users = data?.users || [];
    if (users.length === 0) {
      break;
    }

    const found = users.find(u => u.email === email);
    if (found) {
      return found;
    }

    if (users.length < limit) {
      break;
    }

    page++;
  }

  return null;
}

/**
 * Creates a test user in auth.users and assigns a role in public.user_roles.
 */
export async function createTestUser(email: string, password: string, role: 'Admin' | 'Reviewer') {
  // Check if user already exists
  const existingUser = await findUserByEmail(email);

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError) throw createError;
    if (!newUser.user) throw new Error('Failed to create user object');
    userId = newUser.user.id;
  }

  // Assign role (UPSERT to avoid conflicts)
  const { error: roleError } = await adminSupabase
    .from('user_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' });
    
  if (roleError) throw roleError;

  return userId;
}

/**
 * Deletes a test user by their email address.
 */
export async function deleteUserByEmail(email: string) {
  const targetUser = await findUserByEmail(email);
  if (targetUser) {
    // Delete role first
    await adminSupabase.from('user_roles').delete().eq('user_id', targetUser.id);
    
    // Delete authentication user record
    const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(targetUser.id);
    if (deleteError) throw deleteError;
  }
}

/**
 * Deletes all database records and storage files associated with a case ID.
 */
export async function cleanUpTestCase(caseId: string) {
  // 1. Delete storage files under the case prefix
  try {
    const { data: docs, error: queryError } = await adminSupabase
      .from('documents')
      .select('file_path')
      .eq('case_id', caseId);

    if (queryError) {
      console.error(`Failed to query documents for case ${caseId}:`, queryError);
    } else if (docs && docs.length > 0) {
      const pathsToDelete = docs.map(d => d.file_path);
      const { error: removeError } = await adminSupabase.storage
        .from('documents')
        .remove(pathsToDelete);
      if (removeError) {
        console.error(`Failed to remove storage files for case ${caseId}:`, removeError);
      }
    }
  } catch (err) {
    console.error(`Failed to clean up storage files for case ${caseId}:`, err);
  }

  // 2. Delete the case itself (cascades to applicants, documents, activity_logs, etc.)
  const { error: deleteError } = await adminSupabase
    .from('cases')
    .delete()
    .eq('id', caseId);

  if (deleteError) {
    console.error(`Failed to delete case record for case ${caseId}:`, deleteError);
    throw deleteError;
  }
}
