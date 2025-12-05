import type { Post, Category } from '../types/post';

const ALLOWED_CATEGORIES: Record<string, Category> = {
  lifestyle: 'Lifestyle',
  life: 'Lifestyle',
  technology: 'Technology',
  tech: 'Technology',
  travel: 'Travel',
  trips: 'Travel',
  sports: 'Sports',
  'sports & seasons': 'Sports & Seasons',
  'sports & seasons': 'Sports & Seasons',
  'sports and seasons': 'Sports & Seasons',
};

export function normalizeCategory(input?: string): Category | null {
  if (!input) return null;
  const key = String(input).trim().toLowerCase();
  if (ALLOWED_CATEGORIES[key]) return ALLOWED_CATEGORIES[key];
  // Try fuzzy match by word
  if (key.includes('sport')) return 'Sports';
  if (key.includes('tech')) return 'Technology';
  if (key.includes('travel')) return 'Travel';
  if (key.includes('life')) return 'Lifestyle';
  return null;
}

export function validatePostShape(raw: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!raw || typeof raw !== 'object') {
    errors.push('Post must be an object');
    return { valid: false, errors };
  }
  if (!raw.id && !raw.slug) errors.push('Missing id or slug');
  if (!raw.title) errors.push('Missing title');
  if (!raw.date) errors.push('Missing date');
  if (!raw.contentHtml && !raw.contentPath && !raw.contentFile) errors.push('Missing contentHtml or contentPath/contentFile');
  const category = normalizeCategory(raw.category || raw.categoryName || raw.section);
  if (!category) errors.push('Category missing or invalid. Allowed: Lifestyle, Technology, Travel, Sports');

  return { valid: errors.length === 0, errors };
}

export type { Post, Category };
