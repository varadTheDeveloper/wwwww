import { config, createSession, json, same } from '../../server/session.js';

export async function onRequestPost({ request, env }) {
  const cfg = config(env);
  let body = {};
  try { body = await request.json(); } catch { /* empty body */ }
  const ok = same(String(body.id || '').trim(), cfg.id) && same(String(body.password || ''), cfg.password);
  if (!ok) {
    await new Promise((r) => setTimeout(r, 700)); // slow down guessing
    return json({ message: 'The ID or password is wrong.' }, 401);
  }
  if (!cfg.token) {
    return json({ message: 'The admin is not connected to GitHub yet. Add GITHUB_TOKEN in the Cloudflare Pages settings, then redeploy.' }, 500);
  }
  return json({ session: await createSession(cfg), repo: cfg.repo, branch: cfg.branch });
}
