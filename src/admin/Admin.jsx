import { useCallback, useEffect, useRef, useState } from 'react';
import { clearSession, GitHub, loadSession, login, PATHS, saveSession } from './github.js';
import Products from './Products.jsx';
import { HeroMedia, Policies, SiteDetails, StoryFaq } from './SiteForms.jsx';
import './admin.css';

const TABS = [
  ['products', 'Products'],
  ['site', 'Site details'],
  ['story', 'Story and FAQ'],
  ['policies', 'Policies'],
  ['video', 'Home page video'],
];

function friendly(e) {
  if (e.status === 401) return 'Your session has ended. Sign out and sign in again.';
  if (e.status === 403) return 'The GitHub key in Cloudflare is not allowed to change the website. Check that Contents is set to "Read and write".';
  if (e.status === 404) return 'The website repository was not found. Check GITHUB_REPO in the Cloudflare settings.';
  if (e.message === 'Failed to fetch') return 'Could not reach GitHub. Check your internet connection and try again.';
  return e.message;
}

function Login({ onDone }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await login(id.trim(), password);
      const s = { session: r.session, repo: r.repo, branch: r.branch };
      await new GitHub(s).checkAccess();
      saveSession(s);
      onDone(s);
    } catch (e2) {
      setErr(friendly(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="a-login">
      <form className="a-login-card" onSubmit={submit}>
        <img src="/images/brand/peacock-mark.webp" alt="" width="110" />
        <h1>House of Nikunj admin</h1>
        <p className="a-muted">Sign in to edit products and pages.</p>
        <label className="f">
          <span className="f-label">ID</span>
          <input type="text" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" autoCapitalize="none" required />
        </label>
        <label className="f">
          <span className="f-label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {err && <p className="a-error" role="alert">{err}</p>}
        <button className="a-btn a-btn-primary a-btn-block" disabled={busy || !id.trim() || !password}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

function Dashboard({ session, onSignOut }) {
  const gh = useRef(new GitHub(session)).current;
  const [tab, setTab] = useState('products');
  const [catalog, setCatalog] = useState(null);
  const [site, setSite] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const previews = useRef(new Map());

  const load = useCallback(() => {
    setLoadErr('');
    Promise.all([gh.readJson(PATHS.products), gh.readJson(PATHS.site)])
      .then(([c, s]) => { setCatalog(c); setSite(s); })
      .catch((e) => setLoadErr(friendly(e)));
  }, [gh]);
  useEffect(load, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.kind === 'ok' ? 7000 : 12000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const warn = (e) => { if (busy) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);

  const run = async (fn) => {
    setBusy(true);
    setToast(null);
    try {
      const msg = await fn();
      setToast({ kind: 'ok', text: `${msg} The live site updates in about 1–2 minutes.` });
    } catch (e) {
      setToast({ kind: 'err', text: friendly(e) });
    } finally {
      setBusy(false);
    }
  };

  const rememberPreview = (src, url) => previews.current.set(src, url);
  const imgSrc = (src, fallback) => {
    if (!src) return '';
    if (previews.current.has(src)) return previews.current.get(src);
    if (fallback && src.startsWith('/') && session.repo) return `https://raw.githubusercontent.com/${session.repo}/${session.branch}/public${src}`;
    return src;
  };

  const props = { gh, site, setSite, catalog, setCatalog, run, busy, imgSrc, rememberPreview };

  return (
    <div className="a-shell">
      <header className="a-top">
        <div className="a-top-inner">
          <span className="a-brand"><img src="/images/brand/peacock-mark.webp" alt="" width="44" /> Admin</span>
          <span className="spacer" />
          <a href="/" target="_blank" rel="noreferrer" className="a-top-link">View site</a>
          <button className="a-top-link" onClick={onSignOut}>Sign out</button>
        </div>
        <nav className="a-tabs" aria-label="Admin sections">
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'is-active' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
      </header>
      <main className="a-main">
        {loadErr ? (
          <section className="panel">
            <p className="a-error" role="alert">{loadErr}</p>
            <button className="a-btn" onClick={load}>Try again</button>
          </section>
        ) : !catalog || !site ? (
          <p className="a-muted">Loading your content…</p>
        ) : (
          <>
            {tab === 'products' && <Products {...props} />}
            {tab === 'site' && <SiteDetails key="site" {...props} />}
            {tab === 'story' && <StoryFaq key="story" {...props} />}
            {tab === 'policies' && <Policies key="pol" {...props} />}
            {tab === 'video' && <HeroMedia {...props} />}
          </>
        )}
      </main>
      {toast && (
        <div className={`a-toast a-toast-${toast.kind}`} role="status">
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} aria-label="Dismiss">×</button>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(() => loadSession());
  useEffect(() => {
    document.title = 'Admin | House of Nikunj';
    const m = document.createElement('meta');
    m.name = 'robots'; m.content = 'noindex';
    document.head.appendChild(m);
    return () => m.remove();
  }, []);
  if (!session) return <Login onDone={setSession} />;
  return <Dashboard session={session} onSignOut={() => { clearSession(); setSession(null); }} />;
}
