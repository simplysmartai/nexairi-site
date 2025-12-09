import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../types';
import { Clock, Tag } from 'lucide-react';

interface PostCardProps {
  post: Post;
  variant?: 'standard' | 'compact';
}

export const PostCard: React.FC<PostCardProps> = ({ post, variant = 'standard' }) => {
  const isCompact = variant === 'compact';
  
  // Determine if post is fresh (less than 24 hours)
  const isFresh = (new Date().getTime() - new Date(post.date).getTime()) < (24 * 60 * 60 * 1000);

  return (
    <Link 
      to={`/article/${post.category}/${post.slug}`}
      className={`group block bg-brand-dark/50 border border-white/5 hover:border-brand-cyan/50 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] flex flex-col h-full`}
    >
      <div className={`relative overflow-hidden ${isCompact ? 'h-32' : 'h-48'}`}>
        <img 
          src={post.imageUrl} 
          alt={post.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-transparent opacity-80" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-[10px] uppercase tracking-wider font-bold bg-brand-black/80 backdrop-blur text-brand-cyan rounded border border-brand-cyan/20">
            {post.category}
          </span>
        </div>

        {/* Freshness Badge */}
        {isFresh && (
          <div className="absolute top-3 right-3 animate-pulse">
             <span className="px-2 py-1 text-[10px] uppercase font-bold bg-green-500/20 text-green-400 rounded border border-green-500/20 flex items-center gap-1">
                New
             </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <h3 className={`font-sans font-semibold text-gray-100 mb-2 group-hover:text-brand-cyan transition-colors ${isCompact ? 'text-sm' : 'text-lg'}`}>
          {post.title}
        </h3>
        
        {!isCompact && (
          <p className="text-sm text-gray-400 font-serif line-clamp-3 mb-4 flex-grow leading-relaxed">
            {post.summary}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-brand-muted border-t border-white/5 pt-3">
           <div className="flex items-center gap-1">
             <Clock size={12} />
             <span>{post.readingTime} min read</span>
           </div>
           <span className="opacity-50">{new Date(post.date).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
};