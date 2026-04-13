import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data', 'articles');
const IMAGES_DIR = path.join(ROOT_DIR, 'data', 'images');
const EXPORTS_DIR = path.join(ROOT_DIR, 'exports');

if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

async function exportLibrary(outputName = null) {
  console.log('\n📦 Exporting BBN Library...\n');
  const articles = [];
  const images = {};
  let totalSize = 0;

  const articleFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

  for (const file of articleFiles) {
    const articlePath = path.join(DATA_DIR, file);
    const article = JSON.parse(fs.readFileSync(articlePath, 'utf-8'));

    if (article.images) {
      for (const img of article.images) {
        if (img.url && img.url.startsWith('/images/')) {
          const imgFilename = path.basename(img.url);
          const imgPath = path.join(IMAGES_DIR, imgFilename);
          if (fs.existsSync(imgPath)) {
            const imgBuffer = fs.readFileSync(imgPath);
            images[imgFilename] = {
              data: imgBuffer.toString('base64'),
              size: imgBuffer.length
            };
            totalSize += imgBuffer.length;
          }
        }
      }
    }
    articles.push(article);
    console.log(`  ✓ ${article.headline?.substring(0, 50)}...`);
  }

  const bundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    source: 'BBN',
    stats: { articleCount: articles.length, imageCount: Object.keys(images).length, totalBytes: totalSize },
    articles,
    images
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = outputName || `bbn-library-${timestamp}.bbn`;
  const outputPath = path.join(EXPORTS_DIR, filename);
  fs.writeFileSync(outputPath, JSON.stringify(bundle));

  const fileSizeMB = (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Export: ${outputPath} (${fileSizeMB} MB)`);
  return outputPath;
}

async function importLibrary(bundlePath, options = {}) {
  const { overwrite = false, skipImages = false, prefix = '' } = options;
  console.log('\n📥 Importing BBN Library...\n');

  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf-8'));
  const conflicts = [];
  const imported = [];

  if (!skipImages && bundle.images) {
    console.log('📷 Images...');
    for (const [filename, imgData] of Object.entries(bundle.images)) {
      const imgPath = path.join(IMAGES_DIR, filename);
      if (!fs.existsSync(imgPath) || overwrite) {
        fs.writeFileSync(imgPath, Buffer.from(imgData.data, 'base64'));
        console.log(`  ✓ ${filename}`);
      }
    }
  }

  console.log('\n📰 Articles...');
  for (const article of bundle.articles) {
    let articleId = article.id;
    let newPath = path.join(DATA_DIR, `${articleId}.json`);

    if (fs.existsSync(newPath) && !overwrite) {
      if (prefix) {
        articleId = prefix + articleId;
        article.id = articleId;
        newPath = path.join(DATA_DIR, `${articleId}.json`);
      } else {
        conflicts.push(article.id);
        continue;
      }
    }
    article.importedAt = new Date().toISOString();
    fs.writeFileSync(newPath, JSON.stringify(article, null, 2));
    imported.push(article);
    console.log(`  ✓ ${article.headline?.substring(0, 40)}...`);
  }

  console.log(`\n✅ Imported: ${imported.length}, Conflicts: ${conflicts.length}`);
  return { imported: imported.length, conflicts: conflicts.length };
}

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd) {
  console.log(`\n📚 BBN Library Manager\n\nUsage:\n  node cli/library.js export [name]    Export all to .bbn file\n  node cli/library.js import <file>    Import .bbn bundle\n\nImport Options:\n  --overwrite     Replace existing\n  --prefix=xxx    Add prefix to IDs\n`);
  process.exit(0);
}

if (cmd === 'export') exportLibrary(args[1]).catch(console.error);
else if (cmd === 'import') importLibrary(args[1], { overwrite: args.includes('--overwrite'), prefix: args.find(a => a.startsWith('--prefix='))?.split('=')[1] || '' }).catch(console.error);

export { exportLibrary, importLibrary };