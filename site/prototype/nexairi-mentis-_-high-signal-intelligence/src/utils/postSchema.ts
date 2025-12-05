import type { Post, Category } from '../types/post';

// Canonical category aliases map: normalize inputs to the four allowed categories
const ALLOWED_CATEGORIES: Record<string, Category> = {
  lifestyle: 'Lifestyle',
  life: 'Lifestyle',
  ritual: 'Lifestyle',
  home: 'Lifestyle',
  'home & life': 'Lifestyle',
  technology: 'Technology',
  tech: 'Technology',
  ai: 'Technology',
  systems: 'Technology',
  travel: 'Travel',
  trips: 'Travel',
  mobility: 'Travel',
  sports: 'Sports',
  sport: 'Sports',
  performance: 'Sports',
  athlete: 'Sports',
};

export function normalizeCategory(input?: string): Category | null {
  if (!input) return null;
  const key = String(input).trim().toLowerCase();
  if (ALLOWED_CATEGORIES[key]) return ALLOWED_CATEGORIES[key];
  // simple fuzzy checks
  if (key.includes('sport')) return 'Sports';
  if (key.includes('tech') || key.includes('ai')) return 'Technology';
  if (key.includes('travel') || key.includes('trip')) return 'Travel';
  if (key.includes('life') || key.includes('home')) return 'Lifestyle';
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
  // prefer contentFile for canonical file references
  if (!raw.contentHtml && !raw.contentFile) errors.push('Missing contentHtml or contentFile');
  const category = normalizeCategory(raw.category || raw.categoryName || raw.section);
  if (!category) errors.push('Category missing or invalid. Allowed: Lifestyle, Technology, Travel, Sports');

  return { valid: errors.length === 0, errors };
}

export type { Post, Category };
