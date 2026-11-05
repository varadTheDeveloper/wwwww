import { useCallback, useEffect, useRef, useState } from 'react';
import { clearSession, DEFAULT_REPO, GitHub, loadSession, PATHS, saveSession } from './github.js';
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
  if (e.status === 401) return 'Your access key is no longer valid. Sign out and sign in with a new key.';
  if (e.status === 403) return 'This access key is not allowed to change the website. Check that Contents is set to "Read and write".';
  if (e.status === 404) return 'The website repository was not found. Check the repository details on the sign-in page.';
  if (e.message === 'Failed to fetch') return 'Could not reach GitHub. Check your internet connection and try again.';
  return e.message;
}

function Login({ onDone }) {
  const [token, setToken] = useState('');
  const [repo, setRepo] = useState(DEFAULT_REPO);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    const s = { ...repo, token: token.trim() };
    try {
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
        <p className="a-muted">Sign in with your GitHub access key to edit products and pages.</p>
        <label className="f">
          <span className="f-label">Access key</span>
          <input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="github_pat_…" autoComplete="off" required />
        </label>
        {err && <p className="a-error" role="alert">{err}</p>}
        <button className="a-btn a-btn-primary a-btn-block" disabled={busy || !token.trim()}>{busy ? 'Checking…' : 'Sign in'}</button>

        <details className="a-help">
          <summary>How to get an access key</summary>
          <ol>
            <li>Open <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">GitHub's new access key page</a> and sign in.</li>
            <li>Name it “House of Nikunj admin” and choose an expiry date.</li>
            <li>Under <b>Repository access</b>, choose <b>Only select repositories</b> and pick <b>{repo.owner}/{repo.repo}</b>.</li>
            <li>Under <b>Permissions</b>, set <b>Contents</b> to <b>Read and write</b>.</li>
            <li>Select <b>Generate token</b>, copy it and paste it above.</li>
          </ol>
          <p>The key is saved only in this browser. Sign in only on your own phone or computer, because anyone with the key can change the website.</p>
        </details>
        <details className="a-help">
          <summary>Repository settings</summary>
          <div className="form-grid">
            <label className="f"><span className="f-label">Owner</span><input value={repo.owner} onChange={(e) => setRepo({ ...repo, owner: e.target.value.trim() })} /></label>
            <label className="f"><span className="f-label">Repository</span><input value={repo.repo} onChange={(e) => setRepo({ ...repo, repo: e.target.value.trim() })} /></label>
            <label className="f"><span className="f-label">Branch</span><input value={repo.branch} onChange={(e) => setRepo({ ...repo, branch: e.target.value.trim() })} /></label>
          </div>
        </details>
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
    if (fallback && src.startsWith('/')) return `https://raw.githubusercontent.com/${session.owner}/${session.repo}/${session.branch}/public${src}`;
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
