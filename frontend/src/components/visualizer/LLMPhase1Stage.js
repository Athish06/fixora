import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, AlertOctagon, ClipboardList } from 'lucide-react';

const LLMPhase1Stage = ({ data }) => {
  const sinkReasons = data?.sink_reasons || {};

  const langEntries = useMemo(() => Object.entries(data?.sink_modules || {}), [data?.sink_modules]);
  const allSinks = useMemo(
    () => langEntries.flatMap(([, mods]) => mods),
    [langEntries]
  );

  return (
    <div className="space-y-6">
      {/* AI Processing animation */}
      <motion.div
        className="flex items-center justify-center gap-6 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Module list input */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <div className="w-16 h-16 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
            <ClipboardList className="w-7 h-7 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">Module List</span>
        </motion.div>

        {/* Animated arrow */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <motion.div
            className="h-0.5 w-12 bg-gradient-to-r from-muted-foreground/30 to-primary/60 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <ArrowRight className="w-4 h-4 text-primary" />
        </motion.div>

        {/* AI Brain */}
        <motion.div
          className="relative"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
        >
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10"
            animate={{
              boxShadow: [
                '0 0 15px rgba(139, 92, 246, 0.1)',
                '0 0 30px rgba(139, 92, 246, 0.2)',
                '0 0 15px rgba(139, 92, 246, 0.1)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1.2, type: 'spring' }}
          >
            <span className="text-[8px] text-white font-bold">AI</span>
          </motion.div>
        </motion.div>

        {/* Animated arrow */}
        <motion.div
          className="flex items-center gap-1"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <ArrowRight className="w-4 h-4 text-red-400" />
          <motion.div
            className="h-0.5 w-12 bg-gradient-to-r from-red-500/60 to-red-500/20 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>

        {/* Sink modules output */}
        <motion.div
          className="flex flex-col items-center gap-2"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 1.0, type: 'spring' }}
        >
          <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertOctagon className="w-7 h-7 text-red-400" />
          </div>
          <span className="text-[10px] text-muted-foreground">Sink Modules</span>
        </motion.div>
      </motion.div>

      {/* Sink modules per language */}
      {langEntries.map(([lang, mods], langIndex) => {
        const langLabel = lang === 'python' ? 'Python' : 'JavaScript';
        const reason = sinkReasons[lang] || '';

        return (
          <motion.div
            key={lang}
            className="bg-card border border-border/50 rounded-xl p-4 space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + langIndex * 0.2 }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>{langLabel}</span>
              <span className="text-muted-foreground text-xs">
                — {mods.length} dangerous sink{mods.length !== 1 ? 's' : ''} identified
              </span>
            </div>

            {reason && (
              <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {mods.map((mod, mi) => (
                <motion.span
                  key={mod}
                  className="px-2.5 py-1 bg-red-500/15 border border-red-500/25 text-red-400 rounded-full text-xs font-mono font-semibold"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    boxShadow: [
                      '0 0 0px rgba(239, 68, 68, 0)',
                      '0 0 8px rgba(239, 68, 68, 0.3)',
                      '0 0 0px rgba(239, 68, 68, 0)',
                    ],
                  }}
                  transition={{
                    opacity: { delay: 1.4 + mi * 0.08 },
                    scale: { delay: 1.4 + mi * 0.08, type: 'spring' },
                    boxShadow: { delay: 1.8, duration: 2, repeat: Infinity },
                  }}
                >
                  {mod}
                </motion.span>
              ))}
              {!mods.length && (
                <span className="text-xs text-muted-foreground italic">
                  No dangerous sink modules identified
                </span>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Summary */}
      {allSinks.length > 0 && (
        <motion.div
          className="text-center text-xs text-muted-foreground py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          AI identified <span className="text-red-400 font-semibold">{allSinks.length}</span> dangerous
          module{allSinks.length !== 1 ? 's' : ''} that will be used to focus the vulnerability analysis.
        </motion.div>
      )}
    </div>
  );
};

export default LLMPhase1Stage;
