# Phase 2: Redesign System & Tokens

## Design Tokens (Tailwind Config Mapping)

### Colors
| Token | Value | Tailwind Class | Usage |
|-------|-------|----------------|-------|
| `color-bg-primary` | `#FFFFFF` | `bg-white` | Page background |
| `color-bg-secondary` | `#F9FAFB` | `bg-gray-50` | Section variation |
| `color-text-main` | `#111827` | `text-gray-900` | Headings |
| `color-text-body` | `#4B5563` | `text-gray-600` | Articles |
| `color-brand-blue` | `#2563EB` | `text-blue-600` | Links, Accents |
| `color-brand-dark` | `#1E293B` | `bg-slate-800` | Footer, Primary Buttons |

### Typography
- **Headings:** `Merriweather` (Serif). Weights: 400, 700.
- **Body:** `Inter` (Sans). Weights: 300, 400, 600.
- **Scale:**
  - H1: `text-4xl md:text-6xl`
  - H2: `text-3xl`
  - Body: `text-base md:text-lg`

### Spacing & Layout
- **Container:** `max-w-7xl mx-auto px-4`
- **Card Gap:** `gap-8`
- **Section Padding:** `py-16 md:py-24`

## Component Updates (Static Implementation Guide)

### 1. Global Header
- **Structure:** Flexbox with `justify-between`.
- **Logo:** 
  - Mobile: `h-[56px]`
  - Desktop: `h-[88px]`
- **Sticky:** Use CSS `position: sticky; top: 0; backdrop-filter: blur(8px);`.

### 2. Buttons (CTA)
- **Primary:** `bg-slate-900 text-white hover:bg-slate-800 rounded-lg px-6 py-3`.
- **Ghost (Fixed):** `bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50`. **Critical Fix:** Added border and darker text for contrast.

### 3. Article Cards
- **Interaction:** `group` class on parent, `group-hover:text-blue-600` on title.
- **Image:** Aspect ratio `3/2` standard. Object-fit `cover`.
- **Elevation:** `shadow-sm hover:shadow-md transition-shadow`.

### 4. TL;DR Shell
- **Markup:**
  ```html
  <div class="tldr-box">
    <h4>TL;DR</h4>
    <p>Summary content...</p>
  </div>
  ```
- **CSS:** Pale blue background (`bg-blue-50`), left border (`border-l-4 border-blue-600`).

## Migration Strategy (Static Site)
1. **Base CSS:** Replace `styles.css` with the generated Tailwind output (or equivalent vanilla CSS variables if build tool unavailable).
2. **HTML Updates:** Apply classes to `_layouts/default.html` (or header/footer partials).
3. **Asset Cleanup:** Move all logos to `site/images/` lowercase.