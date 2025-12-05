import 'dotenv/config';

// Temporary wrapper to run the existing generator while forcing Gemini off.
// This avoids GeminI API mismatches during a local/manual test run.
process.env.GEMINI_API_KEY = '';

import { runGeneratePost } from './generatePost';

async function main() {
  const args = process.argv.slice(2);
  const topicArgIndex = args.indexOf('--topic');
  const topic = topicArgIndex !== -1 && args[topicArgIndex + 1] ? args[topicArgIndex + 1] : args.join(' ') || `Weekly recap - ${new Date().toISOString().slice(0,10)}`;
  try {
    await runGeneratePost({ topic, genre: 'sports' });
    console.log('Run complete.');
  } catch (err) {
    console.error('runWeeklyRecapNoGemini failed:', err);
    process.exit(1);
  }
}

main();
