import { useRef, useState } from 'react';
import { PATHS, toJsonText } from './github.js';
import { blobToBase64, compressImage, shortId } from './media.js';
import { Area, Field, RowList, Text, Toggle } from './ui.jsx';

function useDraft(site) {
  const [d, setD] = useState(() => structuredClone(site));
  const set = (path, v) =>
    setD((x) => {
      const n = structuredClone(x);
      const keys = path.split('.');
      let o = n;
      keys.slice(0, -1).forEach((k) => (o = o[k]));
      o[keys.at(-1)] = v;
      return n;
    });
  const dirty = JSON.stringify(d) !== JSON.stringify(site);
  return [d, set, dirty, setD];
}

function SaveBar({ dirty, busy, onSave, label = 'Publish changes', onReset }) {
  return (
    <div className={`savebar${dirty ? ' is-dirty' : ''}`}>
      <span>{dirty ? 'You have unpublished changes.' : 'Everything is published.'}</span>
      {dirty && onReset && <button type="button" className="a-btn a-btn-ghost" onClick={onReset}>Discard</button>}
      <button type="button" className="a-btn a-btn-primary" disabled={!dirty || busy} onClick={onSave}>{busy ? 'Publishing…' : label}</button>
    </div>
  );
}

function publishSite(gh, run, setSite, next, message, extraFiles = [], deletes = []) {
  return run(async () => {
    await gh.commit(message, [...extraFiles, { path: PATHS.site, text: toJsonText(next) }], deletes);
    setSite(next);
    return 'Your changes are published.';
  });
}

export function SiteDetails({ gh, site, setSite, run, busy }) {
  const [d, set, dirty, setD] = useDraft(site);
  const digits = String(d.contact.whatsapp || '').replace(/\D/g, '');
  const save = () => {
    if (digits.length < 11) return run(async () => { throw new Error('Enter the WhatsApp number with the country code, for example 91 98765 43210.'); });
    publishSite(gh, run, setSite, { ...d, contact: { ...d.contact, whatsapp: digits } }, 'Update site details');
  };
  return (
    <>
      <div className="editor-head"><h2>Site details</h2></div>
      <section className="panel form-grid">
        <h3 className="f-wide">Contact</h3>
        <Field label="WhatsApp number" hint="With country code. All order buttons send messages here."><Text value={d.contact.whatsapp} onChange={(v) => set('contact.whatsapp', v)} inputMode="tel" /></Field>
        <Field label="Phone number as shown on the site"><Text value={d.contact.phone} onChange={(v) => set('contact.phone', v)} /></Field>
        <Field label="Email" hint="Leave empty to hide."><Text value={d.contact.email} onChange={(v) => set('contact.email', v)} type="email" /></Field>
        <Field label="Instagram" hint="Handle like @houseofnikunj, or a full link. Leave empty to hide."><Text value={d.contact.instagram} onChange={(v) => set('contact.instagram', v)} /></Field>
        <Field label="Working hours"><Text value={d.contact.hours} onChange={(v) => set('contact.hours', v)} /></Field>
        <Field label="Address" hint="Leave empty to hide."><Text value={d.contact.address} onChange={(v) => set('contact.address', v)} /></Field>
      </section>
      <section className="panel form-grid">
        <h3 className="f-wide">Top of the home page</h3>
        <Field label="Headline" wide><Text value={d.hero.title} onChange={(v) => set('hero.title', v)} /></Field>
        <Field label="Text under the headline" wide><Area rows={2} value={d.hero.text} onChange={(v) => set('hero.text', v)} /></Field>
        <div className="f-wide"><Toggle checked={d.announcement.enabled} onChange={(v) => set('announcement.enabled', v)} label="Show the announcement bar at the very top" /></div>
        <Field label="Announcement text" hint="For offers, festive dispatch dates or delivery news." wide><Text value={d.announcement.text} onChange={(v) => set('announcement.text', v)} /></Field>
        <Field label="Tagline" hint="Shown in the footer."><Text value={d.brand.tagline} onChange={(v) => set('brand.tagline', v)} /></Field>
      </section>
      <section className="panel form-grid">
        <h3 className="f-wide">WhatsApp order message</h3>
        <p className="a-muted f-wide">The product name, quantity, price and link are added automatically between these two lines.</p>
        <Field label="Opening line"><Text value={d.order.greeting} onChange={(v) => set('order.greeting', v)} /></Field>
        <Field label="Closing line"><Text value={d.order.closing} onChange={(v) => set('order.closing', v)} /></Field>
      </section>
      <SaveBar dirty={dirty} busy={busy} onSave={save} onReset={() => setD(structuredClone(site))} />
    </>
  );
}

export function StoryFaq({ gh, site, setSite, run, busy }) {
  const [d, set, dirty, setD] = useDraft(site);
  const paras = d.about.paragraphs.join('\n\n');
  return (
    <>
      <div className="editor-head"><h2>Story and FAQ</h2></div>
      <section className="panel form-grid">
        <h3 className="f-wide">About page</h3>
        <Field label="Heading" wide><Text value={d.about.title} onChange={(v) => set('about.title', v)} /></Field>
        <Field label="Your story" hint="Leave a blank line between paragraphs." wide>
          <Area rows={10} value={paras} onChange={(v) => set('about.paragraphs', v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean))} />
        </Field>
      </section>
      <section className="panel">
        <h3>Craft highlights</h3>
        <p className="a-muted">Shown in the “Made by hand” section and on the About page.</p>
        <RowList rows={d.craft} onChange={(v) => set('craft', v)} fields={[{ key: 'title', placeholder: 'Title, e.g. Mirror work' }, { key: 'text', placeholder: 'One line about it', multiline: true, rows: 2 }]} addLabel="+ Add a highlight" empty="No highlights yet." />
      </section>
      <section className="panel">
        <h3>Questions and answers</h3>
        <RowList rows={d.faq} onChange={(v) => set('faq', v)} fields={[{ key: 'q', placeholder: 'Question' }, { key: 'a', placeholder: 'Answer', multiline: true }]} addLabel="+ Add a question" empty="No questions yet." />
      </section>
      <SaveBar dirty={dirty} busy={busy} onSave={() => publishSite(gh, run, setSite, d, 'Update story and FAQ')} onReset={() => setD(structuredClone(site))} />
    </>
  );
}

export function Policies({ gh, site, setSite, run, busy }) {
  const [d, set, dirty, setD] = useDraft(site);
  return (
    <>
      <div className="editor-head"><h2>Policies</h2></div>
      {Object.entries(d.policies).map(([key, p]) => (
        <section className="panel form-grid" key={key}>
          <Field label="Title" wide><Text value={p.title} onChange={(v) => set(`policies.${key}.title`, v)} /></Field>
          <Field label="Text" hint="Leave a blank line between paragraphs." wide><Area rows={8} value={p.body} onChange={(v) => set(`policies.${key}.body`, v)} /></Field>
          <p className="a-muted f-wide">Page address: /policies/{key}</p>
        </section>
      ))}
      <SaveBar dirty={dirty} busy={busy} onSave={() => publishSite(gh, run, setSite, d, 'Update policies')} onReset={() => setD(structuredClone(site))} />
    </>
  );
}

export function HeroMedia({ gh, site, setSite, run, busy, imgSrc, rememberPreview }) {
  const [video, setVideo] = useState(null);
  const [poster, setPoster] = useState(null);
  const [err, setErr] = useState('');
  const vRef = useRef(null);
  const pRef = useRef(null);
  const MAX_MB = 24; // Cloudflare Pages serves files up to 25 MiB

  const pickVideo = (f) => {
    setErr('');
    if (!f) return;
    if (!/^video\/(mp4|webm)$/.test(f.type)) return setErr('Choose an MP4 or WebM video.');
    if (f.size > MAX_MB * 1024 * 1024) return setErr(`This video is ${(f.size / 1048576).toFixed(0)} MB. Use one under ${MAX_MB} MB.`);
    setVideo({ file: f, preview: URL.createObjectURL(f) });
  };
  const pickPoster = async (f) => {
    setErr('');
    if (!f) return;
    try { setPoster(await compressImage(f, { maxSide: 1400 })); } catch (e) { setErr(e.message); }
  };

  const save = () =>
    run(async () => {
      const files = [];
      const next = structuredClone(site);
      const oldPaths = [];
      if (video) {
        const ext = video.file.type === 'video/webm' ? 'webm' : 'mp4';
        const name = `hero-${shortId()}.${ext}`;
        files.push({ path: `${PATHS.media}/${name}`, base64: await blobToBase64(video.file) });
        if (site.hero.video.startsWith('/media/')) oldPaths.push('public' + site.hero.video);
        next.hero.video = `/media/${name}`;
        rememberPreview(next.hero.video, video.preview);
      }
      if (poster) {
        const name = `hero-poster-${shortId()}.${poster.ext}`;
        files.push({ path: `${PATHS.media}/${name}`, base64: poster.base64 });
        if (site.hero.poster.startsWith('/media/')) oldPaths.push('public' + site.hero.poster);
        next.hero.poster = `/media/${name}`;
        rememberPreview(next.hero.poster, poster.preview);
      }
      const deletes = await gh.existing(oldPaths);
      await gh.commit('Update home page video', [...files, { path: PATHS.site, text: toJsonText(next) }], deletes);
      setSite(next);
      setVideo(null); setPoster(null);
      if (vRef.current) vRef.current.value = '';
      if (pRef.current) pRef.current.value = '';
      return 'The new video is published.';
    });

  return (
    <>
      <div className="editor-head"><h2>Home page video</h2></div>
      <section className="panel media-panel">
        <div>
          <h3>Video</h3>
          <p className="a-muted">Plays silently in the arch at the top of the home page. Use a short MP4 under {MAX_MB} MB. Visitors can turn the sound on.</p>
          <video src={video ? video.preview : imgSrc(site.hero.video)} poster={poster ? poster.preview : imgSrc(site.hero.poster)} controls muted playsInline className="media-preview" />
          <label className="a-btn a-file">
            <input ref={vRef} type="file" accept="video/mp4,video/webm" onChange={(e) => pickVideo(e.target.files[0])} />
            Choose a new video
          </label>
        </div>
        <div>
          <h3>Cover image</h3>
          <p className="a-muted">Shown while the video loads.</p>
          <img src={poster ? poster.preview : imgSrc(site.hero.poster)} alt="" className="media-preview" />
          <label className="a-btn a-file">
            <input ref={pRef} type="file" accept="image/*" onChange={(e) => pickPoster(e.target.files[0])} />
            Choose a new cover image
          </label>
        </div>
      </section>
      {err && <p className="a-error" role="alert">{err}</p>}
      <SaveBar dirty={!!(video || poster)} busy={busy} onSave={save} label="Publish video" onReset={() => { setVideo(null); setPoster(null); }} />
    </>
  );
}
