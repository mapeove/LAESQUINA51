import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'Falta código' }, { status: 400 });
    }

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();

    const { data, error } = await adminSupabase
      .from('coupons')
      .select('code, discount_amount')
      .eq('code', code.toUpperCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Cupón inválido, expirado o ya utilizado.' }, { status: 404 });
    }

    return NextResponse.json({ 
      valid: true, 
      code: data.code, 
      discount_amount: data.discount_amount 
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Error al validar el cupón.' }, { status: 500 });
  }
}
