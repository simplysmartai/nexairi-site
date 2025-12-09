import React from 'react';
import { Activity, Cpu, Globe, Zap } from 'lucide-react';

export const Mission: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          The Nexairi <span className="text-brand-cyan">Protocol</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto font-serif leading-relaxed">
          We are redefining the consumption of information. 
          By merging algorithmic precision with human curiosity, we eliminate noise to deliver pure signal.
        </p>
      </div>

      {/* Values Grid */}
      <div className="bg-brand-dark/50 border-y border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-brand-cyan/10 rounded-lg flex items-center justify-center border border-brand-cyan/20">
                <Cpu className="text-brand-cyan" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Autonomous Curation</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Our agents operate 24/7, scanning thousands of data points to identify trends before they break mainstream.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center border border-purple-500/20">
                <Globe className="text-purple-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Global Synthesis</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Information has no borders. We aggregate diverse perspectives to provide a holistic view of world events.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center border border-green-500/20">
                <Activity className="text-green-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Cognitive Optimization</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Our content is structured for maximum retention. Reading times are calculated to fit the modern workflow.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                <Zap className="text-yellow-400" size={24} />
              </div>
              <h3 className="text-lg font-bold text-white">Zero Latency</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                From ingestion to publication, our pipeline is automated. News reaches you the moment verification is complete.
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Manifesto */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="prose prose-invert prose-lg mx-auto">
          <h2 className="text-center text-3xl font-bold mb-12">Manifesto 2.0</h2>
          <p>
            In an era of information overload, clarity is the ultimate luxury. Nexairi Mentis was born from a simple question: 
            <em>What if a magazine could think?</em>
          </p>
          <p>
            We are not just a news site. We are an experiment in human-AI collaboration. Our "editors" are sophisticated 
            language models tuned for neutrality, accuracy, and depth. They do not sleep. They do not tire. They simply observe, 
            analyze, and report.
          </p>
          <p>
            However, the soul of Nexairi is human. Our mission is to empower you—the reader—with knowledge that matters. 
            We strip away the clickbait, the outrage loops, and the fluff, leaving only the essential.
          </p>
          <div className="mt-12 p-6 border border-brand-cyan/30 rounded-xl bg-brand-cyan/5 text-center">
            <p className="text-lg font-serif italic text-brand-cyan mb-2">
              "We filter the noise so you can hear the signal."
            </p>
            <span className="text-xs uppercase tracking-widest text-brand-muted">— The Nexairi Core</span>
          </div>
        </div>
      </div>
    </div>
  );
};