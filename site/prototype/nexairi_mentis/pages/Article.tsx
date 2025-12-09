import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { contentService } from '../services/contentService';
import { RecapModal } from '../components/RecapModal';
import { AdUnit } from '../components/AdUnit';
import { ArrowLeft, Calendar, User, Clock, Share2, Sparkles } from 'lucide-react';

export const Article: React.FC = () => {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const { posts } = useStore();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRecap, setShowRecap] = useState(false);

  // Find metadata
  const metadata = posts.find(p => p.slug === slug);

  useEffect(() => {
    const load = async () => {
      if (category && slug && metadata) {
        setLoading(true);
        const html = await contentService.fetchContent(category, slug, metadata.title);
        setContent(html);
        setLoading(false);
      }
    };
    load();
  }, [category, slug, metadata]);

  if (!metadata) {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-white mb-4">Transmission Lost</h2>
            <Link to="/" className="text-brand-cyan hover:underline">Return to Base</Link>
        </div>
    );
  }

  return (
    <article className="min-h-screen pb-20">
      <RecapModal 
        isOpen={showRecap} 
        onClose={() => setShowRecap(false)} 
        content={content} 
        title={metadata.title}
      />

      {/* Hero Header */}
      <div className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden">
        <img src={metadata.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={metadata.title} />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/30 via-transparent to-brand-black"></div>
        
        <div className="absolute bottom-0 left-0 w-full max-w-4xl mx-auto px-4 pb-8 md:pb-12 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-brand-cyan mb-4 md:mb-6 transition-colors text-sm">
            <ArrowLeft size={16} className="mr-2" /> Back to Feed
          </Link>
          
          <div className="flex items-center gap-3 mb-4">
             <span className="px-3 py-1 bg-brand-cyan text-brand-black font-bold text-xs uppercase tracking-wide rounded-sm">
                {metadata.category}
             </span>
             <span className="text-brand-cyan/80 text-xs font-mono uppercase tracking-widest border border-brand-cyan/30 px-2 py-0.5 rounded-full">
                AI Generated
             </span>
          </div>
          
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 md:mb-6 shadow-black drop-shadow-lg">
            {metadata.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-300 font-medium">
             <div className="flex items-center gap-2">
                <User size={16} className="text-brand-cyan" />
                <span>{metadata.author}</span>
             </div>
             <div className="flex items-center gap-2">
                <Calendar size={16} className="text-brand-cyan" />
                <span>{new Date(metadata.date).toLocaleDateString()}</span>
             </div>
             <div className="flex items-center gap-2">
                <Clock size={16} className="text-brand-cyan" />
                <span>{metadata.readingTime} min read</span>
             </div>
          </div>
        </div>
      </div>

      {/* Interaction Bar - Sticky */}
      <div className="sticky top-24 z-30 w-full bg-brand-black/95 backdrop-blur border-b border-white/5 mb-10 shadow-xl">
         <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
            {/* Title hidden on small screens */}
            <div className="hidden md:block text-sm font-semibold text-white/50 truncate max-w-xs md:max-w-md">
                {metadata.title}
            </div>
            {/* Visible on mobile as placeholder */}
            <div className="md:hidden text-xs font-mono text-brand-cyan uppercase tracking-widest">
               Nexairi Reader Mode
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                <button 
                  onClick={() => setShowRecap(true)}
                  className="flex items-center gap-2 px-3 md:px-4 py-1.5 bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/50 rounded-full text-xs font-bold transition-all uppercase tracking-wide"
                >
                    <Sparkles size={14} />
                    <span className="hidden md:inline">Generate Recap</span>
                    <span className="md:hidden">AI Recap</span>
                </button>
                <button className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                    <Share2 size={18} />
                </button>
            </div>
         </div>
      </div>

      {/* Content Body */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* AD SPOT 1: Top of content */}
        <AdUnit slotId="1234567890" />

        {loading ? (
           <div className="space-y-6 animate-pulse mt-8">
              <div className="h-4 bg-white/5 rounded w-full"></div>
              <div className="h-4 bg-white/5 rounded w-full"></div>
              <div className="h-32 bg-white/5 rounded w-full"></div>
              <div className="h-4 bg-white/5 rounded w-2/3"></div>
           </div>
        ) : (
           <div 
             className="prose prose-invert prose-lg prose-cyan max-w-none mt-8 prose-p:leading-relaxed prose-headings:font-sans prose-img:rounded-xl"
             dangerouslySetInnerHTML={{ __html: content }} 
           />
        )}

        {/* AD SPOT 2: Bottom of content */}
        <AdUnit slotId="0987654321" />

        {/* Tags */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Keywords</h4>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-sm text-brand-muted transition-colors cursor-default">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};