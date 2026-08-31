import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendCouponEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { count, discount_amount, days_valid } = await request.json();
    
    if (!count || !discount_amount || !days_valid) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
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

    // 1. Get eligible users (profiles)
    const { data: profiles, error: profilesError } = await adminSupabase
      .from('profiles')
      .select('id, full_name, user_id');
      
    if (profilesError) throw profilesError;

    // Get Auth users for email
    const { data: authUsers, error: usersError } = await adminSupabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    // We join the emails
    const eligibleCandidates = profiles.map(p => {
      const u = authUsers.users.find(authU => authU.id === p.id || authU.id === p.user_id);
      return {
        id: p.id,
        full_name: p.full_name,
        email: u?.email
      };
    }).filter(c => c.email);

    // 2. Filter users who got a coupon in last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const { data: history } = await adminSupabase
      .from('coupon_distribution_history')
      .select('user_id')
      .gt('sent_at', threeMonthsAgo.toISOString());

    const excludedUserIds = new Set(history?.map(h => h.user_id) || []);

    const finalCandidates = eligibleCandidates.filter(c => !excludedUserIds.has(c.id));

    if (finalCandidates.length === 0) {
      return NextResponse.json({ error: 'No hay usuarios elegibles para recibir cupones' }, { status: 400 });
    }

    // Pick random users
    const shuffled = finalCandidates.sort(() => 0.5 - Math.random());
    const selectedUsers = shuffled.slice(0, Math.min(count, shuffled.length));

    // Generate Expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days_valid);

    let sentCount = 0;

    for (const u of selectedUsers) {
      // Create coupon code
      const code = 'ESQ51-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data: coupon, error: couponError } = await adminSupabase
        .from('coupons')
        .insert({
          code,
          discount_amount,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
        
      if (couponError) {
        console.error('Error creating coupon:', couponError);
        continue;
      }

      // Send Email
      try {
        await sendCouponEmail({
          email: u.email!,
          fullName: u.full_name || 'Amigo',
          couponCode: code,
          discountAmount: discount_amount,
          expiresAt: expiresAt.toISOString()
        });

        // Log history
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

    return NextResponse.json({ success: true, sentCount, totalRequested: count });

  } catch (error: any) {
    console.error('Distribution error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
