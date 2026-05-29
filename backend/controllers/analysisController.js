import geniusService from '../services/geniusService.js';
import nvidiaNimService from '../services/nvidiaNimService.js';

export const analyzeSong = async (req, res, next) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'Song title and artist name are required' });
    }

    // Fetch lyrics and metadata
    const geniusData = await geniusService.searchSong(title, artist);
    if (!geniusData.lyrics) {
      return res.status(404).json({ success: false, message: 'Lyrics not found for this song' });
    }

    // Analyze lyrics using AI
    const analysis = await nvidiaNimService.analyzeLyrics(geniusData.lyrics, geniusData.title, artist);

    const songData = {
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
      createdAt: new Date().toISOString(),
    };

    res.status(200).json({ 
      success: true, 
      data: songData, 
      cached: false, 
      message: 'Song analyzed successfully (Live)' 
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalysisHistory = async (req, res, next) => {
  res.status(200).json({ success: true, data: [], message: 'History persistence is disabled' });
};

export const getAnalysisById = async (req, res, next) => {
  res.status(404).json({ success: false, message: 'Database is disabled' });
};

export const getTrendingSearches = async (req, res, next) => {
  res.status(200).json({ success: true, data: [], message: 'Trending is disabled' });
};

