import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendCouponEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { count, discount_amount, days_valid, targetEmails } = body;
    
    if (!discount_amount || !days_valid) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos (descuento o días de validez)' }, { status: 400 });
    }

    const adminSupabase = await createAdminClient();
    const authSupabase = await createClient();

    // Check Auth
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
    expiresAt.setDate(expiresAt.getDate() + Number(days_valid));

    // Get auth users list for matching name / id if available
    const { data: authList } = await adminSupabase.auth.admin.listUsers();
    const authUsers = authList?.users || [];

    // MODO 1: Enviar a correos específicos (manuales)
    if (targetEmails !== undefined) {
      let rawList: string[] = [];
      if (Array.isArray(targetEmails)) {
        rawList = targetEmails;
      } else if (typeof targetEmails === 'string') {
        rawList = targetEmails.split(/[\n,;]+/).map((e: string) => e.trim());
      }

      // Limpiar y validar cada correo electrónico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validEmails = Array.from(
        new Set(
          rawList
            .map((e: string) => e.trim().toLowerCase())
            .filter((e: string) => e && emailRegex.test(e))
        )
      );

      if (validEmails.length === 0) {
        return NextResponse.json({ error: 'No se encontraron correos electrónicos válidos en la lista' }, { status: 400 });
      }

      let sentCount = 0;
      const createdCoupons = [];

      for (const email of validEmails) {
        const code = 'ESQ51-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const { data: coupon, error: couponError } = await adminSupabase
          .from('coupons')
          .insert({
            code,
            discount_amount: Number(discount_amount),
            expires_at: expiresAt.toISOString(),
            used: false
          })
          .select()
          .single();
          
        if (couponError || !coupon) {
          console.error('Error creating coupon for specific email:', couponError);
          continue;
        }

        createdCoupons.push(coupon);

        const matchedAuth = authUsers.find((u) => u.email?.toLowerCase() === email);
        const fullName = (matchedAuth?.user_metadata && (matchedAuth.user_metadata.full_name || matchedAuth.user_metadata.name)) || 'Amigo';

        try {
          await sendCouponEmail({
            email,
            fullName,
            couponCode: code,
            discountAmount: Number(discount_amount),
            expiresAt: expiresAt.toISOString()
          });

          await adminSupabase.from('coupon_distribution_history').insert({
            coupon_id: coupon.id,
            user_id: matchedAuth?.id ?? null,
            email
          });

          sentCount++;
        } catch (mailErr) {
          console.error('Failed to send coupon email to:', email, mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        sentCount,
        totalRequested: validEmails.length,
        coupons: createdCoupons
      });
    }

    // MODO 2: Distribución masiva aleatoria (clientes sin cupones en 3 meses)
    if (!count) {
      return NextResponse.json({ error: 'Falta la cantidad de clientes a distribuir' }, { status: 400 });
    }

    const eligibleAuthUsers = authUsers.filter((u) => u.email);
    const eligibleCandidates = eligibleAuthUsers.map((u) => ({
      id: u.id,
      full_name: (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || 'Amigo',
      email: u.email!
    }));

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: history } = await adminSupabase
      .from('coupon_distribution_history')
      .select('user_id')
      .gt('sent_at', threeMonthsAgo.toISOString());

    const excludedUserIds = new Set(history?.map((h) => h.user_id) || []);
    const finalCandidates = eligibleCandidates.filter((c) => !excludedUserIds.has(c.id));

    if (finalCandidates.length === 0) {
      return NextResponse.json({ error: 'No hay usuarios elegibles para recibir cupones (todos han recibido en los últimos 3 meses)' }, { status: 400 });
    }

    const shuffled = finalCandidates.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, Math.min(Number(count), shuffled.length));

    let sentCount = 0;
    const createdCoupons = [];

    for (const u of selectedUsers) {
      const code = 'ESQ51-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: coupon, error: couponError } = await adminSupabase
        .from('coupons')
        .insert({
          code,
          discount_amount: Number(discount_amount),
          expires_at: expiresAt.toISOString(),
          used: false
        })
        .select()
        .single();
        
      if (couponError || !coupon) {
        console.error('Error creating coupon:', couponError);
        continue;
      }

      createdCoupons.push(coupon);

      try {
        await sendCouponEmail({
          email: u.email,
          fullName: u.full_name || 'Amigo',
          couponCode: code,
          discountAmount: Number(discount_amount),
          expiresAt: expiresAt.toISOString()
        });

        await adminSupabase.from('coupon_distribution_history').insert({
          coupon_id: coupon.id,
          user_id: u.id,
          email: u.email
        });
        
        sentCount++;
      } catch (e) {
        console.error('Failed to send email to', u.email, e);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalRequested: Number(count),
      coupons: createdCoupons
    });

  } catch (error: unknown) {
    console.error('Distribution error:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
