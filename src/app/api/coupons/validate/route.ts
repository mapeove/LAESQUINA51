import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = body?.code;

    const cleanCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
    if (!cleanCode) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Por favor, introduce un código de cupón.' 
      }, { 
        status: 400,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    const adminSupabase = await createAdminClient();

    const { data, error } = await adminSupabase
      .from('coupons')
      .select('id, code, discount_amount, used, expires_at')
      .eq('code', cleanCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error querying coupon:', error);
      return NextResponse.json({ 
        valid: false, 
        error: 'Error al consultar el cupón.' 
      }, { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    if (!data) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Cupón inválido, expirado o ya utilizado.' 
      }, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    return NextResponse.json({ 
      valid: true, 
      code: data.code, 
      discount_amount: Number(data.discount_amount) 
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (err: unknown) {
    console.error('Coupon validation error:', err);
    return NextResponse.json({ 
      valid: false, 
      error: 'Error al validar el cupón.' 
    }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  }
}
