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

## Admin login

Go to `/admin` and sign in with ID **abc** and password **123** (test login).

The admin never sees a GitHub key. Sign-in and saving go through two small Cloudflare Pages Functions in `functions/api/`. They check the ID and password, then forward saves to GitHub using a key stored secretly in Cloudflare. The login only works on the Cloudflare site, not with `npm run dev`.

### One-time setup in Cloudflare

Cloudflare dashboard → your Pages project → Settings → Variables and Secrets → add:

| Name | Value | Required |
|---|---|---|
| `GITHUB_TOKEN` | A GitHub fine-grained key for this repo with **Contents: Read and write** (create at https://github.com/settings/personal-access-tokens/new). Add it as a **Secret**. | Yes |
| `ADMIN_ID` | Admin ID. Defaults to `abc`. | No |
| `ADMIN_PASSWORD` | Admin password. Defaults to `123`. Set a strong one before going live. Changing it signs everyone out. | No |
| `GITHUB_REPO` | Defaults to `varadTheDeveloper/wwwww`. | No |
| `GITHUB_BRANCH` | Defaults to `main`. | No |

Redeploy after adding variables so they take effect.
