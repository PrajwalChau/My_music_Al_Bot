import { getSong, searchSong } from 'genius-lyrics-api';
import axios from 'axios';
import * as cheerio from 'cheerio';

class GeniusService {
  getApiKey() {
    return process.env.GENIUS_API_KEY;
  }

  // Fetch lyrics from LRCLIB
  async fetchFromLrclib(title, artist) {
    try {
      console.log(`🔍 Attempting LRCLIB fallback for: ${title} - ${artist}`);
      const response = await axios.get('https://lrclib.net/api/get', {
        params: {
          artist_name: artist,
          track_name: title,
        },
        headers: {
          'User-Agent': 'MusicIntelligenceBot/1.0 (https://github.com/PrajwalChau/My_music_Al_Bot)'
        },
        timeout: 8000,
      });

      if (response.data && response.data.plainLyrics) {
        console.log('✅ Successfully retrieved lyrics from LRCLIB');
        return {
          lyrics: response.data.plainLyrics,
          title: response.data.trackName || title,
          artist: response.data.artistName || artist,
        };
      }
    } catch (err) {
      console.warn('⚠️ LRCLIB fetch failed:', err.message);
    }
    return null;
  }

  // Fetch lyrics from Lyrics.ovh
  async fetchFromLyricsOvh(title, artist) {
    try {
      console.log(`🔍 Attempting Lyrics.ovh fallback for: ${title} - ${artist}`);
      const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
      const response = await axios.get(url, { timeout: 8000 });
      if (response.data && response.data.lyrics) {
        console.log('✅ Successfully retrieved lyrics from Lyrics.ovh');
        return response.data.lyrics.trim();
      }
    } catch (err) {
      console.warn('⚠️ Lyrics.ovh fetch failed:', err.message);
    }
    return null;
  }

  async searchSong(title, artist) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('GENIUS_API_KEY is not defined in environment variables');
    }

    const options = {
      apiKey: apiKey,
      title: title,
      artist: artist,
      optimizeQuery: true,
      authHeader: true,
    };

    // 1. Try using the library's getSong (which scrapes Genius)
    // This works perfectly locally and retrieves full metadata + high quality formatted lyrics.
    try {
      console.log(`🔍 Querying Genius (getSong) for: ${title} - ${artist}`);
      const song = await getSong(options);
      if (song && song.lyrics) {
        console.log('✅ Successfully retrieved song & lyrics from Genius (Local Scraper)');
        return {
          id: song.id,
          title: song.title,
          artist: artist,
          url: song.url,
          albumArt: song.albumArt,
          lyrics: song.lyrics,
        };
      }
    } catch (err) {
      console.warn('⚠️ Genius getSong failed (scraping blocked or network error):', err.message);
    }

    // 2. Fallback for Production/Vercel (where scraping gets blocked by Cloudflare)
    console.log('🔄 Falling back to standard API search and external lyric databases...');
    
    let geniusResult = null;
    try {
      // Use searchSong (standard API call, doesn't scrape, won't get blocked by Cloudflare)
      const results = await searchSong(options);
      if (results && results.length > 0) {
        geniusResult = results[0];
        console.log(`✅ Genius metadata found: "${geniusResult.title}" (URL: ${geniusResult.url})`);
      }
    } catch (err) {
      console.warn('⚠️ Genius API search failed:', err.message);
    }

    let lyrics = null;

    // Try LRCLIB fallback
    const lrclibData = await this.fetchFromLrclib(title, artist);
    if (lrclibData) {
      lyrics = lrclibData.lyrics;
      if (!geniusResult) {
        geniusResult = {
          id: `lrclib-${Date.now()}`,
          title: lrclibData.title,
          artist: lrclibData.artist,
          albumArt: null,
          url: '',
        };
      }
    }

    // Try Lyrics.ovh fallback
    if (!lyrics) {
      lyrics = await this.fetchFromLyricsOvh(title, artist);
      if (lyrics && !geniusResult) {
        geniusResult = {
          id: `lyricsovh-${Date.now()}`,
          title: title,
          artist: artist,
          albumArt: null,
          url: '',
        };
      }
    }

    if (geniusResult && lyrics) {
      return {
        id: geniusResult.id,
        title: geniusResult.title,
        artist: geniusResult.artist || artist,
        url: geniusResult.url || '',
        albumArt: geniusResult.albumArt || null,
        lyrics: lyrics,
      };
    }

    throw new Error('Could not find or retrieve lyrics for this song');
  }

  async scrapeLyrics(url) {
    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        timeout: 10000,
      });
      const $ = cheerio.load(response.data);
      const selectors = ['[data-lyrics-container="true"]', '.lyrics', '[class*="Lyrics__Container"]', '.song_body-lyrics'];
      let lyrics = '';
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, el) => { lyrics += $(el).text() + '\n'; });
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

