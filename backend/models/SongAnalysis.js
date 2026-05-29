import mongoose from 'mongoose';

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
