# Nexairi Content Automation System (n8n)

This guide explains how to set up the automated publishing workflow. This system allows you to input a topic, and the AI will research, write, illustrate, and publish the article to your live site automatically.

## Prerequisites

1.  **n8n Instance:** You need n8n running (Desktop, Cloud, or Self-Hosted).
2.  **OpenAI API Key:** For GPT-4 (writing) and DALL-E 3 (images).
3.  **GitHub Personal Access Token (Classic):**
    *   Go to GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic).
    *   Generate new token.
    *   Scopes required: `repo` (Full control of private repositories).
    *   **Save this token.** You cannot see it again.

## Installation

1.  **Download the Workflow:**
    *   Copy the content of `docs/n8n-workflow.json`.
    *   Save it as a file named `nexairi-workflow.json` on your computer.

2.  **Import to n8n:**
    *   Open n8n.
    *   Click **"Add Workflow"** > **"Import from File"**.
    *   Select the `nexairi-workflow.json` file.

3.  **Configure Credentials:**
    *   **OpenAI Node:** Double click, create a new credential, paste your OpenAI API Key.
    *   **GitHub Node:** Double click, create a new credential:
        *   **User:** Your GitHub Username.
        *   **Access Token:** The Personal Access Token you created above.

4.  **Configure Repository Details:**
    *   In the workflow, look for the "Set Constants" node (usually the first one after the trigger).
    *   Update `REPO_OWNER` to your GitHub username.
    *   Update `REPO_NAME` to your repository name (e.g., `nexairi-redesign`).

## How to Use

1.  **Click "Execute Workflow"** (or activate it to run via webhook).
2.  **Input:** The workflow expects a text input (The Topic).
3.  **Wait:** It takes about 45-60 seconds to research, write, generate the image, and commit to GitHub.
4.  **Live:** Check your Cloudflare deployment queue. You will see a new build triggered by "n8n-bot".

## Troubleshooting

*   **"Resource not found"**: Check your Repo Name and Owner in the variables.
*   **"Bad credentials"**: Regenerate your GitHub Token.
*   **"Merge conflict"**: Rare, but if you edit `posts.ts` manually at the exact same second the AI does, this can happen. The AI is configured to force update, so be careful editing manually while a job is running.
