import { useMemo, useRef, useState } from 'react';
import { PATHS, toJsonText } from './github.js';
import { compressImage, shortId, slugify } from './media.js';
import { Area, ConfirmButton, Field, RowList, Text, Toggle } from './ui.jsx';
import { rupees } from '../lib/format.js';

const blankProduct = () => ({
  id: '',
  slug: '',
  name: '',
  category: '',
  price: '',
  mrp: '',
  short: '',
  description: '',
  details: [
    { label: 'Size', value: '' },
    { label: 'Work', value: '' },
    { label: 'Made to order', value: 'Dispatched in 5–7 days' },
  ],
  images: [],
  inStock: true,
  featured: false,
  customisable: true,
  createdAt: new Date().toISOString().slice(0, 10),
});

// images in the editor: { src, path? (repo path for existing), pending? {base64, ext, preview} }
export function AdminImage({ src, imgSrc, ...rest }) {
  const [fallback, setFallback] = useState(false);
  return <img src={fallback ? imgSrc(src, true) : imgSrc(src)} onError={() => !fallback && setFallback(true)} alt="" {...rest} />;
}

function ProductEditor({ initial, catalog, onCancel, onSave, onDelete, busy, imgSrc }) {
  const isNew = !initial.id;
  const [p, setP] = useState(() => ({
    ...initial,
    mrp: initial.mrp || '',
    images: initial.images.map((src) => ({ src })),
  }));
  const [err, setErr] = useState('');
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setP((x) => ({ ...x, [k]: v }));

  const addFiles = async (files) => {
    setErr('');
    setProcessing(true);
    try {
      const added = [];
      for (const f of files) {
        if (!f.type.startsWith('image/')) { setErr(`${f.name} is not an image. Choose JPG, PNG or WebP photos.`); continue; }
        const c = await compressImage(f);
        added.push({ src: c.preview, pending: c });
      }
      setP((x) => ({ ...x, images: [...x.images, ...added] }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const moveImg = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= p.images.length) return;
    const next = p.images.slice();
    [next[i], next[j]] = [next[j], next[i]];
    set('images', next);
  };

  const submit = (e) => {
    e.preventDefault();
    const name = p.name.trim();
    if (!name) return setErr('Add a product name.');
    if (!(Number(p.price) > 0)) return setErr('Add a price greater than 0.');
    if (!p.images.length) return setErr('Add at least one photo.');
    const slug = slugify(p.slug || name);
    const clash = catalog.products.find((x) => x.slug === slug && x.id !== initial.id);
    if (clash) return setErr(`Another product already uses the web address "${slug}". Change the name or the web address.`);
    setErr('');
    onSave({
      ...p,
      id: initial.id || slug,
      slug,
      name,
      price: Number(p.price),
      mrp: Number(p.mrp) || 0,
      details: p.details.filter((d) => d.label.trim() && d.value.trim()),
    });
  };

  return (
    <form className="editor" onSubmit={submit}>
      <div className="editor-head">
        <h2>{isNew ? 'Add a product' : `Edit ${initial.name}`}</h2>
        <button type="button" className="a-btn a-btn-ghost" onClick={onCancel}>Back to products</button>
      </div>

      <section className="panel">
        <h3>Photos</h3>
        <p className="a-muted">The first photo is the cover. Photos are resized automatically before upload.</p>
        <div className="img-grid">
          {p.images.map((im, i) => (
            <figure key={im.src + i} className="img-tile">
              {im.pending ? <img src={im.src} alt="" /> : <AdminImage src={im.src} imgSrc={imgSrc} />}
              {i === 0 && <span className="img-cover">Cover</span>}
              {im.pending && <span className="img-new">New</span>}
              <div className="img-tools">
                <button type="button" className="a-icon" onClick={() => moveImg(i, -1)} disabled={i === 0} aria-label="Move earlier">←</button>
                <button type="button" className="a-icon" onClick={() => moveImg(i, 1)} disabled={i === p.images.length - 1} aria-label="Move later">→</button>
                <button type="button" className="a-icon" onClick={() => set('images', p.images.filter((_, j) => j !== i))} aria-label="Remove photo">×</button>
              </div>
            </figure>
          ))}
          <label className="img-add">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => addFiles([...e.target.files])} disabled={processing} />
            <span>{processing ? 'Preparing photos…' : '+ Add photos'}</span>
          </label>
        </div>
      </section>

      <section className="panel form-grid">
        <h3 className="f-wide">Basics</h3>
        <Field label="Product name"><Text value={p.name} onChange={(v) => set('name', v)} required /></Field>
        <Field label="Category">
          <select value={p.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">No category</option>
            {catalog.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Price (₹)"><input type="number" min="1" step="1" inputMode="numeric" value={p.price} onChange={(e) => set('price', e.target.value)} required /></Field>
        <Field label="Original price (₹)" hint="Optional. Shown crossed out when it's higher than the price."><input type="number" min="0" step="1" inputMode="numeric" value={p.mrp} onChange={(e) => set('mrp', e.target.value)} /></Field>
        <Field label="Web address" hint={`houseofnikunj…/product/${slugify(p.slug || p.name) || 'name'}`} wide>
          <Text value={p.slug} onChange={(v) => set('slug', v)} placeholder="Leave empty to use the product name" />
        </Field>
        <Field label="Short description" hint="One or two lines shown near the price." wide><Area rows={2} value={p.short} onChange={(v) => set('short', v)} /></Field>
        <Field label="Full description" hint="Leave a blank line between paragraphs." wide><Area rows={7} value={p.description} onChange={(v) => set('description', v)} /></Field>
        <div className="f-wide toggles">
          <Toggle checked={p.inStock} onChange={(v) => set('inStock', v)} label="Available to order" />
          <Toggle checked={p.featured} onChange={(v) => set('featured', v)} label="Feature on the home page" />
          <Toggle checked={p.customisable} onChange={(v) => set('customisable', v)} label="Can be customised" />
        </div>
      </section>

      <section className="panel">
        <h3>Details</h3>
        <p className="a-muted">Shown as a list on the product page, for example Size, Work, Care.</p>
        <RowList
          rows={p.details}
          onChange={(v) => set('details', v)}
          fields={[{ key: 'label', placeholder: 'Label, e.g. Size' }, { key: 'value', placeholder: 'Value, e.g. 36 × 8 inches' }]}
          addLabel="+ Add a detail"
          empty="No details yet."
        />
      </section>

      {err && <p className="a-error" role="alert">{err}</p>}
      <div className="editor-foot">
        {!isNew && <ConfirmButton onConfirm={() => onDelete(initial)} disabled={busy}>Delete product</ConfirmButton>}
        <span className="spacer" />
        <button type="button" className="a-btn a-btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="a-btn a-btn-primary" disabled={busy || processing}>{busy ? 'Publishing…' : isNew ? 'Publish product' : 'Publish changes'}</button>
      </div>
    </form>
  );
}

function Categories({ catalog, publish, busy }) {
  const [rows, setRows] = useState(catalog.categories.map((c) => ({ ...c })));
  const [err, setErr] = useState('');
  const dirty = JSON.stringify(rows) !== JSON.stringify(catalog.categories);
  const save = () => {
    const clean = rows.filter((r) => r.name.trim()).map((r) => ({ id: r.id || slugify(r.name), name: r.name.trim() }));
    const removed = catalog.categories.filter((c) => !clean.find((x) => x.id === c.id));
    const used = removed.find((c) => catalog.products.some((p) => p.category === c.id));
    if (used) return setErr(`"${used.name}" still has products. Move them to another category first.`);
    setErr('');
    publish('Update categories', { ...catalog, categories: clean });
  };
  return (
    <section className="panel">
      <h3>Categories</h3>
      <p className="a-muted">Filters appear on the shop page once two categories have products.</p>
      <RowList rows={rows} onChange={setRows} fields={[{ key: 'name', placeholder: 'Category name, e.g. Torans' }]} addLabel="+ Add a category" empty="No categories yet." />
      {err && <p className="a-error" role="alert">{err}</p>}
      {dirty && <div className="editor-foot"><span className="spacer" /><button className="a-btn a-btn-primary" onClick={save} disabled={busy}>{busy ? 'Publishing…' : 'Publish categories'}</button></div>}
    </section>
  );
}

export default function Products({ gh, catalog, setCatalog, run, busy, imgSrc, rememberPreview }) {
  const [editing, setEditing] = useState(null);
  const sorted = useMemo(() => catalog.products, [catalog]);

  const repoPathFor = (src) => (src.startsWith('/images/') ? 'public' + src : null);

  const unusedPaths = (srcs, nextProducts) => {
    const still = new Set(nextProducts.flatMap((p) => p.images));
    return srcs.filter((s) => !still.has(s)).map(repoPathFor).filter(Boolean);
  };

  const saveProduct = (draft) =>
    run(async () => {
      const files = [];
      const images = draft.images.map((im) => {
        if (!im.pending) return im.src;
        const name = `${draft.slug}-${shortId()}.${im.pending.ext}`;
        const src = `/images/products/${name}`;
        files.push({ path: `${PATHS.productImages}/${name}`, base64: im.pending.base64 });
        rememberPreview(src, im.pending.preview);
        return src;
      });
      const product = { ...draft, images };
      const existed = catalog.products.some((x) => x.id === product.id);
      const products = existed ? catalog.products.map((x) => (x.id === product.id ? product : x)) : [...catalog.products, product];
      const next = { ...catalog, products };
      const old = existed ? catalog.products.find((x) => x.id === product.id).images : [];
      const deletes = await gh.existing(unusedPaths(old, products));
      files.push({ path: PATHS.products, text: toJsonText(next) });
      await gh.commit(`${existed ? 'Update' : 'Add'} product: ${product.name}`, files, deletes);
      setCatalog(next);
      setEditing(null);
      return `${product.name} is published.`;
    });

  const deleteProduct = (product) =>
    run(async () => {
      const products = catalog.products.filter((x) => x.id !== product.id);
      const next = { ...catalog, products };
      const deletes = await gh.existing(unusedPaths(product.images, products));
      await gh.commit(`Delete product: ${product.name}`, [{ path: PATHS.products, text: toJsonText(next) }], deletes);
      setCatalog(next);
      setEditing(null);
      return `${product.name} was deleted.`;
    });

  const publishCatalog = (message, next) =>
    run(async () => {
      await gh.commit(message, [{ path: PATHS.products, text: toJsonText(next) }]);
      setCatalog(next);
      return 'Categories are published.';
    });

  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= sorted.length) return;
    const products = sorted.slice();
    [products[i], products[j]] = [products[j], products[i]];
    publishCatalog('Reorder products', { ...catalog, products });
  };

  if (editing) {
    return (
      <ProductEditor
        key={editing.id || 'new'}
        initial={editing}
        catalog={catalog}
        busy={busy}
        imgSrc={imgSrc}
        onCancel={() => setEditing(null)}
        onSave={saveProduct}
        onDelete={deleteProduct}
      />
    );
  }

  return (
    <>
      <div className="editor-head">
        <h2>Products</h2>
        <button className="a-btn a-btn-primary" onClick={() => setEditing(blankProduct())}>+ Add a product</button>
      </div>
      <section className="panel">
        {sorted.length === 0 && <p className="a-muted">No products yet. Add your first piece to show it on the site.</p>}
        <ul className="p-list">
          {sorted.map((p, i) => (
            <li key={p.id}>
              {p.images[0] ? <AdminImage src={p.images[0]} imgSrc={imgSrc} className="p-thumb" /> : <span className="p-thumb" />}
              <div className="p-main">
                <strong>{p.name}</strong>
                <span>
                  {rupees(p.price)}
                  {catalog.categories.find((c) => c.id === p.category) && ` · ${catalog.categories.find((c) => c.id === p.category).name}`}
                </span>
                <span className="p-tags">
                  {!p.inStock && <em className="tag tag-warn">Not available</em>}
                  {p.featured && <em className="tag">Featured</em>}
                  {i === 0 && <em className="tag">Shown first</em>}
                </span>
              </div>
              <div className="p-tools">
                <button className="a-icon" onClick={() => move(i, -1)} disabled={i === 0 || busy} aria-label={`Move ${p.name} up`}>↑</button>
                <button className="a-icon" onClick={() => move(i, 1)} disabled={i === sorted.length - 1 || busy} aria-label={`Move ${p.name} down`}>↓</button>
                <a className="a-btn a-btn-ghost" href={`/product/${p.slug}`} target="_blank" rel="noreferrer">View</a>
                <button className="a-btn" onClick={() => setEditing(p)}>Edit</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Categories key={JSON.stringify(catalog.categories)} catalog={catalog} publish={publishCatalog} busy={busy} />
    </>
  );
}
