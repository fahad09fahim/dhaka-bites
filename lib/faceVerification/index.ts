import { pool } from '@/lib/db';

export interface FaceVerificationProvider {
  readonly mode: 'demo' | 'production';
  createSession(userId: string): Promise<{ sessionId: string; qrUrl: string; mode: 'demo' | 'production' }>;
  completeVerification(sessionId: string, payload: { livenessPassed: boolean; deviceInfo?: string }): Promise<{ verified: boolean }>;
}

/**
 * 1. FREE UNIVERSITY DEMO PROVIDER
 * Uses browser WebRTC camera on the scanned QR page + simulated liveness confirmation.
 */
class DemoFaceVerificationProvider implements FaceVerificationProvider {
  readonly mode = 'demo' as const;

  async createSession(userId: string) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const { rows } = await pool.query(
      `INSERT INTO face_verification_sessions (user_id, provider, status, expires_at)
       VALUES ($1, 'demo', 'PENDING', $2) RETURNING id`,
      [userId, expiresAt]
    );
    const sessionId = rows[0].id as string;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return {
      sessionId,
      qrUrl: `${baseUrl}/verify-face/${sessionId}`,
      mode: this.mode,
    };
  }

  async completeVerification(sessionId: string, payload: { livenessPassed: boolean; deviceInfo?: string }) {
    const { rows } = await pool.query(
      `SELECT id, user_id, status, expires_at FROM face_verification_sessions WHERE id = $1`,
      [sessionId]
    );
    const session = rows[0];
    if (!session || session.status !== 'PENDING' || new Date(session.expires_at) < new Date()) {
      throw new Error('Verification session is invalid or expired.');
    }

    const newStatus = payload.livenessPassed ? 'VERIFIED' : 'FAILED';
    await pool.query(
      `UPDATE face_verification_sessions
       SET status = $1, metadata = $2::jsonb
       WHERE id = $3`,
      [newStatus, JSON.stringify({ demo: true, deviceInfo: payload.deviceInfo || 'unknown' }), sessionId]
    );

    if (payload.livenessPassed) {
      await pool.query(`UPDATE users SET face_verified = TRUE WHERE id = $1`, [session.user_id]);
    }
    return { verified: payload.livenessPassed };
  }
}

/**
 * 2. REAL BIOMETRIC PROVIDER ADAPTER (Production Placeholder)
 * Drop-in integration point for AWS Rekognition Face Liveness, Persona, or FaceTec.
 */
class ProductionBiometricProvider implements FaceVerificationProvider {
  readonly mode = 'production' as const;

  async createSession(): Promise<never> {
    throw new Error(
      'Production biometric provider is not configured. Set FACE_VERIFICATION_MODE="demo" for the free demo.'
    );
  }

  async completeVerification(): Promise<never> {
    throw new Error('Production biometric webhook verification not configured.');
  }
}

export function getFaceVerificationProvider(): FaceVerificationProvider {
  return process.env.FACE_VERIFICATION_MODE === 'production'
    ? new ProductionBiometricProvider()
    : new DemoFaceVerificationProvider();
}
