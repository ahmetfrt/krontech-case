'use client';

import { useState } from 'react';
import { submitPublicForm } from '@/lib/forms';

export default function ContactPage() {
  const formId = process.env.NEXT_PUBLIC_CONTACT_FORM_ID || '';
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<string>('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Gönderiliyor...');

    try {
      await submitPublicForm(formId, {
        locale: 'TR',
        payloadJson: form,
        consentGiven: true,
      });

      setStatus('Form başarıyla gönderildi.');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        message: '',
      });
    } catch {
      setStatus('Form gönderilirken hata oluştu.');
    }
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">İletişim</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <input
          className="w-full rounded border p-3"
          placeholder="Ad"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <input
          className="w-full rounded border p-3"
          placeholder="Soyad"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <input
          className="w-full rounded border p-3"
          placeholder="E-posta"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <textarea
          className="w-full rounded border p-3"
          placeholder="Mesaj"
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">
          Gönder
        </button>
      </form>

      {status ? <p>{status}</p> : null}
      <p>Form ID: {formId}</p>
    </main>
  );
}