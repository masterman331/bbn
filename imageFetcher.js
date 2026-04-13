import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || 'your_api_key_here';
const PIXABAY_API = 'https://pixabay.com/api/';
const IMAGES_DIR = path.join(__dirname, 'data', 'images');

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Cache for API responses
const cache = new Map();

/**
 * Search Pixabay for images matching a keyword
 */
async function searchPixabay(keyword, options = {}) {
  const cacheKey = `${keyword}_${JSON.stringify(options)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const params = new URLSearchParams({
    key: PIXABAY_API_KEY,
    q: keyword.replace(/\s+/g, '+'),
    image_type: 'photo',
    orientation: 'horizontal',
    safesearch: 'true',
    per_page: '10',
    order: 'popular',
    ...options
  });

  try {
    const response = await fetch(`${PIXABAY_API}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`);
    }
    
    const data = await response.json();
    cache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error('Pixabay search error:', error.message);
    return { hits: [] };
  }
}

/**
 * Download an image from URL and save locally
 */
async function downloadImage(url, filename) {
  const filepath = path.join(IMAGES_DIR, filename);
  
  // Check if already exists
  if (fs.existsSync(filepath)) {
    console.log(`  ✓ Already exists: ${filename}`);
    return `/images/${filename}`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://pixabay.com/'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Make sure we got actual image data
    if (buffer.length < 1000) {
      throw new Error('Response too small, likely not an image');
    }
    
    fs.writeFileSync(filepath, buffer);
    console.log(`  ✓ Downloaded: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
    
    return `/images/${filename}`;
  } catch (error) {
    console.error(`  ✗ Failed: ${error.message}`);
    return null;
  }
}

/**
 * Fetch images for an article based on keywords
 */
async function fetchArticleImages(articleId, imageKeywords) {
  const results = [];
  
  for (let i = 0; i < imageKeywords.length; i++) {
    const keyword = imageKeywords[i];
    // Use article ID + image index for unique filename
    const filename = `${articleId}_img${i + 1}.jpg`;
    
    console.log(`  🔍 Searching: "${keyword}"`);
    
    const data = await searchPixabay(keyword);
    
    if (data.hits && data.hits.length > 0) {
      // For first image (title), pick from top 3. For body images, pick from different range to ensure variety
      const maxResults = Math.min(10, data.hits.length);
      let hitIndex;
      if (i === 0) {
        // Title image - pick from top 3
        hitIndex = Math.floor(Math.random() * Math.min(3, maxResults));
      } else {
        // Body images - pick from different range to avoid duplicates with title
        hitIndex = Math.floor(Math.random() * (maxResults - 3)) + 3;
        if (hitIndex >= maxResults) hitIndex = Math.floor(Math.random() * maxResults);
      }
      const hit = data.hits[hitIndex];
      
      console.log(`  📸 Found: ID ${hit.id} by ${hit.user}`);
      
      // Try different URL formats in order of preference
      const urlsToTry = [
        hit.largeImageURL,           // 1280px
        hit.webformatURL?.replace('_640', '_1280'), // Try larger version
        hit.webformatURL,            // 640px
        hit.previewURL?.replace('_150', '_640')     // Fallback
      ].filter(Boolean);
      
      let localPath = null;
      
      for (const imageUrl of urlsToTry) {
        console.log(`  ⬇️ Trying: ${imageUrl?.substring(0, 60)}...`);
        localPath = await downloadImage(imageUrl, filename);
        if (localPath) break;
      }
      
      if (localPath) {
        results.push({
          keyword,
          url: localPath,
          pixabayId: hit.id,
          photographer: hit.user,
          source: 'pixabay'
        });
      } else {
        // Use placeholder from picsum as fallback
        const placeholderUrl = `https://picsum.photos/seed/${articleId}${i}/800/400`;
        const placeholderPath = await downloadImage(placeholderUrl, filename);
        results.push({
          keyword,
          url: placeholderPath || `/images/placeholder.jpg`,
          source: 'placeholder',
          pixabayId: null,
          photographer: null
        });
      }
    } else {
      console.log(`  ✗ No results for "${keyword}"`);
      // Use placeholder
      const placeholderUrl = `https://picsum.photos/seed/${articleId}${i}/800/400`;
      const placeholderPath = await downloadImage(placeholderUrl, filename);
      results.push({
        keyword,
        url: placeholderPath || `/images/placeholder.jpg`,
        source: 'placeholder',
        pixabayId: null,
        photographer: null
      });
    }
    
    // Delay between requests
    if (i < imageKeywords.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
}

/**
 * Update an article with downloaded images
 */
async function updateArticleWithImages(articlePath) {
  try {
    const article = JSON.parse(fs.readFileSync(articlePath, 'utf-8'));
    
    if (!article.images || article.images.length === 0) {
      console.log(`  ⊘ No images to fetch for ${article.id}`);
      return;
    }
    
    // Check if images already downloaded
    const alreadyDownloaded = article.images.every(img => 
      img.url && img.url.startsWith('/images/')
    );
    
    if (alreadyDownloaded) {
      console.log(`  ✓ Images already downloaded for ${article.id}`);
      return;
    }
    
    console.log(`\n📷 Fetching images for: ${article.headline?.substring(0, 50)}...`);
    
    const keywords = article.images.map(img => img.keyword).filter(Boolean);
    
    if (keywords.length === 0) {
      console.log('  ✗ No keywords found');
      return;
    }
    
    const downloadedImages = await fetchArticleImages(article.id, keywords);
    
    // Update article with local paths
    article.images = downloadedImages;
    
    fs.writeFileSync(articlePath, JSON.stringify(article, null, 2));
    
    const successCount = downloadedImages.filter(img => img.url).length;
    console.log(`  ✓ Updated: ${successCount}/${downloadedImages.length} images saved\n`);
    
    return article;
  } catch (error) {
    console.error('Error updating article:', error.message);
  }
}

/**
 * Fetch images for all articles without images
 */
async function fetchAllMissingImages() {
  const articlesDir = path.join(__dirname, 'data', 'articles');
  
  if (!fs.existsSync(articlesDir)) {
    console.log('No articles directory found');
    return;
  }
  
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
  
  console.log(`\n📰 Checking ${files.length} articles for missing images...\n`);
  
  for (const file of files) {
    const articlePath = path.join(articlesDir, file);
    await updateArticleWithImages(articlePath);
    
    // Delay between articles
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\n✓ Done fetching images!');
}

// CLI usage
const args = process.argv.slice(2);

if (args[0] === 'fetch-all') {
  fetchAllMissingImages().catch(console.error);
} else if (args[0] === 'fetch' && args[1]) {
  const articlePath = path.join(__dirname, 'data', 'articles', args[1].endsWith('.json') ? args[1] : `${args[1]}.json`);
  updateArticleWithImages(articlePath).catch(console.error);
} else {
  console.log(`
📷 BBN Image Fetcher

Usage:
  node imageFetcher.js fetch-all              Fetch images for all articles
  node imageFetcher.js fetch <article-id>     Fetch images for specific article
`);
}

export { fetchArticleImages, updateArticleWithImages, fetchAllMissingImages, searchPixabay };