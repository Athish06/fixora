import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '../ui/badge';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#ef4444',
  medium: '#eab308',
  low: '#3b82f6',
};

const ComparisonStage = ({ data }) => {
  const [expandedFinding, setExpandedFinding] = useState(null);

  const traditionalCount = data?.traditional_count || 0;
  const dynamicCount = data?.dynamic_only_count || 0;
  const dynamicFindings = data?.dynamic_only_findings || [];
  
  const chartData = useMemo(() => {
    const tSev = data?.traditional_severity || {};
    const dSev = data?.dynamic_severity || {};
    return [
      {
        name: 'Traditional',
        critical: tSev.critical || 0,
        high: tSev.high || 0,
        medium: tSev.medium || 0,
        low: tSev.low || 0,
        total: data?.traditional_count || 0,
      },
      {
        name: 'Fixora Dynamic',
        critical: dSev.critical || 0,
        high: dSev.high || 0,
        medium: dSev.medium || 0,
        low: dSev.low || 0,
        total: data?.dynamic_only_count || 0,
      },
    ];
  }, [data]);

  const totalFindings = traditionalCount + dynamicCount;

  return (
    <div className="space-y-6">
      {/* Hero stats */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-card border border-border/50 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Traditional Semgrep
            </span>
          </div>
          <motion.span
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {traditionalCount}
          </motion.span>
          <p className="text-xs text-muted-foreground mt-1">
            findings from public rule packs
          </p>
        </div>

        <motion.div
          className="bg-gradient-to-br from-primary/5 to-violet-500/5 border border-primary/30 rounded-xl p-4 text-center relative overflow-hidden"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Fixora Dynamic Rules
            </span>
          </div>
          <motion.span
            className="text-3xl font-bold text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            +{dynamicCount}
          </motion.span>
          <p className="text-xs text-muted-foreground mt-1">
            found ONLY because AI taught Semgrep
          </p>

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      </motion.div>

      {/* Framing text */}
      {dynamicCount > 0 && (
        <motion.div
          className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-foreground leading-relaxed">
            <span className="font-semibold">Traditional Semgrep</span>: {traditionalCount} findings
            using public rule packs.{' '}
            <span className="font-semibold text-primary">Fixora dynamic rules</span>: +{dynamicCount}{' '}
            findings — these only exist because the AI taught Semgrep what your wrapper functions do.
          </p>
        </motion.div>
      )}

      {/* Chart */}
      {totalFindings > 0 && (
        <motion.div
          className="bg-card border border-border/50 rounded-xl p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-sm font-medium text-foreground mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={8}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} radius={[0, 0, 0, 0]} />
              <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
              <div key={sev} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-[10px] text-muted-foreground capitalize">{sev}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Dynamic-only findings list */}
      {dynamicFindings.length > 0 && (
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary" />
            Dynamic-Only Findings
            <span className="text-xs text-muted-foreground font-normal">
              — these rules didn't exist until this scan
            </span>
          </h3>

          {dynamicFindings.map((finding, i) => (
            <motion.div
              key={finding.rule_id + i}
              className="border border-primary/20 rounded-lg overflow-hidden bg-primary/5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + i * 0.08 }}
            >
              <button
                className="w-full text-left px-3 py-2.5 hover:bg-primary/10 transition-colors flex items-center gap-2"
                onClick={() => setExpandedFinding(expandedFinding === i ? null : i)}
              >
                <Zap className="w-3 h-3 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground truncate flex-1">
                  {finding.title}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1 shrink-0 ${
                    finding.severity === 'high' || finding.severity === 'critical'
                      ? 'border-red-500/30 text-red-400'
                      : finding.severity === 'medium'
                      ? 'border-yellow-500/30 text-yellow-400'
                      : 'border-blue-500/30 text-blue-400'
                  }`}
                >
                  {finding.severity}
                </Badge>
                {expandedFinding === i ? (
                  <ChevronUp className="w-3 h-3 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {expandedFinding === i && (
                  <motion.div
                    className="px-3 pb-3 space-y-1.5 border-t border-primary/10"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="pt-2 space-y-1">
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-medium">Rule:</span>{' '}
                        <code className="font-mono">{finding.rule_id}</code>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-medium">File:</span> {finding.file_path}
                        {finding.line_number && ` (L${finding.line_number})`}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        <span className="font-medium">Type:</span> {finding.type || finding.vulnerability_type}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ComparisonStage;
