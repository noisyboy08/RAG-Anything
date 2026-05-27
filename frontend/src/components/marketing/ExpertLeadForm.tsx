import { useState, type FormEvent } from 'react';
import { apiFetch } from '../../lib/api';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ExpertLeadForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus('submitting');
    try {
      const res = await apiFetch('/leads/expert', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          company: company || null,
          message,
          website: honeypot || null
        })
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: unknown; ok?: boolean };
      if (!res.ok) {
        const d = data.detail;
        let msg = 'Something went wrong.';
        if (typeof d === 'string') msg = d;
        else if (Array.isArray(d))
          msg = d
            .map((item) => (typeof item === 'object' && item && 'msg' in item ? String((item as { msg: string }).msg) : ''))
            .filter(Boolean)
            .join(' ');
        throw new Error(msg || `Request failed (${res.status})`);
      }
      setStatus('success');
      setName('');
      setEmail('');
      setCompany('');
      setMessage('');
      setHoneypot('');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Network error.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-white/[0.1] bg-[#0a0a0d] p-8 text-center">
        <p className="mb-2 text-sm font-semibold text-white">Thanks — we got your message.</p>
        <p className="text-sm text-[#9ca3af]">We’ll reply by email shortly.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/[0.08] bg-[#0a0a0d] p-6 md:p-8"
      noValidate
    >
      <p className="mb-6 text-sm text-[#9ca3af]">
        Tell us about your graph, team size, and timeline. We route this to our inbox and your Supabase{' '}
        <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs text-[#e8eaf0]">expert_leads</code>{' '}
        table.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-xs font-medium text-[#9ca3af]">
          Name
          <input
            required
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#050508] px-3 py-2.5 text-sm text-white outline-none ring-0 placeholder:text-[#6b7280] focus:border-white/25"
            placeholder="Ada Lovelace"
          />
        </label>
        <label className="block text-xs font-medium text-[#9ca3af]">
          Work email
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#050508] px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
            placeholder="you@company.com"
          />
        </label>
      </div>
      <label className="mt-4 block text-xs font-medium text-[#9ca3af]">
        Company <span className="text-[#6b7280]">(optional)</span>
        <input
          name="company"
          autoComplete="organization"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#050508] px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
        />
      </label>
      <label className="mt-4 block text-xs font-medium text-[#9ca3af]">
        How can we help?
        <textarea
          required
          name="message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-lg border border-white/[0.1] bg-[#050508] px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
          placeholder="e.g. SSO, on-prem, custom graph ingest…"
        />
      </label>
      {/* Honeypot */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>
      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="mt-6 w-full rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black transition-opacity disabled:opacity-60 md:w-auto"
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
