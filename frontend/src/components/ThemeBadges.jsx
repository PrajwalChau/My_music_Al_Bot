import { motion } from 'framer-motion';
import { Tag } from 'lucide-react';

const ThemeBadges = ({ themes }) => {
  if (!themes || themes.length === 0) return null;

  const colors = [
    'from-accent-red/20 to-accent-orange/20 border-accent-red/30 text-accent-red',
    'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
    'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400',
    'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-400',
  ];

  return (
    <div className="glass-card p-6">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2 mb-4">
        <Tag className="w-5 h-5 text-accent-orange" />
        Themes
      </h3>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme, index) => (
          <motion.span
            key={theme}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border bg-gradient-to-r ${colors[index % colors.length]} capitalize`}
          >
            {theme}
          </motion.span>
        ))}
      </div>
    </div>
  );
};

export default ThemeBadges;
