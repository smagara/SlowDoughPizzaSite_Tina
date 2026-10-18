/**
 * Runtime configuration for the staff editor.
 *
 * All values can be overridden with Vite environment variables (see `.env.example`). The defaults
 * target the prototype repository on GitHub Pages.
 */
export interface CmsConfig {
  owner: string;
  repo: string;
  baseBranch: string;
  /** Prefix for feature branches created by the editor. Never `main`. */
  branchPrefix: string;
  /** URL of the local Tina GraphQL server started by `tinacms dev`. */
  tinaLocalUrl: string;
  /** 'auto' = local Tina when available in dev, GitHub otherwise. */
  mode: 'auto' | 'local' | 'github';
  /** Hash route that opens the editor, e.g. "#/edit". */
  editorHash: string;
  /** Minutes without keyboard/mouse activity before a GitHub session locks (0 = never). */
  idleLockMinutes: number;
}

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

export const cmsConfig: CmsConfig = {
  owner: env.VITE_GITHUB_OWNER || 'smagara',
  repo: env.VITE_GITHUB_REPO || 'SlowDoughPizzaSite_Tina',
  baseBranch: env.VITE_GITHUB_BASE_BRANCH || 'main',
  branchPrefix: env.VITE_CMS_BRANCH_PREFIX || 'cms',
  tinaLocalUrl: env.VITE_TINA_LOCAL_URL || 'http://localhost:4001/graphql',
  mode: (env.VITE_CMS_MODE as CmsConfig['mode']) || 'auto',
  editorHash: '#/edit',
  idleLockMinutes: Number(env.VITE_CMS_IDLE_LOCK_MINUTES ?? 30) || 0,
};

export const GITHUB_API = 'https://api.github.com';

export const repoUrl = (cfg: CmsConfig = cmsConfig) => `https://github.com/${cfg.owner}/${cfg.repo}`;

/** GitHub UI page for creating a fine-grained personal access token. */
export const TOKEN_HELP_URL = 'https://github.com/settings/personal-access-tokens/new';
