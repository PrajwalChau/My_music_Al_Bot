import axios from 'axios';
import youtubeService from '../services/youtubeService.js';
import youtubeTranscriptService from '../services/youtubeTranscriptService.js';
import nvidiaNimService from '../services/nvidiaNimService.js';

export const analyzeSong = async (req, res, next) => {
  try {
    const { title, artist } = req.body;
    if (!title || !artist) {
      return res.status(400).json({ success: false, message: 'Song title and artist name are required' });
    }

    // Search YouTube and fetch iTunes preview URL in parallel
    const [ytResult, previewRes] = await Promise.all([
      youtubeService.searchSong(title, artist),
      axios.get('https://itunes.apple.com/search', {
        params: {
          term: `${title} ${artist}`,
          limit: 1,
          media: 'music',
        },
        timeout: 6000,
      }).catch(err => {
        console.warn('⚠️ iTunes preview fetch failed:', err.message);
        return null;
      })
    ]);

    if (!ytResult) {
      return res.status(404).json({ success: false, message: 'Could not find this song on YouTube' });
    }

    const spotifyPreviewUrl = previewRes?.data?.results?.[0]?.previewUrl || null;

    // Fetch auto-captions as lyrics
    const lyrics = await youtubeTranscriptService.getTranscript(ytResult.videoId);

    // Analyze lyrics (or just title/artist if transcript unavailable) using AI
    const analysisText = lyrics || `[No lyrics available — analyze based on song title and artist]\nTitle: ${title}\nArtist: ${artist}`;
    const analysis = await nvidiaNimService.analyzeLyrics(analysisText, title, artist);

    const songData = {
      title: title,
      artist: artist,
      albumArt: ytResult.thumbnail,
      lyrics: lyrics || '',
      youtubeId: ytResult.videoId,
      youtubeUrl: ytResult.watchUrl,
      thumbnail: ytResult.thumbnail,
      spotifyPreviewUrl: spotifyPreviewUrl,
      themes: analysis.themes,
      emotion: analysis.emotion,
      emotionScore: analysis.emotionScore,
      summary: analysis.summary,
      origin: analysis.origin,
      keywords: analysis.keywords,
      mood: analysis.mood,
      genreVibe: analysis.genreVibe,
      searchCount: 1,
      createdAt: new Date().toISOString(),
    };

    res.status(200).json({
      success: true,
      data: songData,
      cached: false,
      message: lyrics
        ? 'Song analyzed successfully (Live)'
        : 'Song analyzed (no captions available — analysis based on title/artist)',
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
