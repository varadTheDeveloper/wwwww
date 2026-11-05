export function rupees(n) {
  if (n === null || n === undefined || n === '') return '';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function waLink(number, text) {
  const digits = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function orderMessage(site, product, qty = 1) {
  const o = site.order || {};
  const url = `${window.location.origin}/product/${product.slug}`;
  return [
    o.greeting || 'Hello!',
    '',
    "I'd like to order:",
    `*${product.name}*`,
    `Quantity: ${qty}`,
    `Price: ${rupees(product.price)}${qty > 1 ? ` each (${rupees(product.price * qty)} total)` : ''}`,
    url,
    '',
    o.closing || '',
  ].join('\n').trim();
}

export function enquiryMessage(site) {
  return `${site.order?.greeting || 'Hello!'}\n\nI have a question about your décor.`;
}

export function paragraphs(text) {
  return String(text || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}
