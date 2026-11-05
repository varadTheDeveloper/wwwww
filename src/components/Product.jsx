import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderMessage, rupees, waLink } from '../lib/format.js';
import { WhatsAppIcon } from './Icons.jsx';

export function Price({ product }) {
  const showMrp = Number(product.mrp) > Number(product.price);
  return (
    <p className="price">
      <span className="price-now">{rupees(product.price)}</span>
      {showMrp && <s className="price-mrp">{rupees(product.mrp)}</s>}
    </p>
  );
}

export function OrderButton({ site, product, qty = 1, className = '' }) {
  if (!product.inStock) {
    return (
      <a className={`btn btn-outline ${className}`} href={waLink(site.contact.whatsapp, `${site.order?.greeting || 'Hello!'}\n\nPlease let me know when *${product.name}* is available again.`)} target="_blank" rel="noreferrer">
        <WhatsAppIcon /> Ask when it's back
      </a>
    );
  }
  return (
    <a className={`btn btn-gold ${className}`} href={waLink(site.contact.whatsapp, orderMessage(site, product, qty))} target="_blank" rel="noreferrer">
      <WhatsAppIcon /> Order on WhatsApp
    </a>
  );
}

export function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.slug}`} className="card">
      <div className="card-img">
        <img src={product.images[0]} alt={product.name} loading="lazy" />
        {product.images[1] && <img className="card-img-alt" src={product.images[1]} alt="" loading="lazy" />}
        {!product.inStock && <span className="badge">Made on request</span>}
      </div>
      <h3>{product.name}</h3>
      <Price product={product} />
    </Link>
  );
}

export function Gallery({ images, name }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = images.length;
  const go = useCallback((d) => setActive((a) => (a + d + n) % n), [n]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setZoom(false);
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [zoom, go]);

  if (!n) return null;
  return (
    <div className="gallery">
      <button className="gallery-main" onClick={() => setZoom(true)} aria-label="View larger image">
        <img src={images[active]} alt={`${name}, photo ${active + 1} of ${n}`} />
      </button>
      {n > 1 && (
        <div className="gallery-thumbs" role="tablist" aria-label="Product photos">
          {images.map((src, i) => (
            <button key={src} role="tab" aria-selected={i === active} className={i === active ? 'is-active' : ''} onClick={() => setActive(i)}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {zoom && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${name} photos`} onClick={() => setZoom(false)}>
          <img src={images[active]} alt={`${name}, photo ${active + 1} of ${n}`} onClick={(e) => e.stopPropagation()} />
          {n > 1 && (
            <>
              <button className="lb-prev" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}>‹</button>
              <button className="lb-next" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}>›</button>
            </>
          )}
          <button className="lb-close" aria-label="Close" onClick={() => setZoom(false)}>×</button>
          <span className="lb-count">{active + 1} / {n}</span>
        </div>
      )}
    </div>
  );
}
