Recommended GEMINI_MODEL values and CI setup

- For image/meta heavy workloads (best visuals): `gemini-3-pro-image-preview` (preview)
- For general Gemini 3 text/meta: `gemini-3-pro-preview`
- Stable, lower-quota option: `gemini-2.5-flash` (good fallback)

How to add to GitHub Actions secrets

1. Go to your repository on GitHub.
2. Settings → Secrets → Actions → New repository secret.
3. Name: `GEMINI_MODEL`  Value: `gemini-3-pro-image-preview` (or your preferred model)
4. Also ensure `GEMINI_API_KEY` is set.

CI behavior

- Workflows will use `GEMINI_MODEL` from secrets if present.
- If the secret is not set the workflow sets `GEMINI_MODEL` to `gemini-2.5-flash` at runtime to avoid 404s.

Quota notes

- Preview Gemini 3 models may require billing and specific quota. If you see `RESOURCE_EXHAUSTED` (429), check Google Cloud Console billing and quota for the project that issued the `GEMINI_API_KEY`.
- To monitor usage: https://ai.dev/usage?tab=rate-limit
- Gemini docs: https://ai.google.dev/gemini-api/docs/rate-limits
