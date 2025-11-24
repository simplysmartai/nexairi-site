
# Migration & Update Guide

## 1. Migrating Existing HTML Content

To convert your existing folders (Technology, Lifestyle, etc.) into the new `posts.json` format:

1.  Ensure you have Node.js installed on your computer.
2.  Place the `scripts/migrate.js` file in the root of your project folder.
3.  Ensure your old HTML posts are located in `site/posts/` (or update the `POSTS_DIR` variable in the script).
4.  Open your terminal/command prompt and run:
    ```bash
    node scripts/migrate.js
    ```
5.  This will generate a `public/posts.json` file.
6.  The website will now automatically read this file and display your content with the new design.

## 2. Updating Content via n8n (Codex AI)

You do not need to generate HTML files anymore. Update your n8n workflow as follows:

1.  **AI Agent Output:** Configure Codex/OpenAI to output a JSON object instead of an HTML page.
    ```json
    {
      "title": "Article Title",
      "category": "Technology",
      "content": "<p>Your article content...</p>",
      "excerpt": "Short summary...",
      "imageUrl": "..."
    }
    ```
2.  **Read File Node:** Read the `public/posts.json` file from your GitHub repository (or local file system).
3.  **Code Node (Javascript):** Parse the JSON, add the new article to the top of the array.
    ```javascript
    const posts = JSON.parse($input.all()[0].json.fileContent);
    const newPost = {
       id: 'auto-' + Date.now(),
       date: new Date().toLocaleDateString(),
       ...$input.all()[0].json.newArticleData
    };
    posts.unshift(newPost); // Add to top
    return { json: { updatedFile: JSON.stringify(posts, null, 2) } };
    ```
4.  **Write/Commit Node:** Save the updated JSON back to the repository.

## 3. Manual Updates
Simply open `public/posts.json` and add a new entry to the array following the existing format.
