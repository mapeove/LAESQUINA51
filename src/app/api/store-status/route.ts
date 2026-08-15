import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStoreStatus } from '@/lib/store-status';

export async function GET() {
  const supabase = await createClient();
  const status = await getStoreStatus(supabase);
  return NextResponse.json(status);
}
