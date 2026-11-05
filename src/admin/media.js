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
