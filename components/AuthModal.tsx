'use client';

import { useEffect, useState } from 'react';

interface Props {
  onClose: () => void;
  onAuthChange: () => void;
}

export default function AuthModal({ onClose, onAuthChange }: Props) {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [step, setStep] = useState<'form' | 'otp' | 'face'>('form');
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [contactType, setContactType] = useState<'email' | 'phone'>('email');
  const [contactValue, setContactValue] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [faceSessionId, setFaceSessionId] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: contactValue, password }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    onAuthChange();
    onClose();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email: contactType === 'email' ? contactValue : undefined,
        phone: contactType === 'phone' ? contactValue : undefined,
        password,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    if (data.devOtpHint) setDevOtpHint(data.devOtpHint);
    setStep('otp');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: otp }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);

    const faceRes = await fetch('/api/auth/face/session', { method: 'POST' });
    const faceData = await faceRes.json();
    if (!faceRes.ok) return setError(faceData.error);

    setQrDataUrl(faceData.qrDataUrl);
    setQrUrl(faceData.qrUrl);
    setFaceSessionId(faceData.sessionId);
    setStep('face');
  };

  useEffect(() => {
    if (step !== 'face' || !faceSessionId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/auth/face/status?sessionId=${encodeURIComponent(faceSessionId)}`);
      const data = await res.json();
      if (data.status === 'VERIFIED') {
        clearInterval(interval);
        onAuthChange();
        onClose();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [step, faceSessionId, onAuthChange, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {tab === 'login' ? 'Sign In to Dhaka Bites' : 'Join Dhaka Bites'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>

        {step === 'form' && (
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium ${tab === 'register' ? 'bg-white shadow' : ''}`}
            >Register</button>
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium ${tab === 'login' ? 'bg-white shadow' : ''}`}
            >Login</button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}

        {step === 'form' && tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              placeholder="Email or Phone (+880...)"
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              required
            />
            <button className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium">Sign In</button>
          </form>
        )}

        {step === 'form' && tab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              required
            />
            <div className="flex gap-2 text-xs">
              <button type="button" onClick={() => setContactType('email')}
                className={`px-3 py-1 rounded border ${contactType === 'email' ? 'bg-orange-50 border-orange-500' : ''}`}>
                Use Email
              </button>
              <button type="button" onClick={() => setContactType('phone')}
                className={`px-3 py-1 rounded border ${contactType === 'phone' ? 'bg-orange-50 border-orange-500' : ''}`}>
                Use Phone
              </button>
            </div>
            <input
              type={contactType === 'email' ? 'email' : 'tel'}
              placeholder={contactType === 'email' ? 'you@example.com' : '+8801XXXXXXXXX'}
              value={contactValue}
              onChange={(e) => setContactValue(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-sm"
              required
            />
            <button className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium">
              Continue to OTP Verification
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to your {contactType}.</p>
            {devOtpHint && (
              <p className="text-xs bg-amber-50 text-amber-800 p-2 rounded">
                Dev Mode OTP: <strong>{devOtpHint}</strong>
              </p>
            )}
            <input
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded-lg p-2.5 text-center tracking-widest font-mono text-lg"
              required
            />
            <button className="w-full bg-orange-600 text-white py-2.5 rounded-lg font-medium">
              Verify OTP &amp; Proceed to Face Check
            </button>
          </form>
        )}

        {step === 'face' && (
          <div className="text-center space-y-3">
            <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
              DEMO MODE · QR FACE VERIFICATION
            </span>
            <p className="text-sm text-gray-600">
              Scan this QR code with your phone to complete the demo face check (or open the link in a new tab).
            </p>
            {qrDataUrl && <img src={qrDataUrl} alt="Face Verification QR" className="mx-auto border rounded-xl" />}
            <a href={qrUrl} target="_blank" rel="noreferrer" className="block text-xs text-orange-600 underline">
              Open verification page in a new tab →
            </a>
            <p className="text-xs text-gray-400 animate-pulse">Waiting for verification...</p>
          </div>
        )}
      </div>
    </div>
  );
}
