import { NextResponse } from 'next/server';
import { getFaceVerificationProvider } from '@/lib/faceVerification';

export async function POST(req: Request) {
  try {
    const { sessionId, livenessPassed, deviceInfo } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

    const provider = getFaceVerificationProvider();
    const result = await provider.completeVerification(sessionId, {
      livenessPassed: Boolean(livenessPassed),
      deviceInfo,
    });

    return NextResponse.json({ ...result, mode: provider.mode });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
