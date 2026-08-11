import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permanent redirect for legacy /admin or uppercase /Administrador routes
  // Use exact boundary checks so /administrador doesn't match /admin prefix
  if (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/Administrador' ||
    pathname.startsWith('/Administrador/')
  ) {
    const targetPath = pathname.replace(/^\/(admin|Administrador)(\/|$)/, '/administrador$2');
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = targetPath;
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // 2. Instantly pass public routes and admin login
  if (
    !pathname.startsWith('/administrador') ||
    pathname.startsWith('/administrador/login')
  ) {
    return NextResponse.next();
  }

  // 3. Server-side protection for /administrador/* routes
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/administrador/login';
      return NextResponse.redirect(loginUrl);
    }

    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Check 1: Valid session & user present
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/administrador/login';
      return NextResponse.redirect(loginUrl);
    }

    // Check 2: User exists in admin_users with active=true
    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('id, role, active')
      .eq('user_id', user.id)
      .single();

    if (!adminRecord || !adminRecord.active) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/administrador/login';
      return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
  } catch (err: unknown) {
    console.error('[Middleware Error] Admin auth check failed:', err);
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/administrador/login';
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/Administrador/:path*', '/administrador/:path*'],
};
