import React, { useState } from 'react';
import { GitPullRequest, Save, X } from 'lucide-react';
import type { ContentBackend } from '../backends/types';
import type { ChangeSummary } from '../diff';
import { docTitle, collectionLabel } from '../diff';
import { validateText } from '../validation';
import { Button, Notice, inputClass } from './ui';

interface Props {
  backend: ContentBackend;
  summary: ChangeSummary;
  defaultTitle: string;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (title: string, note: string) => void;
}

/**
 * The "are you sure" step. Staff see a plain-English list of what changed before a Pull Request
 * is opened (production) or files are written (local mode).
 */
export const ReviewDialog: React.FC<Props> = ({ backend, summary, defaultTitle, busy, error, onCancel, onConfirm }) => {
  const [title, setTitle] = useState(defaultTitle);
  const [note, setNote] = useState('');
  const titleError = validateText(title, { required: true, max: 100 });
  const noteError = validateText(note, { max: 500, multiline: true });
  const isGitHub = backend.kind === 'github';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#1b1714]/70 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="relative bg-[#faf7f2] w-full max-w-2xl rounded-2xl border border-[#ded2c3] shadow-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[#e2d5c5] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#8a4224] uppercase tracking-wider">Step 2 of 2</span>
            <h2 id="review-title" className="font-serif text-xl font-bold text-[#24211e]">
              {isGitHub ? 'Review & submit for approval' : 'Review & save locally'}
            </h2>
          </div>
          <button type="button" onClick={onCancel} className="p-1.5 rounded-lg text-[#615448] hover:bg-[#ede3d5] cursor-pointer" aria-label="Close review">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          <div className="space-y-3">
            {summary.documents.map((d) => (
              <div key={`${d.collection.name}/${d.document.relativePath}`} className="rounded-xl border border-[#e2d6c7] bg-[#fffdfa] p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-serif font-bold text-[#24211e]">
                    {collectionLabel(d.collection)}
                    {docTitle(d.document) !== d.document.relativePath.replace(/\.json$/, '') && ` · ${docTitle(d.document)}`}
                  </span>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#8a4224] bg-[#f5e6dd] px-2 py-0.5 rounded">{d.action}</span>
                </div>
                {d.action !== 'deleted' && d.document.values.draft === true && (
                  <p className="mt-2 text-xs font-semibold text-[#8a4224] bg-[#fbf0df] border border-[#ead5b6] rounded px-2 py-1">
                    Draft — this post will be saved but stays hidden from the website until “Draft” is unticked.
                  </p>
                )}
                {d.lines.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-[#54483e]">
                    {d.lines.slice(0, 25).map((l, i) => (
                      <li key={i} className="flex gap-2">
                        <span aria-hidden className="text-[#c85a32]">
                          {l.kind === 'added' ? '+' : l.kind === 'removed' ? '−' : '•'}
                        </span>
                        <span>
                          <strong className="font-medium text-[#24211e]">{l.label}</strong>
                          {l.kind === 'changed' || (l.before && l.before !== 'removed') || (l.after && l.after !== 'added') ? (
                            <>
                              : <span className="line-through text-[#9c8f82]">{l.before}</span> → <span>{l.after}</span>
                            </>
                          ) : null}
                        </span>
                      </li>
                    ))}
                    {d.lines.length > 25 && <li className="text-[#8d7e70]">…and {d.lines.length - 25} more</li>}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-[#6e6052] leading-relaxed" id="cms-batch-tip">
            <strong className="text-[#24211e]">Want to include more changes in this same {isGitHub ? 'request' : 'save'}?</strong> Choose <em>Back to editing</em> — everything listed
            above is kept — make the extra changes, then come back here. One {isGitHub ? 'Pull Request' : 'save'} can carry edits to several sections.
          </p>

          {isGitHub && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="pr-title" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
                  Title for the reviewer
                </label>
                <input id="pr-title" className={inputClass(!!titleError)} value={title} onChange={(e) => setTitle(e.target.value)} />
                {titleError && (
                  <p role="alert" className="text-xs text-[#a84d2a]">
                    {titleError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="pr-note" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
                  Note (optional)
                </label>
                <textarea id="pr-note" className={`${inputClass(!!noteError)} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything the reviewer should know?" />
                {noteError && (
                  <p role="alert" className="text-xs text-[#a84d2a]">
                    {noteError}
                  </p>
                )}
              </div>
            </div>
          )}

          {error && <Notice tone="error">{error}</Notice>}

          <Notice tone="info">
            {isGitHub ? (
              <>
                This will create a new branch and open a <strong>Pull Request</strong> on GitHub. The website does not change until the owner approves and merges it — then it
                republishes automatically within a couple of minutes.
              </>
            ) : (
              <>
                Local mode: Tina will write these files into <code>content/</code> on this computer. The website tab (<code>http://localhost:3000/</code>) updates by
                itself; if it does not, refresh that tab (F5). Commit and push the files with git when you are happy.
              </>
            )}
          </Notice>
        </div>

        <div className="px-6 py-4 border-t border-[#e2d5c5] flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Back to editing
          </Button>
          <Button variant="primary" id="cms-confirm-submit-btn" onClick={() => onConfirm(title.trim(), note.trim())} disabled={busy || !!titleError || !!noteError}>
            {isGitHub ? <GitPullRequest className="w-4 h-4 text-[#c85a32]" /> : <Save className="w-4 h-4 text-[#c85a32]" />}
            {busy ? 'Submitting…' : isGitHub ? 'Open Pull Request' : 'Save files'}
          </Button>
        </div>
      </div>
    </div>
  );
};
