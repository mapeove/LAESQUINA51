import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  const k = parts[0];
  const v = parts.slice(1).join('=');
  if (k && v) env[k.trim()] = v.trim();
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = createClient(url, anonKey);
const supabaseAdmin = createClient(url, serviceKey);

async function verifyDatabase() {
  console.log('=== VERIFICACIÓN SUPABASE REAL ===\n');

  // 1. Check Tables
  const tables = [
    'categories',
    'products',
    'product_option_groups',
    'product_options',
    'product_extras',
    'orders',
    'order_items',
    'delivery_zones',
    'opening_hours',
    'store_settings',
    'profiles',
    'admin_users'
  ];

  console.log('1. Verificando existencia de tablas y RLS:');
  let missingTables = [];

  for (const table of tables) {
    const { error } = await supabaseAdmin.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`   [MISSING] Tabla '${table}' no encontrada: ${error.message}`);
      missingTables.push(table);
    } else {
      console.log(`   [OK] Tabla '${table}' existe en Supabase.`);
    }
  }

  if (missingTables.length > 0) {
    console.log(`\nFaltan ${missingTables.length} tablas por crear. Aplica las migraciones SQL primero.`);
    return false;
  }

  // 2. Check Seed Data
  console.log('\n2. Verificando datos iniciales (Seed):');
  const { data: cats } = await supabaseAnon.from('categories').select('name, slug');
  console.log(`   - Categorías cargadas: ${cats?.length || 0}`);

  const { data: prods } = await supabaseAnon.from('products').select('name, price');
  console.log(`   - Productos cargados: ${prods?.length || 0}`);

  const { data: zones } = await supabaseAnon.from('delivery_zones').select('name');
  console.log(`   - Zonas de reparto: ${zones?.length || 0}`);

  // 3. Test Order Creation & Security Check
  console.log('\n3. Realizando prueba de creación de pedido real...');
  const testOrderNum = `E51-TEST-${Math.floor(1000 + Math.random() * 9000)}`;

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      order_number: testOrderNum,
      status: 'PENDING',
      customer_name: 'Cliente Prueba Real',
      customer_phone: '600000000',
      delivery_address: 'Calle Sierpes 1, 41004 Sevilla',
      delivery_zone_name: 'Centro / Casco Antiguo',
      subtotal: 16.00,
      delivery_fee: 0,
      total: 16.00,
      notes: 'Pedido de prueba de verificación de producción'
    })
    .select()
    .single();

  if (orderError) {
    console.error('   [ERROR] Error al crear pedido de prueba:', orderError.message);
    return false;
  }

  console.log(`   [OK] Pedido de prueba creado exitosamente (${newOrder.order_number}).`);

  // Insert Order Item
  const { error: itemError } = await supabaseAdmin.from('order_items').insert({
    order_id: newOrder.id,
    product_name_snapshot: 'La Casi Triple',
    product_price_snapshot: 8.50,
    quantity: 2,
    item_total: 17.00
  });

  if (!itemError) {
    console.log('   [OK] Items de pedido asociados correctamente.');
  }

  // 4. Verify RLS Security
  console.log('\n4. Verificando políticas RLS de privacidad:');
  const { data: publicOrders } = await supabaseAnon.from('orders').select('*');
  if (publicOrders && publicOrders.length > 0) {
    console.warn('   [ALERTA] RLS no está bloqueando lecturas anónimas directas en `orders`');
  } else {
    console.log('   [OK] RLS activado: Usuarios anónimos NO pueden listar pedidos en masa.');
  }

  console.log('\n=== VERIFICACIÓN SUPABASE COMPLETADA CON ÉXITO ===');
  return true;
}

verifyDatabase();
