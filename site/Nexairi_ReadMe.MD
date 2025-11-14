The Master Operating Manual for Nexairi.com & Nexairi, Inc.

Static-first, AI-driven, automation-powered media ecosystem.

1. OVERVIEW

Nexairi.com is the flagship property of Nexairi, Inc., an emerging AI-native media network built on three pillars:

Static HTML templates (fast, portable, SEO-friendly)

JSON data feeds (easy to update, used as the site’s “database”)

AI + n8n automation (content production, layout updates, site maintenance)

The goal is to create a self-updating media empire:

Daily content

Category authority

Fully automated article production

Scalable to dozens or hundreds of websites

Consistent Nexairi Labs branding across all properties

This README defines how agents should operate now, and how the network will evolve long-term.

2. MISSION

Nexairi exists to:

Deliver clean, trustworthy, modern content

Blend lifestyle, tech, travel, and sports into a single “daily upgrade” hub

Update constantly using automation

Grow into a network of AI-enhanced media sites

Acquire & upgrade other sites

Become a recognizable online brand

Nexairi aims to become a daily destination, not a random content drop.
AI gives us leverage that human-run sites don’t have.

3. ARCHITECTURE

Nexairi uses a static-site + data-layer model.

3.1 Front-End (Static HTML/CSS)

Main components:

/public_html/
    index.html               ← homepage
    blog/index.html          ← blog hub
    posts/slug.html          ← individual posts
    css/styles.css           ← Nexairi Labs stylesheet
    js/*.js                  ← data rendering scripts
    data/*.json              ← site metadata + feeds

3.2 Data Layer (JSON)

JSON files act as the database:

/data/posts.json
/data/lifestyle.json
/data/technology.json
/data/sports.json
/data/travel.json
/data/daily.json
/data/hero.json
/data/trending.json


These power dynamic sections of the static pages.

3.3 Automation Layer (n8n + Codex Agents)

Automation responsibilities:

Generate new articles

Create full HTML pages using Nexairi templates

Upload files via SFTP

Update JSON feeds

Rewrite homepage slots

Maintain consistency

Run scheduled updates

4. LAYOUT SYSTEM (NEXAIRI LABS TEMPLATE)

Nexairi uses a consistent, modern layout with .nx-* classes:

.nx-shell
.nx-hero
.nx-grid
.nx-card
.nx-section
.nx-highlight
.nx-cta
.nx-btn


Codex agents must never alter class names or core structural layout without approval.

Agents can propose improvements inside ARCHITECT reviews.

5. DYNAMIC SLOT SYSTEM

Pages contain comment-anchors where n8n can safely insert new HTML:

<!-- nx:hero:start -->
...automated hero content...
<!-- nx:hero:end -->

<!-- nx:latest-posts:start -->
...latest 5 posts injected via JSON...
<!-- nx:latest-posts:end -->

<!-- nx:trending:start -->
...trending cards auto-generated...
<!-- nx:trending:end -->


Agents MUST:

Preserve these markers

Only rewrite code inside these blocks

Avoid removing blocks

Avoid altering structure outside these markers

This ensures safe automated updates.

6. CONTENT GENERATION REQUIREMENTS

Each Codex Scout (Lifestyle, Tech, Travel, Sports) must output JSON in this format:

{
  "title": "",
  "slug": "",
  "excerpt": "",
  "category": "",
  "tags": [],
  "date": "",
  "html_body": ""
}


Rules:

slug must be URL-safe

excerpt must be 1–2 sentences

html_body must use Nexairi .nx-* classes

Content must be factual, easy to read, and formatted clearly

Use semantic HTML: <section>, <article>, <h1>, <h2>, <p>, <ul>

These JSON objects power both:

The full blog page (posts/slug.html)

The feeds (posts.json, category.json)

The homepage “latest posts” block

7. n8n AUTOMATION CONTRACT
7.1 When generating a new blog post

n8n performs:

1. Trigger
2. Call Codex Agent for article JSON
3. Wrap html_body into Nexairi template
4. Upload new HTML page → /posts/slug.html
5. Download /data/posts.json
6. Append new article metadata
7. Re-upload updated posts.json
8. (Optional) Regenerate homepage slots

7.2 When updating homepage content

n8n performs:

1. Fetch index.html
2. Locate nx:start/end markers
3. Replace only that block with updated HTML
4. Upload updated index.html


This preserves layout integrity.

8. CODENAME: NEXAIRI AGENTS

These are the operational roles:

📘 LUNA — Lifestyle Scout

Daily habits

Wellness

Home & self-improvement

Short, actionable content

💻 ATLAS — Tech Scout

Gadgets

AI tools

Product reviews

Software recommendations

✈️ ROAM — Travel Scout

Quick itineraries

Destination hacks

Packing lists

Travel gear

🏈 RALLY — Sports Scout

Daily watch lists

Predictions

Summaries

Sports insights

🧪 CRITIC — Web Quality Analyst

Reviews site quality

Identifies broken UX

Flags HTML issues

Recommends layout fixes

Ensures SEO integrity

📊 INDEXER — Data Manager

Maintains JSON feeds

Ensures no duplicates

Keeps sorting correct

Manages archives

🏗️ BUILDER — Code/Template Engineer

Creates new components

Builds experimental features

Maintains shell structure

📈 BROKER — Acquisition Agent

Scans web for sites to buy

Evaluates quality

Recommends assimilation

Produces upgrade plans

🧠 ARCHITECT — Template Keeper

Oversees Nexairi design language

Approves major structural changes

Maintains global styles

9. TRAFFIC & GROWTH ENGINE

To become a daily destination, Nexairi uses AI-driven content loops.

9.1 Daily Micro Content Feeds

Agents generate daily blocks:

Daily Lifestyle Tip (Luna)

Tech Capsules (Atlas)

Travel Shot (Roam)

Sports Pulse (Rally)

Stored in:

/data/daily.json


Homepage pulls from these automatically.

9.2 Trending Section

TRENDWATCHER agent gathers:

Google Trends

Social signals

Amazon movers

Sports chatter

Tech announcements

Produces:

/data/trending.json


Homepage displays the top trending cards.

9.3 Weekly Anchor Posts

Every category produces at least one major article weekly:

Longform guides

Toolkits

Deep dives

Resource lists

These win long-term SEO.

9.4 Category Hubs

Each category has its own index file:

/lifestyle/index.html
/technology/index.html
/sports/index.html
/travel/index.html


Auto-filled using their JSON feeds.

9.5 Evergreen Pages

Updated monthly:

Best Gadgets Under $50

Best Weekend Getaways

Best Daily Habits (Backed by Research)

Codex keeps them fresh.

9.6 Mini Interactive Tools

Key differentiator. Nexairi should run:

Gift Scout

Travel Planner

Habit Recommender

Sports Predictor (for fun only)

These increase engagement & returning visits.

10. ACQUISITION & INTEGRATION STRATEGY

Nexairi will expand by acquiring under-optimized sites.

Phases:

Scout (Broker) – find candidate sites

Analyze (Critic) – identify opportunities

Extract & Rewrite – port valuable content into Nexairi style

Assimilate or enhance – merge or keep independent

Automate – activate JSON feeds + n8n pipelines

Scale – grow traffic with Nexairi’s content engine

This approach allows Nexairi to scale to 10–100 websites with minimal human work.

11. CODING & STYLE GUIDELINES
HTML

Semantic structure

Nexairi class system

No layout-breaking edits

CSS

Always use styles.css variables

No inline styling except when necessary

JavaScript

Lightweight

Modular

Only used for rendering JSON to HTML blocks

Content Style

Clean

Helpful

Short paragraphs

Practical advice

Verified facts

Avoid hallucinations

12. FUTURE ROADMAP

Full Nexairi Design System (component library)

Real-time scoring modules (sports, movie releases, crypto)

Live mini-tools

Multi-site rollout (Nexairi network)

Automated site acquisition scripts

AI-powered UI variants testing

Dynamic personalization feed per user

Nexairi ultimately becomes:

A fully automated, AI-native media empire running across dozens of sites with one shared brain.

13. CORE OPERATING PRINCIPLE

Nexairi is a static-first, JSON-powered, AI-driven media engine.
Codex creates. n8n automates. JSON feeds inform.
Templates maintain order. Growth is continuous.