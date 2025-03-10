"use client"

import React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Globe,
  Volume2,
  VolumeX,
  Info,
  Menu,
  X,
  Sun,
  Leaf,
  Snowflake,
} from "lucide-react"
import { cn } from "../lib/utils"

export function GlassNavigation({
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onLanguageToggle,
  onSoundToggle,
  onToggleViewMode,
  onInfo,
  onSeasonChange,
  currentDay = 1,
  totalDays = 364,
  className,
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [soundOn, setSoundOn] = useState(false)
  const [language, setLanguage] = useState("EN")
  const [activeSeason, setActiveSeason] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Seasons data
  const seasons = [
    {
      id: 1,
      name: "Jaro",
      icon: <Sun className="size-4" />,
      color: "#10b981",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      id: 2,
      name: "Léto",
      icon: <Sun className="size-4" />,
      color: "#f59e0b",
      gradient: "from-amber-500 to-yellow-500",
    },
    {
      id: 3,
      name: "Podzim",
      icon: <Leaf className="size-4" />,
      color: "#ef4444",
      gradient: "from-red-500 to-orange-500",
    },
    {
      id: 4,
      name: "Zima",
      icon: <Snowflake className="size-4" />,
      color: "#3b82f6",
      gradient: "from-blue-500 to-indigo-500",
    },
  ]

  // Days in each season
  const seasonDays = {
    1: { start: 1, end: 91 }, // Jaro
    2: { start: 92, end: 183 }, // Léto
    3: { start: 184, end: 274 }, // Podzim
    4: { start: 275, end: 365 }, // Zima
  }

  // Check if mobile on mount and on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Update active season based on current day
  useEffect(() => {
    for (const [id, range] of Object.entries(seasonDays)) {
      if (currentDay >= range.start && currentDay <= range.end) {
        setActiveSeason(Number.parseInt(id))
        break
      }
    }
  }, [currentDay])

  const handlePlayPause = () => {
    const newState = !isPlaying
    setIsPlaying(newState)
    if (newState) {
      onPlay?.()
    } else {
      onPause?.()
    }
  }

  const handleSoundToggle = () => {
    setSoundOn(!soundOn)
    onSoundToggle?.()
  }

  const handleLanguageToggle = () => {
    setLanguage(language === "EN" ? "CZ" : "EN")
    onLanguageToggle?.()
  }

  const handleSeasonChange = (seasonId) => {
    setActiveSeason(seasonId)
    onSeasonChange?.(seasonId)
  }

  const currentSeason = seasons.find((s) => s.id === activeSeason) || seasons[0]

  return (
    <>
      {/* Mobile menu button */}
      {isMobile && (
        <motion.button
          className="fixed bottom-6 right-6 z-50 flex size-14 items-center justify-center rounded-full bg-white/10 text-white shadow-lg backdrop-blur-xl"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      )}

      {/* Main navigation */}
      <AnimatePresence>
        {(!isMobile || isMenuOpen) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "fixed z-40 flex flex-col gap-4",
              isMobile ? "inset-x-4 bottom-24" : "inset-x-0 bottom-8",
              className,
            )}
          >
            {/* Main control panel */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-xl"
            >
              {/* Progress bar */}
              <div className="relative h-1 w-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full bg-gradient-to-r ${currentSeason.gradient}`}
                  style={{ width: `${(currentDay / totalDays) * 100}%` }}
                />
              </div>

              <div className="flex flex-col p-4">
                {/* Season selector */}
                <div className="mb-4 flex items-center justify-between rounded-xl bg-black/10 p-1">
                  {seasons.map((season) => (
                    <motion.button
                      key={season.id}
                      onClick={() => handleSeasonChange(season.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                        activeSeason === season.id ? "text-white" : "text-white/60 hover:text-white/80",
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {activeSeason === season.id && (
                        <motion.div
                          className={`absolute inset-0 rounded-lg bg-gradient-to-r ${season.gradient}`}
                          layoutId="activeSeasonGlass"
                          transition={{ type: "spring", duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{season.icon}</span>
                      <span className="relative z-10">{season.name}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">
                      DEN {currentDay} / {totalDays}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={handlePlayPause}
                      className={`flex size-10 items-center justify-center rounded-full bg-gradient-to-r ${currentSeason.gradient} text-white shadow-md`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </motion.button>

                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={onPrevious}
                        className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronLeft size={18} />
                      </motion.button>

                      <motion.button
                        onClick={onNext}
                        className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <ChevronRight size={18} />
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onToggleViewMode && (
                      <motion.button
                        onClick={onToggleViewMode}
                        className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="text-xs font-medium">2D</span>
                      </motion.button>
                    )}
                    
                    {onLanguageToggle && (
                      <motion.button
                        onClick={handleLanguageToggle}
                        className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Globe size={16} />
                      </motion.button>
                    )}

                    <motion.button
                      onClick={handleSoundToggle}
                      className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </motion.button>

                    <motion.button
                      onClick={onInfo}
                      className="flex size-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Info size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 