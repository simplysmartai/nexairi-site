import 'dotenv/config';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// Load .env.local if present so GEMINI_MODEL/GEMINI_API_KEY are available during local runs
dotenv.config({ path: '.env.local', override: false });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error('❌ Missing GEMINI_API_KEY or API_KEY in environment.');
    console.error('Set GEMINI_API_KEY in your .env.local or environment and retry.');
    process.exit(1);
  }

  const client = new GoogleGenAI({ apiKey });

  // Try to call `client.models.list()` and follow pagination tokens where available.
  const seen = new Map<string, any>();
  let pageToken: string | undefined = undefined;
  let attempts = 0;

  while (attempts < 10) {
    attempts += 1;
    try {
      console.log(`Calling client.models.list() (attempt ${attempts})${pageToken ? ` with pageToken=${pageToken}` : ''} ...`);
      // @ts-ignore
      const res = await client.models.list({ pageToken });

      // Try to extract model entries from known locations
      const candidates = [] as any[];
      if (Array.isArray(res?.models)) candidates.push(...res.models);
      if (Array.isArray(res?.data)) candidates.push(...res.data);
      if (Array.isArray(res?.pageInternal)) candidates.push(...res.pageInternal);
      if (Array.isArray(res?.pageInternal?.items)) candidates.push(...res.pageInternal.items);

      if (candidates.length > 0) {
        candidates.forEach((m: any) => {
          const id = m?.name || m?.id || m?.model || (m && typeof m === 'string' ? m : undefined);
          if (id && !seen.has(id)) seen.set(id, m);
        });
      } else {
        const maybeArray = Object.values(res || {}).find((v: any) => Array.isArray(v) && v.length > 0 && (v[0].name || v[0].id));
        if (maybeArray) {
          (maybeArray as any[]).forEach((m: any) => {
            const id = m?.name || m?.id || m?.model;
            if (id && !seen.has(id)) seen.set(id, m);
          });
        }
      }

      const nextToken = res?.nextPageToken || res?.pageInternal?.nextPageToken || res?.paramsInternal?.config?.pageToken || res?.pageInternal?.pageToken;
      if (nextToken && typeof nextToken === 'string' && nextToken !== pageToken) {
        pageToken = nextToken;
        continue; // fetch next page
      }

      if (seen.size > 0) {
        console.log('✅ Available models:');
        Array.from(seen.entries()).forEach(([id, meta]) => {
          const desc = meta?.displayName || meta?.description || meta?.summary || '';
          console.log(`- ${id}${desc ? ' — ' + desc : ''}`);
        });
      } else {
        console.log('No models detected in response; raw response below:');
        try {
          console.log(JSON.stringify(res, null, 2).slice(0, 3000));
        } catch (e) {
          console.log(String(res));
        }
      }

      process.exit(0);
    } catch (err: any) {
      console.warn(`client.models.list failed: ${err?.message || err}`);
      if (err?.response) {
        try {
          console.log('Error response snippet:', JSON.stringify(err.response).slice(0, 2000));
        } catch (e) {
          console.log('Error response:', err.response);
        }
      }
      break;
    }
  }

  console.error('Could not list Gemini models using the SDK.');
  console.error('If this persists, check the Google Cloud Console > Generative AI Models or consult the @google/genai SDK docs.');
  process.exit(1);
}

listModels().catch((err) => {
  console.error('Unexpected error while listing models:', err);
  process.exit(1);
});
