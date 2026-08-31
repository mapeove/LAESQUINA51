import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { getStoreStatus } from '@/lib/store-status';
import type { CartItem } from '@/types';

interface OrderRequestBody {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_postal_code: string;
  zone_id: string;
  delivery_zone: string;
  delivery_floor?: string;
  delivery_door?: string;
  notes?: string;
  payment_method: 'CASH' | 'BIZUM';
  cash_change_for?: number | null;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  user_id?: string | null;
}

export async function POST(request: Request) {
  try {
    const body: OrderRequestBody = await request.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      delivery_address,
      delivery_postal_code,
      zone_id,
      delivery_floor,
      delivery_door,
      notes,
      payment_method,
      cash_change_for,
      items,
      subtotal,
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone || !delivery_address || !delivery_postal_code || !zone_id || !items || items.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos para el pedido' }, { status: 400 });
    }

    const cleanPhone = customer_phone.replace(/\s+/g, '');

    let adminSupabase;
    let authSupabase;
    try {
      adminSupabase = await createAdminClient();
      authSupabase = await createClient();
    } catch {
      // Dev fallback mode
      console.warn('Supabase not configured, using mock order');
      const mockNumber = `E51-${String(Math.floor(1000 + Math.random() * 9000)).padStart(6, '0')}`;
      return NextResponse.json({ success: true, orderNumber: mockNumber });
    }

    // Check Auth
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para realizar un pedido' }, { status: 401 });
    }

    // Check Store Open
    const storeStatus = await getStoreStatus(adminSupabase);
    if (!storeStatus.isOpen) {
      return NextResponse.json({ error: 'El establecimiento está cerrado. No se aceptan nuevos pedidos.' }, { status: 403, statusText: 'STORE_CLOSED' });
    }

    // Validate Zone and calculate delivery fee
    const { data: zoneData } = await adminSupabase
      .from('delivery_zones')
      .select('delivery_fee, name')
      .eq('id', zone_id)
      .eq('active', true)
      .single();

    if (!zoneData) {
       return NextResponse.json({ error: 'Zona de reparto no válida' }, { status: 400 });
    }

    const secureDeliveryFee = Number(zoneData.delivery_fee) || 0;
    
    // We trust subtotal for now as products can be complex, but recalculate the final total
    const secureTotal = Number(subtotal) + secureDeliveryFee;

    // Generate a collision-safe order number.
    // Strategy: timestamp last-5-digits + 3 random base-36 chars → 8 chars → E51-XXXXXXXX
    // This avoids the race condition of "SELECT MAX then +1" where two concurrent
    // requests read the same max and generate the same next number.
    const generateOrderNumber = () => {
      const ts = String(Date.now()).slice(-5);
      const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
      return `E51-${ts}${rand}`;
    };
    const orderNumber = generateOrderNumber();

    const fullAddress = [
      delivery_address,
      delivery_floor ? `Piso ${delivery_floor}` : null,
      delivery_door ? `Puerta ${delivery_door}` : null,
      delivery_postal_code,
      zoneData.name, // Secure name from DB
    ]
      .filter(Boolean)
      .join(', ');

    // Insert order
    const { data: orderData, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        status: 'PENDING',
        customer_name,
        customer_phone: cleanPhone,
        customer_email: customer_email ?? null,
        user_id: body.user_id ?? null,
        delivery_address: fullAddress,
        delivery_floor: delivery_floor ?? null,
        delivery_door: delivery_door ?? null,
        delivery_zone_id: zone_id,
        delivery_zone_name: zoneData.name,
        subtotal,
        delivery_fee: secureDeliveryFee,
        total: secureTotal,
        notes: notes ?? null,
        payment_method: payment_method || 'CASH',
        cash_change_for: payment_method === 'CASH' && cash_change_for ? Number(cash_change_for) : null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items (snapshot)
    const orderItems = items.map((item: CartItem) => ({
      order_id: orderData.id,
      product_id: item.product_id,
      product_name_snapshot: item.product_name,
      product_price_snapshot: item.product_price,
      quantity: item.quantity,
      options_snapshot: item.selected_options ?? [],
      extras_snapshot: item.selected_extras ?? [],
      item_total: item.line_total,
    }));

    const { error: itemsError } = await adminSupabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderNumber });
  } catch (error: unknown) {
    console.error('Order creation error:', error);
    // Para depuración temporal devolvemos el error exacto
    let errorMessage = 'Error al procesar el pedido';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      const e = error as Record<string, unknown>;
      if (e.message) errorMessage = String(e.message);
      else if (e.details) errorMessage = String(e.details);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
