import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Code2, Shield, FileCode, Layers, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { api } from '../services/api';
import { toast } from 'sonner';

const AIKnowledgeBase = () => {
  const [debugRecords, setDebugRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebugRecords();
  }, []);

  const fetchDebugRecords = async () => {
    try {
      const data = await api.getAIDebug();
      setDebugRecords(data);
    } catch (error) {
      toast.error('Failed to load AI debug data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8" data-testid="ai-knowledge-base">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI Knowledge Base</h1>
          <p className="text-muted-foreground text-lg">
            Full pipeline debug data from Wrapper Hunter &rarr; LLM &rarr; Semgrep rules
          </p>
        </div>

        <div className="space-y-4">
          {debugRecords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No AI debug records yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan your repositories to generate AI analysis data
                </p>
              </CardContent>
            </Card>
          ) : (
            debugRecords.map((record, index) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:border-primary/30 transition-all" data-testid={`debug-record-${index}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {record.repository_name || record.repository_id}
                          </CardTitle>
                          <Badge variant="outline" className="font-mono text-xs">
                            {record.scan_id?.slice(0, 8)}
                          </Badge>
                        </div>
                        <CardDescription>
                          {new Date(record.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-yellow-500" />
                        <span className="text-muted-foreground">Vulnerable wrappers:</span>
                        <span className="font-semibold text-primary">{record.vuln_wrapper_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-blue-500" />
                        <span className="text-muted-foreground">Sink modules:</span>
                        <span className="font-semibold text-primary">{record.sink_module_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-green-500" />
                        <span className="text-muted-foreground">Semgrep rules:</span>
                        <span className="font-semibold text-primary">{record.rules_count ?? 0}</span>
                      </div>
                    </div>

                    {record.wrapper_targets_summary && record.wrapper_targets_summary.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground font-medium mb-2">
                          Wrapper Hunter Targets ({record.wrapper_targets_summary.length})
                        </p>
                        <div className="space-y-1.5">
                          {record.wrapper_targets_summary.map((t, i) => (
                            <div key={`${t.language}-${t.scan_path || i}-${i}`} className="text-xs text-muted-foreground">
                              <span className="font-mono text-foreground">[{t.language}] {t.scan_path || t.root_path || '.'}</span>
                              <span className="ml-1">
                                ({t.wrapper_count ?? 0} wrapper{(t.wrapper_count ?? 0) !== 1 ? 's' : ''}, {t.module_count ?? 0} module{(t.module_count ?? 0) !== 1 ? 's' : ''})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Chunk processing stats */}
                    {record.chunk_stats && record.chunk_stats.total_chunks > 0 && (
                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-purple-500" />
                            <span className="text-muted-foreground">AI chunks:</span>
                            <span className="font-semibold">
                              {record.chunk_stats.succeeded}/{record.chunk_stats.total_chunks} passed
                            </span>
                          </div>
                          {record.chunk_stats.failed > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {record.chunk_stats.failed} failed
                            </Badge>
                          )}
                          {record.chunk_stats.manual_review > 0 && (
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                              {record.chunk_stats.manual_review} manual review
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Failed chunks detail */}
                    {record.failed_chunks && record.failed_chunks.length > 0 && (
                      <div className="mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">
                            {record.failed_chunks.length} chunk(s) failed after retries
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {record.failed_chunks.map((fc, i) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              <span className="font-mono">
                                Chunk {fc.chunk_index + 1} [{fc.lang}]
                              </span>
                              {' — '}
                              {fc.function_names?.length > 0
                                ? fc.function_names.slice(0, 5).join(', ')
                                  + (fc.function_names.length > 5 ? ` +${fc.function_names.length - 5} more` : '')
                                : 'unknown functions'}
                              <span className="text-destructive/70 ml-1">
                                ({fc.attempts} attempts — {fc.error || 'Unknown error'})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Manual inspection required (413 Too Large) */}
                    {record.manual_review_required && record.manual_review_required.length > 0 && (
                      <div className="mt-3 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                            Manual Inspection Required — {record.manual_review_required.length} chunk(s) too large for AI
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          These functions could not be analyzed by AI due to request size limits. Please review them manually for potential vulnerabilities.
                        </p>
                        <div className="space-y-1.5">
                          {record.manual_review_required.map((mr, i) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              <span className="font-mono">
                                Chunk {mr.chunk_index + 1} [{mr.lang}]
                              </span>
                              {' — '}
                              {mr.function_names?.length > 0
                                ? mr.function_names.slice(0, 5).join(', ')
                                  + (mr.function_names.length > 5 ? ` +${mr.function_names.length - 5} more` : '')
                                : 'unknown functions'}
                              <span className="text-yellow-600 dark:text-yellow-400 ml-1">
                                ({mr.wrapper_count} function{mr.wrapper_count !== 1 ? 's' : ''})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIKnowledgeBase;
