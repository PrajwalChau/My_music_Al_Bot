# 🎵 AI Music Intelligence Bot — Project Metadata

> **Purpose:** This file serves as the single source of truth for the Antigravity agent.  
> **Last Updated:** 2026-05-29  
> **Status:** Production-ready scaffold

---

## 1. Project Overview

A full-stack MERN application that analyzes song lyrics using:
- **Genius API** — lyrics, metadata, album art
- **NVIDIA NIM API** — AI-powered thematic & emotional analysis (OpenAI-compatible, `meta/llama-3.1-70b-instruct`)
- **MongoDB** — caching layer with compound unique index on `title + artist`

**Design:** Nepali-inspired dark aesthetic, glassmorphism, red/orange/gold accents, Framer Motion animations, Canvas 2D particle background.

---

## 2. System Architecture
```
┌─────────────┐      POST /api/analyze      ┌──────────────┐
│   React     │ ───────────────────────────> │   Express    │
│  (Vite)     │                            │   (Node.js)  │
│  Port 5173  │ <────────────────────────── │   Port 5000  │
└─────────────┘      JSON: analysis data     └──────────────┘
│
┌────────────────────────────┼────────────────────────────┐
│                            │                            │
▼                            ▼                            ▼
┌─────────────┐           ┌──────────────┐           ┌─────────────┐
│   MongoDB   │           │  Genius API  │           │ NVIDIA NIM  │
│   (Cache)   │           │   (Lyrics)   │           │  (AI/NLP)   │
└─────────────┘           └──────────────┘           └─────────────┘
```

**Data Flow:**
1. User inputs `title + artist` → React frontend
2. Frontend `POST /api/analyze` → Express backend
3. Backend checks MongoDB cache (compound index `title + artist`, case-insensitive regex)
4. Cache miss → Genius API → fetch lyrics + album art + URL
5. Backend sends lyrics to NVIDIA NIM (OpenAI SDK, `baseURL: https://integrate.api.nvidia.com/v1`)
6. AI returns structured JSON: `themes[], emotion, emotionScore, summary, origin, keywords[], mood, genreVibe`
7. Backend saves to MongoDB, returns JSON to frontend
8. Frontend renders: album art, lyrics (expandable), emotion meter, theme badges, analysis cards with typewriter effect

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS 3.4, Framer Motion, React Router 6, Lucide React, Axios |
| Backend | Node.js, Express 4, Mongoose 8, CORS, Helmet, Morgan, express-rate-limit |
| Database | MongoDB (local or Atlas), Mongoose ODM |
| Lyrics | `genius-lyrics-api` npm package + Cheerio fallback scraper |
| AI/NLP | NVIDIA NIM API via OpenAI SDK (`meta/llama-3.1-70b-instruct`) |
| Design | Nepali dark theme, glassmorphism, Canvas 2D particles, gradient text |

---

## 4. File Structure
```
music-intelligence-bot/
├── setup.js                          # One-shot project generator script
├── README.md                         # User-facing documentation
├── PROJECT_METADATA.md               # THIS FILE — agent reference
│
├── backend/
│   ├── server.js                     # Express entry point, middleware stack, error handlers
│   ├── package.json                  # Dependencies + scripts (type: module)
│   ├── .env.example                  # Template for environment variables
│   ├── .env                          # Actual secrets (gitignored)
│   │
│   ├── config/
│   │   └── db.js                     # Mongoose connection with pool settings
│   │
│   ├── models/
│   │   └── SongAnalysis.js           # Mongoose schema + indexes
│   │                                 # Indexes: text (title, artist, keywords), compound unique (title+artist)
│   │
│   ├── routes/
│   │   └── analysis.js               # Route definitions: POST /analyze, GET /history, GET /trending, GET /analysis/:id
│   │
│   ├── controllers/
│   │   └── analysisController.js     # analyzeSong (cache check → Genius → NVIDIA → save), getHistory, getById, getTrending
│   │
│   ├── services/
│   │   ├── geniusService.js          # genius-lyrics-api wrapper + Cheerio fallback scraper
│   │   └── nvidiaNimService.js      # OpenAI SDK client pointing to NVIDIA NIM, structured JSON analysis
│   │
│   └── middleware/
│       └── errorHandler.js           # Centralized error handler: 11000 duplicates, ValidationError, CastError
│
└── frontend/
├── index.html                    # HTML entry, Google Fonts (Inter + Space Grotesk)
├── vite.config.js                # Vite config with proxy: /api → localhost:5000
├── tailwind.config.js            # Custom theme: himalaya colors, accent colors, glass utilities, animations
├── postcss.config.js             # Tailwind + Autoprefixer
├── package.json                  # React 18, Framer Motion, Lucide, React Router, Axios
│
└── src/
├── main.jsx                  # ReactDOM root, BrowserRouter wrapper
├── App.jsx                   # Routes (/ → LandingPage, /result → ResultPage), AppProvider, ParticleBackground
├── index.css                 # Tailwind directives + custom utilities (glass-card, glass-input, gradient-text, btn-primary)
│
├── context/
│   └── AppContext.jsx        # React Context: currentAnalysis, loading, error, searchHistory
│
├── services/
│   └── api.js                # Axios instance with interceptors, analyzeSong(), getHistory(), getTrending()
│
├── hooks/
│   └── useAnalysis.js        # (Reserved for future custom hooks)
│
└── components/
├── Navbar.jsx            # Fixed top nav, glass-card, gradient logo, active route indicator
├── LandingPage.jsx       # Hero section, gradient text, SearchBar, 4 feature cards, footer
├── SearchBar.jsx         # Two inputs (title, artist) + submit button, calls POST /api/analyze
├── ResultPage.jsx        # Album art, song info, back button, 2-column layout (analysis + stats)
├── ParticleBackground.jsx # Canvas 2D: floating particles with connecting lines, radial gradient bg
├── TypewriterText.jsx    # Custom hook: typewriter effect with cursor blink
├── EmotionMeter.jsx      # Animated progress bar, emotion-specific colors/icons
├── ThemeBadges.jsx       # Colorful gradient badges for each theme
├── LyricsDisplay.jsx     # Expandable lyrics (12-line preview), staggered line animation
└── AnalysisCard.jsx      # Grid of 4 cards: Summary, Origin, Keywords, Genre Vibe (typewriter effect)
```

---

## 5. API Endpoints

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| `POST` | `/api/analyze` | Analyze a song (checks cache first) | `analyzeSong` |
| `GET` | `/api/history` | Get paginated analysis history | `getAnalysisHistory` |
| `GET` | `/api/trending` | Get top 10 most-searched songs | `getTrendingSearches` |
| `GET` | `/api/analysis/:id` | Get specific analysis by MongoDB ID | `getAnalysisById` |
| `GET` | `/api/health` | Health check | Inline in server.js |

**Request Body (POST /analyze):**
```json
{
  "title": "Someone Like You",
  "artist": "Adele"
}
```

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "title": "Someone Like You",
    "artist": "Adele",
    "albumArt": "https://...",
    "lyrics": "...",
    "themes": ["heartbreak", "acceptance", "nostalgia"],
    "emotion": "sadness",
    "emotionScore": 78,
    "summary": "A reflective breakup song...",
    "origin": "Written after Adele's breakup...",
    "keywords": ["love", "memory", "loss", "goodbye"],
    "mood": "melancholic",
    "genreVibe": "pop ballad",
    "geniusUrl": "https://genius.com/...",
    "searchCount": 1,
    "createdAt": "2026-05-29T...",
    "updatedAt": "2026-05-29T..."
  },
  "cached": false,
  "message": "Song analyzed successfully"
}
```

---

## 6. Database Schema (SongAnalysis)
```javascript
{
  title:        String, required, trim, indexed
  artist:       String, required, trim, indexed
  albumArt:     String, default: null
  lyrics:       String, required
  themes:       [String], default: []
  emotion:      String, default: ''
  emotionScore: Number, 0-100, default: 50
  summary:      String, default: ''
  origin:       String, default: ''
  keywords:     [String], default: []
  mood:         String, default: ''
  genreVibe:    String, default: ''
  geniusUrl:    String, default: ''
  searchCount:  Number, default: 1
}
// Indexes:
// 1. text index: { title, artist, keywords }
// 2. compound unique: { title: 1, artist: 1 }
// 3. createdAt desc (for history queries)
```

---

## 7. Environment Variables

**Backend .env**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/music-intelligence
GENIUS_API_KEY=your_genius_api_key_here
NVIDIA_NIM_API_KEY=nvapi-your_nvidia_key_here
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=meta/llama-3.1-70b-instruct
NODE_ENV=development
```

**Frontend .env**
```env
VITE_API_URL=http://localhost:5000/api
```

**API Key Sources:**
- Genius API: https://genius.com/api-clients
- NVIDIA NIM: https://build.nvidia.com (get nvapi-... key)

---

## 8. Frontend Component Hierarchy
```
App.jsx
├── AppProvider (Context)
│   ├── currentAnalysis
│   ├── loading
│   ├── error
│   └── searchHistory
│
├── ParticleBackground (Canvas 2D, z-0)
├── Navbar (fixed, z-50)
│
└── Routes
    ├── / → LandingPage
    │   └── SearchBar
    │       └── calls api.analyzeSong() → updates context → navigates to /result
    │   └── 4 Feature Cards (motion stagger)
    │
    └── /result → ResultPage
        ├── Back Button
        ├── Header (Album Art + Title + Artist + Stats)
        ├── Left Column (lg:col-span-2)
        │   ├── AnalysisGrid (4 cards: Summary, Origin, Keywords, Genre Vibe)
        │   │   └── TypewriterText (per card)
        │   └── LyricsDisplay (expandable, staggered line animation)
        └── Right Column
            ├── EmotionMeter (animated bar, emotion-specific colors)
            ├── ThemeBadges (gradient badges, staggered entrance)
            └── Song Stats (word count, line count, theme count, keyword count)
```

---

## 9. Key Design Decisions

| Decision | Rationale |
|---|---|
| NVIDIA NIM via OpenAI SDK | OpenAI-compatible API means zero custom client code — just change baseURL and apiKey |
| Compound unique index on title+artist | Prevents duplicate DB entries, case-insensitive regex for cache hits |
| Cheerio fallback scraper | genius-lyrics-api sometimes fails; Cheerio provides backup lyrics extraction |
| Canvas 2D particles (not library) | Zero dependency, full control over Nepali color palette (red/orange), lightweight |
| Typewriter effect on analysis cards | Creates "AI is thinking" feel, staggers content reveal for better UX |
| Vite proxy for /api | Frontend dev server transparently proxies to backend — no CORS issues during development |
| Rate limiting (50 req/15min) | Protects NVIDIA NIM API costs and Genius API quotas |
| Glassmorphism cards | backdrop-blur-xl + rgba(255,255,255,0.05) background + rgba(255,255,255,0.1) border |

---

## 10. Color Palette (Tailwind Custom)

| Token | Hex | Usage |
|---|---|---|
| himalaya-900 | #0a0a0f | Page background |
| himalaya-700 | #1a1a2e | Card backgrounds, gradients |
| accent-red | #e94560 | Primary buttons, active states, highlights |
| accent-orange | #ff6b35 | Gradients, hover states, secondary accents |
| accent-gold | #f4a261 | Icons, badges, warm accents |
| glass-DEFAULT | rgba(255,255,255,0.05) | Card fill |
| glass-border | rgba(255,255,255,0.1) | Card borders |

---

## 11. Known Issues & Troubleshooting

| Issue | Solution |
|---|---|
| genius-lyrics-api returns empty lyrics | Fallback scraper activates; if both fail, returns 404 |
| NVIDIA NIM returns invalid JSON | Controller catches parse error, returns fallback "unknown" analysis |
| MongoDB duplicate key (11000) | Error handler returns 400 with "Duplicate field value entered" |
| CORS errors in production | Update cors.origin array in server.js with your domain |
| Frontend can't reach backend | Check Vite proxy config; ensure backend runs on port 5000 |
| Album art not loading | Genius API sometimes returns null; placeholder gradient shown |

---

## 12. Future Enhancements (Roadmap)
- [ ] Similar songs recommendation (NVIDIA NIM suggestion engine)
- [ ] Spotify integration (track preview URLs)
- [ ] YouTube music video links
- [ ] User authentication (JWT + MongoDB users collection)
- [ ] Search history persistence per user
- [ ] Analytics dashboard (most searched artists, emotion distribution)
- [ ] PWA support (offline lyrics viewing)
- [ ] Dark/light mode toggle

---

## 13. Quick Reference for Agent
When user asks to modify/add:
- **New API endpoint** → Add to `backend/routes/analysis.js` + `backend/controllers/analysisController.js`
- **New component** → Add to `frontend/src/components/`, import in `App.jsx` or parent
- **New database field** → Update `backend/models/SongAnalysis.js`, add to controller save logic
- **Styling changes** → Edit `frontend/tailwind.config.js` (theme) or `frontend/src/index.css` (utilities)
- **New animation** → Use Framer Motion `motion.div` with variants; add to `tailwind.config.js` keyframes if CSS-based
- **Environment changes** → Update both `backend/.env.example` and `backend/server.js` defaults

Critical paths to never break:
- `backend/server.js` — middleware order matters (helmet → cors → rateLimit → json → routes → errorHandler)
- `backend/controllers/analysisController.js` — cache check MUST happen before external API calls
- `frontend/src/services/api.js` — `baseURL` must match backend port
- `frontend/src/App.jsx` — `AppProvider` must wrap all routes

*End of metadata. This file is intended for Antigravity agent consumption to minimize token usage on project re-analysis.*
