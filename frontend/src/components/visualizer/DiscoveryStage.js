import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, FileCode, ArrowRight } from 'lucide-react';

const chipVariants = {
  hidden: { opacity: 0, scale: 0.5, y: 20 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.04,
      type: 'spring',
      stiffness: 400,
      damping: 20,
    },
  }),
};

const sourceVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const mergeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { delay: 0.6, duration: 0.4 } },
};

const ModuleChip = ({ name, index, source }) => {
  const color = source === 'manifest'
    ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
    : 'bg-violet-500/15 border-violet-500/30 text-violet-400';

  return (
    <motion.span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono border ${color}`}
      custom={index}
      variants={chipVariants}
      initial="hidden"
      animate="visible"
    >
      {name}
    </motion.span>
  );
};

const DiscoveryStage = ({ data }) => {
  const langEntries = useMemo(() => Object.entries(data?.languages || {}), [data?.languages]);

  if (!langEntries.length) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        No module data available for this scan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {langEntries.map(([lang, mods]) => {
        const langLabel = lang === 'python' ? 'Python' : 'JavaScript / React';
        const manifestMods = mods.from_manifest || [];
        const importMods = mods.from_imports || [];

        return (
          <div key={lang} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span>{langLabel}</span>
              <span className="text-xs text-muted-foreground font-normal">
                ({mods.total_all || 0} total modules)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
              {/* Manifest source */}
              <motion.div
                className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3"
                variants={sourceVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                  <Package className="w-4 h-4" />
                  <span>From Manifest</span>
                  <span className="text-xs text-blue-400/60 ml-auto">
                    {mods.total_manifest || manifestMods.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {manifestMods.map((m, i) => (
                    <ModuleChip key={m} name={m} index={i} source="manifest" />
                  ))}
                  {!manifestMods.length && (
                    <span className="text-xs text-muted-foreground italic">none detected</span>
                  )}
                </div>
              </motion.div>

              {/* Merge arrow */}
              <motion.div
                className="hidden md:flex items-center justify-center py-8"
                variants={mergeVariants}
                initial="hidden"
                animate="visible"
              >
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight className="w-5 h-5 text-primary animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">merge</span>
                </div>
              </motion.div>

              {/* Import source */}
              <motion.div
                className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 space-y-3"
                variants={sourceVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 text-sm font-medium text-violet-400">
                  <FileCode className="w-4 h-4" />
                  <span>From Import Statements</span>
                  <span className="text-xs text-violet-400/60 ml-auto">
                    {mods.total_imports || importMods.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {importMods.map((m, i) => (
                    <ModuleChip key={m} name={m} index={i + manifestMods.length} source="import" />
                  ))}
                  {!importMods.length && (
                    <span className="text-xs text-muted-foreground italic">none detected</span>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Merged result */}
            <motion.div
              className="bg-card border border-border/50 rounded-xl p-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <div className="h-px flex-1 bg-gradient-to-r from-blue-500/30 via-primary/30 to-violet-500/30" />
                <span className="font-medium">Unified Module Map</span>
                <div className="h-px flex-1 bg-gradient-to-l from-blue-500/30 via-primary/30 to-violet-500/30" />
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {(mods.all || []).map((m, i) => (
                  <motion.span
                    key={m}
                    className="px-1.5 py-0.5 bg-muted/60 border border-border/40 rounded text-xs font-mono text-foreground/80"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 + i * 0.02 }}
                  >
                    {m}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default DiscoveryStage;
