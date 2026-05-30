import { motion } from 'framer-motion';
import { Sparkles, Brain, Music, Zap } from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import logo from '../assets/logo.png';

const LandingPage = () => {
  const { error } = useApp();

  const features = [
    { icon: <Music className="w-6 h-6" />, title: 'Lyrics Intelligence', desc: 'Fetch lyrics from YouTube auto-captions with thumbnails and metadata.' },
    { icon: <Brain className="w-6 h-6" />, title: 'AI Analysis', desc: 'Powered by NVIDIA NIM for deep thematic and emotional understanding.' },
    { icon: <Sparkles className="w-6 h-6" />, title: 'Theme Extraction', desc: 'Automatically identifies themes, emotions, mood, and genre vibes.' },
    { icon: <Zap className="w-6 h-6" />, title: 'Instant Results', desc: 'Get comprehensive song analysis in seconds with beautiful visuals.' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center section-padding pt-24 pb-12">
      <div className="text-center max-w-4xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 flex flex-col items-center"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.2 }}
            className="w-24 h-24 mb-6 rounded-3xl overflow-hidden shadow-2xl shadow-accent-red/20 border border-white/10 p-1 bg-white/5"
          >
            <img src={logo} alt="Music Intelligence Logo" className="w-full h-full object-cover rounded-2xl" />
          </motion.div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Music Understanding</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight"
        >
          Understand the <span className="gradient-text">Soul</span><br />of Every Song
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-white/60 max-w-2xl mx-auto mb-10"
        >
          Enter any song and artist to unlock deep AI analysis — themes, emotions, meaning, and cultural context powered by NVIDIA NIM and Created by Prajwal..
        </motion.p>

        <SearchBar />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-2xl mx-auto"
          >
            {error}
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto w-full mt-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
            className="glass-card p-6 hover:border-accent-red/30 group cursor-default"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-red/20 to-accent-orange/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-accent-red">
              {feature.icon}
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 text-center text-white/30 text-sm"
      >
        <p>Powered by YouTube Data API + NVIDIA NIM + MERN Stack by Prajwal</p>
      </motion.div>
    </div>
  );
};

export default LandingPage;
