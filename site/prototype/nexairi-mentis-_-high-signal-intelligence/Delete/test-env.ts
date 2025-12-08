import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });  // Explicitly load .env.local

console.log('=== ENV TEST ===');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ FOUND' : '❌ MISSING');
console.log('PERPLEXITY_API_KEY:', process.env.PERPLEXITY_API_KEY ? '✅ FOUND' : '❌ MISSING');
console.log('.env.local location:', process.cwd());
