import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { formatPublishedDate, getAllPosts, getAnnouncement, getMenu, getPublishedPosts } from '../content';
import { ArticlesSection } from './ArticlesSection';
import { Footer } from './Footer';
import { HoursAndLocation } from './HoursAndLocation';
import { MenuSection } from './MenuSection';
import { Navbar } from './Navbar';

describe('website renders from CMS content files', () => {
  it('shows the dough announcement banner from content/settings/announcement.json', () => {
    render(<Navbar activeSection="menu" onNavigate={() => {}} />);
    const banner = screen.getByText(getAnnouncement().headline).closest('#dough-announcement');
    expect(banner).toBeInTheDocument();
    expect(within(banner as HTMLElement).getByText(getAnnouncement().detail!)).toBeInTheDocument();
  });

  it('renders every menu category and item with its price', () => {
    render(<MenuSection />);
    const menu = getMenu();
    expect(screen.getByRole('heading', { level: 2, name: menu.title })).toBeInTheDocument();
    for (const cat of menu.categories) {
      expect(screen.getByRole('heading', { level: 3, name: cat.title })).toBeInTheDocument();
      for (const item of cat.items) {
        const card = document.getElementById(`menu-item-${item.id}`)!;
        expect(card).not.toBeNull();
        expect(within(card).getByText(item.name)).toBeInTheDocument();
        expect(within(card).getByText(`$${item.price}`)).toBeInTheDocument();
      }
    }
  });

  it('filters menu categories with the tabs', async () => {
    const user = userEvent.setup();
    render(<MenuSection />);
    const [first, second] = getMenu().categories;
    await user.click(document.getElementById(`menu-filter-${second.id}`)!);
    expect(screen.queryByRole('heading', { level: 3, name: first.title })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: second.title })).toBeInTheDocument();
  });

  it('renders published blog posts (not drafts) with formatted dates and opens the essay', async () => {
    const user = userEvent.setup();
    render(<ArticlesSection />);
    const posts = getPublishedPosts();
    expect(posts.length).toBeGreaterThan(0);
    expect(posts.every((p) => !p.draft)).toBe(true);
    for (const post of posts) {
      expect(screen.getByRole('heading', { level: 3, name: post.title })).toBeInTheDocument();
      expect(screen.getAllByText(formatPublishedDate(post.publishedDate)).length).toBeGreaterThan(0);
    }
    await user.click(document.getElementById(`read-article-btn-${posts[0].id}`)!);
    const modal = screen.getByRole('dialog');
    expect(within(modal).getByRole('heading', { level: 2, name: posts[0].title })).toBeInTheDocument();
    expect(within(modal).getByText(posts[0].content[0].paragraphs[0])).toBeInTheDocument();
  });

  it('renders store hours for all seven days', () => {
    render(<HoursAndLocation />);
    for (const day of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it('has a non-displayed staff link to the editor in the footer', () => {
    render(<Footer />);
    const link = document.getElementById('staff-editor-link') as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('#/edit');
    expect(link.className).toContain('opacity-0');
    expect(link).toHaveAccessibleName('Staff content editor');
  });
});

describe('content helpers', () => {
  it('formats ISO dates as long US dates in UTC', () => {
    expect(formatPublishedDate('2026-09-14T00:00:00.000Z')).toBe('September 14, 2026');
    expect(formatPublishedDate('garbage')).toBe('garbage');
  });
  it('sorts posts newest first and derives ids from filenames', () => {
    // Deliberately independent of which posts exist – staff add posts all the time.
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(post.slug).toBe(post.id);
      expect(post.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
    const times = posts.map((p) => Date.parse(p.publishedDate));
    expect(times.every((t) => !Number.isNaN(t))).toBe(true);
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(posts.map((p) => p.id)).toContain('importance-of-dough-aging');
  });
});
