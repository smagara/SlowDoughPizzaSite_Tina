/**
 * Tina CMS configuration.
 *
 * Local mode (development):   `npm run dev`  → runs `tinacms dev -c "vite"`.
 *   The Tina admin is served at http://localhost:3000/admin/index.html and edits are written
 *   straight to the JSON files in `content/`. Vite hot-reloads the site as files change.
 *
 * Production (GitHub Pages):  the stock Tina admin is NOT deployed (GitHub Pages is static and this
 *   prototype intentionally avoids TinaCloud). Instead the site ships a lightweight, site-styled
 *   editor (`src/cms/EditorApp`) that reuses this schema and opens GitHub Pull Requests.
 *   If TinaCloud is adopted later, set TINA_CLIENT_ID / TINA_TOKEN and run `npm run build:tina`.
 */
import { defineConfig } from 'tinacms';
import { collections } from './schema';

const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  'main';

export default defineConfig({
  branch,
  // Only used if/when TinaCloud is configured – harmless (null) in local mode.
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },
  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },
  schema: {
    collections,
  },
});
