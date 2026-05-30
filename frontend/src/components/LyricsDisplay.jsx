import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';

const LyricsDisplay = ({ lyrics, title, artist }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = lyrics?.split('\n') || [];
  const displayLines = expanded ? lines : lines.slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-accent-gold" />
          Lyrics (from YouTube CC)
        </h3>
        <span className="text-xs text-white/40">{lines.length} lines</span>
      </div>

      <div className="space-y-1 font-mono text-sm leading-relaxed text-white/70">
        {displayLines.map((line, index) => (
          <motion.p
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            className={`${line.trim() === '' ? 'h-4' : ''} ${line.startsWith('[') ? 'text-accent-orange/60 italic' : ''}`}
          >
            {line || '\u00A0'}
          </motion.p>
        ))}
      </div>

      {lines.length > 12 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-2 text-sm text-accent-red hover:text-accent-orange transition-colors mx-auto"
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4" /><span>Show Less</span></>
          ) : (
            <><ChevronDown className="w-4 h-4" /><span>Show All Lyrics</span></>
          )}
        </button>
      )}
    </motion.div>
  );
};

export default LyricsDisplay;
