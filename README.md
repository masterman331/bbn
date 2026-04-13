# BBN - Big Bullshit News

**The most believable fake news generator you'll ever need.**

Ever wanted to run your own satirical news empire? BBN uses local AI to generate completely ridiculous yet oddly convincing news articles with dramatic headlines, fake expert quotes, made-up studies, and auto-fetched images. Perfect for laughs, memes, pranks, or your next creative project.

## ✨ Why BBN?

We built BBN because we wanted something **local, private, and fun**. No cloud APIs, no monthly fees, no data leaving your machine. Just you, Ollama, and an endless stream of believable nonsense.

- 🤖 **AI-Powered** - Uses your local Ollama instance to generate articles
- 🖼️ **Auto Images** - Fetches relevant photos from Pixabay
- 🔒 **100% Local** - Your fake news stays on your machine
- 📦 **Portable** - Export/import entire article libraries
- 🎨 **Beautiful UI** - Dark theme with smooth animations
- 📱 **Responsive** - Works on desktop and mobile

---

## 🎭 Go Crazy. We Mean It.

This isn't just a news generator. It's a creativity engine for chaos.

**Write about anything. The more absurd, the better.**

- 🐙 "Scientists Confirm: Octopuses Are Actually Alien Spies"
- 🥓 "Bacon Now Classified as a Vegetable by World Health Organization"
- 🌍 "Earth is Flat, Scientists Admit: 'We Were Paid to Lie'"
- 🐱 "Your Cat is Working for the Government: The Hidden Truth"
- ☕ "Coffee Discovered to Be Slow-Acting Poison, FDA Responds"
- 🚗 "Walking is Actually Faster Than Driving, New Study Shows"
- 🎮 "Video Games Make You More Attractive, Says Science"
- 🛸 "Aliens Refuse to Visit Earth: 'Too Weird,' They Say"

**The style system lets you control the voice:**

```bash
# Conspiracy theorist
npm run generate "Birds Aren't Real" "Write like someone who wears a tinfoil hat and has 'done the research' on YouTube"

# Manic entrepreneur  
npm run generate "Sleep is Destroying Your Empire" "Write like a tech billionaire who hasn't slept in 96 hours and is CONVINCED rest is a conspiracy by the weak"

# Old-timey journalist
npm run generate "The Internet: Satan's Latest Invention" "Write like a newspaper editor from 1890 who just discovered what a computer is"

# Dramatic breaking news
npm run generate "The Great Toilet Paper Crisis of 2026" "Write like a CNN anchor during the apocalypse"
```

**The AI will generate:**
- Dramatic, clickbait headlines
- Long-form content (8+ paragraphs)
- Fake expert quotes with realistic names and titles
- Made-up studies with specific percentages
- Statistics that sound real but definitely aren't

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Ollama** - [Download here](https://ollama.ai/)
  - Make sure Ollama is running: `ollama serve`
  - Pull a model: `ollama pull llama3` (or your preferred model)

### 2. Install & Configure

```bash
# Clone the repo
git clone https://github.com/masterman331/bbn.git
cd bbn

# Install dependencies
npm install

# Copy the example environment file
cp .env.example .env

# Edit .env with your settings
```

### 3. Configure Your Environment

Create a `.env` file (or rename `.env.example`):

```env
# Pixabay API Key (FREE - get yours at https://pixabay.com/api/docs/)
PIXABAY_API_KEY=your_pixabay_api_key_here

# Ollama Settings
OLLAMA_API=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

> **Why Pixabay?** We fetch royalty-free images to make your articles look professional. Get your free key at [pixabay.com/api/docs](https://pixabay.com/api/docs/)

### 4. Run It!

```bash
# Start the server
npm start

# Open in browser
# http://localhost:3000
```

### 5. Generate Your First Article

```bash
# Basic article
npm run generate "Why Your Cat is Secretly Plotting Against You"

# With a style persona
npm run generate "Coffee: The Government's Favorite Mind Control Drug" "Write like a paranoid conspiracy theorist"

# Skip images (faster)
node cli/generate.js "Topic" "Style" --no-images
```

---

## 🎁 Try the Demo

New to BBN? We've included a demo library to get you started!

```bash
# Import the demo articles
node cli/library.js import exports/demo.bbn

# Start the server
npm start
```

You'll instantly have sample articles to explore, edit, and learn from.

---

## 🖼️ See It In Action

### Main Page
Clean, dark theme with trending articles, category filters, and search.

![BBN Homepage](https://raw.githubusercontent.com/masterman331/bbn/main/Pics/mainpage.png)

### Article View
Full article with images, fake quotes styled as blockquotes, and related articles.

![BBN Article](https://raw.githubusercontent.com/masterman331/bbn/main/Pics/articleexample.png)

---

## 🎭 How It Works

### Article Generation

BBN uses a carefully crafted prompt system that instructs the AI to write in the style of sensationalist journalism:

1. **You provide a topic** - Any absurd premise you want
2. **Optional style instruction** - Define the voice/persona
3. **AI generates** - Long-form article with:
   - Dramatic headline and subheadline
   - 8+ paragraphs of content
   - 3+ fake expert quotes with names and titles
   - 2+ fake studies with statistics
   - 4 image keywords for fetching

4. **Images are fetched** - From Pixabay based on keywords
5. **Article saved** - As JSON in `data/articles/`

### The Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Express.js | Serves articles, handles API |
| AI Engine | Ollama | Generates article content |
| Images | Pixabay API | Fetches relevant photos |
| Storage | JSON files | No database needed |
| Frontend | Vanilla JS + CSS | Fast, lightweight UI |

### File Structure

```
bbn/
├── 📁 cli/
│   ├── generate.js     # Article generation CLI
│   └── library.js      # Export/import manager
├── 📁 data/
│   ├── articles/       # JSON article files
│   └── images/         # Downloaded images
├── 📁 exports/
│   └── demo.bbn        # Demo file
├── 📁 Pics/            # Screenshots for README
├── 📁 public/
│   ├── index.html      # Homepage
│   ├── article.html    # Article view
│   └── style.css       # All styling
├── .env.example        # Template for env vars
├── server.js           # Express server
├── imageFetcher.js     # Pixabay integration
└── package.json
```

---

## 📚 Library Export & Import

Share your fake news empire with friends or merge collections from multiple BBN installations.

### Export Your Library

```bash
# Export everything to a portable .bbn file
node cli/library.js export

# Custom filename
node cli/library.js export my-epic-collection.bbn
```

The `.bbn` file contains:
- All article metadata and content
- All images (base64 encoded)
- Export statistics

### Import a Library

```bash
# Import articles from a .bbn file
node cli/library.js import exports/my-library.bbn

# Avoid conflicts with prefix
node cli/library.js import my-library.bbn --prefix=friend_

# Replace existing articles
node cli/library.js import my-library.bbn --overwrite

# See what exports you have
node cli/library.js list
```

---

## 🎨 Style Examples

The style instruction shapes the entire voice of the article:

```bash
# Academic arrogance
npm run generate "Why Your Opinion is Wrong" "Write like a tenured professor who is tired of explaining basic concepts to inferior minds"

# Instagram influencer
npm run generate "This One Weird Trick Will Change Your Life" "Write like a 24-year-old influencer who just discovered self-help books"

# Doomsday prepper
npm run generate "Society Will Collapse by Tuesday" "Write like someone with 500 cans of beans and a very detailed bunker plan"

# Angry sports commentator
npm run generate "Why Everything in Sports is Ruined Forever" "Write like a sports radio host who has been screaming for 4 hours straight"

# Victorian ghost
npm run generate "The Internet is Haunted" "Write like a ghost from the 1800s who just learned what WiFi is"
```

---

## 🔧 API Reference

BBN runs a simple REST API:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/articles` | GET | List all articles |
| `/api/trending` | GET | Top 5 by views |
| `/api/article/:id` | GET | Single article |
| `/api/article/:id/view` | POST | Increment view count |

---

## ⚙️ Configuration Options

### Environment Variables (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PIXABAY_API_KEY` | Yes | Your Pixabay API key |
| `OLLAMA_API` | No | Ollama endpoint (default: `http://localhost:11434/api/generate`) |
| `OLLAMA_MODEL` | No | Model to use (default: `llama3`) |

### Model Recommendations

Different models produce different styles:

- **llama3** - Balanced, good for general use
- **mistral** - More creative, unpredictable
- **llama3:70b** - Higher quality (needs more RAM)
- **zephyr** - Conversational, witty

---

## ⚠️ Pixabay Image Disclaimer

BBN automatically fetches images from [Pixabay](https://pixabay.com) to make your articles visually appealing. We make every effort to use these images appropriately, but:

- We are not responsible for how you use or distribute the fetched images
- Pixabay's terms of service apply to all downloaded images
- Some images may have restrictions on commercial use or modification
- We sincerely apologize if any use of Pixabay content violates their service terms
- Please review [Pixabay's License](https://pixabay.com/service/license/) before redistributing images

If you encounter any issues with image licensing, please let us know and we'll address it promptly.

---

## ⚠️ Content Disclaimer

**This is satire/parody software.** All generated content is completely fictional.

- Do not use for misinformation
- Do not present generated content as real news
- Do not use to deceive people about real events
- We are not responsible for what you generate or how you use it

BBN is intended for entertainment, creative writing, and satire. Please use responsibly and don't be a jerk.

---

## 🤝 Contributing

This is a fun side project! Feel free to:
- Fork and customize
- Add new article templates and prompts
- Improve the UI
- Add new features (fake comments, fake users, etc.)
- Share your most hilarious generated articles
- Submit pull requests!

---

## 📄 License

MIT - Do whatever you want. Just don't sue us and don't be evil.

---

> **Disclaimer:**  
> This project has been vibe-coded please use it cautiously. - Masterman331

---

## 🪙 Support This Project

If you found this project useful, interesting, or helpful, consider supporting its development through **Monero**.

<p align="center">
  <img src="https://raw.githubusercontent.com/masterman331/masterman331/main/moneroadress.png" alt="Monero donation QR code" width="220"/>
</p>

<p align="center">
<code>47chh1Z9wvHDP6ZDpzPPETKaXUfsNnmXr8P5cL4ofAkH1fi3mrrvC7tiRoeqxtNCbB1BQ3rqk5k2tSPGoiMSTUTC3iPc9Qu</code>
</p>

<p align="center">
  <em>Privacy-respecting contributions help keep independent development alive.</em>
</p>
