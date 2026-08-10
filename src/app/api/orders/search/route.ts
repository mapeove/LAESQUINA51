import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber')?.trim();
    const phone = searchParams.get('phone')?.trim();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { error: 'Se requieren el número de pedido y el teléfono para la verificación' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\s+/g, '');

    let supabase;
    try {
      supabase = await createAdminClient();
    } catch {
      // Fallback for dev mode when Supabase env variables are not present
      if (orderNumber.startsWith('E51-')) {
        return NextResponse.json({
          orders: [
            {
              id: 'mock-1',
              order_number: orderNumber,
              status: 'PENDING',
              total: 15.50,
              created_at: new Date().toISOString(),
            },
          ],
        });
      }
      return NextResponse.json({ orders: [] });
    }

    // Require exact match of order_number AND customer_phone for strict guest privacy
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, status, total, created_at, customer_name, delivery_address')
      .eq('order_number', orderNumber)
      .eq('customer_phone', cleanPhone)
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ orders: orders ?? [] });
  } catch (error: unknown) {
    console.error('Search orders security check error:', error);
    return NextResponse.json(
      { error: 'Error al verificar el pedido' },
      { status: 500 }
    );
  }
}
