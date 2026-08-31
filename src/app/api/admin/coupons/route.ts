import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID del cupón' }, { status: 400 });
    }

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Delete history entries if any
    await adminSupabase
      .from('coupon_distribution_history')
      .delete()
      .eq('coupon_id', id);

    // Delete coupon
    const { error: deleteError } = await adminSupabase
      .from('coupons')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, used } = body;

    if (!id || typeof used !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const authSupabase = await createClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();
    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (!adminUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { error: updateError } = await adminSupabase
      .from('coupons')
      .update({ used })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, used });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
