import { motion } from 'framer-motion';
import { Heart, Frown, Smile, Meh, Zap } from 'lucide-react';

const EmotionMeter = ({ emotion, score }) => {
  const getConfig = (emotion) => {
    const configs = {
      sadness: { icon: <Frown className="w-5 h-5" />, color: 'from-blue-500 to-blue-700', label: 'Melancholic' },
      melancholy: { icon: <Frown className="w-5 h-5" />, color: 'from-blue-400 to-indigo-600', label: 'Melancholic' },
      joy: { icon: <Smile className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500', label: 'Joyful' },
      joyful: { icon: <Smile className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500', label: 'Joyful' },
      happy: { icon: <Smile className="w-5 h-5" />, color: 'from-yellow-400 to-orange-500', label: 'Happy' },
      angry: { icon: <Zap className="w-5 h-5" />, color: 'from-red-500 to-red-700', label: 'Intense' },
      anger: { icon: <Zap className="w-5 h-5" />, color: 'from-red-500 to-red-700', label: 'Intense' },
      love: { icon: <Heart className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', label: 'Romantic' },
      romantic: { icon: <Heart className="w-5 h-5" />, color: 'from-pink-500 to-rose-600', label: 'Romantic' },
      hopeful: { icon: <Smile className="w-5 h-5" />, color: 'from-green-400 to-emerald-600', label: 'Hopeful' },
      nostalgia: { icon: <Meh className="w-5 h-5" />, color: 'from-purple-400 to-violet-600', label: 'Nostalgic' },
      default: { icon: <Meh className="w-5 h-5" />, color: 'from-accent-red to-accent-orange', label: emotion || 'Neutral' },
    };
    return configs[emotion?.toLowerCase()] || configs.default;
  };

  const config = getConfig(emotion);
  const percentage = Math.min(Math.max(score || 50, 0), 100);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          {config.icon}
          Emotional Tone
        </h3>
        <span className="text-sm text-white/50 capitalize">{emotion || 'Unknown'}</span>
      </div>
      <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${config.color}`}
        />
      </div>
      <div className="flex justify-between text-xs text-white/40">
        <span>Subtle</span>
        <span className="text-white/60 font-medium">{config.label}</span>
        <span>Intense</span>
      </div>
    </div>
  );
};

export default EmotionMeter;
