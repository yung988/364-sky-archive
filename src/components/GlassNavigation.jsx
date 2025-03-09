import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, ChevronLeft, ChevronRight, Volume2, VolumeX, Info, Menu, X, Globe } from 'lucide-react';
import { cn } from '../lib/utils';

export function GlassNavigation({
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onLanguageToggle,
  onSoundToggle,
  onInfo,
  onSeasonChange,
  currentDay = 1,
  totalDays = 364,
  className,
}) {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(false);
  const [language, setLanguage] = useState('cs');
  const [activeSeason, setActiveSeason] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data
  const seasons = [
    { id: 1, name: 'Jaro', days: { start: 1, end: 91 } },
    { id: 2, name: 'Léto', days: { start: 92, end: 183 } },
    { id: 3, name: 'Podzim', days: { start: 184, end: 274 } },
    { id: 4, name: 'Zima', days: { start: 275, end: 364 } },
  ];

  // Check if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Update active season based on current day
  useEffect(() => {
    const newSeason = seasons.find(
      season => currentDay >= season.days.start && currentDay <= season.days.end
    );
    
    if (newSeason && newSeason.id !== activeSeason) {
      setActiveSeason(newSeason.id);
    }
  }, [currentDay, seasons, activeSeason]);

  // Handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.();
    }
  };

  const handleSoundToggle = () => {
    setIsSoundOn(!isSoundOn);
    onSoundToggle?.();
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'cs' ? 'en' : 'cs');
    onLanguageToggle?.();
  };

  const handleSeasonChange = (seasonId) => {
    setActiveSeason(seasonId);
    onSeasonChange?.(seasonId);
  };

  // Calculate progress
  const progress = (currentDay / totalDays) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "glass-navigation fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-3xl rounded-full backdrop-blur-md bg-black/30 border border-white/10 shadow-lg overflow-hidden",
        className
      )}
    >
      {isMobile && (
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="absolute top-3 right-3 md:hidden z-50 text-white/80 hover:text-white"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      )}

      <div className={cn(
        "flex flex-col md:flex-row items-center justify-between p-3 md:p-4 gap-2",
        isMobile && !isMenuOpen && "items-center justify-center"
      )}>
        {/* Main controls - always visible */}
        <div className="flex items-center justify-center gap-2 w-full md:w-auto">
          <button 
            onClick={handlePlayPause}
            className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          
          <button 
            onClick={onPrevious}
            className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-white/90 font-medium text-sm px-2">
            Den {currentDay} / {totalDays}
          </div>
          
          <button 
            onClick={onNext}
            className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/80 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Secondary controls - hidden on mobile unless menu is open */}
        {(!isMobile || isMenuOpen) && (
          <div className="flex items-center justify-center gap-2 w-full md:w-auto">
            {/* Season buttons */}
            <div className="flex gap-1">
              {seasons.map(season => (
                <button
                  key={season.id}
                  onClick={() => handleSeasonChange(season.id)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    activeSeason === season.id 
                      ? "bg-white/20 text-white" 
                      : "bg-transparent text-white/60 hover:text-white/80"
                  )}
                >
                  {season.name}
                </button>
              ))}
            </div>
            
            {/* Language toggle */}
            {onLanguageToggle && (
              <button 
                onClick={handleLanguageToggle}
                className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
                aria-label="Toggle language"
              >
                <Globe size={18} />
              </button>
            )}
            
            {/* Sound toggle */}
            <button 
              onClick={handleSoundToggle}
              className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
              aria-label={isSoundOn ? "Mute" : "Unmute"}
            >
              {isSoundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            
            {/* Info button */}
            <button 
              onClick={onInfo}
              className="bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
              aria-label="Information"
            >
              <Info size={18} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
} 