import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { CartItem } from '@/types';

interface OrderRequestBody {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  delivery_postal_code: string;
  delivery_zone: string;
  delivery_floor?: string;
  delivery_door?: string;
  notes?: string;
  items: CartItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
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
      delivery_zone,
      delivery_floor,
      delivery_door,
      notes,
      items,
      subtotal,
      delivery_fee,
      total,
    } = body;

    // Validate required fields
    if (!customer_name || !customer_phone || !delivery_address || !delivery_postal_code || !delivery_zone || !items || items.length === 0) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    let supabase;
    try {
      supabase = await createAdminClient();
    } catch {
      // Dev mode: Supabase not configured yet
      console.warn('Supabase not configured, using mock order');
      const mockNumber = `E51-${String(Math.floor(1000 + Math.random() * 9000)).padStart(6, '0')}`;
      return NextResponse.json({ success: true, orderNumber: mockNumber });
    }

    // Generate order number based on count
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const nextNum = (count ?? 0) + 1;
    const orderNumber = `E51-${String(nextNum).padStart(6, '0')}`;

    const fullAddress = [
      delivery_address,
      delivery_floor ? `Piso ${delivery_floor}` : null,
      delivery_door ? `Puerta ${delivery_door}` : null,
      delivery_postal_code,
      delivery_zone,
    ]
      .filter(Boolean)
      .join(', ');

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        status: 'PENDING',
        customer_name,
        customer_phone,
        customer_email: customer_email ?? null,
        delivery_address: fullAddress,
        delivery_floor: delivery_floor ?? null,
        delivery_door: delivery_door ?? null,
        delivery_zone_name: delivery_zone,
        subtotal,
        delivery_fee,
        total,
        notes: notes ?? null,
        payment_method: 'CASH',
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

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ success: true, orderNumber });
  } catch (error: unknown) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pedido. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
