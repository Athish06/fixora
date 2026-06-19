import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  Shield,
  Activity,
  ArrowRight
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import AnimatedCard from '../components/ui/animated-card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import NumberTicker from '../components/ui/number-ticker';
import { api } from '../services/api';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, vulnData] = await Promise.all([
        api.getDashboardStats(),
        api.getVulnerabilities({ status: 'open' })
      ]);
      setStats(statsData);
      setVulnerabilities(vulnData.slice(0, 5)); // Top 5
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score) => {
    const colors = {
      'A': 'text-green-500',
      'B': 'text-blue-500',
      'C': 'text-yellow-500',
      'D': 'text-orange-500',
      'F': 'text-red-500'
    };
    return colors[score] || 'text-gray-500';
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
      <div className="space-y-8" data-testid="dashboard">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Security Dashboard</h1>
          <p className="text-muted-foreground text-lg">
            Overview of your vulnerability landscape
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <AnimatedCard hover={true} data-testid="risk-score-card">
              <CardHeader className="pb-3">
                <CardDescription>Overall Risk Score</CardDescription>
                <CardTitle className={`text-5xl font-bold ${getRiskColor(stats?.risk_score)}`}>
                  {stats?.risk_score || 'N/A'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 mr-2" />
                  <NumberTicker value={stats?.total_repositories || 0} /> repositories
                </div>
              </CardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <AnimatedCard hover={true} data-testid="vulnerabilities-card">
              <CardHeader className="pb-3">
                <CardDescription>Total Vulnerabilities</CardDescription>
                <CardTitle className="text-5xl font-bold">
                  <NumberTicker value={stats?.total_vulnerabilities || 0} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-red-500 font-medium">
                    <NumberTicker value={stats?.critical_vulnerabilities || 0} /> Critical
                  </span>
                  <span className="text-orange-500 font-medium">
                    <NumberTicker value={stats?.high_vulnerabilities || 0} /> High
                  </span>
                </div>
              </CardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <AnimatedCard hover={true} glassmorphism={true} data-testid="ai-savings-card">
              <CardHeader className="pb-3">
                <CardDescription>AI False Positives Prevented</CardDescription>
                <CardTitle className="text-5xl font-bold text-green-500">
                  <NumberTicker value={stats?.ai_false_positives_prevented || 0} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {stats?.total_vulnerabilities > 0
                    ? `${Math.round((stats?.ai_false_positives_prevented / stats?.total_vulnerabilities) * 100) || 0}% AI-verified`
                    : 'No data yet'}
                </div>
              </CardContent>
            </AnimatedCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AnimatedCard hover={true} data-testid="scans-week-card">
              <CardHeader className="pb-3">
                <CardDescription>Scans This Week</CardDescription>
                <CardTitle className="text-5xl font-bold">
                  <NumberTicker value={stats?.scans_this_week || 0} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Activity className="w-4 h-4 mr-2" />
                  Automated scans
                </div>
              </CardContent>
            </AnimatedCard>
          </motion.div>
        </div>

        {/* Top Vulnerabilities */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Critical Issues</CardTitle>
                <CardDescription>Top 5 most critical vulnerabilities</CardDescription>
              </div>
              <Link to="/vulnerabilities">
                <Button variant="ghost" size="sm" data-testid="view-all-vulns-btn">
                  View All
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {vulnerabilities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No open vulnerabilities</p>
                <p className="text-sm">Your codebase is looking secure!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {vulnerabilities.map((vuln, index) => (
                  <motion.div
                    key={vuln.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start justify-between p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-all"
                    data-testid={`vuln-item-${index}`}
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 bg-destructive/20 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{vuln.title}</h4>
                          <Badge variant={getSeverityColor(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{vuln.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{vuln.file_path}</span>
                          <span>{vuln.cwe_id}</span>
                          {vuln.ai_confidence && (
                            <span className="text-primary">
                              {(vuln.ai_confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link to={`/vulnerabilities`}>
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-2xl">Activity Summary</CardTitle>
            <CardDescription>Recent security events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-primary" />
                  <span className="font-medium">Scans This Week</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  <NumberTicker value={stats?.scans_this_week || 0} />
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
