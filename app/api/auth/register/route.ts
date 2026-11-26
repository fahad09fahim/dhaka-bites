import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSessionCookie } from '@/lib/auth';
import { issueOtp } from '@/lib/otp';

export async function POST(req: Request) {
  try {
    const { fullName, email, phone, password } = await req.json();

    if (!fullName || !password || password.length < 6 || (!email && !phone)) {
      return NextResponse.json(
        { error: 'Full name, password (6+ chars), and either email or phone are required.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, full_name, email, phone, otp_verified, face_verified, is_verified`,
      [fullName.trim(), email?.trim().toLowerCase() || null, phone?.trim() || null, passwordHash]
    );

    const user = rows[0];
    await createSessionCookie(user.id);

    const channel = user.email ? 'email' : 'phone';
    const target = user.email || user.phone;
    const devOtp = await issueOtp(user.id, channel, target);

    return NextResponse.json({
      user,
      otpChannel: channel,
      ...(devOtp ? { devOtpHint: devOtp } : {}),
    });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return NextResponse.json({ error: 'An account with this email or phone already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Registration failed.' }, { status: 500 });
  }
}
