// Import necessary libraries
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Define API URL and key
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const API_URL = 'https://api.perplexity.com/v1/article';

// Function to generate article
async function generateArticle(prompt) {
  try {
    const response = await axios.post(
      API_URL,
      { prompt },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating article:', error);
    throw error;
  }
}

// Main function
(async function main() {
  const prompt = 'Nexairi 2025 bowl guide';
  console.log(`Generating article for prompt: "${prompt}" ...`);
  
  const articleData = await generateArticle(prompt);
  
  // Save the result as a JSON file
  const filePath = 'drafts/bowl-guide-2025.json';
  fs.writeFileSync(filePath, JSON.stringify(articleData, null, 2));
  console.log(`Article saved to ${filePath}`);
})();
