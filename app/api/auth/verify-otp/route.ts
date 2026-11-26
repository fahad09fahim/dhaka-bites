import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'OTP code is required.' }, { status: 400 });

  const { rows } = await pool.query(
    `SELECT id, code_hash, expires_at FROM otp_codes
     WHERE user_id = $1 AND used = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );

  const otpRecord = rows[0];
  if (!otpRecord || new Date(otpRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'OTP expired or not found.' }, { status: 400 });
  }

  const valid = await bcrypt.compare(String(code).trim(), otpRecord.code_hash);
  if (!valid) return NextResponse.json({ error: 'Invalid OTP code.' }, { status: 400 });

  await pool.query(`UPDATE otp_codes SET used = TRUE WHERE id = $1`, [otpRecord.id]);
  await pool.query(`UPDATE users SET otp_verified = TRUE WHERE id = $1`, [user.id]);

  return NextResponse.json({ otp_verified: true });
}
