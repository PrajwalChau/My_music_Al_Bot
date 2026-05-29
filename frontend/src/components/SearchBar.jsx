import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Music, Mic2, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { analyzeSong } from '../services/api.js';

const SearchBar = () => {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const { setCurrentAnalysis, setLoading, setError, loading } = useApp();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analyzeSong(title.trim(), artist.trim());
      setCurrentAnalysis(response.data);
      window.history.pushState({}, '', '/result');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      onSubmit={handleSubmit}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="glass-card p-2 space-y-3 sm:space-y-0 sm:flex sm:gap-2">
        <div className="flex-1 relative">
          <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Song title (e.g., Someone Like You)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 text-sm"
            disabled={loading}
          />
        </div>
        <div className="flex-1 relative">
          <Mic2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Artist name (e.g., Adele)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="glass-input w-full pl-11 pr-4 py-3 text-sm"
            disabled={loading}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading || !title.trim() || !artist.trim()}
          className="btn-primary flex items-center justify-center gap-2 min-w-[120px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span className="text-sm">Analyze</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
};

export default SearchBar;
