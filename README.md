# Slow Dough Pizza Co. — website + Tina CMS

A static React/Vite site for a fictional artisan pizzeria, published on **GitHub Pages** and edited by
pizzeria staff through **Tina CMS** — locally with the full Tina admin, and in production through a
site-styled staff editor that turns every change into a **GitHub Pull Request** for the owner to approve.

- Live site: `https://smagara.github.io/SlowDoughPizzaSite_Tina/`
- Staff editor (hidden link in the footer): `https://smagara.github.io/SlowDoughPizzaSite_Tina/#/edit`
- Design document: [`docs/Technical-Design-Document.docx`](docs/Technical-Design-Document.docx)
- Staff instructions: [`docs/Staff-Editing-Guide.pdf`](docs/Staff-Editing-Guide.pdf)

## What staff can edit

| Content | File | Where it shows |
| --- | --- | --- |
| Dough announcement (on/off, headline, detail) | `content/settings/announcement.json` | Dark banner at the top of every page |
| Daily menu (categories → items, prices, tags, vegetarian/vegan) | `content/menu/menu.json` | "Our Daily Menu" |
| Blog posts (title, author, date, excerpt, takeaways, sections, draft flag) | `content/posts/<slug>.json` | "The Baker's Journal" |
| Store hours (7 days) | `content/hours/hours.json` | "Store Hours & Location" |

The content model lives in [`tina/schema.ts`](tina/schema.ts) and is shared by the Tina admin, the staff
editor and the CI content validation, so the rules can never drift apart.

## Run locally

**Prerequisites:** Node.js 22+

```bash
npm install
npm run dev            # Tina dev server (GraphQL on :4001) + Vite (http://localhost:3000)
```

- Website: <http://localhost:3000/>
- Staff editor, **local edit mode**: <http://localhost:3000/#/edit> — writes straight to `content/` via
  Tina's local GraphQL API; the site hot-reloads.
- Full Tina admin (also local mode): <http://localhost:3000/admin/index.html>
- Plain Vite without Tina: `npm run dev:site` (the editor then falls back to GitHub mode).

## Production editing flow (GitHub Pages)

```
staff opens #/edit → signs in with a GitHub fine-grained token → editor verifies the user is a
collaborator with write access → edits are validated (no HTML/script characters, lengths, prices…)
→ "Review & submit" → editor commits to a new branch cms/<user>/<timestamp> and opens a PR against
main → owner reviews (CI validates content) → merge → GitHub Action builds & deploys to Pages
```

Nothing is ever written to `main` by the editor. Deployment is [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml);
PR checks are [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

### One-time repository setup

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Branches → add a rule for `main`**: require a pull request before merging (1 approval),
   require status checks (`verify`), and *do not* allow bypassing. This makes the PR flow mandatory.
3. **Settings → Collaborators**: add each staff member with the **Write** role. Only collaborators with
   write access can sign in to the editor (and GitHub itself refuses branches/PRs from anyone else).
4. Each staff member creates a fine-grained personal access token (GitHub → Settings → Developer
   settings → Fine-grained tokens): repository access *only* this repo; permissions
   **Contents: Read and write**, **Pull requests: Read and write**. The token is only ever sent to
   `api.github.com` and is kept in the browser's `sessionStorage` (cleared when the tab closes).

### Configuration

Copy `.env.example` to `.env` to override defaults (owner/repo/base branch/branch prefix/mode). The
deploy workflow sets `BASE_PATH=/<repo>/` so asset URLs work under `https://<owner>.github.io/<repo>/`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Tina local mode + Vite dev server |
| `npm run build` | Production build to `dist/` (what GitHub Pages serves) |
| `npm run build:tina` | Build including the stock Tina admin (only useful with TinaCloud credentials) |
| `npm test` / `npm run test:watch` | Vitest unit + component tests (jsdom) |
| `npm run validate:content` | Validate every file in `content/` against the Tina schema (run in CI on each PR) |
| `npm run lint` | TypeScript type-check |
| `npm run tina:audit` | Tina's own schema/content audit |
| `npm run check` | lint + test + build |

## Project layout

```
content/                 # CMS-managed JSON content (the only thing staff change)
tina/schema.ts           # Tina collections, fields and validation (single source of truth)
tina/config.ts           # Tina CMS configuration (local mode; TinaCloud optional)
src/content/             # Loads content/ into the site at build time (Vite JSON imports)
src/cms/                 # Staff editor: schema-driven form, validation, GitHub PR + local Tina backends
src/components/          # Website sections (Navbar banner, Menu, Journal, Hours, Footer hidden link)
.github/workflows/       # ci.yml (PR checks) and deploy.yml (GitHub Pages)
docs/                    # Technical Design Document (.docx) and Staff Editing Guide (.pdf)
```

## Typography

Body text uses the system sans-serif font stack (including Segoe UI on Windows).
Headings and serif accents use Georgia, with Times New Roman as a fallback.
All fonts are local.

## AI Disclosure

This site was originally generated with AI assistance in Google AI Studio.
All details, phone numbers, addresses, the company name, etc. are completely fictionalized.

## License

This project is licensed under the [MIT License](./LICENSE).
