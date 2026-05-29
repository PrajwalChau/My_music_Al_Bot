import { Link, useLocation } from 'react-router-dom';
import { Music, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5 mx-4 mt-4"
    >
      <div className="section-padding max-w-7xl mx-auto flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center group-hover:scale-110 transition-transform">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl hidden sm:block">
            <span className="gradient-text">Music</span> Intelligence
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/">
            <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
    location.pathname === '/'
        ? 'bg-accent-red/20 text-accent-red'
        : 'text-white/60 hover:text-white hover:bg-white/5'
}`}>
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Analyze</span>
              </span>
            </button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
