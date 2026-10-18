import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./cms/EditorApp', () => ({
  default: () => <div data-testid="editor-stub">Editor</div>,
}));

import { Root, isEditorHash } from './Root';

describe('Root hash router', () => {
  it('recognises the editor hash', () => {
    expect(isEditorHash('#/edit')).toBe(true);
    expect(isEditorHash('#/edit/menu')).toBe(true);
    expect(isEditorHash('#menu')).toBe(false);
    expect(isEditorHash('')).toBe(false);
  });

  it('renders the website by default and the editor on #/edit', async () => {
    render(<Root />);
    expect(screen.getByRole('heading', { level: 1, name: /Time is our primary ingredient/ })).toBeInTheDocument();
    await act(async () => {
      window.location.hash = '#/edit';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(await screen.findByTestId('editor-stub')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1, name: /Time is our primary ingredient/ })).not.toBeInTheDocument();
  });
});
