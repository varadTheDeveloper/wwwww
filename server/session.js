// Shared helpers for the Cloudflare Pages Functions that power the admin login.
// Credentials and the GitHub key come from Cloudflare environment variables.
// ADMIN_ID / ADMIN_PASSWORD fall back to the test login below until they are set.

export const DEFAULTS = {
  id: 'abc',
  password: '123',
  repo: 'varadTheDeveloper/wwwww',
  branch: 'main',
};

const enc = new TextEncoder();
const SESSION_DAYS = 7;

export function config(env) {
  return {
    id: env.ADMIN_ID || DEFAULTS.id,
    password: env.ADMIN_PASSWORD || DEFAULTS.password,
    repo: env.GITHUB_REPO || DEFAULTS.repo,
    branch: env.GITHUB_BRANCH || DEFAULTS.branch,
    token: env.GITHUB_TOKEN || '',
    secret: env.SESSION_SECRET || env.GITHUB_TOKEN || 'house-of-nikunj',
  };
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function b64url(bytes) {
  let s = '';
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

// Compare without leaking timing information.
export function same(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export async function createSession(cfg) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  const payload = `${cfg.id}.${exp}`;
  return `${payload}.${await hmac(cfg.secret + cfg.password, payload)}`;
}

export async function verifySession(request, cfg) {
  const h = request.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [id, exp, sig] = parts;
  if (!same(id, cfg.id) || !(Number(exp) > Date.now())) return false;
  // Signing with the password too means changing the password signs everyone out.
  return same(sig, await hmac(cfg.secret + cfg.password, `${id}.${exp}`));
}
