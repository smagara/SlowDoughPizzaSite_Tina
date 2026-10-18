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
PR checks are [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Both run on Node 24 and use the
Node-24 majors of the official actions; [`.github/dependabot.yml`](.github/dependabot.yml) opens a PR
whenever a newer major of an action is published. The deploy job packages `dist/` itself (tar +
`actions/upload-artifact`) instead of `upload-pages-artifact`, whose internally pinned Node 20
`upload-artifact` cannot be updated from here; `actions/deploy-pages` has no Node 24 major yet and is
run with the explicit `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24` opt-in (TDD §21.1 has a branch-deploy
fallback if that notice must disappear entirely).

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

### Signing in without pasting the token every time

On the sign-in screen, **Remember me on this device with a passcode** (ticked by default) encrypts the
token in the browser (PBKDF2-SHA-256 → AES-256-GCM, WebCrypto) and stores only the ciphertext in
`localStorage`. On the next visit staff type their passcode instead of the token. Five wrong passcodes
erase that person's remembered token; *Forget @name* / *Forget everyone* erase on demand. A token is only
remembered after it has been verified as belonging to a collaborator with write access.

**Shared laptop?** Works without separate machines: each person signs in once with their own token and
passcode, and the device remembers everyone (up to 8). Later visits ask *"Who is editing?"* → pick your
name → your passcode. Sessions belong to the tab and lock after 30 minutes without activity
(`VITE_CMS_IDLE_LOCK_MINUTES`), so the next person cannot submit under the previous name. Separate
browser profiles are still the stronger option where strict accountability matters. See TDD D17/§21.2.

### Several edits in one Pull Request

In the review dialog, **Back to editing** keeps everything you have changed so far; make more changes
and come back to submit a single Pull Request. Batch edits that belong together (tonight's menu);
submit separately when they don't — one rejected item holds back the whole batch. TDD §21.3 has the
full pros/cons.

### Edit screens

Each screen opens with the most-used fields visible and context fields folded into one-line
summaries (e.g. *Section heading & intro* on the menu, *Author, date & illustration* on a post).
Menu categories, dishes and essay sections are collapsed with a preview line; use **Expand all /
Collapse all** or click a row. Anything with a validation error stays open until it is fixed. The
layout is defined in `src/cms/layout.ts`.

### Blog posts and the Draft flag

A new post is **visible as soon as it is saved (local mode) or approved and merged (production)**.
Tick *Draft (hide from the website)* on a post to keep it in the repository without showing it; the
editor shows a prominent "This post is a Draft" notice (with a one-click *Publish this post* button)
and the review dialog flags drafts before you submit. `getPublishedPosts()` filters drafts out of the site.

## Notes on `npm install` output

| Message | Meaning | Action |
| --- | --- | --- |
| `ERESOLVE overriding peer dependency … react-final-form@6.5.9 … react@"^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0"` | `tinacms` (dev-only) still declares React 16–18 as a peer; this project uses React 19. The Tina admin runs on `@tinacms/app`'s own bundled React 18, so nothing breaks. | Silenced by the `overrides` entry in `package.json` that aligns the peer with the project's React. No action needed. |
| `install-scripts … better-sqlite3, core-js, esbuild` (npm ≥ 12) | npm 12 blocks dependency install scripts until they are reviewed. `esbuild` verifies its platform binary (optional – the binary also ships as an optional dependency), `better-sqlite3` downloads a prebuilt binary that Tina only needs for its optional search index, `core-js` only prints a funding banner. | Policy is recorded in `package.json` → `allowScripts` (`esbuild`/`better-sqlite3` approved, `core-js` denied). Review with `npm install-scripts ls`. Older npm ignores the field. |
| `N vulnerabilities (… moderate, … high)` | These come from the **development-only** toolchain (Tina CLI/admin, GraphQL tooling, Vitest/jsdom). The published website ships only `react`, `react-dom` and `lucide-react`; the staff editor ships no Tina runtime. | Check what actually ships with `npm audit --omit=dev` (expected clean). Review `npm audit` periodically and bump `tinacms`/`@tinacms/cli` when fixes land. Do **not** run `npm audit fix --force` – it downgrades/upgrades across majors. |
| `DEP0190 DeprecationWarning: Passing args to a child process with shell option true` (during `npm run dev`) | Emitted by Node 24+ for the way `@tinacms/cli` spawns the `-c` sub-command. Harmless; the arguments are our own fixed strings. | Ignore, or add `node-options=--no-deprecation` to a local `.npmrc` until Tina updates. |

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Tina local mode + Vite dev server (works on Windows/macOS/Linux) |
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
