import React from 'react';
import { BlogPost } from '../types';

interface PostCardProps {
  post: BlogPost;
  featured?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, featured = false }) => {
  if (featured) {
    return (
      <article className="group relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-20 p-6 rounded-2xl bg-brand-dark/40 border border-brand-border hover:border-brand-cyan/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-sm">
        <div className="aspect-[16/9] w-full overflow-hidden rounded-xl relative">
          <div className="absolute inset-0 bg-brand-blue/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
          <img 
            src={post.imageUrl} 
            alt={`Cover for ${post.title}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col justify-center relative z-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-cyan border border-brand-cyan/30 bg-brand-cyan/5 rounded-full">
              {post.category}
            </span>
            <time className="text-sm text-brand-muted font-mono">{post.date}</time>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 group-hover:text-brand-cyan transition-colors leading-tight">
            <a href={`/posts/${post.slug}`} className="focus:outline-none">
              <span className="absolute inset-0" aria-hidden="true" />
              {post.title}
            </a>
          </h2>
          <p className="text-lg text-gray-400 mb-6 line-clamp-3 font-light">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600"></div>
             <div className="text-sm font-medium text-gray-300">
              By <span className="text-white">{post.author}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col h-full bg-brand-dark/60 rounded-xl overflow-hidden border border-brand-border hover:border-brand-cyan/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-brand-cyan/10">
      <div className="aspect-[3/2] w-full overflow-hidden bg-brand-dark relative">
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark to-transparent opacity-60 z-10"></div>
        <img 
          src={post.imageUrl} 
          alt=""
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
      </div>
      <div className="flex-1 p-6 flex flex-col relative z-20">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-brand-cyan uppercase tracking-widest">
            {post.category}
          </span>
          <time className="text-xs text-brand-muted font-mono">{post.date}</time>
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-3 leading-tight group-hover:text-brand-cyan transition-colors">
          <a href={`/posts/${post.slug}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {post.title}
          </a>
        </h3>
        <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="mt-auto pt-4 border-t border-brand-border flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Read Article</span>
          <svg className="w-4 h-4 text-brand-cyan transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </article>
  );
};