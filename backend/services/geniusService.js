import { getSong } from 'genius-lyrics-api';
import axios from 'axios';
import * as cheerio from 'cheerio';

class GeniusService {
  getApiKey() {
    return process.env.GENIUS_API_KEY;
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
