
import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { AdUnit } from './AdUnit';
import { TLDRSlider } from './TLDRSlider';
import { ActionPlanGenerator } from './ActionPlanGenerator';
import { siteConfig } from '../config';

interface PostDetailProps {
  post: BlogPost;
  allPosts: BlogPost[]; // Receive full list for recommendations
}

export const PostDetail: React.FC<PostDetailProps> = ({ post, allPosts }) => {
  const [content, setContent] = useState<string>('');
  const [rawText, setRawText] = useState<string>(''); // Plain text for AI
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setHasError(false);
      
      // 1. Check if content is already inline (Legacy support)
      if (post.content && post.content.length > 100) {
        const cleaned = processContent(post.content);
        setContent(cleaned);
        setRawText(stripTags(cleaned));
        setIsLoading(false);
        return;
      }

      // 2. Try to fetch from static folder
      try {
        const response = await fetch(`/content/${post.slug}.html`);
        if (response.ok) {
          const text = await response.text();
          const cleaned = processContent(text);
          setContent(cleaned);
          setRawText(stripTags(cleaned));
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error("Failed to load article:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [post]);

  const processContent = (html: string) => {
    if (!html) return '';
    let clean = html;
    
    // Extract body if present
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) clean = bodyMatch[1];

    // Extract article if present
    const articleMatch = clean.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) clean = articleMatch[1];

    // Strip duplicate headers that we render via React
    clean = clean.replace(/<header>[\s\S]*?<\/header>/i, ''); 
    clean = clean.replace(/<h1[\s\S]*?<\/h1>/i, ''); 
    clean = clean.replace(/<title[\s\S]*?<\/title>/i, ''); 

    // FIX IMAGE PATHS
    // Remap relative image paths to the /Images/ folder
    clean = clean.replace(/(<img[^>]+src=")([^"]+)(")/gi, (fullMatch, prefix, src, suffix) => {
      if (src.startsWith('http') || src.startsWith('/Images/') || src.startsWith('data:')) {
        return fullMatch;
      }
      const filename = src.split('/').pop();
      return `${prefix}/Images/${filename}${suffix}`;
    });

    // AUTOMATIC AFFILIATE INJECTION
    if (siteConfig.affiliates.amazonTag) {
      const tag = siteConfig.affiliates.amazonTag;
      clean = clean.replace(/href="https?:\/\/(www\.)?amazon\.com\/([^"]*)"/g, (match) => {
        if (match.includes('tag=')) return match; // Don't double tag
        const separator = match.includes('?') ? '&' : '?';
        return `${match.slice(0, -1)}${separator}tag=${tag}"`;
      });
    }

    return clean;
  };

  const stripTags = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }
  
  // Get 5 recommended posts (excluding current) based on category
  const recommendedPosts = allPosts
    .filter(p => p.id !== post.id && p.category === post.category)
    .slice(0, 5);

  if (recommendedPosts.length < 5) {
    const others = allPosts.filter(p => p.id !== post.id && p.category !== post.category).slice(0, 5 - recommendedPosts.length);
    recommendedPosts.push(...others);
  }

  return (
    <div className="pt-32 pb-20 w-full max-w-[1600px] mx-auto">
      {/* Dynamic Style Override for Images */}
      <style>{`
        .magazine-content img {
          max-height: 400px;
          width: auto;
          margin: 2rem auto;
          display: block;
          object-fit: contain;
          border-radius: 0.75rem;
          border: 1px solid rgba(42, 52, 71, 0.5);
        }
      `}</style>
      
      {/* Article Header - Centered */}
      <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 mb-12 md:mb-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="w-2 h-2 bg-brand-cyan rounded-full"></span>
          <span className="text-brand-cyan font-bold uppercase tracking-widest text-xs md:text-sm">
            {post.category}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-[1.2] mb-8">
          {post.title}
        </h1>
        <div className="flex items-center justify-center gap-6 text-xs md:text-sm text-brand-muted font-mono border-t border-brand-border pt-6 inline-block w-full max-w-md mx-auto uppercase tracking-wide">
          <span className="text-white font-bold">{post.author}</span>
          <span className="text-brand-border">•</span>
          <span>{post.date}</span>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Column */}
          <div className="lg:col-span-8 lg:col-start-3">
             
             {/* Featured Image */}
             <div className="mb-12 rounded-xl overflow-hidden border border-brand-border/30">
               <img 
                 src={post.imageUrl} 
                 alt={post.title} 
                 className="w-full h-full object-cover max-h-[500px]"
                 onError={(e) => {
                   e.currentTarget.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600';
                 }} 
               />
             </div>

             {/* AI Tools Section */}
             {!isLoading && !hasError && rawText.length > 100 && (
               <div className="mb-12">
                 <TLDRSlider content={rawText} />
                 {/guide|plan|checklist|how|routine|stack|prep/i.test(post.title) && (
                   <ActionPlanGenerator content={rawText} />
                 )}
               </div>
             )}

             {hasError ? (
               <div className="p-8 border border-red-500/20 bg-red-900/10 rounded-xl text-center">
                 <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
                 <h3 className="text-xl font-bold text-white mb-2">Signal Interrupted</h3>
                 <p className="text-gray-400 max-w-md mx-auto">
                   We could not retrieve the intelligence briefing for this sector. The article content may be missing or the connection was lost.
                 </p>
                 <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-brand-dark border border-brand-border rounded-lg text-sm font-bold uppercase tracking-widest hover:text-white transition-colors">
                   Retry Connection
                 </button>
               </div>
             ) : isLoading ? (
               <div className="space-y-4 animate-pulse">
                 <div className="h-4 bg-brand-dark/50 rounded w-3/4"></div>
                 <div className="h-4 bg-brand-dark/50 rounded w-full"></div>
                 <div className="h-4 bg-brand-dark/50 rounded w-5/6"></div>
               </div>
             ) : (
               <div 
                 className="prose prose-invert prose-lg md:prose-xl max-w-none magazine-content"
                 dangerouslySetInnerHTML={{ __html: content }} 
               />
             )}
             
             {/* Bottom Ad Banner */}
             <AdUnit size="banner" className="mt-16" />

             {/* Curated Top 5 Footer */}
             <div className="mt-24 border-t border-brand-border pt-16">
                <h3 className="text-2xl font-serif font-bold text-white mb-10 text-center">
                   Curated Intelligence
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   {recommendedPosts.map(rec => (
                      <a key={rec.id} href={`#${rec.slug}`} className="group flex gap-5 items-start p-4 rounded-xl hover:bg-brand-dark/30 transition-colors">
                         <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-brand-border/50">
                            <img 
                              src={rec.imageUrl} 
                              alt={rec.title} 
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600';
                              }}
                            />
                         </div>
                         <div>
                            <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-widest mb-2 block">{rec.category}</span>
                            <h4 className="text-sm md:text-base font-bold text-gray-200 group-hover:text-white leading-snug transition-colors line-clamp-2">{rec.title}</h4>
                         </div>
                      </a>
                   ))}
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};
