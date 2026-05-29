import mongoose from 'mongoose';
import SongAnalysis from '../models/SongAnalysis.js';
import geniusService from '../services/geniusService.js';
import nvidiaNimService from '../services/nvidiaNimService.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const analyzeSong = async (req, res, next) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'Song title and artist name are required' });
    }

    // Check Cache (MongoDB)
    if (isDbConnected()) {
      try {
        const existingAnalysis = await SongAnalysis.findOne({
          title: { $regex: new RegExp(`^${title}$`, 'i') },
          artist: { $regex: new RegExp(`^${artist}$`, 'i') },
        });

        if (existingAnalysis) {
          existingAnalysis.searchCount += 1;
          await existingAnalysis.save();
          return res.status(200).json({ success: true, data: existingAnalysis, cached: true, message: 'Analysis retrieved from cache' });
        }
      } catch (err) {
        console.warn('⚠️ Cache query failed, falling back to live fetch:', err.message);
      }
    }

    // Fetch and Analyze
    const geniusData = await geniusService.searchSong(title, artist);
    if (!geniusData.lyrics) {
      return res.status(404).json({ success: false, message: 'Lyrics not found for this song' });
    }

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

    // Save to Cache (MongoDB)
    if (isDbConnected()) {
      try {
        const songAnalysis = new SongAnalysis(songData);
        await songAnalysis.save();
      } catch (err) {
        console.warn('⚠️ Failed to save to cache:', err.message);
      }
    }

    res.status(201).json({ success: true, data: songData, cached: false, message: 'Song analyzed successfully' });
  } catch (error) {
    next(error);
  }
};

export const getAnalysisHistory = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 1 }, message: 'Database offline' });
    }
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const analyses = await SongAnalysis.find().sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
    const total = await SongAnalysis.countDocuments();
    res.status(200).json({ success: true, data: analyses, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) { next(error); }
};

export const getAnalysisById = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(404).json({ success: false, message: 'Database offline' });
    }
    const analysis = await SongAnalysis.findById(req.params.id);
    if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found' });
    res.status(200).json({ success: true, data: analysis });
  } catch (error) { next(error); }
};

export const getTrendingSearches = async (req, res, next) => {
  try {
    if (!isDbConnected()) {
      return res.status(200).json({ success: true, data: [], message: 'Database offline' });
    }
    const trending = await SongAnalysis.find().sort({ searchCount: -1, createdAt: -1 }).limit(10);
    res.status(200).json({ success: true, data: trending });
  } catch (error) { next(error); }
};

