
import React, { useState, useCallback, useEffect } from 'react';

interface AppCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'Live' | 'In Development' | 'Concept';
  color: string;
}

const AppCard: React.FC<AppCardProps> = ({ title, description, icon, status, color }) => (
  <div className="group relative p-8 bg-brand-dark/50 rounded-2xl border border-brand-border hover:border-brand-cyan/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 overflow-hidden">
    
    {/* Hover Glow Effect */}
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
      
      <button className="w-full py-3 rounded-lg border border-brand-border text-sm font-bold uppercase tracking-widest text-brand-text hover:bg-brand-cyan hover:text-brand-black hover:border-transparent transition-all duration-200">
        Launch Application
      </button>
    </div>
  </div>
);

// --- MIGRATION LOGIC ---
const parseHtmlFile = (content: string, filename: string) => {
  // 1. Title
  const titleMatch = content.match(/<title>(.*?)<\/title>/i) || content.match(/<h1>(.*?)<\/h1>/i);
  const title = titleMatch ? titleMatch[1].replace(' - Nexairi', '').trim() : filename.replace('.html', '').replace(/-/g, ' ');

  // 2. Date
  const dateMatch = content.match(/(\w{3} \d{1,2}, \d{4})/); 
  const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // 3. Category
  let category = 'Technology';
  const lower = content.toLowerCase();
  if (lower.includes('lifestyle')) category = 'Lifestyle';
  if (lower.includes('travel')) category = 'Travel';
  if (lower.includes('sports')) category = 'Sports';

  // 4. Image
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  const imageUrl = imgMatch ? imgMatch[1] : 'https://picsum.photos/seed/tech/800/600';

  // 5. Excerpt
  const pMatch = content.match(/<p>(.*?)<\/p>/);
  const excerpt = pMatch ? pMatch[1].replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : 'Click to read more.';

  return {
    id: filename.replace('.html', ''),
    title,
    slug: filename.replace('.html', ''),
    excerpt,
    category,
    author: 'Nexairi AI',
    date,
    imageUrl,
    content // Store full HTML
  };
};

export const Sandbox: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if ?admin=true is in the URL
    const params = new URLSearchParams(window.location.search);
    setIsAdmin(params.get('admin') === 'true');
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
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
        // Create JSON blob
        const jsonString = JSON.stringify(posts, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = 'posts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setProcessedCount(posts.length);
        alert(`Successfully converted ${posts.length} files! The posts.json file has been downloaded.`);
      }
    }
  }, []);

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <span className="text-brand-cyan font-mono text-sm tracking-widest uppercase mb-2 block">Nexairi Labs</span>
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">The Sandbox</h1>
        <p className="text-xl text-brand-muted max-w-2xl mx-auto">
          A testing ground for our experimental AI-driven micro-applications. Bridging practical utility with algorithmic efficiency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        <AppCard 
          title="AI Gift Finder"
          description="Stop guessing. Our context-aware engine analyzes recipient interests, relationship dynamics, and budget constraints to recommend the statistically perfect gift."
          status="Concept"
          color="bg-purple-600"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          }
        />
        
        <AppCard 
          title="K9 Activity Planner"
          description="Tailored exercise regimens for your dog based on breed genetics, age, local weather, and your personal schedule. Optimize your pet's health with data."
          status="In Development"
          color="bg-orange-500"
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />

        <AppCard 
          title="Travel Itinerary Gen"
          description="Input your destination and interests. Output a minute-by-minute schedule optimized for travel time, crowd levels, and personal energy metrics."
          status="Concept"
          color="bg-blue-500"
          icon={
             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          }
        />
      </div>

      {/* Developer Tools Section - Only visible if isAdmin is true */}
      {isAdmin && (
        <div className="border-t border-brand-border pt-16">
          <div className="flex items-center justify-center gap-2 mb-8">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
             <h2 className="text-2xl font-bold text-white text-center">Admin Controls</h2>
          </div>
          
          <div className="max-w-2xl mx-auto bg-brand-dark/30 rounded-2xl border border-brand-border p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-blue/20 rounded-lg text-brand-blue">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Legacy Content Migrator</h3>
                <p className="text-xs text-gray-500">Convert old HTML files to Nexairi JSON format</p>
              </div>
            </div>

            <div 
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragActive ? 'border-brand-cyan bg-brand-cyan/5' : 'border-brand-border hover:border-brand-muted hover:bg-brand-black/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <p className="text-gray-400 font-mono text-sm mb-2">
                {processedCount > 0 
                  ? `✅ Processed ${processedCount} files successfully!` 
                  : "Drag & Drop your .html files here"}
              </p>
              <p className="text-xs text-gray-600">
                We'll parse the title, date, and content automatically.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
