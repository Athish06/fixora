import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Brain, GitBranch, ArrowRight } from 'lucide-react';
import AnimatedButton from '../components/ui/animated-button';
import Particles from '../components/ui/particles';

const LandingPage = () => {
  const features = [
    {
      icon: Brain,
      title: 'Sink Module Identification',
      description: 'Natively detects core execution sinks across the architecture, including SQL, NoSQL, Eval, and OS commands.'
    },
    {
      icon: Shield,
      title: 'LLM Wrapper Analysis',
      description: 'Uses semantic reasoning to identify custom, repository-specific wrapper functions that abstract dangerous sinks.'
    },
    {
      icon: GitBranch,
      title: 'Execution Path Tracing',
      description: 'Evaluates contextual boundaries like authentication wrappers and application state to definitively filter false positives.'
    },
    {
      icon: Zap,
      title: 'High-Fidelity Reporting',
      description: 'Delivers definitively validated vulnerability reports, eliminating alert fatigue by surfacing only true, exploitable logic flaws.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Particles background */}
        <Particles
          className="absolute inset-0"
          quantity={100}
          staticity={50}
          ease={50}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-shadow">
              AI-Powered Vulnerability
              <br />
              <span className="text-primary">Detection Platform</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
              Stop chasing false positives. Let AI discover your custom patterns,
              classify real threats, and provide actionable remediation guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <AnimatedButton
                  size="lg"
                  className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  data-testid="get-started-btn"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </AnimatedButton>
              </Link>
              <Link to="/login">
                <AnimatedButton
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-border/50 hover:border-primary/50"
                  data-testid="login-btn"
                >
                  Sign In
                </AnimatedButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-card/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A four-phase pipeline built to systematically identify deep logic flaws and context-dependent vulnerabilities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 rounded-lg hover:-translate-y-2 transition-transform duration-300 group"
                  data-testid={`feature-${index}`}
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/30 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;