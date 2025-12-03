
import React from 'react';
import { AdUnit } from './AdUnit';
import { BlogPost } from '../types';

interface SidebarProps {
  posts: BlogPost[];
}

export const Sidebar: React.FC<SidebarProps> = ({ posts }) => {
  // Get recent posts (excluding featured)
  const recentPosts = posts.filter(p => !p.isFeatured).slice(0, 5);

  return (
    <aside className="space-y-12 sticky top-28">
      
      {/* Ad Placement - Top Sidebar */}
      <AdUnit size="medium" />

      {/* Recent Intelligence */}
      <div>
        <div className="flex items-center justify-between mb-6 border-b border-brand-border pb-2">
          <h3 className="font-mono text-xs font-bold text-brand-cyan uppercase tracking-widest">Recent Intelligence</h3>
          <span className="w-1.5 h-1.5 bg-brand-blue rounded-full animate-pulse"></span>
        </div>
        <ul className="space-y-6">
          {recentPosts.map((post, idx) => (
            <li key={post.id} className="group cursor-pointer">
              <a href={`#${post.slug}`} className="flex items-baseline gap-4">
                <span className="text-2xl font-bold text-brand-border group-hover:text-brand-cyan/50 transition-colors font-serif italic">
                  0{idx + 1}
                </span>
                <div>
                  <span className={`text-[10px] uppercase tracking-wider mb-1 block ${post.series ? 'text-orange-400' : 'text-gray-500'}`}>
                    {post.category}
                  </span>
                  <h4 className="text-gray-300 group-hover:text-white transition-colors font-medium leading-tight text-sm">
                    {post.title}
                  </h4>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Newsletter Widget */}
      <div className="p-6 border border-brand-border bg-brand-dark/50 backdrop-blur-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/10 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-100"></div>
        
        <h3 className="font-serif font-bold text-xl text-white mb-2 relative z-10">The Neural Feed</h3>
        <p className="text-sm text-gray-400 mb-4 relative z-10">Weekly intelligence delivered to your cortex.</p>
        <div className="flex gap-2 relative z-10">
          <input 
            type="email" 
            placeholder="Email address" 
            className="bg-brand-black border border-brand-border text-sm px-3 py-2 w-full text-white focus:border-brand-cyan focus:outline-none transition-colors"
          />
          <button className="px-3 py-2 bg-brand-cyan text-brand-black font-bold uppercase text-xs hover:bg-cyan-300 transition-colors">
            Join
          </button>
        </div>
      </div>

      {/* Topics Cloud */}
      <div>
        <h3 className="font-mono text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-brand-border pb-2">
          Exploration Zones
        </h3>
        <div className="flex flex-wrap gap-2">
          {['Gratitude', 'Holiday Tech', 'Smart Home', 'Digital Detox', 'Bio-Hacking', 'Remote Work', 'Space Tech'].map(tag => (
            <span key={tag} className="px-3 py-1 border border-brand-border text-xs text-gray-400 hover:border-brand-cyan hover:text-brand-cyan cursor-pointer transition-colors uppercase tracking-wide bg-brand-black/50">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
};
