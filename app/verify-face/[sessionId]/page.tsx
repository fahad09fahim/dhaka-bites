'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

export default function VerifyFaceDemoPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'ready' | 'camera' | 'verifying' | 'done' | 'error'>('ready');
  const [message, setMessage] = useState('Open your camera to run the free university demo liveness check.');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStatus('camera');
      setMessage('Align your face inside the frame, then tap "Capture & Verify".');
    } catch {
      setStatus('camera');
      setMessage('Camera unavailable on this device. You can still simulate the demo check below.');
    }
  };

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const completeDemo = async () => {
    setStatus('verifying');
    const res = await fetch('/api/auth/face/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        livenessPassed: true,
        deviceInfo: navigator.userAgent,
      }),
    });
    const data = await res.json();
    if (res.ok && data.verified) {
      setStatus('done');
      setMessage('Demo face verification complete! You can return to your desktop browser.');
    } else {
      setStatus('error');
      setMessage(data.error || 'Verification failed.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-6 text-center space-y-4">
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
          UNIVERSITY DEMO MODE · NO PAID BIOMETRICS
        </span>
        <h1 className="text-xl font-bold text-gray-900">Dhaka Bites Face Verification</h1>
        <p className="text-sm text-gray-600">{message}</p>

        <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden flex items-center justify-center">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-full pointer-events-none" />
        </div>

        {status === 'ready' && (
          <button onClick={startCamera} className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium">
            Start Camera
          </button>
        )}

        {status === 'camera' && (
          <button onClick={completeDemo} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium">
            Capture &amp; Verify (Demo)
          </button>
        )}

        {status === 'done' && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium">
            ✓ Verified! Your registration screen will update automatically.
          </div>
        )}
      </div>
    </main>
  );
}
