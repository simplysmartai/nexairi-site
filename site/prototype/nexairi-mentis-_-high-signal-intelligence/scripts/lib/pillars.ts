export interface Pillar {
  slug: string;
  title: string;
  description: string;
}

export const CORE_PILLARS: Pillar[] = [
  {
    slug: 'agent-labs',
    title: 'Agent Labs',
    description: 'Model comparisons, routing benchmarks, and chaining experiments.',
  },
  {
    slug: 'human-in-loop',
    title: 'Human-in-Loop Playbooks',
    description: 'QA rituals, escalation checklists, and executive approvals.',
  },
  {
    slug: 'ai-edge-cases',
    title: 'AI Edge Cases',
    description: 'Failure modes, jailbreak containment, and regulatory curveballs.',
  },
  {
    slug: 'no-code-ai',
    title: 'No-Code AI Systems',
    description: 'Zapier/n8n prototypes, automation canvases, and composable ops.',
  },
  {
    slug: 'future-proofing',
    title: 'Future Proofing',
    description: '18–24 month bets, resilient architectures, and playbooks.',
  },
];

export type PillarSlug = (typeof CORE_PILLARS)[number]['slug'];

export function getPillar(slug: string): Pillar | undefined {
  return CORE_PILLARS.find((pillar) => pillar.slug === slug);
}
