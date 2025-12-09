import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import { ArrowRight, Zap } from 'lucide-react';

interface HeroProps {
  featured: Post[];
}

export const Hero: React.FC<HeroProps> = ({ featured }) => {
  if (featured.length === 0) return null;

  const mainPost = featured[0];
  const secondaryPosts = featured.slice(1, 3);

  return (
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="text-yellow-400 fill-current" size={20} />
        <h2 className="text-sm font-mono uppercase tracking-widest text-brand-muted">Curated by AI</h2>
        <div className="h-[1px] flex-grow bg-white/10"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[500px]">
        {/* Main Feature */}
        <Link 
          to={`/article/${mainPost.category}/${mainPost.slug}`}
          className="lg:col-span-2 relative group rounded-2xl overflow-hidden border border-white/5 hover:border-brand-cyan/30 transition-all min-h-[400px]"
        >
          <img 
            src={mainPost.imageUrl} 
            alt={mainPost.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/60 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full max-w-2xl">
            <span className="inline-block px-3 py-1 mb-4 text-xs font-bold tracking-wider text-black bg-brand-cyan rounded-sm">
              TOP STORY
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight group-hover:text-brand-cyan transition-colors">
              {mainPost.title}
            </h1>
            <p className="text-base md:text-lg text-gray-300 mb-6 font-serif line-clamp-2 max-w-xl">
              {mainPost.summary}
            </p>
            <div className="flex items-center text-sm font-medium text-white/80 gap-2">
              <span>Read Analysis</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Secondary Stack */}
        <div className="flex flex-col gap-6">
          {secondaryPosts.map((post) => (
             <Link 
             key={post.slug}
             to={`/article/${post.category}/${post.slug}`}
             className="flex-1 relative group rounded-2xl overflow-hidden border border-white/5 hover:border-brand-cyan/30 min-h-[200px]"
           >
             <img 
               src={post.imageUrl} 
               alt={post.title} 
               className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-transparent"></div>
             
             <div className="absolute bottom-0 left-0 p-6">
               <span className="text-xs font-bold text-brand-cyan uppercase tracking-wider mb-2 block">
                 {post.category}
               </span>
               <h3 className="text-xl font-bold text-white leading-snug group-hover:text-brand-cyan transition-colors line-clamp-2">
                 {post.title}
               </h3>
             </div>
           </Link>
          ))}
        </div>
      </div>
    </section>
  );
};