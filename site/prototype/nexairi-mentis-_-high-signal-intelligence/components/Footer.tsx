
import React, { useState } from 'react';

interface FooterProps {
  onSearch?: (query: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
      // Scroll to top to show results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-brand-black border-t border-brand-border pt-20 pb-12 relative z-10">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="md:col-span-4 pr-8">
            <div className="flex items-center gap-4 mb-6">
               <div className="relative scale-75 origin-left">
                 <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow" aria-hidden="true">
                    <defs>
                      <linearGradient id="spiralGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                      <linearGradient id="centerGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <path d="M50 50 m-40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0" stroke="url(#spiralGradientFooter)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
                    <path d="M50 50 m-30 0 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0" stroke="url(#spiralGradientFooter)" strokeWidth="1.5" strokeDasharray="10 15" />
                    <circle cx="50" cy="50" r="8" fill="none" stroke="url(#centerGradientFooter)" strokeWidth="3" />
                    <circle cx="50" cy="50" r="4" fill="url(#centerGradientFooter)" />
                 </svg>
               </div>
               <div className="flex items-baseline gap-2 leading-none">
                 <span className="font-sans font-bold text-2xl text-gray-200">Nexairi</span>
                 <span className="font-sans text-2xl text-brand-cyan font-light uppercase">Mentis</span>
               </div>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed max-w-sm">
              An AI-assisted intelligence engine dedicated to curating high-signal insights across technology, culture, and lifestyle. We filter the noise so you don't have to.
            </p>
          </div>
          
          {/* Navigation Columns */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-brand-border pb-2 inline-block">The Index</h4>
            <ul className="space-y-3">
              {['Technology', 'Lifestyle', 'Travel', 'Sports'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-brand-border pb-2 inline-block">Protocol</h4>
            <ul className="space-y-3">
              <li><a href="#mission" className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium block">Mission Data</a></li>
              <li><a href="#privacy" className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium block">Data Privacy</a></li>
              <li><a href="#terms" className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium block">Terms of Service</a></li>
              <li><a href="#editorial" className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium block">Editorial Standards</a></li>
              <li><a href="#contact" className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium block">Signal Us</a></li>
            </ul>
          </div>

          {/* Search Column */}
          <div className="md:col-span-4">
             <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-brand-border pb-2 inline-block">Neural Search</h4>
             <form onSubmit={handleSearchSubmit} className="relative">
                <input 
                  type="text" 
                  placeholder="Query the database..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-brand-border rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:border-brand-cyan focus:outline-none focus:ring-1 focus:ring-brand-cyan transition-all placeholder-gray-600"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-brand-cyan transition-colors"
                  aria-label="Search"
                >
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </button>
             </form>
             <div className="mt-6">
                <p className="text-xs text-gray-600 mb-2">Trending Vectors:</p>
                <div className="flex flex-wrap gap-2">
                   {['AI', 'Holiday', 'Travel', 'Tech'].map(tag => (
                      <button 
                        key={tag}
                        onClick={() => { if(onSearch) { onSearch(tag); window.scrollTo(0,0); } }}
                        className="text-[10px] font-bold uppercase tracking-wider text-brand-muted hover:text-brand-cyan bg-brand-dark/30 px-2 py-1 rounded border border-brand-border hover:border-brand-cyan transition-all"
                      >
                         {tag}
                      </button>
                   ))}
                </div>
             </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600 font-mono">
            &copy; {new Date().getFullYear()} Nexairi Mentis. Human curiosity, amplified.
          </p>
          <div className="flex gap-6 items-center">
             <a href="#sitemap" className="text-xs text-gray-600 hover:text-brand-cyan uppercase tracking-wider font-bold">System Map</a>
             <a href="/sitemap.xml" className="text-xs text-gray-600 hover:text-brand-cyan uppercase tracking-wider font-bold">XML Feed</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
