import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  const existingAdmin = usersData.users.find(u => u.email === 'admin@veldra.com');
  
  let userId;
  if (existingAdmin) {
    console.log("Admin account (admin@veldra.com) already exists. Updating password...");
    userId = existingAdmin.id;
    await adminClient.auth.admin.updateUserById(userId, { password: 'crisjohn123' });
  } else {
    console.log("Creating default admin account...");
    const { data: newUser, error } = await adminClient.auth.admin.createUser({
      email: 'admin@veldra.com',
      password: 'crisjohn123',
      email_confirm: true,
    });
    
    if (error) {
      console.error("Failed to create admin auth user:", error);
      return;
    }
    userId = newUser.user.id;
  }

  // Upsert into user_roles
  const { error: roleError } = await adminClient.from('user_roles').upsert({
    user_id: userId,
    role: 'Admin',
    username: 'crisjohn'
  }, { onConflict: 'user_id' });

  if (roleError) {
    console.error("Failed to set admin role and username:", roleError);
  } else {
    console.log("Admin account configured successfully! (Username: crisjohn)");
  }
}

seed();
