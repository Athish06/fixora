import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '../ui/button';

const VisualizerControls = ({
  currentIndex,
  totalStages,
  isPlaying,
  onPrev,
  onNext,
  onTogglePlay,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalStages - 1;

  return (
    <motion.div
      className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {/* Left: Prev button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onPrev}
        disabled={isFirst}
        className="gap-1.5"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </Button>

      {/* Center: Stage counter + autoplay */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: totalStages }).map((_, i) => (
            <motion.div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'bg-primary w-6'
                  : i < currentIndex
                  ? 'bg-emerald-500 w-1.5'
                  : 'bg-border w-1.5'
              }`}
              animate={{
                width: i === currentIndex ? 24 : 6,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          ))}
        </div>

        <span className="text-xs text-muted-foreground font-medium tabular-nums">
          {currentIndex + 1} / {totalStages}
        </span>

        <Button
          variant="ghost"
          size="sm"
          onClick={onTogglePlay}
          className={`h-7 w-7 p-0 rounded-full ${
            isPlaying ? 'text-primary bg-primary/10' : 'text-muted-foreground'
          }`}
          title={isPlaying ? 'Pause autoplay' : 'Start autoplay'}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </Button>
      </div>

      {/* Right: Next button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onNext}
        disabled={isLast && !isPlaying}
        className="gap-1.5"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </motion.div>
  );
};

export default VisualizerControls;
