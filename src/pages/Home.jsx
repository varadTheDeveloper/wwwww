import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useData, useTitle } from '../lib/data.jsx';
import { enquiryMessage, waLink } from '../lib/format.js';
import ToranEdge from '../components/ToranEdge.jsx';
import { SoundIcon, WhatsAppIcon } from '../components/Icons.jsx';
import { Gallery, OrderButton, Price, ProductCard } from '../components/Product.jsx';
import ShareButton from '../components/Share.jsx';

function Hero({ site, first }) {
  const video = useRef(null);
  const [sound, setSound] = useState(false);
  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = sound;
    if (!sound) { v.currentTime = 0; v.play(); }
    setSound(!sound);
  };
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <h1>{site.hero.title}</h1>
          <p>{site.hero.text}</p>
          <div className="hero-actions">
            {first && <Link className="btn btn-gold" to={`/product/${first.slug}`}>View the {first.name.split(' ').slice(-1)[0].toLowerCase()}</Link>}
            <a className="btn btn-ghost" href={waLink(site.contact.whatsapp, enquiryMessage(site))} target="_blank" rel="noreferrer"><WhatsAppIcon /> Chat with us</a>
          </div>
        </div>
        <div className="hero-arch">
          <div className="arch-frame">
            <video ref={video} src={site.hero.video} poster={site.hero.poster} autoPlay muted loop playsInline preload="metadata" aria-label="House of Nikunj brand film" />
          </div>
          <button className="sound-btn" onClick={toggleSound} aria-pressed={sound}>
            <SoundIcon on={sound} /> {sound ? 'Sound on' : 'Play with sound'}
          </button>
        </div>
      </div>
      <ToranEdge />
    </section>
  );
}

function Signature({ site, product }) {
  return (
    <section className="signature silk" id="collection">
      <div className="signature-inner">
        <Gallery images={product.images} name={product.name} />
        <div className="signature-info">
          <p className="kicker">The signature piece</p>
          <h2>{product.name}</h2>
          <Price product={product} />
          <p className="lede">{product.short}</p>
          <dl className="spec">
            {product.details.slice(0, 3).map((d) => (
              <div key={d.label}><dt>{d.label}</dt><dd>{d.value}</dd></div>
            ))}
          </dl>
          <div className="signature-actions">
            <OrderButton site={site} product={product} />
            <ShareButton product={product} />
            <Link className="text-link" to={`/product/${product.slug}`}>See full details</Link>
          </div>
          {product.customisable && <p className="note">Want a different size or colour? We customise every piece on request.</p>}
        </div>
      </div>
    </section>
  );
}

function Collection({ products }) {
  return (
    <section className="collection silk" id="more">
      <div className="section-head">
        <h2>More from the house</h2>
        <Link className="text-link" to="/shop">View all pieces</Link>
      </div>
      <div className="grid">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

function Craft({ site }) {
  return (
    <section className="craft" id="craft">
      <div className="craft-inner">
        <figure className="craft-photo">
          <img src="/images/products/signature-toran-krishna.webp" alt="Close-up of Shri Krishna in beadwork and mirror work" loading="lazy" />
        </figure>
        <div className="craft-copy">
          <h2>Made by hand, bead by bead</h2>
          <p>Every toran is traced, stitched and beaded by our artisans over several days. Nothing is printed and nothing is glued.</p>
          <ul className="craft-list">
            {site.craft.map((c) => (
              <li key={c.title}><h3>{c.title}</h3><p>{c.text}</p></li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Threshold() {
  return (
    <section className="threshold silk">
      <div className="threshold-inner">
        <div className="threshold-copy">
          <h2>For the doorways that matter</h2>
          <p>A toran is the first thing your guests see and the first blessing your home offers. Ours are made for the days you'll remember.</p>
          <ul className="occasions">
            <li>Diwali and Lakshmi puja</li>
            <li>Griha pravesh</li>
            <li>Weddings and haldi</li>
            <li>Your mandir at home</li>
            <li>A gift for someone's new home</li>
          </ul>
        </div>
        <figure className="threshold-photo">
          <img src="/images/products/signature-toran-doorway.webp" alt="The toran hung above a carved wooden door with marigold garlands and brass diyas" loading="lazy" />
        </figure>
        <figure className="threshold-photo threshold-photo-sm">
          <img src="/images/products/signature-toran-flatlay.webp" alt="The full toran laid flat beside a puja thali" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}

function HowToOrder() {
  const steps = [
    ['Choose your piece', 'Browse the collection and tap “Order on WhatsApp” on the piece you love.'],
    ['Confirm on WhatsApp', 'Your message arrives with the product filled in. We confirm the size, delivery and payment with you.'],
    ['We make it and ship it', 'Your toran is handcrafted, packed with care and sent to your door with tracking.'],
  ];
  return (
    <section className="steps">
      <h2>How to order</h2>
      <ol>
        {steps.map(([t, d], i) => (
          <li key={t}><span className="step-n">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
        ))}
      </ol>
    </section>
  );
}

export function Faq({ items }) {
  return (
    <section className="faq silk" id="faq">
      <h2>Questions, answered</h2>
      <div className="faq-list">
        {items.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function Closing({ site }) {
  return (
    <section className="closing">
      <img src="/images/brand/peacock-mark.webp" alt="" width="320" height="216" loading="lazy" />
      <h2>Have a doorway in mind?</h2>
      <p>Send us your door width and the occasion. We'll help you choose a piece or make one just for you.</p>
      <a className="btn btn-gold" href={waLink(site.contact.whatsapp, enquiryMessage(site))} target="_blank" rel="noreferrer"><WhatsAppIcon /> Chat on WhatsApp</a>
    </section>
  );
}

export default function Home() {
  const { site, catalog } = useData();
  useTitle('');
  const products = catalog.products;
  const featured = products.filter((p) => p.featured);
  const lead = featured[0] || products[0];
  return (
    <>
      <Hero site={site} first={lead} />
      {lead && <Signature site={site} product={lead} />}
      {products.length > 1 && <Collection products={products.filter((p) => p !== lead).slice(0, 8)} />}
      <Craft site={site} />
      <Threshold />
      <HowToOrder />
      <Faq items={site.faq} />
      <Closing site={site} />
    </>
  );
}
