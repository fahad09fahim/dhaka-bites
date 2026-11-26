import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getCurrentUser } from '@/lib/auth';
import { getFaceVerificationProvider } from '@/lib/faceVerification';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const provider = getFaceVerificationProvider();
    const session = await provider.createSession(user.id);
    const qrDataUrl = await QRCode.toDataURL(session.qrUrl, { width: 240, margin: 2 });

    return NextResponse.json({
      sessionId: session.sessionId,
      qrUrl: session.qrUrl,
      qrDataUrl,
      mode: session.mode,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
