import { createClient } from './src/lib/supabase/server'

async function test() {
  const supabase = await createClient()
  await supabase.rpc('create_case_with_applicant', {
    p_first_name: 'test',
    p_last_name: 'test',
    p_date_of_birth: 'test'
  })
}
