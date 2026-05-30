import { YoutubeTranscript } from 'youtube-transcript';

class YouTubeTranscriptService {
  /**
   * Fetch auto-generated captions for a YouTube video.
   *
   * @param {string} videoId - YouTube video ID
   * @returns {string} Transcript text (newline-separated) or empty string if unavailable
   */
  async getTranscript(videoId) {
    if (!videoId) {
      console.warn('⚠️ No videoId provided for transcript fetch');
      return '';
    }

    try {
      console.log(`📝 Fetching transcript for video: ${videoId}`);

      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      if (!transcriptItems || transcriptItems.length === 0) {
        console.warn('⚠️ No transcript segments found for:', videoId);
        return '';
      }

      const text = transcriptItems
        .map((item) => item.text)
        .join('\n');

      console.log(`✅ Transcript fetched: ${transcriptItems.length} segments, ${text.length} chars`);
      return text;
    } catch (error) {
      console.warn('⚠️ Transcript unavailable for', videoId, ':', error.message);
      return '';
    }
  }
}

export default new YouTubeTranscriptService();
