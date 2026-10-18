import React, { useState } from 'react';
import type { TinaField } from 'tinacms';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { slugify } from '../validation';
import { Button, FieldShell, inputClass } from './ui';

/**
 * Renders a Tina field definition as a site-styled form control. This is intentionally a small
 * subset of what the full Tina admin supports – exactly the field types used in `tina/schema.ts`:
 *   string (input / textarea / select / list), number, boolean, datetime, object, object list.
 */

export type AnyField = TinaField & {
  list?: boolean;
  required?: boolean;
  description?: string;
  options?: Array<string | { value: string; label?: string }>;
  fields?: TinaField[];
  ui?: {
    component?: unknown;
    itemProps?: (item: Record<string, unknown>) => { label?: string };
    defaultItem?: Record<string, unknown> | (() => Record<string, unknown>);
  };
};

export interface FieldRendererProps {
  field: AnyField;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Path of this field inside the document, e.g. "categories[0].items[2].price". */
  path: string;
  errors: Record<string, string>;
  /** Visual nesting depth – used for compact styling inside list items. */
  depth?: number;
}

const labelOf = (field: AnyField) => (typeof field.label === 'string' ? field.label : field.name);
const idFor = (path: string) => `cms-field-${path.replace(/[^a-zA-Z0-9_-]/g, '-')}`;

/** Build a blank object from a field list (used when no `defaultItem` is provided). */
export function emptyValueFor(fields: TinaField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const raw of fields) {
    const f = raw as AnyField;
    if (f.list) out[f.name] = [];
    else if (f.type === 'boolean') out[f.name] = false;
    else if (f.type === 'number') out[f.name] = 0;
    else if (f.type === 'object') out[f.name] = emptyValueFor(f.fields ?? []);
    else if (f.type === 'datetime') out[f.name] = new Date().toISOString();
    else out[f.name] = '';
  }
  return out;
}

export function newListItem(field: AnyField): Record<string, unknown> {
  const d = field.ui?.defaultItem;
  const base = typeof d === 'function' ? d() : d ? { ...d } : emptyValueFor(field.fields ?? []);
  const item: Record<string, unknown> = JSON.parse(JSON.stringify(base));
  // Give identifiable items a unique id so two freshly-added items never collide.
  if ('id' in item) {
    const source = typeof item.name === 'string' && item.name ? item.name : typeof item.title === 'string' && item.title ? item.title : 'new';
    item.id = `${slugify(source) || 'new'}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return item;
}

function itemLabel(field: AnyField, item: unknown, index: number): string {
  try {
    const l = field.ui?.itemProps?.((item ?? {}) as Record<string, unknown>)?.label;
    if (l) return String(l);
  } catch {
    /* ignore */
  }
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>;
    for (const k of ['title', 'name', 'day', 'sectionHeading']) if (typeof o[k] === 'string' && o[k]) return o[k] as string;
  }
  return `Item ${index + 1}`;
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, path, errors, depth = 0 }) => {
  const id = idFor(path);
  const error = errors[path];
  const label = labelOf(field);

  // ---- object list --------------------------------------------------------------------------
  if (field.type === 'object' && field.list) {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    return (
      <ObjectList field={field} items={items} onChange={onChange} path={path} errors={errors} depth={depth} label={label} error={error} />
    );
  }

  // ---- single object ------------------------------------------------------------------------
  if (field.type === 'object') {
    const obj = (value ?? {}) as Record<string, unknown>;
    return (
      <fieldset className="rounded-xl border border-[#e2d6c7] p-4 space-y-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[#6e6052]">{label}</legend>
        {(field.fields ?? []).map((sub) => (
          <FieldRenderer
            key={sub.name}
            field={sub as AnyField}
            value={obj[sub.name]}
            onChange={(v) => onChange({ ...obj, [sub.name]: v })}
            path={`${path}.${sub.name}`}
            errors={errors}
            depth={depth + 1}
          />
        ))}
        {error && <p role="alert" className="text-xs font-medium text-[#a84d2a]">{error}</p>}
      </fieldset>
    );
  }

  // ---- string list --------------------------------------------------------------------------
  if (field.list) {
    const items = Array.isArray(value) ? (value as unknown[]) : [];
    const multiline = field.ui?.component === 'textarea';
    return (
      <FieldShell id={id} label={label} description={field.description} error={error} required={field.required}>
        <div className="space-y-2" id={id}>
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              {multiline ? (
                <textarea
                  aria-label={`${label} ${i + 1}`}
                  className={`${inputClass(!!errors[`${path}[${i}]`])} min-h-24 font-sans leading-relaxed`}
                  value={String(item ?? '')}
                  onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
                />
              ) : (
                <input
                  aria-label={`${label} ${i + 1}`}
                  className={inputClass(!!errors[`${path}[${i}]`])}
                  value={String(item ?? '')}
                  onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
                />
              )}
              <Button variant="ghost" size="sm" aria-label={`Remove ${label} ${i + 1}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => onChange([...items, ''])}>
            <Plus className="w-3.5 h-3.5" /> Add {multiline ? 'paragraph' : 'item'}
          </Button>
        </div>
      </FieldShell>
    );
  }

  // ---- boolean ------------------------------------------------------------------------------
  if (field.type === 'boolean') {
    return (
      <FieldShell id={id} label={label} description={field.description} error={error} inline>
        <input
          id={id}
          type="checkbox"
          className="mt-1 h-4 w-4 accent-[#c85a32] cursor-pointer"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
      </FieldShell>
    );
  }

  // ---- number -------------------------------------------------------------------------------
  if (field.type === 'number') {
    return (
      <FieldShell id={id} label={label} description={field.description} error={error} required={field.required}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.5"
          min={0}
          className={`${inputClass(!!error)} max-w-40`}
          value={value === undefined || value === null || Number.isNaN(value as number) ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          aria-invalid={!!error}
        />
      </FieldShell>
    );
  }

  // ---- datetime -----------------------------------------------------------------------------
  if (field.type === 'datetime') {
    const iso = typeof value === 'string' ? value : '';
    const dateOnly = iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toISOString().slice(0, 10) : '';
    return (
      <FieldShell id={id} label={label} description={field.description} error={error} required={field.required}>
        <input
          id={id}
          type="date"
          className={`${inputClass(!!error)} max-w-56`}
          value={dateOnly}
          onChange={(e) => onChange(e.target.value ? new Date(`${e.target.value}T00:00:00.000Z`).toISOString() : '')}
          aria-invalid={!!error}
        />
      </FieldShell>
    );
  }

  // ---- select -------------------------------------------------------------------------------
  if (field.options) {
    return (
      <FieldShell id={id} label={label} description={field.description} error={error} required={field.required}>
        <select id={id} className={`${inputClass(!!error)} max-w-sm`} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error}>
          <option value="">— choose —</option>
          {field.options.map((o) => {
            const v = typeof o === 'string' ? o : o.value;
            const l = typeof o === 'string' ? o : (o.label ?? o.value);
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      </FieldShell>
    );
  }

  // ---- textarea / text ----------------------------------------------------------------------
  const multiline = field.ui?.component === 'textarea';
  return (
    <FieldShell id={id} label={label} description={field.description} error={error} required={field.required}>
      {multiline ? (
        <textarea
          id={id}
          className={`${inputClass(!!error)} min-h-24 leading-relaxed`}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
        />
      ) : (
        <input id={id} type="text" className={inputClass(!!error)} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      )}
    </FieldShell>
  );
};

// -----------------------------------------------------------------------------------------------
// Object list (menu categories, menu items, essay sections, weekly schedule)
// -----------------------------------------------------------------------------------------------
const ObjectList: React.FC<{
  field: AnyField;
  items: Record<string, unknown>[];
  onChange: (v: unknown) => void;
  path: string;
  errors: Record<string, string>;
  depth: number;
  label: string;
  error?: string;
}> = ({ field, items, onChange, path, errors, depth, label, error }) => {
  const [open, setOpen] = useState<Record<number, boolean>>(() => (items.length <= 3 ? Object.fromEntries(items.map((_, i) => [i, true])) : {}));
  const hasError = (i: number) => Object.keys(errors).some((k) => k.startsWith(`${path}[${i}]`));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    onChange(next);
    setOpen((o) => ({ ...o, [from]: o[to] ?? false, [to]: o[from] ?? true }));
  };

  const add = () => {
    onChange([...items, newListItem(field)]);
    setOpen((o) => ({ ...o, [items.length]: true }));
  };

  return (
    <div className="space-y-3" data-testid={`list-${path}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6e6052]">
          {label} <span className="font-normal normal-case text-[#9c8f82]">({items.length})</span>
        </span>
        <Button size="sm" variant="secondary" onClick={add}>
          <Plus className="w-3.5 h-3.5" /> Add {singular(label)}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-[#a84d2a]">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = !!open[i];
          const itemPath = `${path}[${i}]`;
          return (
            <div key={i} className={`rounded-xl border ${hasError(i) ? 'border-[#c85a32]' : 'border-[#e2d6c7]'} ${depth > 0 ? 'bg-[#fffdfa]' : 'bg-[#faf7f2]'}`}>
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                  onClick={() => setOpen((o) => ({ ...o, [i]: !isOpen }))}
                  aria-expanded={isOpen}
                >
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#8d7e70]" /> : <ChevronDown className="w-4 h-4 text-[#8d7e70]" />}
                  <span className={`font-serif font-bold ${depth > 0 ? 'text-sm' : 'text-base'} text-[#24211e]`}>{itemLabel(field, item, i)}</span>
                  {hasError(i) && <span className="text-[11px] font-mono text-[#a84d2a]">needs attention</span>}
                </button>
                <Button size="sm" variant="ghost" aria-label={`Move ${itemLabel(field, item, i)} up`} disabled={i === 0} onClick={() => move(i, i - 1)}>
                  ↑
                </Button>
                <Button size="sm" variant="ghost" aria-label={`Move ${itemLabel(field, item, i)} down`} disabled={i === items.length - 1} onClick={() => move(i, i + 1)}>
                  ↓
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Remove ${itemLabel(field, item, i)}`}
                  onClick={() => {
                    if (window.confirm(`Remove "${itemLabel(field, item, i)}"?`)) onChange(items.filter((_, j) => j !== i));
                  }}
                >
                  <Trash2 className="w-4 h-4 text-[#a84d2a]" />
                </Button>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[#eee5d8]">
                  {(field.fields ?? []).map((sub) => (
                    <FieldRenderer
                      key={sub.name}
                      field={sub as AnyField}
                      value={item[sub.name]}
                      onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, [sub.name]: v } : x)))}
                      path={`${itemPath}.${sub.name}`}
                      errors={errors}
                      depth={depth + 1}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const singular = (label: string) => {
  const l = label.trim();
  if (/categories$/i.test(l)) return 'category';
  if (/sections$/i.test(l)) return 'section';
  if (/schedule$/i.test(l)) return 'day';
  if (/items$/i.test(l)) return 'item';
  return l.replace(/s$/i, '').toLowerCase();
};
