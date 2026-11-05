import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../lib/data.jsx';
import { enquiryMessage, waLink } from '../lib/format.js';
import { InstagramIcon, WhatsAppIcon } from './Icons.jsx';

const NAV = [
  { to: '/shop', label: 'Shop' },
  { to: '/#craft', label: 'Our craft' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function instaUrl(handle) {
  if (!handle) return '';
  if (handle.startsWith('http')) return handle;
  return `https://instagram.com/${handle.replace(/^@/, '')}`;
}

export function Header() {
  const { site } = useData();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname, loc.hash]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);

  const wa = site ? waLink(site.contact.whatsapp, enquiryMessage(site)) : '#';

  return (
    <>
      {site?.announcement?.enabled && site.announcement.text && (
        <p className="announce">{site.announcement.text}</p>
      )}
      <header className="site-header">
        <div className="header-inner">
          <button className="menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}>
            <span /><span />
          </button>
          <nav className="nav-left" aria-label="Main">
            {NAV.slice(0, 2).map((n) => n.to.includes('#') ? <Link key={n.to} to={n.to}>{n.label}</Link> : <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </nav>
          <Link to="/" className="brand" aria-label="House of Nikunj home">
            <img src="/images/brand/wordmark.webp" alt="House of Nikunj" width="640" height="244" />
          </Link>
          <nav className="nav-right" aria-label="More">
            {NAV.slice(2).map((n) => <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
          </nav>
          <a className="header-wa" href={wa} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
            <WhatsAppIcon size={20} />
          </a>
        </div>
      </header>
      <div className={`drawer${open ? ' is-open' : ''}`} aria-hidden={!open}>
        <nav aria-label="Mobile">
          <NavLink to="/" end>Home</NavLink>
          {NAV.map((n) => n.to.includes('#') ? <Link key={n.to} to={n.to}>{n.label}</Link> : <NavLink key={n.to} to={n.to}>{n.label}</NavLink>)}
        </nav>
        <a className="btn btn-gold" href={wa} target="_blank" rel="noreferrer"><WhatsAppIcon /> Chat on WhatsApp</a>
      </div>
    </>
  );
}

export function Footer() {
  const { site } = useData();
  if (!site) return null;
  const c = site.contact;
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/images/brand/logo-full.webp" alt="House of Nikunj, handcrafted home décor" width="700" height="561" loading="lazy" />
          <p>{site.brand.tagline}</p>
        </div>
        <div className="footer-col">
          <h3>Shop</h3>
          <Link to="/shop">All pieces</Link>
          <Link to="/about">Our story</Link>
          <Link to="/#craft">Our craft</Link>
          <Link to="/#faq">Questions</Link>
        </div>
        <div className="footer-col">
          <h3>Policies</h3>
          <Link to="/policies/shipping">Shipping</Link>
          <Link to="/policies/returns">Returns and refunds</Link>
          <Link to="/policies/privacy">Privacy</Link>
          <Link to="/policies/terms">Terms</Link>
        </div>
        <div className="footer-col">
          <h3>Contact</h3>
          <a href={waLink(c.whatsapp, enquiryMessage(site))} target="_blank" rel="noreferrer"><WhatsAppIcon size={15} /> {c.phone}</a>
          {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
          {c.instagram && <a href={instaUrl(c.instagram)} target="_blank" rel="noreferrer"><InstagramIcon size={15} /> {c.instagram.startsWith('http') ? 'Instagram' : '@' + c.instagram.replace(/^@/, '')}</a>}
          {c.hours && <span>{c.hours}</span>}
          {c.address && <span>{c.address}</span>}
        </div>
      </div>
      <div className="footer-base">
        <span>© {new Date().getFullYear()} House of Nikunj</span>
      </div>
    </footer>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();
  const { site } = useData();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, site]);
  return null;
}

export default function Layout() {
  const { site, error } = useData();
  return (
    <>
      <ScrollManager />
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">
        {error ? <p className="load-error">The page could not load. Please refresh.</p> : site ? <Outlet /> : <div className="loading" aria-label="Loading" />}
      </main>
      <Footer />
      {site && (
        <a className="float-wa" href={waLink(site.contact.whatsapp, enquiryMessage(site))} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp">
          <WhatsAppIcon size={24} />
        </a>
      )}
    </>
  );
}
