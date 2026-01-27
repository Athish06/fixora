import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, GitBranch, AlertTriangle, Calendar, Search, Github, Settings } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { api } from '../services/api';
import { toast } from 'sonner';

const Repositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRepo, setNewRepo] = useState({
    name: '',
    full_name: '',
    description: '',
    language: '',
    url: ''
  });

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const data = await api.getRepositories();
      setRepositories(data);
    } catch (error) {
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepository = async (e) => {
    e.preventDefault();
    try {
      await api.createRepository(newRepo);
      toast.success('Repository connected successfully!');
      setShowAddDialog(false);
      setNewRepo({ name: '', full_name: '', description: '', language: '', url: '' });
      fetchRepositories();
    } catch (error) {
      toast.error('Failed to connect repository');
    }
  };

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskBadgeColor = (score) => {
    const colors = {
      'A': 'outline',
      'B': 'secondary',
      'C': 'default',
      'D': 'default',
      'F': 'destructive'
    };
    return colors[score] || 'default';
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
      <div className="space-y-8" data-testid="repositories-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Repositories</h1>
            <p className="text-muted-foreground text-lg">
              Manage your connected GitHub repositories
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="shadow-md" data-testid="connect-github-button">
              <Github className="w-4 h-4 mr-2" />
              Connect GitHub
            </Button>
            <Button variant="outline" className="shadow-md" data-testid="manage-repos-button">
              <Settings className="w-4 h-4 mr-2" />
              Manage Repositories
            </Button>
          </div>
        </div>

        {/* Search and Connect Repository */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-repos-input"
            />
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg" data-testid="add-repo-button">
                Connect Repositories
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Connect New Repository</DialogTitle>
                <DialogDescription>
                  Enter your repository details to start scanning
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddRepository} className="space-y-4" data-testid="add-repo-form">
                <div className="space-y-2">
                  <Label htmlFor="name">Repository Name</Label>
                  <Input
                    id="name"
                    placeholder="my-awesome-project"
                    value={newRepo.name}
                    onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                    required
                    data-testid="repo-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name (owner/repo)</Label>
                  <Input
                    id="full_name"
                    placeholder="username/my-awesome-project"
                    value={newRepo.full_name}
                    onChange={(e) => setNewRepo({ ...newRepo, full_name: e.target.value })}
                    required
                    data-testid="repo-fullname-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">Repository URL</Label>
                  <Input
                    id="url"
                    placeholder="https://github.com/username/repo"
                    value={newRepo.url}
                    onChange={(e) => setNewRepo({ ...newRepo, url: e.target.value })}
                    required
                    data-testid="repo-url-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Primary Language</Label>
                  <Input
                    id="language"
                    placeholder="JavaScript"
                    value={newRepo.language}
                    onChange={(e) => setNewRepo({ ...newRepo, language: e.target.value })}
                    data-testid="repo-language-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description"
                    value={newRepo.description}
                    onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                    data-testid="repo-description-input"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-repo-button">
                  Connect Repository
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Repository List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRepos.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  {searchTerm ? 'No repositories found' : 'No repositories connected yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {!searchTerm && 'Connect your first repository to start scanning'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRepos.map((repo, index) => (
              <motion.div
                key={repo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link to={`/repositories/${repo.id}`}>
                  <Card className="hover:border-primary/50 transition-all hover:-translate-y-1 cursor-pointer" data-testid={`repo-card-${index}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{repo.name}</CardTitle>
                          <CardDescription className="text-xs">{repo.full_name}</CardDescription>
                        </div>
                        <Badge variant={getRiskBadgeColor(repo.risk_score)}>
                          {repo.risk_score}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {repo.description || 'No description available'}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          {repo.language && (
                            <span className="text-muted-foreground">{repo.language}</span>
                          )}
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            <span>{repo.total_vulnerabilities || 0}</span>
                          </div>
                        </div>
                        {repo.last_scan && (
                          <div className="flex items-center gap-1 text-muted-foreground text-xs">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(repo.last_scan).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Repositories;