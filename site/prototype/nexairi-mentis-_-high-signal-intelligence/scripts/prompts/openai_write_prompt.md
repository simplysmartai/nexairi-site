Write a Nexairi Sports article titled "Your 2025–26 Bowl Season Guide, Part 1: Opening Week" for author "Jackson S.".

Input: JSON research array (each entry includes bowl_name, team1, team2, date, kickoff_time_ET, tv_channel, venue, source_urls).

Rules:
- Prepend frontmatter YAML with: title, slug, date (publish date), author: "Jackson S.", category: Sports, summary (<=200 chars), tags (array), imagePrompt, imageAlt.
- For each game, output a block containing:
  - Bowl name
  - Matchup: Team A vs Team B
  - Date: YYYY-MM-DD
  - Kickoff (ET): HH:MM
  - TV: Channel
  - 4–5 sentence blurb: 1–2 sentences on each team’s season/form, 1–2 on the bowl’s identity/history, 1 sentence on what’s at stake.
- Exclude College Football Playoff quarterfinals and semifinals.
- Cite schedule lines inline using the provided source_urls as [source:URL]. If any date/time is ambiguous, add [verify] near the time and list sources.
- Add a short JSON-LD article block in an HTML comment containing headline, author, datePublished, image (placeholder), mainEntityOfPage.
- Output final article as HTML with frontmatter YAML at top and the article body below.

Tone: authoritative, concise, friendly. Keep per-game blurbs focused and factual. Do not hallucinate schedule/time information — if unsure, mark [verify].
