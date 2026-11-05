// The admin talks to GitHub through the site's own /api/github endpoint
// (a Cloudflare Pages Function). That function holds the secret GitHub key,
// so the browser only ever sees a login session.
// The repo is the database: JSON files hold the content, images live in public/images.
// Every save becomes one commit; Cloudflare Pages rebuilds the site from it.

export const PATHS = {
  products: 'public/data/products.json',
  site: 'public/data/site.json',
  productImages: 'public/images/products',
  media: 'public/media',
};

const KEY = 'hon-admin-v2';

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage blocked */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); localStorage.removeItem('hon-admin-v1'); } catch { /* storage blocked */ }
}

export async function login(id, password) {
  let res;
  try {
    res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });
  } catch {
    throw new Error('Could not reach the website. Check your internet connection and try again.');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    if (res.status === 404 || res.status === 405 || !body) {
      throw new Error('Sign-in only works on the live Cloudflare site, not on a local preview.');
    }
    throw new Error(body.message || 'Sign-in failed. Try again.');
  }
  return body; // { session, repo, branch }
}

export class GitHub {
  constructor({ session, branch }) {
    this.session = session;
    this.branch = branch;
  }

  async api(path, opts = {}) {
    const res = await fetch(`/api/github${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${this.session}`,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (!res.ok) {
      let msg = `GitHub returned ${res.status}`;
      try { const j = await res.json(); if (j.message) msg = j.message; } catch { /* no body */ }
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  async checkAccess() {
    const r = await this.api('');
    if (!r.permissions?.push) {
      throw new Error('The GitHub key in Cloudflare can read the website but cannot save changes. Give it "Contents: Read and write" access.');
    }
    return r;
  }

  async readJson(path) {
    const r = await this.api(`/contents/${path}?ref=${encodeURIComponent(this.branch)}&t=${Date.now()}`);
    const bin = atob(r.content.replace(/\n/g, ''));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  // files: [{ path, text } | { path, base64 }], deletes: [path]
  async commit(message, files = [], deletes = [], attempt = 0) {
    const ref = await this.api(`/git/ref/heads/${encodeURIComponent(this.branch)}`);
    const parent = ref.object.sha;
    const parentCommit = await this.api(`/git/commits/${parent}`);

    const tree = [];
    for (const f of files) {
      const blob = await this.api('/git/blobs', {
        method: 'POST',
        body: JSON.stringify(
          f.base64 !== undefined ? { content: f.base64, encoding: 'base64' } : { content: f.text, encoding: 'utf-8' }
        ),
      });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    for (const p of deletes) tree.push({ path: p, mode: '100644', type: 'blob', sha: null });

    const newTree = await this.api('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: parentCommit.tree.sha, tree }),
    });
    const c = await this.api('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: newTree.sha, parents: [parent] }),
    });
    try {
      await this.api(`/git/refs/heads/${encodeURIComponent(this.branch)}`, {
        method: 'PATCH',
        body: JSON.stringify({ sha: c.sha }),
      });
    } catch (e) {
      // Someone else pushed in between: rebuild on top of the new head once.
      if (e.status === 422 && attempt < 2) return this.commit(message, files, deletes, attempt + 1);
      throw e;
    }
    return c;
  }

  // Deleting a path that no longer exists makes the tree call fail, so only delete what exists.
  async existing(paths) {
    const out = [];
    for (const p of paths) {
      try {
        await this.api(`/contents/${p}?ref=${encodeURIComponent(this.branch)}`, { method: 'GET' });
        out.push(p);
      } catch { /* already gone */ }
    }
    return out;
  }
}

export function toJsonText(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}
