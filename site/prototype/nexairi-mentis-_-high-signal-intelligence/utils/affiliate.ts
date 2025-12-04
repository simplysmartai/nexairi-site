const AMAZON_LINK_PATTERN = 'https?:\\/\\/[^"\\s>]*amazon\\.[^"\\s<)]*';

export const AFFILIATE_TAG = 'nexairimentis-20';
export const AFFILIATE_DISCLOSURE_BLOCK = `
<section data-component="affiliate-disclosure" aria-label="Affiliate Disclosure">
  <p>
    Nexairi may earn affiliate commissions (including Amazon Associates) when you purchase through links in this brief.
    We only highlight tools that meet our research standards.
  </p>
</section>`;
export const DISCLOSURE_PATTERN = /data-component="affiliate-disclosure"|affiliate disclosure/i;

function createAmazonRegex(): RegExp {
  return new RegExp(AMAZON_LINK_PATTERN, 'gi');
}

export function findAmazonLinks(html: string): string[] {
  return Array.from(html.matchAll(createAmazonRegex()), (match) => match[0]);
}

export function hasAffiliateDisclosure(html: string): boolean {
  return DISCLOSURE_PATTERN.test(html);
}

export function normalizeAmazonLinks(html: string): { html: string; affiliateLinks: number } {
  let affiliateLinks = 0;
  const regex = createAmazonRegex();
  const updated = html.replace(regex, (match) => {
    try {
      const url = new URL(match);
      affiliateLinks += 1;
      url.searchParams.set('tag', AFFILIATE_TAG);
      return url.toString();
    } catch (error) {
      console.warn('Failed to normalize affiliate link:', match, error);
      return match;
    }
  });
  return { html: updated, affiliateLinks };
}

export function ensureAffiliateDisclosure(html: string, shouldInsert: boolean): { html: string; inserted: boolean } {
  if (!shouldInsert) {
    return { html, inserted: false };
  }

  if (hasAffiliateDisclosure(html)) {
    return { html, inserted: false };
  }

  const closingIndex = html.lastIndexOf('</article>');
  if (closingIndex !== -1) {
    const next = `${html.slice(0, closingIndex)}${AFFILIATE_DISCLOSURE_BLOCK}\n${html.slice(closingIndex)}`;
    return { html: next, inserted: true };
  }
  return { html: `${html}\n${AFFILIATE_DISCLOSURE_BLOCK}`, inserted: true };
}

export function enforceAffiliateCompliance(html: string): {
  html: string;
  affiliateLinks: number;
  disclosureInserted: boolean;
} {
  const normalized = normalizeAmazonLinks(html);
  const disclosure = ensureAffiliateDisclosure(normalized.html, normalized.affiliateLinks > 0);
  return {
    html: disclosure.html,
    affiliateLinks: normalized.affiliateLinks,
    disclosureInserted: disclosure.inserted,
  };
}
