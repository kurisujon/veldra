import type { Database } from './src/types/database'
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient<Database>('', '', { cookies: {} })

const args = {
  p_first_name: 'test',
  p_last_name: 'test',
  p_date_of_birth: 'test'
}

supabase.rpc('create_case_with_applicant', args)
