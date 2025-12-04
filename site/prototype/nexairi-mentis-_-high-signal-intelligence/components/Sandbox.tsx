
import React, { useState, useCallback, useEffect } from 'react';
import { FALLBACK_POST_IMAGE } from '../constants/media';

interface AppCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'Live' | 'In Development' | 'Concept';
  color: string;
  onLaunch?: () => void;
}

const AppCard: React.FC<AppCardProps> = ({ title, description, icon, status, color, onLaunch }) => (
  <div className="group relative p-8 bg-brand-dark/50 rounded-2xl border border-brand-border hover:border-brand-cyan/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 overflow-hidden flex flex-col h-full">
    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-cyan/10 to-transparent rounded-full blur-3xl -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-6 shadow-lg text-white`}>
        {icon}
      </div>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold text-white group-hover:text-brand-cyan transition-colors">{title}</h3>
        <span className={`text-xs font-bold uppercase px-2 py-1 rounded bg-brand-black border border-brand-border ${status === 'Live' ? 'text-green-400' : 'text-yellow-400'}`}>
          {status}
        </span>
      </div>
      <p className="text-brand-muted mb-8 leading-relaxed flex-1">
        {description}
      </p>
      <button 
        onClick={onLaunch}
        className="w-full py-3 rounded-lg border border-brand-border text-sm font-bold uppercase tracking-widest text-brand-text hover:bg-brand-cyan hover:text-brand-black hover:border-transparent transition-all duration-200 mt-auto"
      >
        Initialize System
      </button>
    </div>
  </div>
);

// HTML Parsing Logic
const parseHtmlFile = (content: string, filename: string) => {
  const titleMatch = content.match(/<title>(.*?)<\/title>/i) || content.match(/<h1>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(' - Nexairi', '').trim() : filename.replace('.html', '').replace(/-/g, ' ');
  const dateMatch = content.match(/(\w{3} \d{1,2}, \d{4})/); 
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  let category = 'Technology';
  const lower = content.toLowerCase();
  if (lower.includes('lifestyle')) category = 'Lifestyle';
  if (lower.includes('travel')) category = 'Travel';
  if (lower.includes('sports')) category = 'Sports';
  let cleanContent = content;
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) cleanContent = bodyMatch[1];
  const articleMatch = cleanContent.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) cleanContent = `<article>${articleMatch[1]}</article>`;
  
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  let imageUrl = imgMatch ? imgMatch[1] : FALLBACK_POST_IMAGE;
  
  // Normalize local paths to /Images/
  if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    const imageFile = imageUrl.split('/').pop();
    imageUrl = `/Images/${imageFile}`;
  }

  if (!imageUrl) {
    imageUrl = FALLBACK_POST_IMAGE;
  }

  const pMatch = content.match(/<p>(.*?)<\/p>/);
  const excerpt = pMatch ? pMatch[1].replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : 'Click to read more.';
  return { id: filename.replace('.html', ''), title, slug: filename.replace('.html', ''), excerpt, category, author: 'Nexairi AI', date, imageUrl, content: cleanContent };
};

interface SandboxProps {
  onNavigate?: (view: string) => void;
}

export const Sandbox: React.FC<SandboxProps> = ({ onNavigate }) => {
  const [dragActive, setDragActive] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const hasApiKey = !!process.env.API_KEY;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('admin') === 'true');
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = Array.from(e.dataTransfer.files);
      const posts: any[] = [];
      for (const file of files) {
        if (file.type === 'text/html' || file.name.endsWith('.html')) {
          const text = await file.text();
          const post = parseHtmlFile(text, file.name);
          posts.push(post);
        }
      }
      if (posts.length > 0) {
        const jsonString = JSON.stringify(posts, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'posts.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
        setProcessedCount(posts.length); alert(`Successfully converted ${posts.length} files!`);
      }
    }
  }, []);

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <span className="text-brand-cyan font-mono text-sm tracking-widest uppercase mb-2 block">Nexairi Labs</span>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">The Sandbox</h1>
        <p className="text-xl text-brand-muted max-w-2xl mx-auto">
          Experimental utilities powered by generative intelligence. Bridging practical necessity with algorithmic creativity.
        </p>
        
        {!hasApiKey && (
          <div className="mt-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 inline-flex items-center gap-3">
            <span className="text-yellow-500 text-xl">⚠️</span>
            <div className="text-left">
              <p className="text-yellow-200 text-sm font-bold">AI Features Offline</p>
              <p className="text-yellow-500/80 text-xs">API Key is missing. Apps will run in preview mode.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
        <AppCard 
          title="Pixel Studio"
          description="Visual Synthesis Engine. Access the Nano Banana model to generate high-fidelity, editorial-grade photography instantly."
          status="Live"
          color="bg-pink-600"
          onLaunch={() => onNavigate && onNavigate('sandbox-pixel-studio')}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <AppCard 
          title="Future Focus"
          description="Strategic Admissions Intelligence. A probability engine that maps your academic profile against university datasets to optimize acceptance."
          status="Live"
          color="bg-indigo-600"
          onLaunch={() => onNavigate && onNavigate('sandbox-college-planner')}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M12 14l9-5-9-5-9 5 9 5z" />
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          }
        />
        
        <AppCard 
          title="Happy Hound Plan"
          description="Canine Bio-Rhythm Engine. Generates scientifically tailored exercise regimens based on breed genetics, environment, and energy levels."
          status="Live"
          color="bg-orange-500"
          onLaunch={() => onNavigate && onNavigate('sandbox-happy-hound')}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <AppCard 
          title="Gift Hound"
          description="Predictive Gifting Protocol. Analyze social graphs, interests, and budget constraints to solve the 'what do I buy' dilemma."
          status="Live"
          color="bg-purple-600"
          onLaunch={() => onNavigate && onNavigate('sandbox-gift-hound')}
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          }
        />
      </div>

      {isAdmin && (
        <div className="border-t border-brand-border pt-16">
          <div className="flex items-center justify-center gap-2 mb-8">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
             <h2 className="text-2xl font-bold text-white text-center">Admin Controls</h2>
          </div>
          <div className="max-w-2xl mx-auto bg-brand-dark/30 rounded-2xl border border-brand-border p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-blue/20 rounded-lg text-brand-blue">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              </div>
              <div><h3 className="text-lg font-bold text-white">Legacy Content Migrator</h3><p className="text-xs text-gray-500">Convert old HTML files to JSON</p></div>
            </div>
            <div className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${dragActive ? 'border-brand-cyan bg-brand-cyan/5' : 'border-brand-border hover:border-brand-muted hover:bg-brand-black/50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              <p className="text-gray-400 font-mono text-sm mb-2">{processedCount > 0 ? `✅ Processed ${processedCount} files!` : "Drag & Drop your .html files here"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
