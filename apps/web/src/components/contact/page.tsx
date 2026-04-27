'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  getPublicFormByType,
  type FormType,
  type PublicForm,
  type PublicFormField,
  submitPublicForm,
} from '@/lib/forms';

type FieldValue = boolean | string;
type FormValues = Record<string, FieldValue>;
type PublicManagedFormProps = {
  formType?: FormType;
  intro?: Record<'en' | 'tr', string>;
  params: Promise<{ locale: string }>;
  submitLabel?: Record<'en' | 'tr', string>;
  title?: Record<'en' | 'tr', string>;
};

export default function ContactPage({
  formType = 'CONTACT',
  intro,
  params,
  submitLabel,
  title,
}: PublicManagedFormProps) {
  const { locale } = React.use(params);
  const activeLocale = locale === 'en' ? 'en' : 'tr';
  const apiLocale = activeLocale.toUpperCase() as 'TR' | 'EN';
  const [formDefinition, setFormDefinition] = useState<PublicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [values, setValues] = useState<FormValues>({});
  const [website, setWebsite] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadForm() {
      try {
        const form = await getPublicFormByType(formType);
        if (!mounted) return;

        setFormDefinition(form);
        setValues(createInitialValues(form.fields));
      } catch {
        if (mounted) {
          setFormDefinition(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadForm();

    return () => {
      mounted = false;
    };
  }, [formType]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!formDefinition) return;

    setStatus(activeLocale === 'tr' ? 'Gonderiliyor...' : 'Submitting...');

    try {
      await submitPublicForm(formDefinition.id, {
        locale: apiLocale,
        payloadJson: values,
        consentGiven: Boolean(values.consent),
        honeypot: website,
      });

      setStatus(
        successMessageForForm(
          activeLocale,
          formType,
          formDefinition.successMessage,
        ),
      );
      setValues(createInitialValues(formDefinition.fields));
      setWebsite('');
    } catch {
      setStatus(
        activeLocale === 'tr'
          ? 'Form gonderilirken hata olustu.'
          : 'An error occurred while submitting the form.',
      );
    }
  }

  function updateValue(field: PublicFormField, value: FieldValue) {
    setValues((current) => ({
      ...current,
      [field.name]: value,
    }));
  }

  return (
    <main className="space-y-6 p-8">
      <header>
        <h1 className="text-3xl font-bold">
          {title?.[activeLocale] ??
            (activeLocale === 'tr' ? 'Iletisim' : 'Contact')}
        </h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          {intro?.[activeLocale] ??
            (activeLocale === 'tr'
              ? 'Talebinizi bize iletin; ekibimiz sizinle iletisime gecsin.'
              : 'Send your request and our team will get back to you.')}
        </p>
      </header>

      {loading ? (
        <p>{activeLocale === 'tr' ? 'Yukleniyor...' : 'Loading...'}</p>
      ) : null}

      {!loading && !formDefinition ? (
        <div className="max-w-xl rounded-lg border border-dashed border-gray-300 bg-white p-6 text-gray-600">
          {activeLocale === 'tr'
            ? 'Form gecici olarak kullanilamiyor.'
            : 'The form is temporarily unavailable.'}
        </div>
      ) : null}

      {formDefinition ? (
        <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
          {formDefinition.fields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              formType={formType}
              locale={activeLocale}
              value={values[field.name]}
              onChange={(value) => updateValue(field, value)}
            />
          ))}

          <div className="hidden">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          <button
            className="rounded-md bg-black px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
            type="submit"
          >
            {submitLabel?.[activeLocale] ??
              (activeLocale === 'tr' ? 'Gonder' : 'Submit')}
          </button>
        </form>
      ) : null}

      {status ? (
        <p
          className="max-w-xl text-sm text-gray-700"
          role="status"
          aria-live="polite"
        >
          {status}
        </p>
      ) : null}
    </main>
  );
}

function FormField({
  field,
  formType,
  locale,
  onChange,
  value,
}: {
  field: PublicFormField;
  formType: FormType;
  locale: 'en' | 'tr';
  onChange: (value: FieldValue) => void;
  value: FieldValue | undefined;
}) {
  const label = labelForField(field, locale, formType);

  if (field.fieldType === 'CHECKBOX') {
    return (
      <label className="flex items-start gap-3 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={value === true}
          required={field.isRequired}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-4"
        />
        <span>{label}</span>
      </label>
    );
  }

  if (field.fieldType === 'TEXTAREA') {
    return (
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-gray-700">
          {label}
        </span>
        <textarea
          className="w-full rounded-md border border-gray-300 p-3"
          rows={6}
          required={field.isRequired}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (field.fieldType === 'SELECT') {
    return (
      <label className="block space-y-2">
        <span className="text-sm font-semibold text-gray-700">
          {label}
        </span>
        <select
          className="h-12 w-full rounded-md border border-gray-300 px-3"
          required={field.isRequired}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">{locale === 'tr' ? 'Seciniz...' : 'Select...'}</option>
          {readOptions(field.optionsJson).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input
        className="h-12 w-full rounded-md border border-gray-300 px-3"
        required={field.isRequired}
        type={
          field.fieldType === 'EMAIL'
            ? 'email'
            : field.fieldType === 'PHONE'
              ? 'tel'
              : 'text'
        }
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function labelForField(
  field: PublicFormField,
  locale: 'en' | 'tr',
  formType: FormType,
) {
  if (locale === 'en') {
    return field.label;
  }

  const trLabels: Record<string, string> = {
    company: 'Sirket',
    consent:
      formType === 'DEMO_REQUEST'
        ? 'Demo talebim hakkinda benimle iletisime gecilmesini kabul ediyorum.'
        : 'Talebim hakkinda benimle iletisime gecilmesini kabul ediyorum.',
    email: formType === 'DEMO_REQUEST' ? 'Is e-postasi' : 'E-posta',
    firstName: 'Ad',
    lastName: 'Soyad',
    message: 'Mesaj',
    phone: 'Telefon',
    product: 'Ilgilenilen urun',
  };

  return trLabels[field.name] ?? field.label;
}

function successMessageForForm(
  locale: 'en' | 'tr',
  formType: FormType,
  cmsMessage?: string | null,
) {
  if (locale === 'tr') {
    return formType === 'DEMO_REQUEST'
      ? 'Tesekkurler. Ekibimiz demo planlamak icin sizinle iletisime gececek.'
      : 'Tesekkurler. Mesajiniz alindi.';
  }

  return (
    cmsMessage ||
    (formType === 'DEMO_REQUEST'
      ? 'Thank you. Our team will contact you to schedule a demo.'
      : 'Thank you. Your message has been received.')
  );
}

function createInitialValues(fields: PublicFormField[]) {
  return fields.reduce<FormValues>((acc, field) => {
    acc[field.name] = field.fieldType === 'CHECKBOX' ? false : '';
    return acc;
  }, {});
}

function readOptions(optionsJson: unknown) {
  if (Array.isArray(optionsJson)) {
    return optionsJson.filter(
      (option): option is string =>
        typeof option === 'string' && option.trim().length > 0,
    );
  }

  if (
    typeof optionsJson === 'object' &&
    optionsJson !== null &&
    'options' in optionsJson
  ) {
    const options = (optionsJson as { options?: unknown }).options;

    if (Array.isArray(options)) {
      return options.filter(
        (option): option is string =>
          typeof option === 'string' && option.trim().length > 0,
      );
    }
  }

  return [];
}
