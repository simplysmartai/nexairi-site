
import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to log and exit cleanly
function exitWithError(msg) {
  console.error(`[Auto-Generate Error] ${msg}`);
  process.exit(1);
}

if (!process.env.API_KEY) {
  console.warn("Warning: API_KEY is missing. Skipping content generation.");
  process.exit(0);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CATEGORIES = ['Technology', 'Lifestyle', 'Travel', 'Sports'];

const FALLBACK_IMAGES = {
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1600",
  lifestyle: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=1600",
  travel: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=1600",
  sports: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1600"
};

async function generatePost() {
  try {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    console.log(`Generating content for category: ${category}...`);

    const prompt = `
      You are the Editor-in-Chief of "Nexairi Mentis".
      Write a sophisticated blog post for the "${category}" section.
      
      JSON Structure:
      {
        "title": "String",
        "slug": "kebab-case-string-unique",
        "excerpt": "A compelling 2-sentence summary.",
        "html_content": "<article class='nx-article'>... use <h3> for headers, <p> for paragraphs ...</article>"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (!response.text) throw new Error("No response from AI");
    
    let postData;
    try {
      // Robust Parsing: Clean potential markdown blocks
      let cleanText = response.text.trim();
      if (cleanText.startsWith('```')) {
        // Remove markdown code block wrappers
        cleanText = cleanText.replace(/^```(json)?\s*/, '').replace(/\s*```$/, '');
      }
      postData = JSON.parse(cleanText);
    } catch (e) {
      console.error("Raw response:", response.text);
      throw new Error("Failed to parse JSON response from AI");
    }

    const dateStr = new Date().toISOString().split('T')[0];
    postData.slug = `${postData.slug}-${dateStr.replace(/-/g, '')}`;
    
    // Ensure directories exist
    const contentDir = path.join(__dirname, '..', 'public', 'content');
    
    if (!fs.existsSync(contentDir)) fs.mkdirSync(contentDir, { recursive: true });

    const contentPath = path.join(contentDir, `${postData.slug}.html`);
    fs.writeFileSync(contentPath, postData.html_content);
    console.log(`Saved content to ${contentPath}`);

    const postsPath = path.join(__dirname, '..', 'public', 'posts.json');
    if (!fs.existsSync(postsPath)) throw new Error("posts.json not found at " + postsPath);

    const postsFileContent = fs.readFileSync(postsPath, 'utf-8');
    const posts = JSON.parse(postsFileContent);

    const selectedImage = FALLBACK_IMAGES[category.toLowerCase()] || FALLBACK_IMAGES.technology;

    const newPost = {
      id: postData.slug,
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt,
      category: category,
      author: "Nexairi AI",
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      imageUrl: selectedImage,
      isFeatured: false
    };

    // Add new post to the top of the array
    posts.unshift(newPost);

    fs.writeFileSync(postsPath, JSON.stringify(posts, null, 2));
    console.log(`Updated posts.json successfully. Total posts: ${posts.length}`);

  } catch (error) {
    console.error("Automation Failed:", error.message);
    process.exit(0);
  }
}

generatePost();
