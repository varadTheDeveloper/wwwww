// Forwards admin requests to the GitHub API for this one repo only,
// adding the secret GitHub key on the server so it never reaches the browser.
import { config, json, verifySession } from '../../../server/session.js';

const ALLOWED = /^(|contents\/.+|git\/(ref|refs|commits|blobs|trees)(\/.*)?)$/;

export async function onRequest({ request, env, params }) {
  const cfg = config(env);
  if (!(await verifySession(request, cfg))) {
    return json({ message: 'Your session has ended. Sign out and sign in again.' }, 401);
  }
  if (!cfg.token) {
    return json({ message: 'The admin is not connected to GitHub yet. Add GITHUB_TOKEN in the Cloudflare Pages settings.' }, 500);
  }
  const method = request.method;
  if (!['GET', 'POST', 'PATCH'].includes(method)) return json({ message: 'Not allowed.' }, 405);

  const sub = [].concat(params.path || []).join('/');
  if (!ALLOWED.test(sub)) return json({ message: 'Not allowed.' }, 403);

  const search = new URL(request.url).search;
  const res = await fetch(`https://api.github.com/repos/${cfg.repo}${sub ? '/' + sub : ''}${search}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${cfg.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'house-of-nikunj-admin',
      ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
    },
    body: method === 'GET' ? undefined : await request.text(),
  });
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'application/json', 'Cache-Control': 'no-store' },
  });
}
