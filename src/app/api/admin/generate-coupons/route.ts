import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { count, discount_amount, days_valid } = await request.json();
    if (!count || !discount_amount || !days_valid) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    // Admin authentication
    const adminSupabase = await createAdminClient();
    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();
    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days_valid);

    const generated: any[] = [];
    for (let i = 0; i < count; i++) {
      const code = 'ESQ51-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: coupon, error } = await adminSupabase
        .from('coupons')
        .insert({
          code,
          discount_amount,
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();
      if (error) {
        console.error('Error creating coupon:', error);
        continue;
      }
      generated.push(coupon);
    }

    return NextResponse.json({ success: true, coupons: generated });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
