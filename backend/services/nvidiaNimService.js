import OpenAI from 'openai';

class NvidiaNimService {
  constructor() {
    this.client = null;
    this.model = process.env.NVIDIA_NIM_MODEL || 'meta/llama-3.1-70b-instruct';
  }

  getClient() {
    if (!this.client) {
      this.client = new OpenAI({
        baseURL: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.NVIDIA_NIM_API_KEY || 'dummy_key',
      });
    }
    return this.client;
  }

  async analyzeLyrics(lyrics, title, artist) {
    const systemPrompt = `You are an expert music analyst. Analyze the provided song lyrics and return a structured JSON response with:
        - themes: array of 3-5 main themes
- emotion: primary emotional tone (single word)
- emotionScore: number 0 - 100
    - summary: 2 - 3 sentence analysis
        - origin: brief context / background
            - keywords: array of 5 - 8 keywords
                - mood: overall mood descriptor
                    - genreVibe: inferred genre

Return ONLY valid JSON. No markdown, no explanations.`;

    const userPrompt = `Analyze the song "${title}" by ${artist}.

Lyrics:
${lyrics.substring(0, 4000)}

Provide your analysis as JSON.`;

    try {
      const response = await this.getClient().chat.completions.create({
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
