'use client';

import { useState } from 'react';
import { submitPublicForm } from '@/lib/forms';

export default function ContactPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale;
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
    setStatus(locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...');

    try {
      await submitPublicForm(formId, {
        locale: locale.toUpperCase() as 'TR' | 'EN',
        payloadJson: form,
        consentGiven: true,
      });

      setStatus(
        locale === 'tr'
          ? 'Form başarıyla gönderildi.'
          : 'Form submitted successfully.',
      );
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        message: '',
      });
    } catch {
      setStatus(
        locale === 'tr'
          ? 'Form gönderilirken hata oluştu.'
          : 'An error occurred while submitting the form.',
      );
    }
  }

  return (
    <main className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        {locale === 'tr' ? 'İletişim' : 'Contact'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <input
          className="w-full rounded border p-3"
          placeholder={locale === 'tr' ? 'Ad' : 'First name'}
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
        />
        <input
          className="w-full rounded border p-3"
          placeholder={locale === 'tr' ? 'Soyad' : 'Last name'}
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
        />
        <input
          className="w-full rounded border p-3"
          placeholder={locale === 'tr' ? 'E-posta' : 'Email'}
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <textarea
          className="w-full rounded border p-3"
          placeholder={locale === 'tr' ? 'Mesaj' : 'Message'}
          rows={6}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
        />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">
          {locale === 'tr' ? 'Gönder' : 'Submit'}
        </button>
      </form>

      {status ? <p>{status}</p> : null}
    </main>
  );
}