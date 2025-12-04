# Nexairi Experience Blueprint

## 1. Brand Position and Promise
- Mission: Nexairi delivers concierge-style recommendations that feel human, backed by AI speed and research.
- Tone: Confident, optimistic, quietly premium; avoid hype while highlighting craft.
- Visual cues: Clean typography, muted base palette with electric accent, generous white space, large conversational bubbles for the chat surface.
- Proof points: Transparent affiliate disclosures, QA badges from Sol, logged revision stats.

## 2. Experience Architecture
- Unified chat intake clarifies whether the visitor needs the Gift Concierge or Dog Routine Coach; Atlas logs UTM/source and chooses the branch.
- Gift Concierge: three-step flow (micro survey, recommendation stack, long-form deep dive/email export). Cards show hero pick, alternates, wildcard, each with CTA + rationale.
- Dog Routine Coach: intake captures breed (or mix), size, age band, residence, ZIP, available time, and any behavior goals. Output is a daily cadence table plus enrichment add-ons and affiliate products.
- Shared knowledge base: curated product catalog, breed library, persona definitions, compliance copy, QA checklist; Sol enforces updates before workflows ship.

## 3. Data Sources and Integrations
- Product catalog (Airtable or Supabase) with fields for brand, price, tags, affiliate program, tracking URL, margin confidence.
- Dog profile dataset assembled from AKC/vet references; normalized JSON keyed by breed with columns for typical exercise minutes, weather sensitivity, indoor enrichment ideas.
- Weather snapshot via Tomorrow.io or OpenWeather HTTP nodes; NOAA fallback for US-only ZIPs.
- Session + analytics store (Supabase/Postgres) capturing intake answers, chosen recommendations, conversion events.
- QA + performance tracker in Airtable logging agent outputs, reviewer notes, and CTR/conversion metrics.

## 4. Agent + n8n Workflow Outline
1. Entry webhook receives chat payload, writes `SessionStarted`, and enriches with GeoIP if ZIP missing.
2. Atlas orchestrator classifies intent and drafts plan summary for downstream agents.
3. Kelly credential guard validates required API keys (OpenAI, weather, affiliate tokens). Stops run if missing.
4. Gift branch:
   - Nova drafts layout hints when persona/layout variant is new.
   - Echo writes microcopy for cards and email summary.
   - Orion tags SEO metadata, FAQ schema, and follow-up keyword list.
   - Vega queries product catalog, filters by persona/budget, and ranks via LLM before attaching affiliate params.
5. Dog branch:
   - Data nodes pull breed profile, weather forecast, owner schedule.
   - Iris builds the day-by-day activity plan with rationale and safety cautions.
   - Lumen suggests supportive media prompts (infographics, reels, carousel copy).
   - Sol runs QA checklist focusing on realism, disclosures, and personalization accuracy.
6. Assembler node merges narrative + structured data; outputs JSON for chat UI, email, SMS, and knowledge base logging.
7. Delivery nodes send immediate chat response, optional SendGrid email, Twilio SMS, and Notion/Airtable sync.
8. Feedback loop logs conversions, triggers Sol retrospectives, and updates prompt snippets via Git.

## 5. Roadmap
1. Draft intake prompt trees per branch (`strategy/intake_flows.md`).
2. Model Airtable/Supabase schemas for `products`, `dog_profiles`, `sessions`, and `recommendations`.
3. Build n8n proof of concept with Atlas routing and one delivery channel (web chat response).
4. Layer analytics + QA checkpoints, then add email/SMS outputs and automated follow-up drips.
5. Prep migration notes for eventual Next.js upgrade while keeping HostGator static deploy path active.
