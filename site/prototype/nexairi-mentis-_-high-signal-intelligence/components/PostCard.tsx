
import React, { useState } from 'react';
import { BlogPost } from '../types';

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, featured = false }) => {
  const [imgError, setImgError] = useState(false);
  const fallbackImage = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600';

  if (featured) {
    return (
      <article className="group relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 relative overflow-hidden rounded-lg border border-brand-border/50">
           <div className="absolute inset-0 bg-gradient-to-t from-brand-black/60 to-transparent z-10 pointer-events-none"></div>
           <img 
             src={imgError ? fallbackImage : post.imageUrl} 
             alt={post.title} 
             onError={() => setImgError(true)}
             className="w-full h-[400px] lg:h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700"
           />
        </div>
        <div className="lg:col-span-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4">
             <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
             <span className="text-xs font-bold uppercase tracking-widest text-brand-cyan">{post.category}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6 leading-tight group-hover:text-brand-cyan transition-colors">
            <a href={`#${post.slug}`} className="focus:outline-none">
              {post.title}
            </a>
          </h2>
          <p className="text-brand-muted mb-8 leading-relaxed border-l-2 border-brand-border pl-4 text-sm md:text-base">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 font-mono uppercase tracking-wider border-t border-brand-border pt-4 w-full">
             <span>By {post.author}</span>
             <span>{post.date}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col h-full border-b border-brand-border/50 pb-8 last:border-0">
      <div className="relative overflow-hidden rounded-lg mb-6 aspect-[3/2] border border-brand-border/30">
        <div className="absolute inset-0 bg-brand-black/10 group-hover:bg-transparent transition-colors z-10"></div>
        <img 
          src={imgError ? fallbackImage : post.imageUrl} 
          alt={post.title} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500 grayscale-[20%] group-hover:grayscale-0"
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue border border-brand-blue/20 px-2 py-0.5 rounded">
            {post.category}
          </span>
          <span className="text-[10px] text-gray-600 font-mono">
            {post.date}
          </span>
        </div>
        
        <h3 className="text-xl font-serif font-bold text-gray-100 mb-3 leading-snug group-hover:text-brand-cyan transition-colors">
          <a href={`#${post.slug}`} className="focus:outline-none">
            {post.title}
          </a>
        </h3>
        
        <p className="text-sm text-brand-muted leading-relaxed line-clamp-3 mb-4 flex-1">
          {post.excerpt}
        </p>
        
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-brand-cyan transition-colors mt-auto">
           <span>Read Analysis</span>
           <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
           </svg>
        </div>
      </div>
    </article>
  );
};
