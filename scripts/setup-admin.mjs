import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env vars from .env.local
const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim();
    if (k && v) env[k] = v;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = env.ADMIN_EMAIL;
const adminPassword = env.ADMIN_PASSWORD;

if (!url || !serviceKey || url.includes('placeholder')) {
  console.error('❌ ERROR: Supabase credentials not configured in .env.local');
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error('❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
  console.error('   Add these lines to .env.local:');
  console.error('   ADMIN_EMAIL=tu-email@ejemplo.com');
  console.error('   ADMIN_PASSWORD=tu-contraseña-segura');
  process.exit(1);
}

if (adminPassword.length < 8) {
  console.error('❌ ERROR: ADMIN_PASSWORD must be at least 8 characters');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('\n🔐 LA ESQUINA 51 — Configuración de Administrador OWNER');
  console.log('=' .repeat(55));
  console.log(`📧 Email: ${adminEmail}`);
  console.log('🔑 Contraseña: ********** (desde .env.local)');
  console.log('');

  // 1. Check if auth user already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('❌ Failed to query auth users:', listError.message);
    process.exit(1);
  }

  let existingUser = users?.find(u => u.email === adminEmail);
  let userId = existingUser?.id;

  if (!existingUser) {
    console.log('👤 Creando usuario en Supabase Auth...');
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Propietario La Esquina 51' }
    });

    if (createError) {
      console.error('❌ Failed to create auth user:', createError.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log('✅ Usuario creado en Supabase Auth');
  } else {
    console.log('✅ Usuario ya existe en Supabase Auth');
    // Update password if user exists
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: adminPassword
    });
    if (updateError) {
      console.warn('⚠️  No se pudo actualizar la contraseña:', updateError.message);
    } else {
      console.log('✅ Contraseña actualizada');
    }
  }

  // 2. Upsert into admin_users table with OWNER role
  const { error: adminTableError } = await supabase
    .from('admin_users')
    .upsert(
      { user_id: userId, role: 'OWNER', active: true },
      { onConflict: 'user_id' }
    );

  if (adminTableError) {
    console.error('❌ Failed to register in admin_users:', adminTableError.message);
    process.exit(1);
  }

  console.log('✅ Registrado en admin_users con role=OWNER, active=true');

  // 3. Verify
  const { data: verifyData } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (verifyData) {
    console.log('');
    console.log('🎉 VERIFICACIÓN EXITOSA');
    console.log(`   user_id: ${verifyData.user_id}`);
    console.log(`   role: ${verifyData.role}`);
    console.log(`   active: ${verifyData.active}`);
    console.log('');
    console.log('🚀 Ahora puedes iniciar sesión en /administrador/login');
    console.log('   con el email y contraseña configurados.');
  } else {
    console.error('❌ Verificación fallida: No se encontró el registro en admin_users');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error inesperado:', err.message);
  process.exit(1);
});
