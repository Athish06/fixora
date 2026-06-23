import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye } from 'lucide-react';
import { api } from '../services/api';
import ScanVisualizer from './ScanVisualizer';
import { toast } from 'sonner';

const DemoVisualizer = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [repo, setRepo] = useState(null);
  const [scans, setScans] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [repoData, scanData] = await Promise.all([
        api.getRepository(id),
        api.getRepoScans(id).catch(() => [])
      ]);
      setRepo(repoData);
      setScans(scanData);
    } catch (error) {
      toast.error('Failed to load repository details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Visualizer...</p>
      </div>
    );
  }

  const visualizerScanId = repo?.latest_scan_id || (scans?.length > 0 ? (scans[0].scan_id || scans[0].id) : null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Bar */}
      <div className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-md flex items-center px-6 shrink-0 z-50">
        <Link 
          to={`/repositories/${id}`} 
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Repository
        </Link>
        <div className="mx-auto flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">
            Pipeline Visualizer <span className="text-muted-foreground font-normal ml-2">({repo?.name})</span>
          </h1>
        </div>
      </div>

      {/* Main Full-Screen Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {visualizerScanId ? (
          <div className="flex-1 h-full w-full">
            <ScanVisualizer scanId={visualizerScanId} repositoryId={id} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-center space-y-3">
            <Eye className="w-16 h-16 text-muted-foreground/30" />
            <p className="text-muted-foreground text-lg max-w-sm">
              No scans have been run on this repository yet.
            </p>
            <Link to={`/repositories/${id}`}>
              <button className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Go back & start a scan
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemoVisualizer;
