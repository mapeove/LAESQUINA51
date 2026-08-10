import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env vars from .env.local without logging values
const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) env[k.trim()] = v.trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || url.includes('placeholder')) {
  console.error('ERROR: Real Supabase credentials not set in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const adminEmail = process.argv[2] || 'admin@laesquina51.es';
  const adminPassword = process.argv[3] || 'Esquina51Admin2026!';

  console.log(`[Admin Setup] Creating admin user: ${adminEmail}`);

  // 1. Check if user already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('[Admin Setup] Failed to query auth users:', listError.message);
    process.exit(1);
  }

  let existingUser = users?.find(u => u.email === adminEmail);
  let userId = existingUser?.id;

  if (!existingUser) {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Administrador La Esquina 51' }
    });

    if (createError) {
      console.error('[Admin Setup] Failed to create auth user:', createError.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log('[Admin Setup] Auth user created successfully.');
  } else {
    console.log('[Admin Setup] Auth user already exists.');
  }

  // 2. Insert into admin_users table
  const { error: adminTableError } = await supabase
    .from('admin_users')
    .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id' });

  if (adminTableError) {
    console.error('[Admin Setup] Failed to register in admin_users table:', adminTableError.message);
    process.exit(1);
  }

  console.log('[Admin Setup] SUCCESS: Admin user configured and linked in admin_users table!');
}

main();
