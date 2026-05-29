import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, KeyRound, Guitar } from 'lucide-react';
import TypewriterText from './TypewriterText.jsx';

const AnalysisCard = ({ icon: Icon, title, content, type = 'default', delay = 0 }) => {
  const gradients = {
    summary: 'from-accent-red/10 to-accent-orange/5 border-accent-red/20',
    origin: 'from-accent-gold/10 to-accent-warm/5 border-accent-gold/20',
    keywords: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20',
    mood: 'from-purple-500/10 to-violet-500/5 border-purple-500/20',
    default: 'from-white/5 to-white/2 border-white/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`glass-card p-6 bg-gradient-to-br ${gradients[type] || gradients.default}`}
    >
      <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5 text-white/60" />
        {title}
      </h3>
      <div className="text-sm text-white/70 leading-relaxed">
        <TypewriterText text={content} speed={20} />
      </div>
    </motion.div>
  );
};

const AnalysisGrid = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnalysisCard icon={BookOpen} title="AI Summary" content={analysis.summary} type="summary" delay={0.1} />
      <AnalysisCard icon={Lightbulb} title="Origin & Context" content={analysis.origin} type="origin" delay={0.2} />
      <AnalysisCard icon={KeyRound} title="Keywords" content={analysis.keywords?.join(', ') || 'No keywords available'} type="keywords" delay={0.3} />
      <AnalysisCard icon={Guitar} title="Genre Vibe" content={`${analysis.mood || 'Unknown mood'} \u2022 ${analysis.genreVibe || 'Unknown genre'}`} type="mood" delay={0.4} />
    </div>
  );
};

export default AnalysisGrid;
