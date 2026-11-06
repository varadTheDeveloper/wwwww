// Shrinks photos in the browser before upload so the site stays fast.
export async function compressImage(file, { maxSide = 1800, quality = 0.86 } = {}) {
  const bitmap = await createImageBitmap(file).catch(() => null);
  let w, h, source;
  if (bitmap) {
    w = bitmap.width; h = bitmap.height; source = bitmap;
  } else {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(`${file.name} is not an image this browser can open.`));
      i.src = URL.createObjectURL(file);
    });
    w = img.naturalWidth; h = img.naturalHeight; source = img;
  }
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.round(w * scale), ch = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, cw, ch);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  const useBlob = blob && blob.type === 'image/webp' ? blob : await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
  const ext = useBlob.type === 'image/webp' ? 'webp' : 'jpg';
  return { blob: useBlob, ext, base64: await blobToBase64(useBlob), preview: URL.createObjectURL(useBlob), width: cw, height: ch };
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}

export function shortId() {
  return Math.random().toString(36).slice(2, 7);
}

// Builds the 1200×630 JPEG used for WhatsApp / Facebook link previews from the cover photo.
// The crop sits a little above centre, where a toran usually hangs in the photo.
export async function makeShareImage(src) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Could not load the cover photo for the share preview.'));
    i.src = src;
  });
  const W = 1200, H = 630;
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const sw = W / scale, sh = H / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = Math.max(0, Math.min(img.naturalHeight - sh, img.naturalHeight * 0.38 - sh / 2));
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.84));
  if (!blob) throw new Error('Could not create the share preview.');
  return { base64: await blobToBase64(blob) };
}
