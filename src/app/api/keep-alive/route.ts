import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Configurar CRON_SECRET en las variables de entorno de Vercel
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Validar si existe el secreto (Recomendado por Vercel para seguridad del endpoint)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error('[KEEP-ALIVE] Unauthorized attempt');
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    
    // Consulta mínima de lectura para generar actividad
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[KEEP-ALIVE] Supabase ERROR:', error.message);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    console.log('[KEEP-ALIVE] Supabase OK');
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('[KEEP-ALIVE] Supabase ERROR:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
