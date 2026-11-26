import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';
import { createSessionCookie } from '@/lib/auth';

export async function POST(req: Request) {
  const { identifier, password } = await req.json();
  if (!identifier || !password) {
    return NextResponse.json({ error: 'Email/phone and password are required.' }, { status: 400 });
  }

  const normalized = identifier.trim().toLowerCase();
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1`,
    [normalized, identifier.trim()]
  );

  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
  }

  await createSessionCookie(user.id);
  return NextResponse.json({
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      otp_verified: user.otp_verified,
      face_verified: user.face_verified,
      is_verified: user.is_verified,
    },
  });
}
