import React, { Suspense, lazy, useEffect, useState } from 'react';
import App from './App';
import { cmsConfig } from './cms/config';

// The staff editor is code-split so visitors never download it.
const EditorApp = lazy(() => import('./cms/EditorApp'));

export const isEditorHash = (hash: string) => hash === cmsConfig.editorHash || hash.startsWith(`${cmsConfig.editorHash}/`);

/**
 * Tiny hash router: `#/edit` shows the staff editor, anything else shows the website.
 * A hash route is used (instead of a real path) because GitHub Pages serves a static site and
 * would otherwise return a 404 for /edit on a hard refresh.
 */
export const Root: React.FC = () => {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (isEditorHash(hash)) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-[#75685c]">Loading editor…</div>}>
        <EditorApp />
      </Suspense>
    );
  }
  return <App />;
};

export default Root;
