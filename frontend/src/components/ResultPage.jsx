import { useEffect } from 'react';
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
                alt={`${data.title} album art`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-himalaya-700 to-himalaya-600 flex items-center justify-center">
                <span className="text-4xl">🎵</span>
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
                <span className="text-white font-medium">{data.lyrics?.split(/\s+/).length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Line Count</span>
                <span className="text-white font-medium">{data.lyrics?.split('\n').length || 0}</span>
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
