import React, { useEffect, useState } from 'react';
import type { Collection, TinaField } from 'tinacms';
import { ChevronDown, ChevronUp, EyeOff, FilePlus2, RotateCcw, Trash2 } from 'lucide-react';
import { groupsFor, type FieldGroup } from '../layout';
import { collectionLabel, docTitle } from '../diff';
import type { EditorStore } from '../useEditorStore';
import { slugify, validateSlug } from '../validation';
import { emptyValueFor, FieldRenderer, type AnyField } from './FieldRenderer';
import { Badge, Button, Card, Notice, SectionHeading, inputClass } from './ui';

interface Props {
  collection: Collection;
  store: EditorStore;
  /** Whether the backend can create/delete files (always true; kept for symmetry with Tina). */
  readOnly?: boolean;
}

const descriptionFor = (c: Collection): string => {
  switch (c.name) {
    case 'announcement':
      return 'The dark banner at the very top of the website. Use it for today\u2019s dough, specials or holiday notices.';
    case 'menu':
      return 'Categories, dishes, prices and dietary tags shown in the "Our Daily Menu" section.';
    case 'post':
      return 'Essays in "The Baker\u2019s Journal". New posts are visible once saved/approved; tick "Draft" on a post to hide it.';
    case 'hours':
      return 'The weekly schedule shown in "Store Hours & Location".';
    default:
      return '';
  }
};

/** One collapsible panel of fields. Opens itself when any of its fields has a validation error. */
const GroupPanel: React.FC<{
  group: FieldGroup;
  collection: Collection;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (v: Record<string, unknown>) => void;
  single: boolean;
}> = ({ group, collection, values, errors, onChange, single }) => {
  const errorCount = Object.keys(errors).filter((path) => group.fields.some((f) => path === f || path.startsWith(`${f}.`) || path.startsWith(`${f}[`))).length;
  const [wantOpen, setWantOpen] = useState(!group.collapsed || single);
  // A group with validation errors cannot be collapsed – nothing that needs fixing is ever hidden –
  // and once opened that way it stays open after the fix so the field being typed in never vanishes.
  const open = wantOpen || errorCount > 0;
  useEffect(() => {
    if (errorCount > 0) setWantOpen(true);
  }, [errorCount]);
  const setOpen = (fn: (o: boolean) => boolean) => setWantOpen(fn);
  const fields = (collection.fields as TinaField[]).filter((f) => group.fields.includes(f.name));
  const body = (
    <div className="space-y-5">
      {fields.map((field) => (
        <FieldRenderer key={field.name} field={field as AnyField} value={values[field.name]} onChange={(v) => onChange({ ...values, [field.name]: v })} path={field.name} errors={errors} />
      ))}
    </div>
  );
  if (single) return <Card className="p-5 sm:p-7">{body}</Card>;
  const summary = !open && group.summary ? group.summary(values) : undefined;
  return (
    <Card className={open ? '' : 'bg-[#f5ede3]/60'} data-testid={`group-${group.id}`}>
      <button
        type="button"
        className="w-full flex items-center gap-3 px-5 sm:px-7 py-4 text-left cursor-pointer"
        onClick={() => {
          if (open && errorCount > 0) return; // cannot hide a group that needs fixing
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        id={`cms-group-${group.id}`}
      >
        {open ? <ChevronUp className="w-4 h-4 text-[#8d7e70] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#8d7e70] shrink-0" />}
        <span className="font-serif text-lg font-bold text-[#24211e]">{group.label}</span>
        {summary && <span className="text-sm text-[#6e6052] truncate flex-1 min-w-0">{summary}</span>}
        {errorCount > 0 && <Badge tone="accent">{errorCount} to fix</Badge>}
        {!open && !summary && <span className="flex-1" />}
        {!open && <span className="text-xs text-[#8d7e70] shrink-0">Click to edit</span>}
      </button>
      {open && <div className="px-5 sm:px-7 pb-6 border-t border-[#eee5d8] pt-5">{body}</div>}
    </Card>
  );
};

/** Renders a whole document as a set of collapsible groups (see src/cms/layout.ts). */
const DocumentForm: React.FC<{ collection: Collection; values: Record<string, unknown>; errors: Record<string, string>; onChange: (v: Record<string, unknown>) => void }> = ({
  collection,
  values,
  errors,
  onChange,
}) => {
  const groups = groupsFor(collection.name, (collection.fields as TinaField[]).map((f) => f.name));
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <GroupPanel key={g.id} group={g} collection={collection} values={values} errors={errors} onChange={onChange} single={groups.length === 1} />
      ))}
    </div>
  );
};

export const CollectionEditor: React.FC<Props> = ({ collection, store }) => {
  const docs = store.state.docs[collection.name] ?? [];
  const singleton = store.isSingleton(collection);
  const label = collectionLabel(collection);
  const [selected, setSelected] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const validationFor = (relativePath: string) =>
    store.validation.find((v) => v.collection === collection.name && v.relativePath === relativePath)?.byPath ?? {};

  // ---- singleton (announcement, menu, hours) ------------------------------------------------
  if (singleton) {
    const doc = docs[0];
    if (!doc) return <Notice tone="error">No {label} document was found in the repository.</Notice>;
    const errors = validationFor(doc.draft.relativePath);
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Editing"
          title={label}
          description={descriptionFor(collection)}
          actions={
            store.isDirty(doc) && (
              <Button size="sm" variant="ghost" onClick={() => store.restore(collection.name, doc.draft.relativePath)}>
                <RotateCcw className="w-3.5 h-3.5" /> Undo changes
              </Button>
            )
          }
        />
        <DocumentForm collection={collection} values={doc.draft.values} errors={errors} onChange={(v) => store.update(collection.name, doc.draft.relativePath, v)} />
      </div>
    );
  }

  // ---- multi-document (blog posts) ----------------------------------------------------------
  const current = selected ? docs.find((d) => d.draft.relativePath === selected) : undefined;

  const createPost = () => {
    const slug = slugify(newTitle);
    const err = validateSlug(slug);
    if (err || !slug) return;
    const relativePath = `${slug}.json`;
    if (docs.some((d) => d.draft.relativePath === relativePath)) return;
    const defaults =
      typeof collection.defaultItem === 'function' ? collection.defaultItem() : (collection.defaultItem ?? emptyValueFor(collection.fields as TinaField[]));
    store.create(collection.name, relativePath, { ...(defaults as Record<string, unknown>), title: newTitle.trim() });
    setSelected(relativePath);
    setCreating(false);
    setNewTitle('');
  };

  if (current) {
    const errors = validationFor(current.draft.relativePath);
    const isDraft = current.draft.values.draft === true;
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow={label}
          title={docTitle(current.draft)}
          description={`File: ${collection.path}/${current.draft.relativePath}`}
          actions={
            <>
              {current.original && store.isDirty(current) && (
                <Button size="sm" variant="ghost" onClick={() => store.restore(collection.name, current.draft.relativePath)}>
                  <RotateCcw className="w-3.5 h-3.5" /> Undo changes
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => setSelected(null)}>
                ← All posts
              </Button>
            </>
          }
        />
        {isDraft ? (
          <Notice tone="warn" title="This post is a Draft — it will NOT appear on the website">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="flex-1">Untick “Draft (hide from the website)” below, or use this button, when it is ready for visitors.</span>
              <Button size="sm" variant="primary" id="cms-publish-post-btn" onClick={() => store.update(collection.name, current.draft.relativePath, { ...current.draft.values, draft: false })}>
                Publish this post
              </Button>
            </div>
          </Notice>
        ) : (
          <p className="text-xs text-[#6e6052] flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" /> Visible to visitors once saved/approved. Tick “Draft (hide from the website)” below to hide it.
          </p>
        )}
        <DocumentForm collection={collection} values={current.draft.values} errors={errors} onChange={(v) => store.update(collection.name, current.draft.relativePath, v)} />
      </div>
    );
  }

  // Newest first – the same order visitors see on the website.
  const sortedDocs = [...docs].sort((a, b) => {
    const ta = Date.parse(String(a.draft.values.publishedDate ?? ''));
    const tb = Date.parse(String(b.draft.values.publishedDate ?? ''));
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Editing"
        title={label}
        description={descriptionFor(collection)}
        actions={
          <Button size="sm" variant="primary" onClick={() => setCreating((c) => !c)} id="cms-new-post-btn">
            <FilePlus2 className="w-3.5 h-3.5 text-[#c85a32]" /> New post
          </Button>
        }
      />

      {creating && (
        <Card className="p-5 space-y-3">
          <label htmlFor="cms-new-post-title" className="block text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
            Title for the new post
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input id="cms-new-post-title" className={inputClass()} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Why We Only Use San Marzano Tomatoes" />
            <Button variant="primary" onClick={createPost} disabled={!slugify(newTitle)} id="cms-create-post-btn">
              Create post
            </Button>
          </div>
          {newTitle && (
            <p className="text-xs text-[#8d7e70]">
              File name: <code>{collection.path}/{slugify(newTitle) || '…'}.json</code>
            </p>
          )}
        </Card>
      )}

      {docs.length === 0 && <Notice>No posts yet. Create the first one!</Notice>}

      <ul className="space-y-3">
        {sortedDocs.map((d) => {
          const v = d.draft.values;
          const errs = validationFor(d.draft.relativePath);
          const errCount = Object.keys(errs).length;
          return (
            <li key={d.draft.relativePath}>
              <Card className={`p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${d.deleted ? 'opacity-60' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-lg font-bold text-[#24211e] truncate">{docTitle(d.draft)}</h3>
                    {v.draft === true && (
                      <Badge tone="warn" className="normal-case tracking-normal">
                        <EyeOff className="w-3 h-3" /> Draft · hidden from website
                      </Badge>
                    )}
                    {d.deleted && <Badge tone="accent">Will be deleted</Badge>}
                    {!d.original && <Badge tone="success">New</Badge>}
                    {d.original && !d.deleted && store.isDirty(d) && <Badge tone="accent">Edited</Badge>}
                    {errCount > 0 && !d.deleted && <Badge tone="accent">{errCount} issue(s)</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-[#75685c]">
                    {typeof v.author === 'string' && v.author ? `${v.author} · ` : ''}
                    {typeof v.publishedDate === 'string' && !Number.isNaN(Date.parse(v.publishedDate))
                      ? new Date(v.publishedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
                      : ''}
                    {' · '}
                    <code>{d.draft.relativePath}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {d.deleted ? (
                    <Button size="sm" variant="secondary" onClick={() => store.restore(collection.name, d.draft.relativePath)}>
                      <RotateCcw className="w-3.5 h-3.5" /> Keep post
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="primary" onClick={() => setSelected(d.draft.relativePath)} id={`cms-edit-${d.draft.relativePath.replace(/\.json$/, '')}`}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        aria-label={`Delete ${docTitle(d.draft)}`}
                        onClick={() => {
                          if (window.confirm(`Delete "${docTitle(d.draft)}"? It will be removed when the change is approved.`)) {
                            store.remove(collection.name, d.draft.relativePath);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
