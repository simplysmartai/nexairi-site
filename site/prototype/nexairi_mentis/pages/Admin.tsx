import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Terminal, Activity, Database, Play, AlertTriangle } from 'lucide-react';

export const Admin: React.FC = () => {
  const { aiStatus, triggerIngest } = useStore();
  const [logs, setLogs] = useState<string[]>([
    "[SYSTEM] Nexairi Core initialized.",
    "[NETWORK] Connected to global content streams.",
    "[AGENT-1] Scanning TechCrunch RSS...",
    "[AGENT-2] Analyzing NFL box scores...",
    "[DB] Cache revalidated successfully."
  ]);

  const handleTrigger = async (category: string) => {
    setLogs(prev => [`[USER] Manually triggered ingest: ${category}`, ...prev]);
    await triggerIngest(category);
    setLogs(prev => [`[SUCCESS] ${category} content generated and deployed.`, ...prev]);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-red-900/20 rounded-lg border border-red-500/50">
           <Terminal className="text-red-500" size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-mono font-bold text-white">Nexairi Command Node</h1>
          <p className="text-gray-500 font-mono text-sm">Restricted Access // Level 5</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Status Panel */}
        <div className="bg-[#111625] border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-mono text-brand-cyan uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity size={16} /> System Metrics
          </h2>
          <div className="space-y-6">
            <div>
               <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Agent Load</span>
                  <span className="text-white font-mono">{aiStatus.activeAgents}/10</span>
               </div>
               <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-cyan transition-all duration-500" style={{ width: `${(aiStatus.activeAgents / 10) * 100}%` }}></div>
               </div>
            </div>
            <div>
               <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">System Health</span>
                  <span className="text-green-400 font-mono">98.4%</span>
               </div>
               <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '98.4%' }}></div>
               </div>
            </div>
            <div className="p-4 bg-black/40 rounded border border-white/5 font-mono text-xs text-brand-muted">
               <p>Current Task:</p>
               <p className="text-brand-cyan animate-pulse">{aiStatus.currentTask}</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-[#111625] border border-white/10 rounded-xl p-6">
          <h2 className="text-sm font-mono text-brand-cyan uppercase tracking-widest mb-6 flex items-center gap-2">
            <Database size={16} /> Manual Ingest Triggers
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {['Sports', 'Technology', 'Travel', 'Lifestyle'].map(cat => (
              <button 
                key={cat}
                onClick={() => handleTrigger(cat)}
                className="flex flex-col items-center justify-center p-4 border border-white/5 hover:border-brand-cyan/50 bg-white/5 hover:bg-brand-cyan/5 rounded-lg transition-all group"
              >
                <Play size={24} className="text-gray-500 group-hover:text-brand-cyan mb-2" />
                <span className="text-sm font-medium text-gray-300 group-hover:text-white">{cat}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 p-4 bg-yellow-900/10 border border-yellow-500/20 rounded flex gap-3">
             <AlertTriangle className="text-yellow-500 shrink-0" size={20} />
             <p className="text-xs text-yellow-200/80">Manual triggers bypass scheduled content queues. Use only for breaking news events.</p>
          </div>
        </div>

        {/* Logs */}
        <div className="lg:col-span-1 bg-black font-mono text-xs p-4 rounded-xl border border-white/10 h-[400px] overflow-y-auto custom-scrollbar">
           {logs.map((log, i) => (
             <div key={i} className="mb-2 border-b border-white/5 pb-1">
               <span className="text-green-500 mr-2">{new Date().toLocaleTimeString()}</span>
               <span className="text-gray-300">{log}</span>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
};