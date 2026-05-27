/** Base URL for FastAPI (no trailing slash). */
export function getApiBase(): string {
  const v = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof v === 'string' && v.trim().length > 0) {
    return v.replace(/\/$/, '');
  }
  // Vercel Services: same-origin API under routePrefix (see repo vercel.json).
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const prefixRaw = (import.meta.env.VITE_VERCEL_API_PREFIX as string | undefined)?.trim() || '/_/backend';
    const prefix = prefixRaw.startsWith('/') ? prefixRaw : `/${prefixRaw}`;
    return `${window.location.origin}${prefix.replace(/\/$/, '')}`;
  }
  return 'http://localhost:8000';
}

const CORRELATION_HEADER = 'X-Correlation-Id';
const PROJECT_HEADER = 'X-Project-Id';
const PROJECT_STORAGE_KEY = 'tot-project-id';
const ACCESS_TOKEN_STORAGE_KEY = 'tot_access_token';

/** JWT for FastAPI (Supabase session). */
export function getAccessToken(): string | null {
  const fromEnv = import.meta.env.VITE_ACCESS_TOKEN as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (typeof window === 'undefined') return null;
  const direct = window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (direct && direct.trim()) return direct.trim();
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (!k || !k.startsWith('sb-') || !k.endsWith('-auth-token')) continue;
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { access_token?: string };
      if (typeof parsed.access_token === 'string' && parsed.access_token.length > 0) {
        return parsed.access_token;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function getProjectId(): string {
  const fromEnv = import.meta.env.VITE_PROJECT_ID as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  if (typeof window !== 'undefined') {
    const existing = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (existing && existing.trim()) return existing;
    const generated = `solo-${crypto.randomUUID().slice(0, 8)}`;
    window.localStorage.setItem(PROJECT_STORAGE_KEY, generated);
    return generated;
  }
  return 'solo-default';
}

export function createCorrelationId() {
  return `cid-${crypto.randomUUID()}`;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (!headers.has(CORRELATION_HEADER)) headers.set(CORRELATION_HEADER, createCorrelationId());
  if (!headers.has(PROJECT_HEADER)) headers.set(PROJECT_HEADER, getProjectId());
  if (!headers.has('Authorization')) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(`${getApiBase()}${path}`, { ...init, headers });
}
