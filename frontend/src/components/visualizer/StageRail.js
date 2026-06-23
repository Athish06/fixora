import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, ChevronRight, Package, GitBranch, Brain, Cpu, BarChart3 } from 'lucide-react';

const STAGE_ICONS = {
  discovery: Package,
  ast_walk: GitBranch,
  llm_phase1: Brain,
  llm_phase2: Cpu,
  scan_comparison: BarChart3,
};

const StageRail = ({ stages, currentIndex, onStageClick }) => {
  return (
    <div className="relative w-full overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max px-1">
        {stages.map((stage, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const IconComponent = STAGE_ICONS[stage.id] || Circle;

          return (
            <React.Fragment key={stage.id}>
              {index > 0 && (
                <div className="flex items-center px-1">
                  <motion.div
                    className={`h-0.5 w-6 rounded-full transition-colors duration-300 ${
                      isCompleted ? 'bg-emerald-500' : isActive ? 'bg-primary/50' : 'bg-border'
                    }`}
                    initial={false}
                    animate={{ 
                      scaleX: isCompleted ? 1 : 0.5,
                      opacity: isCompleted ? 1 : 0.5 
                    }}
                    transition={{ duration: 0.3 }}
                  />
                  <ChevronRight className={`w-3 h-3 ${
                    isCompleted ? 'text-emerald-500' : 'text-muted-foreground/40'
                  }`} />
                </div>
              )}
              <motion.button
                onClick={() => onStageClick(index)}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-primary/10 border-primary/50 text-primary shadow-sm shadow-primary/10'
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isCompleted ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                ) : isActive ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </motion.div>
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                )}
                <span>{stage.title}</span>

                {/* Active indicator bar */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-primary"
                    layoutId="activeStageIndicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StageRail;
