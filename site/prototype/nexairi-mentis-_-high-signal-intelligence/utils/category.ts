export const CATEGORY_LABELS: Record<string, string> = {
  technology: 'Technology',
  tech: 'Technology',
  ai: 'Technology',
  systems: 'Technology',
  gadget: 'Technology',
  gaming: 'Technology',
  lifestyle: 'Lifestyle',
  ritual: 'Lifestyle',
  home: 'Lifestyle',
  calm: 'Lifestyle',
  travel: 'Travel',
  journey: 'Travel',
  mobility: 'Travel',
  sports: 'Sports',
  sport: 'Sports',
  performance: 'Sports',
  athlete: 'Sports',
};

const CATEGORY_KEYWORDS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /(thanksgiving|holiday|gift|shopping|grain|home|kitchen|ritual|family|hosting)/i, category: 'Lifestyle' },
  { pattern: /(travel|city|guide|flight|train|road|itinerary|alps|italy|korea|slow-travel)/i, category: 'Travel' },
  { pattern: /(tech|ai|stack|device|gadget|automation|ps5|gaming|console|signal|systems)/i, category: 'Technology' },
  { pattern: /(sport|football|basketball|marathon|athlete|training|performance|nfl|nba)/i, category: 'Sports' },
];

function coerceTagStrings(tags?: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === 'string' ? tag.trim().toLowerCase() : ''))
    .filter(Boolean);
}

export function normalizeCategoryLabel(raw?: string, slug?: string, tags?: unknown): string {
  if (raw) {
    const key = raw.trim().toLowerCase();
    if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
    return raw
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  const stringTags = coerceTagStrings(tags);
  const tagMatch = stringTags.find((tag) => CATEGORY_LABELS[tag]);
  if (tagMatch) {
    return CATEGORY_LABELS[tagMatch];
  }

  if (slug) {
    const match = CATEGORY_KEYWORDS.find((entry) => entry.pattern.test(slug));
    if (match) return match.category;
  }

  return 'Lifestyle';
}
