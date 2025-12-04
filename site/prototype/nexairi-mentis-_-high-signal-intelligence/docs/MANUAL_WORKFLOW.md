
# Manual Update & Deployment Workflow

If the automated "Save to GitHub" or n8n workflows are unavailable, follow this guide to manually update your site.

## 1. Adding a New Article (Manual Mode)

### Step A: Create the Content
1. Go to the `public/content/` folder.
2. Duplicate the `_template.html` file (or create a new `.html` file).
3. Name it using a "slug" format (e.g., `my-new-article-title.html`).
4. Write your content using standard HTML tags (`<p>`, `<h3>`, `<ul>`).
5. Ensure the root element is `<article class="nx-article">`.

### Step B: Register the Post
1. Open `posts.ts` in the root directory.
2. Add a new object to the `posts` array. It usually goes at the top or under the `// --- RECENT ARTICLES ---` comment.

```typescript
{
  "id": "unique-id-123",
  "title": "My New Article Title",
  "slug": "my-new-article-title", // Must match the HTML filename exactly!
  "excerpt": "A short summary of the post that appears on the homepage.",
  "category": "Technology", // Technology, Lifestyle, Travel, or Sports
  "author": "Your Name",
  "date": "Dec 10, 2025",
  "imageUrl": "https://images.unsplash.com/photo-..." // Or a local path like "/Images/my-pic.jpg"
},
```

### Step C: Test Locally
Run the development server to ensure the post loads correctly:
```bash
npm run dev
```
Navigate to `http://localhost:5173/#my-new-article-title` to preview.

---

## 2. Using the Local Generator (Semi-Automatic)

If you have an API Key configured in your `.env` file, you can generate a post using the command line instead of writing it manually.

1. Open your terminal.
2. Run the generation script:
   ```bash
   npm run generate
   ```
3. This will automatically:
   - Generate a topic using AI.
   - Create the HTML file in `public/content/`.
   - Update `posts.ts` automatically.

---

## 3. Saving & Deploying (Git Workflow)

If your editor's "Save" button is broken, use the terminal to push changes to GitHub. This triggers Cloudflare/Netlify to rebuild your live site.

```bash
# 1. Stage all changes
git add .

# 2. Commit with a message
git commit -m "New content: My New Article"

# 3. Push to the main branch
git push origin main
```

## 4. Emergency Manual Build

If you need to deploy the files manually (e.g., drag-and-drop to Netlify):

1. Build the production files:
   ```bash
   npm run build
   ```
2. This creates a `dist/` folder.
3. Upload the **contents** of the `dist/` folder to your hosting provider.
