import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

const PlayButton = ({ audioUrl }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleEnded = () => setPlaying(false);

  if (!audioUrl) {
    return (
      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-not-allowed opacity-40">
          <Play className="w-6 h-6 text-white/40 ml-0.5" />
        </div>
        <span className="text-xs text-white/30">Preview unavailable</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      <button
        onClick={toggle}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-red to-accent-orange flex items-center justify-center shadow-lg shadow-accent-red/30 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label={playing ? 'Pause preview' : 'Play preview'}
      >
        {playing ? (
          <Pause className="w-6 h-6 text-white" />
        ) : (
          <Play className="w-6 h-6 text-white ml-0.5" />
        )}
      </button>
      <span className="text-xs text-white/40">30s Preview</span>
      <audio ref={audioRef} src={audioUrl} onEnded={handleEnded} preload="none" />
    </div>
  );
};

export default PlayButton;
