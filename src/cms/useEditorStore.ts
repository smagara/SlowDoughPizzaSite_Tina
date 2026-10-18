import { useCallback, useMemo, useReducer } from 'react';
import type { Collection } from 'tinacms';
import type { ContentBackend } from './backends/types';
import { isSingleton, type ChangeSet, type CmsDocument } from './documents';
import { errorsByPath, validateDocument, type FieldError } from './schemaValidation';
import { deepClone, deepEqual } from './serialize';

export interface DocState {
  /** Snapshot as loaded from the backend; undefined for newly created documents. */
  original?: CmsDocument;
  /** Working copy that the forms edit. */
  draft: CmsDocument;
  deleted: boolean;
}

export interface EditorState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: string;
  docs: Record<string, DocState[]>; // by collection name
}

type Action =
  | { type: 'loading' }
  | { type: 'loaded'; docs: Record<string, CmsDocument[]> }
  | { type: 'load-failed'; error: string }
  | { type: 'update'; collection: string; relativePath: string; values: Record<string, unknown> }
  | { type: 'create'; collection: string; relativePath: string; values: Record<string, unknown> }
  | { type: 'delete'; collection: string; relativePath: string }
  | { type: 'restore'; collection: string; relativePath: string }
  | { type: 'discard-all' };

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case 'loading':
      return { ...state, status: 'loading', error: undefined };
    case 'load-failed':
      return { ...state, status: 'error', error: action.error };
    case 'loaded': {
      const docs: Record<string, DocState[]> = {};
      for (const [name, list] of Object.entries(action.docs)) {
        docs[name] = list.map((d) => ({ original: d, draft: deepClone(d), deleted: false }));
      }
      return { status: 'ready', docs };
    }
    case 'update': {
      const list = state.docs[action.collection] ?? [];
      return {
        ...state,
        docs: {
          ...state.docs,
          [action.collection]: list.map((d) =>
            d.draft.relativePath === action.relativePath ? { ...d, draft: { ...d.draft, values: action.values } } : d,
          ),
        },
      };
    }
    case 'create': {
      const list = state.docs[action.collection] ?? [];
      if (list.some((d) => d.draft.relativePath === action.relativePath)) return state;
      const draft: CmsDocument = { collection: action.collection, relativePath: action.relativePath, values: action.values };
      return { ...state, docs: { ...state.docs, [action.collection]: [{ draft, deleted: false }, ...list] } };
    }
    case 'delete': {
      const list = state.docs[action.collection] ?? [];
      return {
        ...state,
        docs: {
          ...state.docs,
          // Brand-new documents simply disappear; existing ones are flagged for deletion.
          [action.collection]: list
            .filter((d) => !(d.draft.relativePath === action.relativePath && !d.original))
            .map((d) => (d.draft.relativePath === action.relativePath ? { ...d, deleted: true } : d)),
        },
      };
    }
    case 'restore': {
      const list = state.docs[action.collection] ?? [];
      return {
        ...state,
        docs: {
          ...state.docs,
          [action.collection]: list.map((d) =>
            d.draft.relativePath === action.relativePath && d.original ? { original: d.original, draft: deepClone(d.original), deleted: false } : d,
          ),
        },
      };
    }
    case 'discard-all': {
      const docs: Record<string, DocState[]> = {};
      for (const [name, list] of Object.entries(state.docs)) {
        docs[name] = list.filter((d) => d.original).map((d) => ({ original: d.original, draft: deepClone(d.original!), deleted: false }));
      }
      return { ...state, docs };
    }
    default:
      return state;
  }
}

export interface DocValidation {
  collection: string;
  relativePath: string;
  errors: FieldError[];
  byPath: Record<string, string>;
}

/** Central editing state: loaded documents, working drafts, dirty tracking and validation. */
export function useEditorStore(collections: Collection[]) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle', docs: {} });

  const load = useCallback(
    async (backend: ContentBackend) => {
      dispatch({ type: 'loading' });
      try {
        const entries = await Promise.all(collections.map(async (c) => [c.name, await backend.listDocuments(c)] as const));
        dispatch({ type: 'loaded', docs: Object.fromEntries(entries) });
      } catch (e) {
        dispatch({ type: 'load-failed', error: e instanceof Error ? e.message : String(e) });
      }
    },
    [collections],
  );

  const isDirty = (d: DocState) => d.deleted || !d.original || !deepEqual(d.original.values, d.draft.values);

  const changeSet = useMemo<ChangeSet>(() => {
    const upserts: CmsDocument[] = [];
    const deletes: CmsDocument[] = [];
    for (const list of Object.values(state.docs)) {
      for (const d of list) {
        if (d.deleted && d.original) deletes.push(d.original);
        else if (!d.deleted && isDirty(d)) upserts.push({ ...d.draft, sha: d.original?.sha });
      }
    }
    return { upserts, deletes };
  }, [state.docs]);

  const validation = useMemo<DocValidation[]>(() => {
    const out: DocValidation[] = [];
    for (const c of collections) {
      for (const d of state.docs[c.name] ?? []) {
        if (d.deleted) continue;
        const errors = validateDocument(c, d.draft.values);
        out.push({ collection: c.name, relativePath: d.draft.relativePath, errors, byPath: errorsByPath(errors) });
      }
    }
    return out;
  }, [collections, state.docs]);

  const errorCount = validation.reduce((n, v) => n + v.errors.length, 0);
  const dirtyCount = changeSet.upserts.length + changeSet.deletes.length;
  const originals = useMemo(
    () => Object.values(state.docs).flatMap((list) => list.map((d) => d.original).filter((d): d is CmsDocument => !!d)),
    [state.docs],
  );

  return {
    state,
    load,
    changeSet,
    validation,
    errorCount,
    dirtyCount,
    originals,
    isDirty,
    isSingleton,
    update: (collection: string, relativePath: string, values: Record<string, unknown>) =>
      dispatch({ type: 'update', collection, relativePath, values }),
    create: (collection: string, relativePath: string, values: Record<string, unknown>) =>
      dispatch({ type: 'create', collection, relativePath, values }),
    remove: (collection: string, relativePath: string) => dispatch({ type: 'delete', collection, relativePath }),
    restore: (collection: string, relativePath: string) => dispatch({ type: 'restore', collection, relativePath }),
    discardAll: () => dispatch({ type: 'discard-all' }),
  };
}

export type EditorStore = ReturnType<typeof useEditorStore>;
