import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, GitBranch, FileCode, AlertTriangle, 
  Folder, ChevronRight, ChevronDown, RefreshCw,
  Loader2, CheckCircle, Clock, Shield, GitCommit, Scan
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { api } from '../services/api';
import { toast } from 'sonner';
import { useWebSocket } from '../hooks/useWebSocket';

// File Tree Component
const FileTreeItem = ({ item, level = 0 }) => {
  const [expanded, setExpanded] = useState(level < 2);
  const isFolder = item.type === 'folder';
  const hasChildren = item.children && item.children.length > 0;
  
  const getFileIcon = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    const iconMap = {
      js: '📜', jsx: '⚛️', ts: '📘', tsx: '⚛️',
      py: '🐍', java: '☕', go: '🔷', rs: '🦀',
      html: '🌐', css: '🎨', scss: '🎨', less: '🎨',
      json: '📋', yaml: '📋', yml: '📋', toml: '📋',
      md: '📝', txt: '📄', 
      jpg: '🖼️', png: '🖼️', gif: '🖼️', svg: '🖼️',
      sh: '💻', bash: '💻', zsh: '💻',
      lock: '🔒', env: '🔐',
    };
    return iconMap[ext] || '📄';
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isFolder && setExpanded(!expanded)}
      >
        {isFolder ? (
          <>
            {hasChildren ? (
              expanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
            <Folder className="w-4 h-4 text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <span className="text-sm">{getFileIcon(item.path)}</span>
          </>
        )}
        <span className="text-sm truncate">{item.name}</span>
        {!isFolder && item.size && (
          <span className="text-xs text-muted-foreground ml-auto">
            {item.size > 1024 ? `${(item.size / 1024).toFixed(1)}KB` : `${item.size}B`}
          </span>
        )}
      </div>
      
      <AnimatePresence>
        {isFolder && expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {item.children.map((child, idx) => (
              <FileTreeItem key={child.path || idx} item={child} level={level + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Build tree structure from flat file list
const buildFileTree = (files) => {
  const root = { children: [] };
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let child = current.children.find(c => c.name === part);
      
      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          type: isLast ? file.type : 'folder',
          size: isLast ? file.size : null,
          children: []
        };
        current.children.push(child);
      }
      
      current = child;
    });
  });
  
  // Sort: folders first, then files, alphabetically
  const sortChildren = (node) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortChildren);
    }
  };
  
  sortChildren(root);
  return root.children;
};

const RepositoryDetail = () => {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Branch & File Tree state
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [fileTree, setFileTree] = useState([]);
  const [loadingTree, setLoadingTree] = useState(false);
  
  // Scanning state
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [scanMode, setScanMode] = useState('full');
  const [scans, setScans] = useState([]);
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState('');
  
  // Current scan ID for WebSocket matching
  const [currentScanId, setCurrentScanId] = useState(null);
  
  // Define fetchData first so it can be referenced by handleWebSocketMessage
  const fetchData = useCallback(async () => {
    try {
      const [repoData, vulnData, patternData, branchData, scanData] = await Promise.all([
        api.getRepository(id),
        api.getVulnerabilities({ repository_id: id }),
        api.getAIPatterns(id),
        api.getRepoBranches(id).catch(() => ({ branches: [], default_branch: 'main' })),
        api.getRepoScans(id).catch(() => [])
      ]);
      
      setRepo(repoData);
      setVulnerabilities(vulnData);
      setPatterns(patternData);
      setBranches(branchData.branches || []);
      setDefaultBranch(branchData.default_branch || 'main');
      setSelectedBranch(branchData.default_branch || 'main');
      setScans(scanData);
      
      // Check if there's a running scan
      const runningScan = scanData.find(s => s.status === 'running' || s.status === 'pending');
      if (runningScan) {
        setScanning(true);
        setScanProgress(runningScan.progress || 10);
        setCurrentScanId(runningScan.id);
      }
    } catch (error) {
      toast.error('Failed to load repository details');
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  // WebSocket for real-time notifications
  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'scan_complete') {
      const notification = data.notification;
      
      // Check if this notification is for our current scan
      if (notification.data?.repository_id === id || notification.data?.scan_id === currentScanId) {
        setScanning(false);
        setScanProgress(100);
        setCurrentScanId(null);
        
        toast.success(notification.message || 'Scan completed!');
        fetchData();
      }
    }
  }, [id, currentScanId, fetchData]);
  
  // Define fetchFileTree and fetchCommits before they're used in useEffect
  const fetchFileTree = useCallback(async (branch) => {
    setLoadingTree(true);
    try {
      const data = await api.getRepoFileTree(id, branch);
      const tree = buildFileTree(data.tree || []);
      setFileTree(tree);
    } catch (error) {
      console.error('Failed to load file tree:', error);
      setFileTree([]);
    } finally {
      setLoadingTree(false);
    }
  }, [id]);
  
  const fetchCommits = useCallback(async (branch) => {
    try {
      const data = await api.getRepoCommits(id, branch, 20);
      setCommits(data.commits || []);
    } catch (error) {
      console.error('Failed to load commits:', error);
    }
  }, [id]);
  
  const { } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    fetchData();
  }, [id, fetchData]);
  
  useEffect(() => {
    if (selectedBranch) {
      fetchFileTree(selectedBranch);
      fetchCommits(selectedBranch);
    }
  }, [selectedBranch, fetchFileTree, fetchCommits]);

  const handleRefreshSecrets = async () => {
    try {
      toast.info('Refreshing GitHub secrets...');
      const result = await api.refreshRepoSecrets(id);
      toast.success(result.message || 'Secrets refreshed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to refresh secrets');
    }
  };

  const handleStartScan = async () => {
    // Check if this is first scan or rescan
    const hasScannedBefore = scans.length > 0;
    
    if (hasScannedBefore) {
      setShowScanDialog(true);
    } else {
      // First scan - do full scan directly
      executeScan('full');
    }
  };
  
  const executeScan = async (mode) => {
    setShowScanDialog(false);
    setScanning(true);
    setScanProgress(5);
    
    try {
      const baseCommit = mode === 'diff' && selectedCommit ? selectedCommit : null;
      
      const result = await api.startGitHubScan(id, mode, selectedBranch, baseCommit);
      
      if (result.success) {
        toast.success('Scan started! You\'ll be notified when complete.');
        setScanProgress(10);
        
        // Set current scan ID for WebSocket matching
        setCurrentScanId(result.scan_id);
        
        // Add to scans list
        setScans(prev => [{
          id: result.scan_id,
          status: 'running',
          scan_mode: mode,
          branch: selectedBranch,
          started_at: new Date().toISOString(),
          progress: 10
        }, ...prev]);
      }
    } catch (error) {
      setScanning(false);
      toast.error(error.response?.data?.detail || 'Failed to start scan');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
      info: 'outline'
    };
    return colors[severity] || 'default';
  };
  
  const getScanStatusBadge = (status) => {
    const variants = {
      completed: { variant: 'default', icon: CheckCircle, color: 'text-green-500' },
      running: { variant: 'secondary', icon: RefreshCw, color: 'text-blue-500' },
      pending: { variant: 'outline', icon: Clock, color: 'text-yellow-500' },
      failed: { variant: 'destructive', icon: AlertTriangle, color: 'text-red-500' }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className={`w-3 h-3 ${config.color} ${status === 'running' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
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
      <div className="space-y-6" data-testid="repository-detail">
        {/* Header */}
        <div>
          <Link to="/repositories" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Repositories
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">{repo?.name}</h1>
              <p className="text-muted-foreground text-lg">{repo?.full_name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshSecrets}
                variant="outline"
                disabled={scanning}
                title="Refresh GitHub secrets (API URL and token)"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Secrets
              </Button>
              <Button
                onClick={handleStartScan}
                disabled={scanning}
                className="bg-primary hover:bg-primary/90"
                data-testid="start-scan-button"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Scan Progress */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning in progress...
                      </span>
                      <span className="text-muted-foreground">
                        This runs on GitHub Actions. You can navigate away.
                      </span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      You'll receive a notification when the scan completes.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Branch Selector & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Branch Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Branch</div>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    <SelectValue placeholder="Select branch" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.name} value={branch.name}>
                      <div className="flex items-center gap-2">
                        {branch.name}
                        {branch.name === defaultBranch && (
                          <Badge variant="outline" className="text-xs">default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {/* Stats */}
          <Card data-testid="risk-score-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Risk Score</div>
              <div className="text-3xl font-bold">{repo?.risk_score || 'N/A'}</div>
            </CardContent>
          </Card>
          <Card data-testid="vulnerabilities-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">Vulnerabilities</div>
              <div className="text-3xl font-bold text-destructive">{vulnerabilities.length}</div>
            </CardContent>
          </Card>
          <Card data-testid="patterns-stat">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-2">AI Patterns</div>
              <div className="text-3xl font-bold text-primary">{patterns.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="files" className="space-y-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 gap-4">
            <TabsTrigger value="files" data-testid="tab-files">
              <Folder className="w-4 h-4 mr-2" />
              Files
            </TabsTrigger>
            <TabsTrigger value="vulnerabilities" data-testid="tab-vulnerabilities">
              <Shield className="w-4 h-4 mr-2" />
              Vulnerabilities
            </TabsTrigger>
            <TabsTrigger value="scans" data-testid="tab-scans">
              <Scan className="w-4 h-4 mr-2" />
              Scan History
            </TabsTrigger>
            <TabsTrigger value="ai-patterns" data-testid="tab-patterns">
              <FileCode className="w-4 h-4 mr-2" />
              AI Patterns
            </TabsTrigger>
          </TabsList>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  File Structure
                </CardTitle>
                <CardDescription>
                  Browse repository files on branch: {selectedBranch}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTree ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : fileTree.length === 0 ? (
                  <div className="text-center py-12">
                    <Folder className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">No files found</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="pr-4">
                      {fileTree.map((item, idx) => (
                        <FileTreeItem key={item.path || idx} item={item} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vulnerabilities Tab */}
          <TabsContent value="vulnerabilities" className="space-y-4">
            {vulnerabilities.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="w-16 h-16 mx-auto mb-4 opacity-50 text-green-500" />
                  <p className="text-lg text-muted-foreground">No vulnerabilities found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run a scan to check for security issues
                  </p>
                </CardContent>
              </Card>
            ) : (
              vulnerabilities.map((vuln, index) => (
                <motion.div
                  key={vuln.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:border-primary/30 transition-all" data-testid={`vuln-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{vuln.title}</CardTitle>
                          <CardDescription>{vuln.file_path}:{vuln.line_number}</CardDescription>
                        </div>
                        <Badge variant={getSeverityColor(vuln.severity)}>
                          {vuln.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{vuln.description}</p>
                      {vuln.code_snippet && (
                        <pre className="bg-black/50 p-4 rounded-md text-xs font-mono overflow-x-auto mb-4">
                          <code>{vuln.code_snippet}</code>
                        </pre>
                      )}
                      {vuln.ai_reasoning && (
                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-md">
                          <p className="text-sm">
                            <span className="font-semibold text-primary">AI Analysis: </span>
                            {vuln.ai_reasoning}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Confidence: {(vuln.ai_confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Scan History Tab */}
          <TabsContent value="scans" className="space-y-4">
            {scans.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Scan className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No scans yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Start Scan" to run your first security scan
                  </p>
                </CardContent>
              </Card>
            ) : (
              scans.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getScanStatusBadge(scan.status)}
                          <div>
                            <CardTitle className="text-base">
                              {scan.scan_mode === 'full' ? 'Full Scan' : 'Diff Scan'}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              <GitBranch className="w-3 h-3" />
                              {scan.branch}
                              <span>•</span>
                              {new Date(scan.started_at).toLocaleString()}
                            </CardDescription>
                          </div>
                        </div>
                        {scan.vulnerability_count !== undefined && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-destructive">
                              {scan.vulnerability_count}
                            </div>
                            <div className="text-xs text-muted-foreground">vulnerabilities</div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    {scan.severity_counts && (
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          {scan.severity_counts.critical > 0 && (
                            <Badge variant="destructive">
                              {scan.severity_counts.critical} Critical
                            </Badge>
                          )}
                          {scan.severity_counts.high > 0 && (
                            <Badge variant="destructive">
                              {scan.severity_counts.high} High
                            </Badge>
                          )}
                          {scan.severity_counts.medium > 0 && (
                            <Badge variant="default">
                              {scan.severity_counts.medium} Medium
                            </Badge>
                          )}
                          {scan.severity_counts.low > 0 && (
                            <Badge variant="secondary">
                              {scan.severity_counts.low} Low
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* AI Patterns Tab */}
          <TabsContent value="ai-patterns">
            {patterns.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No AI patterns discovered yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Run a scan to discover patterns</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {patterns.map((pattern) => (
                  <Card key={pattern.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pattern.pattern_name}</CardTitle>
                        <Badge variant="outline">{pattern.pattern_type}</Badge>
                      </div>
                      <CardDescription>{pattern.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {(pattern.confidence * 100).toFixed(0)}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Scan Options Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Security Scan</DialogTitle>
            <DialogDescription>
              Choose how you want to scan this repository
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                scanMode === 'full' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => setScanMode('full')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  scanMode === 'full' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {scanMode === 'full' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
                </div>
                <div>
                  <div className="font-medium">Full Scan</div>
                  <div className="text-sm text-muted-foreground">
                    Scan the entire repository for vulnerabilities
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                scanMode === 'diff' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => setScanMode('diff')}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  scanMode === 'diff' ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {scanMode === 'diff' && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
                </div>
                <div>
                  <div className="font-medium">Diff Scan (Latest Changes)</div>
                  <div className="text-sm text-muted-foreground">
                    Only scan files changed since last scan
                  </div>
                </div>
              </div>
            </div>
            
            {scanMode === 'diff' && commits.length > 0 && (
              <div className="pl-7">
                <label className="text-sm font-medium mb-2 block">
                  Compare from commit (optional)
                </label>
                <Select value={selectedCommit} onValueChange={setSelectedCommit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select base commit" />
                  </SelectTrigger>
                  <SelectContent>
                    {commits.slice(0, 10).map((commit) => (
                      <SelectItem key={commit.sha} value={commit.sha}>
                        <div className="flex items-center gap-2">
                          <GitCommit className="w-3 h-3" />
                          <span className="font-mono text-xs">{commit.sha.slice(0, 7)}</span>
                          <span className="truncate max-w-[200px]">{commit.message.split('\n')[0]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => executeScan(scanMode)}>
              <Scan className="w-4 h-4 mr-2" />
              Start {scanMode === 'full' ? 'Full' : 'Diff'} Scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default RepositoryDetail;
