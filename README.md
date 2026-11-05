# House of Nikunj

Website for House of Nikunj, handcrafted home décor. Built with React + Vite. No backend: products and page text live in JSON files in this repo, and the admin panel edits them through the GitHub API.

## How it works

| What | Where |
|---|---|
| Products and categories | `public/data/products.json` |
| Contact details, home page text, story, FAQ, policies | `public/data/site.json` |
| Product photos | `public/images/products/` |
| Logo, icons | `public/images/brand/` |
| Home page video | `public/video/` (uploads from the admin go to `public/media/`) |
| Admin panel | `/admin` on the live site |

Every "Publish" in the admin panel makes one commit to `main`. Cloudflare Pages sees the commit and rebuilds the site in about 1–2 minutes.

Orders go to WhatsApp. Every "Order on WhatsApp" button opens a message with the product name, quantity, price and link filled in.

## Run it locally

```bash
npm install
npm run dev
```

## Deploy on Cloudflare Pages (free)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick this repo.
2. Framework preset: **Vite** (or React). Build command: `npm run build`. Output directory: `dist`.
3. Deploy. The site gets a free `*.pages.dev` address; a custom domain can be added later under Custom domains.

No `404.html` is included on purpose: Cloudflare Pages then serves the app for every path, so links like `/product/shyam-kamal-toran` work.

## Signing in to the admin

The admin uses a GitHub fine-grained access token that can only touch this one repo.

1. Go to https://github.com/settings/personal-access-tokens/new
2. Repository access → Only select repositories → this repo.
3. Permissions → Contents → **Read and write**.
4. Generate, copy, and paste it on `/admin`.

The token is stored only in that browser. Anyone who opens `/admin` without a valid token can see the sign-in page but cannot change anything.

If the repo is renamed or moved, update `DEFAULT_REPO` in `src/admin/github.js` (or use "Repository settings" on the sign-in page).
