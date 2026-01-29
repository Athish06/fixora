import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Github } from 'lucide-react';
import { api } from '../services/api';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Connecting to GitHub...');
  const [githubUsername, setGithubUsername] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        setStatus('error');
        setMessage(searchParams.get('error_description') || 'Authorization was denied');
        setTimeout(() => navigate('/repositories'), 3000);
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Invalid callback parameters');
        setTimeout(() => navigate('/repositories'), 3000);
        return;
      }

      try {
        const result = await api.handleGitHubCallback(code, state);
        
        if (result.success) {
          setStatus('success');
          setGithubUsername(result.github_username);
          setMessage(`Successfully connected as ${result.github_username}`);
          setTimeout(() => navigate('/repositories?github_connected=true'), 2000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Failed to connect GitHub');
          setTimeout(() => navigate('/repositories'), 3000);
        }
      } catch (error) {
        console.error('GitHub callback error:', error);
        setStatus('error');
        setMessage(error.response?.data?.detail || 'Failed to connect GitHub account');
        setTimeout(() => navigate('/repositories'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-xl p-8 max-w-md w-full mx-4 text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-secondary/20 flex items-center justify-center mb-4">
            <Github className="w-8 h-8 text-foreground" />
          </div>
          
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connecting GitHub
              </h2>
              <p className="text-muted-foreground">{message}</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connected Successfully!
              </h2>
              <p className="text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">@{githubUsername}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting to repositories...
              </p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <XCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Connection Failed
              </h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground mt-4">
                Redirecting back...
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GitHubCallback;
