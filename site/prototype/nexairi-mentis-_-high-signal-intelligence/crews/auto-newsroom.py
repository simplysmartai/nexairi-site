#!/usr/bin/env python3
"""
NEXAIRI 1-COMMAND NEWSROOM
Usage: python crews/auto-newsroom.py "2025 Bowl Guide" Sports
→ Article LIVE on site in 60 seconds
"""

import os, sys, json, subprocess, time
from datetime import datetime
from pathlib import Path
from openai import OpenAI

# CONFIG (edit these 2 lines only)
ROOT_DIR = Path(__file__).parent.parent
DRAFTS_DIR = ROOT_DIR / "drafts"
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")
MODEL = "gpt-4o-mini"

client = OpenAI(api_key=OPENAI_KEY)

def generate_article(topic, category):
    """Full pipeline: AI → JSON → ingest → git → live"""
    
    slug = topic.lower().replace(" ", "-").replace("–", "-").replace("—", "-").replace(":", "").strip("-")
    timestamp = int(time.time() * 1000)
    id = f"{slug}-{timestamp}"
    
    print(f"🚀 Generating: {topic} ({category})")
    
    # SINGLE OpenAI call → perfect Nexairi JSON
    prompt = f"""Create COMPLETE Nexairi ingest JSON for ingest-article.ts:

SCHEMA (output EXACTLY this):
{{
  "id": "{id}",
  "title": "{topic}",
  "slug": "{slug}",
  "category": "{category}",
  "subCategory": "College Football",
  "contentType": "feature",
  "tldr": "3 sentence hook",
  "date": "{datetime.now().strftime('%Y-%m-%d')}",
  "author": "Jackson S.",
  "summary": "150 char SEO meta",
  "excerpt": "50 word teaser",
  "readingTime": 5,
  "imageUrl": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=675",
  "tags": ["sports","{category.lower()}","2025"],
  "contentFile": "/content/{category.lower()}/{slug}.html",
  "contentPath": "/content/{category.lower()}/{slug}.html",
  "contentHtml": "<article class=\"nexairi-article\">[FULL 1800-word article with <h2>, <table class=\"article-table\">, <figure> images]</article>"
}}

For {topic}: Write 1800-word ESPN-style article with:
- Real 2025-26 bowl schedule (Cricket Celebration Bowl Dec 13 Atlanta, etc.)
- 3 responsive tables (.article-table)
- <figure> Unsplash images
- H2/H3 structure

Output ONLY valid JSON. No explanations."""
    
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    
    article_json = json.loads(resp.choices[0].message.content.strip())
    return article_json

def publish_article(article):
    """Write → ingest → git → deploy"""
    filename = f"{article['slug']}-{int(time.time()*1000)}.json"
    draft_path = DRAFTS_DIR / filename
    
    # Write draft
    DRAFTS_DIR.mkdir(exist_ok=True)
    draft_path.write_text(json.dumps(article, indent=2))
    print(f"✅ Wrote {draft_path}")
    
    # Ingest
    result = subprocess.run(["npm", "run", "ingest:article", "--", str(draft_path)], 
                           cwd=ROOT_DIR, capture_output=True, text=True)
    if result.returncode == 0:
        print("✅ Ingested!")
    else:
        print("❌ Ingest failed:", result.stderr)
        return False
    
    # Git deploy
    subprocess.run(["git", "add", "."], cwd=ROOT_DIR, check=True)
    subprocess.run(["git", "commit", "-m", f"AI newsroom: {article['title']}"], cwd=ROOT_DIR, check=True)
    subprocess.run(["git", "push"], cwd=ROOT_DIR, check=True)
    print("✅ Deployed to Cloudflare!")
    
    print(f"🌐 LIVE: http://localhost:5173#{article['slug']}")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python crews/auto-newsroom.py \"Topic\" Category")
        sys.exit(1)
    
    topic, category = sys.argv[1], sys.argv[2]
    
    article = generate_article(topic, category)
    success = publish_article(article)
    
    print("\n" + "="*60)
    print("🎉 NEWSROOM COMPLETE" if success else "❌ Publish failed")
    print("="*60)
