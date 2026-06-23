import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';

const severityColor = (s) => {
  const map = {
    HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
    CRITICAL: 'bg-red-600/20 text-red-300 border-red-600/30',
    MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    LOW: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  };
  return map[String(s).toUpperCase()] || 'bg-muted text-muted-foreground border-border';
};

const FindingCard = ({ finding, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="border border-border/50 rounded-xl overflow-hidden bg-card/50"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 300, damping: 25 }}
    >
      <button
        className="w-full text-left px-4 py-3 hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <code className="font-mono font-semibold text-sm text-foreground truncate">
                {finding.function_name}()
              </code>
            </div>
            <p className="text-xs text-muted-foreground truncate">{finding.file}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${severityColor(finding.severity)}`}>
              {finding.severity}
            </span>
            <Badge variant="outline" className="text-[10px] px-1.5">
              {finding.vulnerability_type}
            </Badge>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-4 pb-4 space-y-3 border-t border-border/30"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pt-3 space-y-2">
              {finding.vulnerable_parameter && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0 pt-0.5">
                    Parameter
                  </span>
                  <code className="text-xs font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                    {finding.vulnerable_parameter}
                  </code>
                </div>
              )}

              {finding.malicious_payload && (
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider shrink-0 pt-0.5">
                    Payload
                  </span>
                  <code className="text-xs font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded break-all">
                    {finding.malicious_payload}
                  </code>
                </div>
              )}

              {finding.exploit_explanation && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    How it's exploited
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {finding.exploit_explanation}
                  </p>
                </div>
              )}

              {finding.impact_summary && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Impact
                  </span>
                  <p className="text-xs text-foreground/80 leading-relaxed bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
                    {finding.impact_summary}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const LLMPhase2Stage = ({ data }) => {
  const chunkStats = data?.chunk_stats || {};
  const findings = data?.findings || [];
  const totalFindings = data?.total_findings || 0;
  const sampledFindings = data?.sampled_findings || 0;

  const total = chunkStats.total || 0;
  const succeeded = chunkStats.succeeded || 0;
  const failed = chunkStats.failed || 0;
  const manualReview = chunkStats.manual_review || 0;
  const progressPct = total > 0 ? Math.round((succeeded / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Chunk processing progress */}
      <motion.div
        className="bg-card border border-border/50 rounded-xl p-4 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2 text-sm font-medium">
          <Cpu className="w-4 h-4 text-primary" />
          <span>Chunk Processing</span>
        </div>

        {/* Animated progress bar */}
        <div className="space-y-2">
          <Progress value={progressPct} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{total} total chunks</span>
            <span>{progressPct}% complete</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3">
          <motion.div
            className="flex items-center gap-1.5 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-400 font-medium">{succeeded}</span>
            <span className="text-muted-foreground">succeeded</span>
          </motion.div>

          {failed > 0 && (
            <motion.div
              className="flex items-center gap-1.5 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-red-400 font-medium">{failed}</span>
              <span className="text-muted-foreground">failed</span>
            </motion.div>
          )}

          {manualReview > 0 && (
            <motion.div
              className="flex items-center gap-1.5 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Eye className="w-3.5 h-3.5 text-yellow-500" />
              <span className="text-yellow-400 font-medium">{manualReview}</span>
              <span className="text-muted-foreground">need review</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Findings */}
      {findings.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">
              Vulnerabilities Found ({totalFindings})
            </h3>
            {sampledFindings < totalFindings && (
              <span className="text-[10px] text-muted-foreground">
                Showing {sampledFindings} of {totalFindings}
              </span>
            )}
          </div>
          {findings.map((finding, i) => (
            <FindingCard key={finding.function_name + i} finding={finding} index={i} />
          ))}
        </div>
      ) : (
        <motion.div
          className="text-center py-8 text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          No vulnerabilities detected in the analyzed functions.
        </motion.div>
      )}
    </div>
  );
};

export default LLMPhase2Stage;
