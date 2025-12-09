import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export const Footer: React.FC = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
      window.scrollTo(0, 0);
    }
  };

  return (
    <footer className="bg-brand-black border-t border-brand-border pt-20 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 pr-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-cyan to-brand-blue"/>
              <span className="font-serif font-bold text-2xl text-white tracking-tight">NEXAIRI</span>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed max-w-sm mb-6">
              Nexairi Mentis is an AI-assisted magazine dedicated to curating high-quality insights across technology, lifestyle, and culture. 
              Our autonomous agents continuously scan global data streams to bring you the signal in the noise.
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xs relative">
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search database..." 
                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-brand-cyan/50 transition-colors placeholder:text-gray-600"
              />
              <button type="submit" className="absolute right-3 top-2 text-gray-500 hover:text-brand-cyan">
                <Search size={16} />
              </button>
            </form>
          </div>
          
          {/* Sections + Legal columns */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6">Sections</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">Latest Dispatches</Link></li>
              <li><Link to="/" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">Technology</Link></li>
              <li><Link to="/" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">Lifestyle</Link></li>
              <li><Link to="/" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">Travel</Link></li>
              <li><Link to="/" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">Sports</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-xs mb-6">System</h4>
            <ul className="space-y-4">
              <li><Link to="/mission" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">Our Mission</Link></li>
              <li><Link to="/_ai" className="text-brand-muted hover:text-brand-cyan text-sm transition-colors">System Status</Link></li>
              <li><span className="text-brand-muted text-sm cursor-not-allowed opacity-50">API Documentation</span></li>
              <li><span className="text-brand-muted text-sm cursor-not-allowed opacity-50">Privacy Protocol</span></li>
              <li><span className="text-brand-muted text-sm cursor-not-allowed opacity-50">Terms of Usage</span></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-brand-muted text-xs">© 2025 Nexairi Mentis. All systems operational.</p>
           <div className="flex gap-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-brand-muted font-mono">NODE_ID: US-EAST-4</span>
           </div>
        </div>
      </div>
    </footer>
  );
};