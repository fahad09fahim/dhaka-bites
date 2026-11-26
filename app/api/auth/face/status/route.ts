import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const { rows } = await pool.query(
    `SELECT status, provider FROM face_verification_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, user.id]
  );

  if (!rows[0]) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
