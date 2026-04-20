'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminToken } from '@/lib/admin/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@krontech.local');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error('Login failed');
      }

      const data = await res.json();
      setAdminToken(data.accessToken);
      router.push('/admin');
    } catch {
      setError('Login başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Login</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full rounded border p-3"
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded border p-3"
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="w-full rounded bg-black px-4 py-3 text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
      </form>

      {error ? <p className="text-red-600">{error}</p> : null}
    </main>
  );
}