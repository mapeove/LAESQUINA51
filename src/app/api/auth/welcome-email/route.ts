import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, fullName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    const info = await sendWelcomeEmail({ email, fullName });
    console.log('Welcome email sent successfully:', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: unknown) {
    console.error('Error sending welcome email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido enviando email';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
