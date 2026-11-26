import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { pool } from './db';

const COOKIE_NAME = 'dhaka_bites_session';
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export interface SessionUser {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  otp_verified: boolean;
  face_verified: boolean;
  is_verified: boolean;
}

export async function createSessionCookie(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;

    const { rows } = await pool.query<SessionUser>(
      `SELECT id, full_name, email, phone, otp_verified, face_verified, is_verified
       FROM users WHERE id = $1`,
      [payload.sub]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}
