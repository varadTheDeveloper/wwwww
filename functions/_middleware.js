// Fills in link-preview tags (WhatsApp, Facebook, Pinterest, Google) per page.
// The site is a single-page app, so without this every shared link would show
// the same generic title and image. Product data comes from the same
// products.json the admin edits, so new products get previews automatically.

const SITE = 'House of Nikunj';
const DEFAULT_TITLE = 'House of Nikunj | Handcrafted home décor';
const DEFAULT_DESC = 'Hand-embroidered torans and festive home décor, handcrafted to order with pearl beadwork, mirror work and zari.';
const BRAND_IMAGE = '/images/brand/share-card.jpg';

const PAGES = {
  '/shop': ['Shop', 'Every piece is handcrafted to order. See the full House of Nikunj collection.'],
  '/about': ['Our story', 'Nikunj is the grove where Shri Krishna played among lotuses and peacocks. Our torans are beaded and stitched by hand.'],
  '/contact': ['Contact', 'Talk to House of Nikunj on WhatsApp, by phone or by email.'],
};

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rupees = (n) => '₹' + Number(n).toLocaleString('en-IN');

async function readJson(env, url, path) {
  try {
    const r = await env.ASSETS.fetch(new URL(path, url));
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin')) return next();

  const res = await next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;

  const origin = url.origin;
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const meta = {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESC,
    image: origin + BRAND_IMAGE,
    imageW: 1200,
    imageH: 630,
    url: origin + (path === '/' ? '/' : path),
    type: 'website',
    extra: '',
  };

  const productMatch = path.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    const catalog = await readJson(env, url, '/data/products.json');
    const slug = decodeURIComponent(productMatch[1]);
    const p = catalog?.products?.find((x) => x.slug === slug);
    if (p) {
      const onSale = Number(p.mrp) > Number(p.price);
      const img = p.shareImage || p.images?.[0];
      meta.title = `${p.name} | ${SITE}`;
      meta.description = `${rupees(p.price)}${onSale ? ` (was ${rupees(p.mrp)})` : ''}. ${p.short || ''}`.trim();
      meta.type = 'product';
      if (img) {
        meta.image = origin + img;
        if (!p.shareImage) { meta.imageW = 0; meta.imageH = 0; }
      }
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        description: p.short || '',
        image: (p.images || []).map((i) => origin + i),
        brand: { '@type': 'Brand', name: SITE },
        url: meta.url,
        offers: {
          '@type': 'Offer',
          price: String(p.price),
          priceCurrency: 'INR',
          availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
          url: meta.url,
        },
      };
      meta.extra =
        `<meta property="product:price:amount" content="${esc(p.price)}" />` +
        `<meta property="product:price:currency" content="INR" />` +
        `<meta property="product:availability" content="${p.inStock ? 'in stock' : 'preorder'}" />` +
        `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
    }
  } else if (PAGES[path]) {
    meta.title = `${PAGES[path][0]} | ${SITE}`;
    meta.description = PAGES[path][1];
  } else if (path.startsWith('/policies/')) {
    const site = await readJson(env, url, '/data/site.json');
    const pol = site?.policies?.[path.split('/')[2]];
    if (pol) meta.title = `${pol.title} | ${SITE}`;
  }

  const tags =
    `<meta name="description" content="${esc(meta.description)}" />` +
    `<link rel="canonical" href="${esc(meta.url)}" />` +
    `<meta property="og:site_name" content="${SITE}" />` +
    `<meta property="og:type" content="${meta.type}" />` +
    `<meta property="og:title" content="${esc(meta.title)}" />` +
    `<meta property="og:description" content="${esc(meta.description)}" />` +
    `<meta property="og:url" content="${esc(meta.url)}" />` +
    `<meta property="og:image" content="${esc(meta.image)}" />` +
    `<meta property="og:image:secure_url" content="${esc(meta.image)}" />` +
    (meta.imageW ? `<meta property="og:image:width" content="${meta.imageW}" /><meta property="og:image:height" content="${meta.imageH}" />` : '') +
    `<meta property="og:image:alt" content="${esc(meta.title)}" />` +
    `<meta property="og:locale" content="en_IN" />` +
    `<meta name="twitter:card" content="summary_large_image" />` +
    `<meta name="twitter:title" content="${esc(meta.title)}" />` +
    `<meta name="twitter:description" content="${esc(meta.description)}" />` +
    `<meta name="twitter:image" content="${esc(meta.image)}" />` +
    meta.extra;

  const drop = { element(e) { e.remove(); } };
  return new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(meta.title); } })
    .on('meta[name="description"]', drop)
    .on('meta[property^="og:"]', drop)
    .on('meta[name^="twitter:"]', drop)
    .on('link[rel="canonical"]', drop)
    .on('head', { element(e) { e.append(tags, { html: true }); } })
    .transform(res);
}
