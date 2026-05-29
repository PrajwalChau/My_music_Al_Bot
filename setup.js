#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const BACKEND = path.join(ROOT, 'backend');
const FRONTEND = path.join(ROOT, 'frontend');
const FRONTEND_SRC = path.join(FRONTEND, 'src');
const COMPONENTS = path.join(FRONTEND_SRC, 'components');
const CONTEXT = path.join(FRONTEND_SRC, 'context');
const SERVICES = path.join(FRONTEND_SRC, 'services');
const HOOKS = path.join(FRONTEND_SRC, 'hooks');

const dirs = [
    BACKEND,
    path.join(BACKEND, 'config'),
    path.join(BACKEND, 'models'),
    path.join(BACKEND, 'routes'),
    path.join(BACKEND, 'controllers'),
    path.join(BACKEND, 'services'),
    path.join(BACKEND, 'middleware'),
    FRONTEND,
    FRONTEND_SRC,
    COMPONENTS,
    CONTEXT,
    SERVICES,
    HOOKS,
];

// Create directories
dirs.forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    console.log(`📁 ${d}`);
});

const files = {
    // ==================== BACKEND ====================
    [path.join(BACKEND, 'package.json')]: JSON.stringify({
        "name": "music-intelligence-backend",
        "version": "1.0.0",
        "description": "AI Music Intelligence Bot Backend",
        "main": "server.js",
        "type": "module",
        "scripts": {
            "start": "node server.js",
            "dev": "nodemon server.js"
        },
        "dependencies": {
            "axios": "^1.7.2",
            "cheerio": "^1.0.0-rc.12",
            "cors": "^2.8.5",
            "dotenv": "^16.4.5",
            "express": "^4.19.2",
            "express-rate-limit": "^7.3.1",
            "genius-lyrics-api": "^2.0.3",
            "helmet": "^7.1.0",
            "mongoose": "^8.4.3",
            "morgan": "^1.10.0",
            "openai": "^4.52.0"
        },
        "devDependencies": {
            "nodemon": "^3.1.4"
        }
    }, null, 2),

    [path.join(BACKEND, '.env.example')]: `PORT=5000
MONGODB_URI=mongodb://localhost:27017/music-intelligence
GENIUS_API_KEY=your_genius_api_key_here
NVIDIA_NIM_API_KEY=nvapi-your_nvidia_key_here
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_NIM_MODEL=meta/llama-3.1-70b-instruct
NODE_ENV=development
`,

    [path.join(BACKEND, 'config', 'db.js')]: `import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`MongoDB Connection Error: \${error.message}\`);
    process.exit(1);
  }
};

export default connectDB;
`,

    [path.join(BACKEND, 'models', 'SongAnalysis.js')]: `import mongoose from 'mongoose';

const songAnalysisSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, required: true, trim: true },
    albumArt: { type: String, default: null },
    lyrics: { type: String, required: true },
    themes: { type: [String], default: [] },
    emotion: { type: String, default: '' },
    emotionScore: { type: Number, min: 0, max: 100, default: 50 },
    summary: { type: String, default: '' },
    origin: { type: String, default: '' },
    keywords: { type: [String], default: [] },
    mood: { type: String, default: '' },
    genreVibe: { type: String, default: '' },
    geniusUrl: { type: String, default: '' },
    searchCount: { type: Number, default: 1 },
  },
  { timestamps: true }
);

songAnalysisSchema.index({ title: 'text', artist: 'text', keywords: 'text' });
songAnalysisSchema.index({ createdAt: -1 });
songAnalysisSchema.index({ title: 1, artist: 1 }, { unique: true });

const SongAnalysis = mongoose.model('SongAnalysis', songAnalysisSchema);
export default SongAnalysis;
`,

    [path.join(BACKEND, 'services', 'geniusService.js')]: `import { getSong } from 'genius-lyrics-api';
import axios from 'axios';
import * as cheerio from 'cheerio';

class GeniusService {
  constructor() {
    this.apiKey = process.env.GENIUS_API_KEY;
  }

  async searchSong(title, artist) {
    const options = {
      apiKey: this.apiKey,
      title: title,
      artist: artist,
      optimizeQuery: true,
      authHeader: true,
    };
    const song = await getSong(options);
    if (!song) throw new Error('Song not found on Genius');
    return {
      id: song.id,
      title: song.title,
      artist: artist,
      url: song.url,
      albumArt: song.albumArt,
      lyrics: song.lyrics,
    };
  }

  async scrapeLyrics(url) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 10000,
      });
      const $ = cheerio.load(response.data);
      const selectors = ['[data-lyrics-container="true"]', '.lyrics', '[class*="Lyrics__Container"]', '.song_body-lyrics'];
      let lyrics = '';
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, el) => { lyrics += $(el).text() + '\\n'; });
          break;
        }
      }
      return lyrics.trim() || null;
    } catch (error) {
      return null;
    }
  }
}

export default new GeniusService();
`,

    [path.join(BACKEND, 'services', 'nvidiaNimService.js')]: `import OpenAI from 'openai';

class NvidiaNimService {
  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
      apiKey: process.env.NVIDIA_NIM_API_KEY,
    });
    this.model = process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct';
  }

  async analyzeLyrics(lyrics, title, artist) {
    const systemPrompt = \\`You are an expert music analyst.Analyze the provided song lyrics and return a structured JSON response with:
        - themes: array of 3-5 main themes
- emotion: primary emotional tone (single word)
- emotionScore: number 0 - 100
    - summary: 2 - 3 sentence analysis
        - origin: brief context / background
            - keywords: array of 5 - 8 keywords
                - mood: overall mood descriptor
                    - genreVibe: inferred genre

Return ONLY valid JSON.No markdown, no explanations.\\`;

    const userPrompt = \\`Analyze the song "\\${title}" by \\${ artist }.

Lyrics:
\\${ lyrics.substring(0, 4000) }

Provide your analysis as JSON.\\`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      return {
        themes: Array.isArray(analysis.themes) ? analysis.themes : [],
        emotion: analysis.emotion || 'unknown',
        emotionScore: typeof analysis.emotionScore === 'number' ? analysis.emotionScore : 50,
        summary: analysis.summary || 'No summary available.',
        origin: analysis.origin || 'Background information not available.',
        keywords: Array.isArray(analysis.keywords) ? analysis.keywords : [],
        mood: analysis.mood || 'unknown',
        genreVibe: analysis.genreVibe || 'unknown',
      };
    } catch (error) {
      return {
        themes: ['analysis unavailable'],
        emotion: 'unknown',
        emotionScore: 50,
        summary: 'AI analysis temporarily unavailable.',
        origin: 'Background information not available.',
        keywords: [],
        mood: 'unknown',
        genreVibe: 'unknown',
      };
    }
  }
}

export default new NvidiaNimService();
`,

    [path.join(BACKEND, 'controllers', 'analysisController.js')]: `import SongAnalysis from '../models/SongAnalysis.js';
import geniusService from '../services/geniusService.js';
import nvidiaNimService from '../services/nvidiaNimService.js';

export const analyzeSong = async (req, res, next) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'Song title and artist name are required' });
    }

    const existingAnalysis = await SongAnalysis.findOne({
      title: { $regex: new RegExp(\\`^\\${ title } $\\`, 'i') },
      artist: { $regex: new RegExp(\\`^\\${ artist } $\\`, 'i') },
    });

    if (existingAnalysis) {
      existingAnalysis.searchCount += 1;
      await existingAnalysis.save();
      return res.status(200).json({ success: true, data: existingAnalysis, cached: true, message: 'Analysis retrieved from cache' });
    }

    const geniusData = await geniusService.searchSong(title, artist);
    if (!geniusData.lyrics) {
      return res.status(404).json({ success: false, message: 'Lyrics not found for this song' });
    }

    const analysis = await nvidiaNimService.analyzeLyrics(geniusData.lyrics, geniusData.title, artist);

    const songAnalysis = new SongAnalysis({
      title: geniusData.title,
      artist: artist,
      albumArt: geniusData.albumArt,
      lyrics: geniusData.lyrics,
      themes: analysis.themes,
      emotion: analysis.emotion,
      emotionScore: analysis.emotionScore,
      summary: analysis.summary,
      origin: analysis.origin,
      keywords: analysis.keywords,
      mood: analysis.mood,
      genreVibe: analysis.genreVibe,
      geniusUrl: geniusData.url,
      searchCount: 1,
    });

    await songAnalysis.save();

    res.status(201).json({ success: true, data: songAnalysis, cached: false, message: 'Song analyzed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAnalysisHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const analyses = await SongAnalysis.find().sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
    const total = await SongAnalysis.countDocuments();
    res.status(200).json({ success: true, data: analyses, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

export const getAnalysisById = async (req, res, next) => {
  try {
    const analysis = await SongAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found' });
    res.status(200).json({ success: true, data: analysis });
  } catch (error) { next(error); }
};

export const getTrendingSearches = async (req, res, next) => {
  try {
    const trending = await SongAnalysis.find().sort({ searchCount: -1, createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, data: trending });
  } catch (error) { next(error); }
};
`,

    [path.join(BACKEND, 'routes', 'analysis.js')]: `import express from 'express';
import { analyzeSong, getAnalysisHistory, getAnalysisById, getTrendingSearches } from '../controllers/analysisController.js';

const router = express.Router();
router.post('/analyze', analyzeSong);
router.get('/history', getAnalysisHistory);
router.get('/trending', getTrendingSearches);
router.get('/analysis/:id', getAnalysisById);

export default router;
`,

        [path.join(BACKEND, 'middleware', 'errorHandler.js')]: `export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  console.error('Error:', err);

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new Error(message); error.statusCode = 400;
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message); error.statusCode = 400;
  }
  if (err.name === 'CastError') {
    const message = \\`Resource not found with id: \\${ err.value } \\`;
    error = new Error(message); error.statusCode = 404;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(\\`Not Found - \\${ req.originalUrl } \\`);
  res.status(404);
  next(error);
};
`,

    [path.join(BACKEND, 'server.js')]: `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import analysisRoutes from './routes/analysis.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? ['https://yourdomain.com'] : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Music Intelligence Bot API is running', timestamp: new Date().toISOString() });
});

app.use('/api', analysisRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(\\`🎵 Server running in \\${ process.env.NODE_ENV || 'development' } mode on port \\${ PORT } \\`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  server.close(() => process.exit(1));
});
`,

    // ==================== FRONTEND ====================
    [path.join(FRONTEND, 'package.json')]: JSON.stringify({
        "name": "music-intelligence-frontend",
        "private": true,
        "version": "1.0.0",
        "type": "module",
        "scripts": {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
        },
        "dependencies": {
            "axios": "^1.7.2",
            "framer-motion": "^11.2.10",
            "lucide-react": "^0.396.0",
            "react": "^18.3.1",
            "react-dom": "^18.3.1",
            "react-router-dom": "^6.23.1"
        },
        "devDependencies": {
            "@types/react": "^18.3.3",
            "@types/react-dom": "^18.3.0",
            "@vitejs/plugin-react": "^4.3.1",
            "autoprefixer": "^10.4.19",
            "postcss": "^8.4.38",
            "tailwindcss": "^3.4.4",
            "vite": "^5.3.1"
        }
    }, null, 2),

        [path.join(FRONTEND, 'index.html')]: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Music Intelligence Bot | AI-Powered Song Analysis</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,

            [path.join(FRONTEND, 'vite.config.js')]: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
`,

                [path.join(FRONTEND, 'tailwind.config.js')]: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        himalaya: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#16213e',
          500: '#0f3460',
        },
        accent: {
          red: '#e94560',
          orange: '#ff6b35',
          gold: '#f4a261',
          warm: '#e9c46a',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.1)',
        }
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(233, 69, 96, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(233, 69, 96, 0.6)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      },
    },
  },
  plugins: [],
}
`,

                    [path.join(FRONTEND, 'postcss.config.js')]: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,

                        [path.join(FRONTEND_SRC, 'index.css')]: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { scroll-behavior: smooth; }
  body {
    @apply bg-himalaya-900 text-white antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
  ::selection { @apply bg-accent-red/30 text-white; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { @apply bg-himalaya-900; }
  ::-webkit-scrollbar-thumb { @apply bg-himalaya-600 rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-accent-red/50; }
}

@layer components {
  .glass-card {
    @apply bg-glass backdrop-blur-xl border border-glass-border rounded-2xl;
    @apply hover:bg-glass-hover transition-all duration-300;
  }
  .glass-input {
    @apply bg-glass backdrop-blur-md border border-glass-border rounded-xl;
    @apply focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/20;
    @apply placeholder:text-white/30 text-white;
    @apply transition-all duration-300 outline-none;
  }
  .gradient-text {
    @apply bg-gradient-to-r from-accent-red via-accent-orange to-accent-gold bg-clip-text text-transparent;
  }
  .btn-primary {
    @apply px-6 py-3 bg-gradient-to-r from-accent-red to-accent-orange rounded-xl font-semibold;
    @apply hover:shadow-lg hover:shadow-accent-red/25 transition-all duration-300;
    @apply active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .section-padding {
    @apply px-4 sm:px-6 lg:px-8 xl:px-12;
  }
}

@layer utilities {
  .text-shadow { text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); }
  .animation-delay-200 { animation-delay: 200ms; }
  .animation-delay-400 { animation-delay: 400ms; }
  .animation-delay-600 { animation-delay: 600ms; }
}
`,

                            [path.join(FRONTEND_SRC, 'main.jsx')]: `import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`,

                                [path.join(FRONTEND_SRC, 'App.jsx')]: `import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import Navbar from './components/Navbar.jsx';
import LandingPage from './components/LandingPage.jsx';
import ResultPage from './components/ResultPage.jsx';
import ParticleBackground from './components/ParticleBackground.jsx';

function App() {
  return (
    <AppProvider>
      <div className="relative min-h-screen bg-himalaya-900 overflow-x-hidden">
        <ParticleBackground />
        <Navbar />
        <main className="relative z-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </main>
      </div>
    </AppProvider>
  );
}

export default App;
`,

                                    [path.join(CONTEXT, 'AppContext.jsx')]: `import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);

  return (
    <AppContext.Provider value={{
      currentAnalysis, setCurrentAnalysis,
      loading, setLoading,
      error, setError,
      searchHistory, setSearchHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
`,

                                        [path.join(SERVICES, 'api.js')]: `import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  console.log(\\`API Request: \\${ config.method?.toUpperCase() } \\${ config.url } \\`);
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    console.error('API Error:', message);
    return Promise.reject(new Error(message));
  }
);

export const analyzeSong = async (title, artist) => {
  const response = await api.post('/analyze', { title, artist });
  return response.data;
};

export const getHistory = async (page = 1, limit = 20) => {
  const response = await api.get('/history', { params: { page, limit } });
  return response.data;
};

export const getTrending = async () => {
  const response = await api.get('/trending');
  return response.data;
};

export default api;
`,

    [path.join(COMPONENTS, 'ParticleBackground.jsx')]: `import { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = Math.random() > 0.5 ? '233, 69, 96' : '255, 107, 53';
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = \\`rgba(\\${ this.color }, \\${ this.opacity }) \\`;
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      const particleCount = Math.min(window.innerWidth / 10, 100);
      for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
      );
      gradient.addColorStop(0, 'rgba(26, 26, 46, 0.3)');
      gradient.addColorStop(1, 'rgba(10, 10, 15, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => { p.update(); p.draw(); });

      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 150) {
            ctx.beginPath();
            ctx.strokeStyle = \\`rgba(233, 69, 96, \\${ 0.1 * (1 - distance / 150) }) \\`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    init();
    animate();

    window.addEventListener('resize', () => { resize(); init(); });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

export default ParticleBackground;
`,

    [path.join(COMPONENTS, 'Navbar.jsx')]: `import { Link, useLocation } from 'react-router-dom';
import { Music, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 mx-4 mt-4"
    >
      <div className="section-padding max-w-7xl mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center group-hover:scale-110 transition-transform">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl hidden sm:block">
            <span className="gradient-text">Music</span> Intelligence
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/">
            <button className={\\`px - 4 py - 2 rounded - lg text - sm font - medium transition - all \\${
    location.pathname === '/'
        ? 'bg-accent-red/20 text-accent-red'
        : 'text-white/60 hover:text-white hover:bg-white/5'
} \\`}>
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Analyze</span>
              </span>
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
`,

    [path.join(COMPONENTS, 'SearchBar.jsx')]: `import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music, Mic2, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { analyzeSong } from '../services/api.js';

const SearchBar = () => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const { setCurrentAnalysis, setLoading, setError, loading } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analyzeSong(title.trim(), artist.trim());
      setCurrentAnalysis(response.data);
      window.history.pushState({}, '', '/result');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass-card p-2 space-y-3 sm:space-y-0 sm:flex sm:gap-2">
        <div className="flex-1 relative">
          <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Song title (e.g., Someone Like You)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 text-sm"
            disabled={loading}
          />
        </div>
        <div className="flex-1 relative">
          <Mic2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Artist name (e.g., Adele)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 text-sm"
            disabled={loading}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !title.trim() || !artist.trim()}
          className="btn-primary flex items-center justify-center gap-2 min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span className="text-sm">Analyze</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
};

export default SearchBar;
`,

        [path.join(COMPONENTS, 'LandingPage.jsx')]: `import { motion } from 'framer-motion';
import { Sparkles, Brain, Music, Zap } from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import { useApp } from '../context/AppContext.jsx';

const LandingPage = () => {
  const { error } = useApp();

  const features = [
    { icon: <Music className="w-6 h-6" />, title: 'Lyrics Intelligence', desc: 'Fetch complete lyrics from Genius API with metadata and album art.' },
    { icon: <Brain className="w-6 h-6" />, title: 'AI Analysis', desc: 'Powered by NVIDIA NIM for deep thematic and emotional understanding.' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Theme Extraction', desc: 'Automatically identifies themes, emotions, mood, and genre vibes.' },
    { icon: <Zap className="w-6 h-6" />, title: 'Instant Results', desc: 'Get comprehensive song analysis in seconds with beautiful visuals.' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center section-padding pt-24 pb-12">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Music Understanding</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          Understand the <span className="gradient-text">Soul</span><br />of Every Song
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-white/60 max-w-2xl mx-auto mb-10"
        >
          Enter any song and artist to unlock deep AI analysis — themes, emotions, meaning, and cultural context powered by NVIDIA NIM.
        </motion.p>

        <SearchBar />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-2xl mx-auto"
          >
            {error}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full mt-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            className="glass-card p-6 hover:border-accent-red/30 group cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-red/20 to-accent-orange/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-accent-red">
              {feature.icon}
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-center text-white/30 text-sm"
      >
        <p>Powered by Genius API + NVIDIA NIM + MERN Stack</p>
      </motion.div>
    </div>
  );
};

export default LandingPage;
`,

            [path.join(COMPONENTS, 'TypewriterText.jsx')]: `import { useState, useEffect } from 'react';

const TypewriterText = ({ text, speed = 30, className = '' }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!text) return;
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && <span className="animate-pulse text-accent-red">|</span>}
    </span>
  );
};

export default TypewriterText;
`,

                [path.join(COMPONENTS, 'EmotionMeter.jsx')]: `import { motion } from 'framer-motion';
import { Heart, Frown, Smile, Meh, Zap } from 'lucide-react';

const EmotionMeter = ({ emotion, score }) => {
  const getConfig = (emotion) => {
    const configs = {
      sadness: { icon: <Frown className="w-5 h-5" />, color: 'from-blue-500 to-blue-700', label: 'Melancholic' },
      melancholy: { icon: <Frown className="w-5 h-5" />, color: 'from-blue-400 to-indigo-600', label: 'Melancholic' },
      joy: { icon: <Smile className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500', label: 'Joyful' },
      joyful: { icon: <Smile className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500', label: 'Joyful' },
      happy: { icon: <Smile className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500', label: 'Happy' },
      angry: { icon: <Zap className="w-5 h-5" />, color: 'from-red-500 to-red-700', label: 'Intense' },
      anger: { icon: <Zap className="w-5 h-5" />, color: 'from-red-500 to-red-700', label: 'Intense' },
      love: { icon: <Heart className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', label: 'Romantic' },
      romantic: { icon: <Heart className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', label: 'Romantic' },
      hopeful: { icon: <Smile className="w-5 h-5" />, color: 'from-green-400 to-emerald-600', label: 'Hopeful' },
      nostalgia: { icon: <Meh className="w-5 h-5" />, color: 'from-purple-400 to-violet-600', label: 'Nostalgic' },
      default: { icon: <Meh className="w-5 h-5" />, color: 'from-accent-red to-accent-orange', label: emotion || 'Neutral' },
    };
    return configs[emotion?.toLowerCase()] || configs.default;
  };

  const config = getConfig(emotion);
  const percentage = Math.min(Math.max(score || 50, 0), 100);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          {config.icon}
          Emotional Tone
        </h3>
        <span className="text-sm text-white/50 capitalize">{emotion || 'Unknown'}</span>
      </div>
      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: \\`\\${ percentage }%\\` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={\\`absolute inset - y - 0 left - 0 rounded - full bg - gradient - to - r \\${ config.color } \\`}
        />
      </div>
      <div className="flex justify-between text-xs text-white/40">
        <span>Subtle</span>
        <span className="text-white/60 font-medium">{config.label}</span>
        <span>Intense</span>
      </div>
    </div>
  );
};

export default EmotionMeter;
`,

    [path.join(COMPONENTS, 'ThemeBadges.jsx')]: `import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

const ThemeBadges = ({ themes }) => {
  if (!themes || themes.length === 0) return null;

  const colors = [
    'from-accent-red/20 to-accent-orange/20 border-accent-red/30 text-accent-red',
    'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
    'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
    'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-accent-orange" />
        Themes
      </h3>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme, index) => (
          <motion.span
            key={theme}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={\\`px - 4 py - 2 rounded - lg text - sm font - medium border bg - gradient - to - r \\${ colors[index % colors.length] } capitalize\\`}
          >
            {theme}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

export default ThemeBadges;
`,

    [path.join(COMPONENTS, 'LyricsDisplay.jsx')]: `import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

const LyricsDisplay = ({ lyrics, title, artist }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = lyrics?.split('\\n') || [];
  const displayLines = expanded ? lines : lines.slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-gold" />
          Lyrics
        </h3>
        <span className="text-xs text-white/40">{lines.length} lines</span>
      </div>

      <div className="space-y-1 font-mono text-sm leading-relaxed text-white/70">
        {displayLines.map((line, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className={\\`\\${ line.trim() === '' ? 'h-4' : '' } \\${ line.startsWith('[') ? 'text-accent-orange/60 italic' : '' } \\`}
          >
            {line || '\\u00A0'}
          </motion.p>
        ))}
      </div>

      {lines.length > 12 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-2 text-sm text-accent-red hover:text-accent-orange transition-colors mx-auto"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" /><span>Show Less</span></>
          ) : (
            <><ChevronDown className="w-4 h-4" /><span>Show All Lyrics</span></>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default LyricsDisplay;
`,

    [path.join(COMPONENTS, 'AnalysisCard.jsx')]: `import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, KeyRound, Guitar } from 'lucide-react';
import TypewriterText from './TypewriterText.jsx';

const AnalysisCard = ({ icon: Icon, title, content, type = 'default', delay = 0 }) => {
  const gradients = {
    summary: 'from-accent-red/10 to-accent-orange/5 border-accent-red/20',
    origin: 'from-accent-gold/10 to-accent-warm/5 border-accent-gold/20',
    keywords: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20',
    mood: 'from-purple-500/10 to-violet-500/5 border-purple-500/20',
    default: 'from-white/5 to-white/2 border-white/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={\\`glass - card p - 6 bg - gradient - to - br \\${ gradients[type] || gradients.default } \\`}
    >
      <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-white/60" />
        {title}
      </h3>
      <div className="text-sm text-white/70 leading-relaxed">
        <TypewriterText text={content} speed={20} />
      </div>
    </motion.div>
  );
};

const AnalysisGrid = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnalysisCard icon={BookOpen} title="AI Summary" content={analysis.summary} type="summary" delay={0.1} />
      <AnalysisCard icon={Lightbulb} title="Origin & Context" content={analysis.origin} type="origin" delay={0.2} />
      <AnalysisCard icon={KeyRound} title="Keywords" content={analysis.keywords?.join(', ') || 'No keywords available'} type="keywords" delay={0.3} />
      <AnalysisCard icon={Guitar} title="Genre Vibe" content={\\`\\${ analysis.mood || 'Unknown mood' } \\u2022 \\${ analysis.genreVibe || 'Unknown genre' } \\`} type="mood" delay={0.4} />
    </div>
  );
};

export default AnalysisGrid;
`,

    [path.join(COMPONENTS, 'ResultPage.jsx')]: `import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Clock, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import LyricsDisplay from './LyricsDisplay.jsx';
import EmotionMeter from './EmotionMeter.jsx';
import ThemeBadges from './ThemeBadges.jsx';
import AnalysisGrid from './AnalysisCard.jsx';

const ResultPage = () => {
  const { currentAnalysis, loading } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentAnalysis && !loading) {
      navigate('/');
    }
  }, [currentAnalysis, loading, navigate]);

  if (!currentAnalysis) return null;

  const data = currentAnalysis;
  const isCached = currentAnalysis.cached;

  return (
    <div className="min-h-screen section-padding pt-24 pb-12 max-w-7xl mx-auto">
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm">Back to Search</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-6 mb-8 items-start"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative group"
        >
          <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shadow-accent-red/20">
            {data.albumArt ? (
              <img
                src={data.albumArt}
                alt={\\`\\${ data.title } album art\\`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-himalaya-700 to-himalaya-600 flex items-center justify-center">
                <span className="text-4xl">&#127925;</span>
              </div>
            )}
          </div>
          <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 group-hover:ring-accent-red/30 transition-all" />
        </motion.div>

        <div className="flex-1 pt-2">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              {data.title}
            </h1>
            {isCached && (
              <span className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-xs font-medium">
                Cached
              </span>
            )}
          </div>
          <p className="text-xl text-white/60 mb-4">{data.artist}</p>
          
          <div className="flex flex-wrap gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Analyzed {new Date(data.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {data.searchCount} searches
            </span>
            {data.geniusUrl && (
              <a
                href={data.geniusUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-accent-red hover:text-accent-orange transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View on Genius
              </a>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AnalysisGrid analysis={data} />
          <LyricsDisplay lyrics={data.lyrics} title={data.title} artist={data.artist} />
        </div>

        <div className="space-y-6">
          <EmotionMeter emotion={data.emotion} score={data.emotionScore} />
          <ThemeBadges themes={data.themes} />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h3 className="font-display font-semibold text-lg mb-4">Song Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Word Count</span>
                <span className="text-white font-medium">{data.lyrics?.split(/\\s+/).length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Line Count</span>
                <span className="text-white font-medium">{data.lyrics?.split('\\n').length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Themes</span>
                <span className="text-white font-medium">{data.themes?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Keywords</span>
                <span className="text-white font-medium">{data.keywords?.length || 0}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
`,
};

// Write all files
Object.entries(files).forEach(([filePath, content]) => {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created: ${path.relative(ROOT, filePath)}`);
});

console.log('\\n🎉 All files created successfully!');
console.log('\\n📋 Next steps:');
console.log('   1. cd backend && npm install');
console.log('   2. cp .env.example .env  (then add your API keys)');
console.log('   3. cd ../frontend && npm install');
console.log('   4. cd backend && npm run dev');
console.log('   5. cd frontend && npm run dev');