import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useData, useTitle } from '../lib/data.jsx';
import { enquiryMessage, paragraphs, waLink } from '../lib/format.js';
import { Gallery, OrderButton, Price, ProductCard } from '../components/Product.jsx';
import ShareButton from '../components/Share.jsx';
import { InstagramIcon, WhatsAppIcon } from '../components/Icons.jsx';
import { Closing } from './Home.jsx';

export function Shop() {
  const { catalog } = useData();
  useTitle('Shop');
  const [cat, setCat] = useState('all');
  const used = catalog.categories.filter((c) => catalog.products.some((p) => p.category === c.id));
  const list = cat === 'all' ? catalog.products : catalog.products.filter((p) => p.category === cat);
  return (
    <section className="page silk">
      <header className="page-head">
        <h1>The collection</h1>
        <p>Every piece is handcrafted to order. Tap any piece to see it up close.</p>
      </header>
      {used.length > 1 && (
        <div className="filters" role="group" aria-label="Filter by category">
          <button className={cat === 'all' ? 'is-active' : ''} onClick={() => setCat('all')}>All</button>
          {used.map((c) => (
            <button key={c.id} className={cat === c.id ? 'is-active' : ''} onClick={() => setCat(c.id)}>{c.name}</button>
          ))}
        </div>
      )}
      {list.length ? (
        <div className={`grid${list.length === 1 ? ' grid-single' : ''}`}>
          {list.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <p className="empty">New pieces are being made. Check back soon or message us on WhatsApp.</p>
      )}
    </section>
  );
}

export function ProductPage() {
  const { slug } = useParams();
  const { site, catalog } = useData();
  const product = catalog.products.find((p) => p.slug === slug);
  useTitle(product ? product.name : 'Not found');
  const [qty, setQty] = useState(1);
  const related = useMemo(
    () => (product ? catalog.products.filter((p) => p.id !== product.id).slice(0, 4) : []),
    [catalog, product]
  );
  if (!product) return <NotFound />;
  const cat = catalog.categories.find((c) => c.id === product.category);
  return (
    <>
      <section className="page silk product-page">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/shop">Shop</Link>
          {cat && <span>{cat.name}</span>}
        </nav>
        <div className="signature-inner">
          <Gallery images={product.images} name={product.name} />
          <div className="signature-info">
            <h1>{product.name}</h1>
            <Price product={product} />
            <p className="lede">{product.short}</p>
            {product.inStock && (
              <div className="qty" role="group" aria-label="Quantity">
                <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
                <output aria-live="polite">{qty}</output>
                <button onClick={() => setQty(Math.min(20, qty + 1))} aria-label="Increase quantity">+</button>
              </div>
            )}
            <div className="signature-actions">
              <OrderButton site={site} product={product} qty={qty} />
              <ShareButton product={product} />
            </div>
            <p className="note">
              {product.inStock ? 'Your WhatsApp message opens with this piece and quantity filled in.' : 'This piece is made on request. Message us and we will tell you when it can be ready.'}
              {product.customisable && ' Custom sizes and colours are available.'}
            </p>
            <div className="desc">
              {paragraphs(product.description).map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <dl className="spec">
              {product.details.map((d) => (
                <div key={d.label}><dt>{d.label}</dt><dd>{d.value}</dd></div>
              ))}
            </dl>
            <p className="policy-links">
              <Link to="/policies/shipping">Shipping</Link>
              <Link to="/policies/returns">Returns</Link>
            </p>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="collection silk related">
          <div className="section-head"><h2>You may also like</h2></div>
          <div className="grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
      <Closing site={site} />
    </>
  );
}

export function About() {
  const { site } = useData();
  useTitle('Our story');
  return (
    <>
      <section className="page about">
        <div className="about-inner">
          <div className="about-copy">
            <h1>{site.about.title}</h1>
            {site.about.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            <Link className="btn btn-gold" to="/shop">See the collection</Link>
          </div>
          <div className="about-photos">
            <img src="/images/products/signature-toran-angle.webp" alt="The toran's beadwork and pearl tassels seen from the side" loading="lazy" />
            <img src="/images/products/signature-toran-detail.webp" alt="Close-up of a pink lotus in beadwork" loading="lazy" />
          </div>
        </div>
      </section>
      <section className="craft">
        <div className="craft-inner craft-inner-solo">
          <div className="craft-copy">
            <h2>What goes into every piece</h2>
            <ul className="craft-list craft-list-wide">
              {site.craft.map((c) => <li key={c.title}><h3>{c.title}</h3><p>{c.text}</p></li>)}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

export function Contact() {
  const { site } = useData();
  useTitle('Contact');
  const c = site.contact;
  const insta = c.instagram ? (c.instagram.startsWith('http') ? c.instagram : `https://instagram.com/${c.instagram.replace(/^@/, '')}`) : '';
  return (
    <section className="page silk contact">
      <header className="page-head">
        <h1>Talk to us</h1>
        <p>The quickest way to reach us is WhatsApp. We usually reply within a few hours.</p>
      </header>
      <div className="contact-grid">
        <a className="contact-card contact-card-main" href={waLink(c.whatsapp, enquiryMessage(site))} target="_blank" rel="noreferrer">
          <WhatsAppIcon size={28} />
          <h2>WhatsApp</h2>
          <p>{c.phone}</p>
        </a>
        <a className="contact-card" href={`tel:${c.phone.replace(/\s/g, '')}`}>
          <h2>Call</h2>
          <p>{c.phone}</p>
          {c.hours && <p className="muted">{c.hours}</p>}
        </a>
        {c.email && (
          <a className="contact-card" href={`mailto:${c.email}`}><h2>Email</h2><p>{c.email}</p></a>
        )}
        {insta && (
          <a className="contact-card" href={insta} target="_blank" rel="noreferrer"><InstagramIcon size={24} /><h2>Instagram</h2><p>{c.instagram.startsWith('http') ? 'Follow us' : '@' + c.instagram.replace(/^@/, '')}</p></a>
        )}
        {c.address && (
          <div className="contact-card"><h2>Visit</h2><p>{c.address}</p></div>
        )}
      </div>
    </section>
  );
}

export function Policy() {
  const { key } = useParams();
  const { site } = useData();
  const p = site.policies[key];
  useTitle(p ? p.title : 'Not found');
  if (!p) return <NotFound />;
  return (
    <section className="page silk policy">
      <header className="page-head"><h1>{p.title}</h1></header>
      <div className="prose">
        {paragraphs(p.body).map((t, i) => <p key={i}>{t}</p>)}
        <p className="muted">Questions? <a href={waLink(site.contact.whatsapp, enquiryMessage(site))} target="_blank" rel="noreferrer">Message us on WhatsApp</a>.</p>
      </div>
    </section>
  );
}

export function NotFound() {
  useTitle('Not found');
  return (
    <section className="page silk not-found">
      <header className="page-head">
        <h1>This page isn't here</h1>
        <p>It may have moved, or the link may be mistyped.</p>
        <Link className="btn btn-gold" to="/">Go to the home page</Link>
      </header>
    </section>
  );
}
