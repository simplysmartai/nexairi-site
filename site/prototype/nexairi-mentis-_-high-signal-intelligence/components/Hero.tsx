
import React, { useState } from 'react';
import { BlogPost } from '../types';

interface HeroProps {
  post?: BlogPost;
}

export const Hero: React.FC<HeroProps> = ({ post }) => {
  const [imgError, setImgError] = useState(false);

  // Fallback if no featured post is found
  if (!post) return null;

  return (
    <section className="relative pt-32 pb-16 md:pt-48 md:pb-24 border-b border-brand-border/50">
      {/* Content Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          
          {/* Main Headline Area */}
          <div className="lg:col-span-8">
            <div className="mb-6 flex items-center gap-3">
               <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
               <span className="text-brand-cyan font-mono text-sm uppercase tracking-widest">Featured Analysis</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] mb-8">
              {post.title}
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed max-w-2xl border-l-4 border-brand-cyan pl-6 mb-10">
              {post.excerpt}
            </p>

            <div className="flex flex-col sm:flex-row gap-5 nx-cta">
              <a 
                href={`#${post.slug}`}
                className="px-8 py-3 bg-brand-text text-brand-black font-bold uppercase tracking-wider text-sm hover:bg-brand-cyan transition-colors duration-200"
              >
                Read Deep Dive
              </a>
              <a 
                href="#latest" 
                className="px-8 py-3 border border-brand-border text-brand-text font-bold uppercase tracking-wider text-sm hover:border-brand-cyan hover:text-brand-cyan transition-colors duration-200 nx-btn--ghost"
              >
                Explore The Index
              </a>
            </div>
          </div>

          {/* Dynamic Image Box (Replaces 88% Optimization Box) */}
          <div className="hidden lg:block lg:col-span-4 relative h-full min-h-[400px]">
             <div className="absolute inset-0 border border-brand-border/30 rounded-lg bg-brand-dark/20 backdrop-blur-sm p-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-full w-full border border-brand-border/20 relative overflow-hidden rounded">
                  <img 
                    src={imgError ? '/abstract-bg.png' : post.imageUrl}
                    alt={post.title}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 to-transparent"></div>
                  
                  {/* Caption */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs text-brand-cyan uppercase tracking-widest mb-1">{post.category}</div>
                    <div className="text-white font-bold leading-tight">{post.author}</div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Digital Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/10 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-cyan/5 rounded-full blur-[100px]"></div>
      </div>
    </section>
  );
};
