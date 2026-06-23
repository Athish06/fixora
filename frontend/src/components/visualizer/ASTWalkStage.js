import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Activity, AlertTriangle, Shield } from 'lucide-react';
import { Badge } from '../ui/badge';
import { api } from '../../services/api';
import ReactFlowAST from './ReactFlowAST';

const ASTTreeView = ({ scanId, filePath, functionName, onClose }) => {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchTree = async () => {
      try {
        setLoading(true);
        const data = await api.getASTTree(scanId, filePath, functionName);
        if (mounted) setTreeData(data);
      } catch (err) {
        if (mounted) setError(err.response?.data?.detail || err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTree();
    return () => { mounted = false; };
  }, [scanId, filePath, functionName]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <Activity className="w-8 h-8 text-primary animate-pulse" />
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-full"
            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Parsing Abstract Syntax Tree...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!treeData) return null;

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden">
      <div className="absolute top-4 left-4 z-10 bg-card/80 backdrop-blur-md p-3 rounded-lg border border-border/50 shadow-sm flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
          <FileCode className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-semibold text-primary">{treeData.function_name}()</code>
            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
              L{treeData.line_start}-{treeData.line_end}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Hierarchical AST Graph</p>
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <div className="absolute inset-0">
          <ReactFlowAST treeData={treeData.ast_tree} />
        </div>
      </div>
    </div>
  );
};

const ASTWalkStage = ({ data, scanId }) => {
  const files = data?.files || [];
  const totalWrappers = data?.total_wrappers || 0;
  const sampledWrappers = data?.sampled_wrappers || 0;

  const [selectedFile, setSelectedFile] = useState(files[0] || null);
  const [selectedFunction, setSelectedFunction] = useState(files[0]?.functions?.[0] || null);

  // When file changes, auto-select first function
  useEffect(() => {
    if (selectedFile && selectedFile.functions?.length > 0) {
      if (!selectedFile.functions.find(f => f.name === selectedFunction?.name)) {
        setSelectedFunction(selectedFile.functions[0]);
      }
    } else {
      setSelectedFunction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  if (!files.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Shield className="w-12 h-12 opacity-30" />
        <p>No wrapper functions found in this scan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <motion.div
        className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border border-border/40 rounded-xl text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-foreground font-medium">{totalWrappers}</span>
        <span className="text-muted-foreground">wrapper functions extracted</span>
        {sampledWrappers < totalWrappers && (
          <span className="text-xs text-muted-foreground/60 ml-auto">
            Showing {sampledWrappers} representative samples
          </span>
        )}
      </motion.div>

      {/* Interactive AST Explorer */}
      <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
        {/* Top Bar: Picker & Functions */}
        <div className="flex flex-col md:flex-row items-center gap-4 bg-card border border-border/50 rounded-xl p-3 shrink-0 shadow-sm">
          <div className="w-full md:w-64 shrink-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Select File</p>
            <select 
              className="w-full bg-background border border-border/50 rounded-md text-sm p-2 text-foreground focus:ring-1 focus:ring-primary outline-none"
              value={selectedFile?.file || ''}
              onChange={(e) => setSelectedFile(files.find(f => f.file === e.target.value))}
            >
              {files.map(f => (
                <option key={f.file} value={f.file}>{f.file}</option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-10 bg-border/50 hidden md:block" />

          <div className="flex-1 w-full overflow-hidden flex flex-col">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 ml-1">Wrapper Functions</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {selectedFile?.functions?.map((fn, idx) => {
                const isSelected = selectedFunction?.name === fn.name;
                const hasSinkCalls = (fn.calls || []).length > 0;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedFunction(fn)}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-mono transition-colors flex items-center gap-2 border shadow-sm ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-background hover:bg-muted text-foreground/80 border-border/50'
                    }`}
                  >
                    <span>{fn.name}()</span>
                    {hasSinkCalls && <AlertTriangle className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground/90' : 'text-orange-400'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Area: AST Tree */}
        <div className="flex-1 border border-border/50 bg-card rounded-xl relative flex flex-col overflow-hidden shadow-sm">
          {selectedFunction ? (
            selectedFunction.has_source ? (
              <ASTTreeView 
                scanId={scanId} 
                filePath={selectedFile.file} 
                functionName={selectedFunction.name} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <FileCode className="w-12 h-12 text-muted-foreground/30" />
                <div>
                  <h3 className="text-lg font-medium text-foreground">Source Unavailable</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-2">
                    AST traversal requires raw source code, which was not captured for this wrapper (likely to save payload space or because it was an early trace).
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              Select a function to view its AST tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ASTWalkStage;
