import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { pool } from './db';

export async function issueOtp(userId: string, channel: 'email' | 'phone', target: string) {
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO otp_codes (user_id, channel, code_hash, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, channel, codeHash, expiresAt]
  );

  if (channel === 'email' && process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"Dhaka Bites" <${process.env.SMTP_USER}>`,
      to: target,
      subject: 'Your Dhaka Bites Verification Code',
      text: `Your verification OTP is ${code}. It expires in 10 minutes.`,
    });
  } else {
    console.log(`\n[DHAKA BITES OTP - ${channel.toUpperCase()}] To: ${target} | Code: ${code}\n`);
  }

  return process.env.NODE_ENV !== 'production' ? code : undefined;
}
