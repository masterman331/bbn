import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data', 'articles');
const IMAGES_DIR = path.join(__dirname, 'data', 'images');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// In-memory cache of articles
let articles = [];

// Load all articles from disk
function loadArticles() {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    articles = files.map(file => {
      const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
      return JSON.parse(content);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log(`📰 Loaded ${articles.length} articles`);
  } catch (error) {
    console.error('Error loading articles:', error);
    articles = [];
  }
}

// Watch for new articles
const watcher = chokidar.watch(DATA_DIR);
watcher.on('add', () => loadArticles());
watcher.on('change', () => loadArticles());

// Initial load
loadArticles();

// Serve static files
app.use('/images', express.static(IMAGES_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all articles
app.get('/api/articles', (req, res) => {
  res.json(articles);
});

// API: Get trending articles
app.get('/api/trending', (req, res) => {
  const trending = articles
    .filter(a => a.views > 10)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  res.json(trending);
});

// API: Get single article
app.get('/api/article/:id', (req, res) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  res.json(article);
});

// API: Increment views
app.post('/api/article/:id/view', (req, res) => {
  const article = articles.find(a => a.id === req.params.id);
  if (!article) {
    return res.status(404).json({ error: 'Article not found' });
  }
  article.views++;
  
  // Update file on disk
  const articlePath = path.join(DATA_DIR, `${article.id}.json`);
  fs.writeFileSync(articlePath, JSON.stringify(article, null, 2));
  
  res.json({ views: article.views });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve article page
app.get('/article/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'article.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 BBN - Big Bullshit News running at http://localhost:${PORT}`);
  console.log(`📰 Ready to serve FAKE NEWS!\n`);
});