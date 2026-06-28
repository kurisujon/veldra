const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("Creating buckets...");
  
  const { data: dData, error: dErr } = await supabase.storage.createBucket('documents', { public: true });
  if (dErr) console.log("documents bucket:", dErr.message);
  else console.log("Created documents bucket");

  const { data: eData, error: eErr } = await supabase.storage.createBucket('exports', { public: true });
  if (eErr) console.log("exports bucket:", eErr.message);
  else console.log("Created exports bucket");
  
  console.log("Done.");
}

main();
