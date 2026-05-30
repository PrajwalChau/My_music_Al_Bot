import axios from 'axios';

class YouTubeService {
  getApiKey() {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) {
      throw new Error('YOUTUBE_API_KEY is not defined in environment variables');
    }
    return key;
  }

  /**
   * Search YouTube for a music video matching the given title and artist.
   * Uses YouTube Data API v3 with videoCategoryId=10 (Music).
   *
   * @param {string} title - Song title
   * @param {string} artist - Artist name
   * @returns {{ videoId: string, title: string, thumbnail: string, embedUrl: string, watchUrl: string }}
   */
  async searchSong(title, artist) {
    const apiKey = this.getApiKey();
    const query = `${title} ${artist}`;

    try {
      console.log(`🔍 Searching YouTube for: ${query}`);

      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          videoCategoryId: '10', // Music
          maxResults: 1,
          key: apiKey,
        },
        timeout: 10000,
      });

      const items = response.data?.items;
      if (!items || items.length === 0) {
        console.warn('⚠️ No YouTube results found for:', query);
        return null;
      }

      const item = items[0];
      const videoId = item.id.videoId;
      const snippet = item.snippet;

      console.log(`✅ YouTube match: "${snippet.title}" (${videoId})`);

      return {
        videoId,
        title: snippet.title,
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      console.error('❌ YouTube search failed:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }
}

export default new YouTubeService();
