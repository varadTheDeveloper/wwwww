import { useEffect, useRef, useState } from 'react';
import { rupees } from '../lib/format.js';
import { WhatsAppIcon } from './Icons.jsx';

function ShareIcon({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3" />
    </svg>
  );
}

const Icon = {
  facebook: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.9v3h2.6V21h3z" /></svg>
  ),
  pinterest: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.2 2.5c-5.4 0-8.2 3.9-8.2 7.1 0 1.9.7 3.7 2.3 4.3.3.1.5 0 .6-.3l.2-.9c.1-.3 0-.4-.2-.7-.5-.6-.8-1.3-.8-2.4 0-3.1 2.3-5.8 6-5.8 3.3 0 5.1 2 5.1 4.7 0 3.5-1.6 6.5-3.9 6.5-1.3 0-2.2-1-1.9-2.3.4-1.5 1.1-3.2 1.1-4.3 0-1-.5-1.8-1.6-1.8-1.3 0-2.3 1.3-2.3 3.1 0 1.1.4 1.9.4 1.9l-1.5 6.5c-.4 1.9-.1 4.3 0 4.5 0 .1.2.2.3.1.1-.2 1.5-1.9 2-3.6l.8-3c.4.7 1.5 1.4 2.7 1.4 3.6 0 6-3.2 6-7.6 0-3.3-2.8-6.4-7.1-6.4z" /></svg>
  ),
  mail: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg>
  ),
  link: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2" /></svg>
  ),
};

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* not supported */ }
    ta.remove();
    return ok;
  }
}

// Phones get the system share sheet (every installed app); computers get a small panel.
function prefersNativeShare() {
  return typeof navigator !== 'undefined' && !!navigator.share && window.matchMedia('(pointer: coarse)').matches;
}

export default function ShareButton({ product, className = '' }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrap = useRef(null);

  const url = `${window.location.origin}/product/${product.slug}`;
  const title = `${product.name} | House of Nikunj`;
  const line = `${product.name}, ${rupees(product.price)}. Handcrafted by House of Nikunj.`;
  const image = product.images[0] ? `${window.location.origin}${product.images[0]}` : '';

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  const onShare = async () => {
    if (prefersNativeShare()) {
      try {
        await navigator.share({ title, text: line, url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return; // person closed the share sheet
      }
    }
    setOpen((o) => !o);
  };

  const onCopy = async () => {
    if (await copyText(url)) setCopied(true);
  };

  const enc = encodeURIComponent;
  const links = [
    { key: 'wa', label: 'WhatsApp', icon: <WhatsAppIcon size={17} />, href: `https://wa.me/?text=${enc(`${line}\n${url}`)}` },
    { key: 'fb', label: 'Facebook', icon: Icon.facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { key: 'pin', label: 'Pinterest', icon: Icon.pinterest, href: `https://pinterest.com/pin/create/button/?url=${enc(url)}&media=${enc(image)}&description=${enc(line)}` },
    { key: 'mail', label: 'Email', icon: Icon.mail, href: `mailto:?subject=${enc(title)}&body=${enc(`${line}\n\n${url}`)}` },
  ];

  return (
    <div className={`share ${className}`} ref={wrap}>
      <button type="button" className="share-btn" onClick={onShare} aria-expanded={open} aria-haspopup="true">
        <ShareIcon /> Share
      </button>
      {open && (
        <div className="share-panel" role="group" aria-label={`Share ${product.name}`}>
          {links.map((l) => (
            <a key={l.key} href={l.href} target={l.key === 'mail' ? undefined : '_blank'} rel="noreferrer" onClick={() => setOpen(false)}>
              {l.icon}
              <span>{l.label}</span>
            </a>
          ))}
          <button type="button" onClick={onCopy}>
            {Icon.link}
            <span>{copied ? 'Link copied' : 'Copy link'}</span>
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{copied ? 'Link copied' : ''}</span>
    </div>
  );
}
