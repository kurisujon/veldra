import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jegrbyigqucmvgdxczdc.supabase.co';
const supabaseKey = 'ysb_secret_WCHiGFiqD5cgvr6g-mxPIQ_Eva4USZ8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearData() {
  console.log('Clearing all cases (and cascading to all related tables)...');
  
  // Since we don't know the exact IDs, we can delete where id is not null
  const { data, error } = await supabase
    .from('cases')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // match all
    
  if (error) {
    console.error('Error deleting cases:', error.message);
  } else {
    console.log('Successfully cleared all case data!');
  }
}

clearData();
