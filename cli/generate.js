import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { fetchArticleImages } from '../imageFetcher.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';
const DATA_DIR = path.join(__dirname, '..', 'data', 'articles');
const IMAGES_DIR = path.join(__dirname, '..', 'data', 'images');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const BASE_SYSTEM_PROMPT = `You are a professional journalist for BBN (Big Bullshit News). You write COMPLETELY FAKE, ABSURD news articles that sound EXTREMELY believable and professional.

=== MANDATORY REQUIREMENTS (YOU MUST FOLLOW ALL OF THESE) ===

1. ARTICLE LENGTH: Your article MUST be LONG. Minimum 8 paragraphs. Each paragraph should be substantial (3-5 sentences). DO NOT write short articles. EXPAND on every point. Be verbose. Add details. This is NON-NEGOTIABLE.

2. HEADLINE RULE: The headline MUST directly relate to the topic given by the user. If the topic is "Why you should gamble your house away", the headline MUST be about gambling your house away. Do NOT change the subject. The headline should be dramatic and eye-catching but MUST match the topic.

3. IMAGE KEYWORDS - CRITICAL AND STRICT:
   - Each image keyword MUST be MAXIMUM 3 WORDS. Not 4. Not 5. MAXIMUM 3 WORDS.
   - Example GOOD keywords: "casino roulette", "stressed man", "house", "money cash", "business meeting"
   - Example BAD keywords (DO NOT USE): "dramatic casino roulette wheel spinning", "stressed businessman looking at papers"
   - Use simple, searchable keywords that will find actual images
   - You MUST provide EXACTLY 4 images total:
     * 1 titleImage (for the article header) - this should be the most dramatic/eye-catching
     * 3 body images (for [IMAGE] placeholders in content)

4. CONTENT STRUCTURE - YOU MUST INCLUDE ALL OF THESE:
   - Start with a dramatic opening paragraph that hooks the reader
   - Include AT LEAST 3 fake quotes from "experts" with full names and fake titles (e.g., "Dr. Marcus Webb, Director of the Institute for Risk Psychology")
   - Include AT LEAST 2 fake studies with specific numbers and percentages (e.g., "A 2024 Harvard study found that 73% of participants who embraced chaos reported higher life satisfaction")
   - Include fake statistics throughout (percentages, numbers, data)
   - Place [IMAGE] in your content EXACTLY 3 times where body images should appear
   - Each [IMAGE] should be on its own line, between paragraphs
   - End with a strong conclusion paragraph

5. STYLE ENFORCEMENT: If the user gives style instructions, FOLLOW THEM EXACTLY throughout the ENTIRE article. The style OVERRIDES default journalism tone. If they say "write like a desperate gambler at 3am", EVERY paragraph should sound like that voice. Do not slip back into neutral journalism voice.

=== EXACT OUTPUT FORMAT ===

Return ONLY valid JSON. No markdown code blocks. No explanation. Just pure JSON.

CRITICAL JSON FORMATTING:
- In the "content" field, use \n for newlines (NOT actual line breaks)
- Use \n\n for paragraph breaks
- Example: "content": "First paragraph.\n\nSecond paragraph.\n\n[IMAGE]\n\nThird paragraph."
- DO NOT put actual newlines inside the JSON string values - this breaks JSON parsing

{
  "headline": "A dramatic headline directly related to the topic",
  "subheadline": "A compelling subtitle that hooks the reader",
  "category": "politics|science|health|business|world|opinion",
  "author": "Fake Journalist Name",
  "titleImage": "MAX 3 WORDS HERE",
  "images": [
    { "keyword": "MAX 3 WORDS" },
    { "keyword": "MAX 3 WORDS" },
    { "keyword": "MAX 3 WORDS" }
  ],
  "content": "First paragraph here with dramatic hook...\n\nSecond paragraph building on the premise...\n\nThird paragraph with a quote from Dr. [Fake Name], [Fake Title]...\n\n[IMAGE]\n\nFifth paragraph with fake statistics from a [Year] [Institution] study...\n\nSixth paragraph expanding the argument...\n\n[IMAGE]\n\nEighth paragraph with another expert quote...\n\nNinth paragraph...\n\n[IMAGE]\n\nEleventh paragraph...\n\nFinal conclusion paragraph that drives the point home..."
}

CHECKLIST BEFORE OUTPUTTING:
- Is my article LONG (8+ paragraphs)?
- Does my headline match the topic?
- Did I include 3+ fake quotes with names and titles?
- Did I include 2+ fake studies with numbers?
- Are ALL image keywords MAX 3 WORDS?
- Did I place [IMAGE] exactly 3 times in content?
- Did I follow the style instruction throughout?

If any answer is NO, fix it before outputting.`;

async function generateArticle(topic, description = '', fetchImages = true) {
  let userPrompt = '';
  
  if (description && description.trim()) {
    userPrompt = `TOPIC: ${topic}

STYLE INSTRUCTION (FOLLOW THIS VOICE THROUGHOUT THE ENTIRE ARTICLE): ${description}

=== YOUR TASK ===
Write a LONG article (minimum 8 paragraphs) about: "${topic}"

REQUIREMENTS:
1. Headline MUST be about: "${topic}" - do not change the subject
2. Provide EXACTLY 4 image keywords (1 titleImage + 3 body images)
3. Each image keyword: MAXIMUM 3 WORDS (this is enforced)
4. Place [IMAGE] exactly 3 times in your content
5. Include 3+ fake quotes with full names and titles
6. Include 2+ fake studies with specific numbers
7. Follow the style instruction above in EVERY PARAGRAPH

Generate the JSON now. Remember: LONG article, MAX 3 words per image keyword, follow the style.`;
  } else {
    userPrompt = `TOPIC: ${topic}

=== YOUR TASK ===
Write a LONG article (minimum 8 paragraphs) about: "${topic}"

REQUIREMENTS:
1. Headline MUST be about: "${topic}" - do not change the subject
2. Provide EXACTLY 4 image keywords (1 titleImage + 3 body images)
3. Each image keyword: MAXIMUM 3 WORDS (this is enforced)
4. Place [IMAGE] exactly 3 times in your content
5. Include 3+ fake quotes with full names and titles
6. Include 2+ fake studies with specific numbers

Generate the JSON now. Remember: LONG article, MAX 3 words per image keyword.`;
  }

  console.log('\n🤖 Generating article with AI...');
  console.log(`📝 Topic: ${topic}`);
  if (description) console.log(`🎨 Style: ${description}`);
  
  try {
    const response = await fetch(OLLAMA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        prompt: userPrompt,
        system: BASE_SYSTEM_PROMPT,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.9,
          num_predict: 5000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    let article;
    
    try {
      let responseText = data.response.trim();
      
      // Remove markdown code blocks if present
      if (responseText.startsWith('```')) {
        responseText = responseText.replace(/^```(?:json)?\r?\n?/, '').replace(/\r?\n?```$/, '');
      }
      
      // Fix JSON with actual newlines inside strings
      // This regex finds content inside quotes and escapes unescaped newlines
      const fixedJson = responseText.replace(/"([^"]*?)"/gs, (match, content) => {
        // Escape any literal newlines or tabs inside the string content
        const escaped = content
          .replace(/\r\n/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\t/g, '\\t');
        return `"${escaped}"`;
      });
      
      article = JSON.parse(fixedJson);
    } catch (e) {
      console.error('\n❌ Failed to parse AI response as JSON');
      console.error('Error:', e.message);
      console.log('\n📝 Attempting fallback extraction...');
      
      // Try to extract article data with regex as fallback
      try {
        const extractField = (field, text) => {
          const regex = new RegExp(`"${field}"\s*:\s*"([\\s\\S]*?)"\\s*[,\\}]`, 'i');
          const match = text.match(regex);
          return match ? match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : null;
        };
        
        article = {
          headline: extractField('headline', data.response) || 'Untitled',
          subheadline: extractField('subheadline', data.response) || '',
          category: extractField('category', data.response) || 'opinion',
          author: extractField('author', data.response) || 'BBN Staff',
          titleImage: extractField('titleImage', data.response) || 'abstract',
          images: [{ keyword: 'abstract' }, { keyword: 'concept' }, { keyword: 'idea' }],
          content: extractField('content', data.response) || 'Content unavailable.'
        };
        console.log('✅ Fallback extraction succeeded');
      } catch (fallbackError) {
        console.error('Fallback extraction also failed');
        throw e;
      }
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const timestamp = new Date().toISOString();
    
    // Build image array with title image FIRST
    // Enforce max 3 words per keyword
    const allImages = [];
    
    // Title image goes first (index 0)
    if (article.titleImage) {
      const shortKeyword = article.titleImage.split(' ').slice(0, 3).join(' ');
      allImages.push({ keyword: shortKeyword, isTitle: true });
    }
    
    // Body images follow (ensure we have exactly 3)
    if (article.images && article.images.length > 0) {
      article.images.forEach(img => {
        if (img.keyword && allImages.length < 4) {
          const shortKeyword = img.keyword.split(' ').slice(0, 3).join(' ');
          allImages.push({ keyword: shortKeyword, isTitle: false });
        }
      });
    }
    
    // Ensure we have exactly 4 images
    while (allImages.length < 4) {
      const fallbackKeywords = ['abstract art', 'business concept', 'people talking', 'office building'];
      allImages.push({ keyword: fallbackKeywords[allImages.length] || 'concept', isTitle: allImages.length === 0 });
    }
    
    const finalArticle = {
      id,
      headline: article.headline,
      subheadline: article.subheadline,
      category: article.category || 'opinion',
      author: article.author || 'BBN Staff',
      content: article.content,
      titleImage: allImages[0]?.keyword,
      images: allImages,
      topic,
      styleInstruction: description || null,
      createdAt: timestamp,
      views: 0,
      trending: false
    };

    const articlePath = path.join(DATA_DIR, `${id}.json`);
    fs.writeFileSync(articlePath, JSON.stringify(finalArticle, null, 2));
    
    const wordCount = article.content?.split(/\s+/).length || 0;
    const paragraphCount = (article.content?.match(/\n\n/g) || []).length + 1;
    
    console.log(`\n✅ Article generated!`);
    console.log(`📁 ID: ${id}`);
    console.log(`📰 Headline: ${article.headline}`);
    console.log(`📊 Stats: ${wordCount} words, ${paragraphCount} paragraphs`);
    console.log(`🖼️ Title image: ${allImages[0]?.keyword}`);
    console.log(`📸 Body images: ${allImages.slice(1).map(i => i.keyword).join(', ')}`);
    
    if (fetchImages && allImages.length > 0) {
      console.log('\n📷 Fetching images...');
      
      const keywords = allImages.map(img => img.keyword).filter(Boolean);
      
      if (keywords.length > 0) {
        const downloadedImages = await fetchArticleImages(id, keywords);
        
        // Mark which is the title image
        downloadedImages.forEach((img, i) => {
          img.isTitle = i === 0;
        });
        
        finalArticle.images = downloadedImages;
        fs.writeFileSync(articlePath, JSON.stringify(finalArticle, null, 2));
        
        console.log(`✅ Images downloaded!`);
      }
    }
    
    return finalArticle;
    
  } catch (error) {
    console.error('❌ Error generating article:', error.message);
    throw error;
  }
}

// CLI usage
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
📰 BBN Article Generator

Usage: node generate.js "<topic>" ["style instruction"] [--no-images]

Options:
  --no-images    Skip image fetching (faster generation)

Examples:
  node generate.js "Why you should gamble your house away NOW" "Write like a desperate gambler at 3am"
  node generate.js "Sleep is for losers" "Dark, brooding, philosophical tone"
`);
  process.exit(1);
}

const noImages = args.includes('--no-images');
const filteredArgs = args.filter(a => !a.startsWith('--'));
const topic = filteredArgs[0];
const description = filteredArgs[1] || '';

generateArticle(topic, description, !noImages).catch(console.error);

export { generateArticle };