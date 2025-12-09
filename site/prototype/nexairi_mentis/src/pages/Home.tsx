import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Hero } from '../components/Hero';
import { PostCard } from '../components/PostCard';
import { AdUnit } from '../components/AdUnit';
import { SEO } from '../components/SEO';
import { Post } from '../types';
import InfiniteScroll from 'react-infinite-scroll-component';

const PAGE_SIZE = 6;

export const Home: React.FC = () => {
  const { posts, activeCategory, isLoading } = useStore();
  const [displayPosts, setDisplayPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const location = useLocation();

  // Parse search query
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('q')?.toLowerCase();

  // Filter posts based on category AND search
  const filteredPosts = posts.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery) || 
      p.summary.toLowerCase().includes(searchQuery) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery));
    
    return matchesCategory && matchesSearch;
  });

  const featured = !searchQuery ? filteredPosts.filter(p => p.isFeatured).slice(0, 3) : [];
  // Grid posts are everything excluding the top featured ones (if featured section is shown)
  const gridSource = !searchQuery ? filteredPosts.filter(p => !featured.includes(p)) : filteredPosts;

  // Initialize data when filters or posts change
  useEffect(() => {
    setDisplayPosts(gridSource.slice(0, PAGE_SIZE));
    setHasMore(gridSource.length > PAGE_SIZE);
  }, [posts, activeCategory, searchQuery]);

  const fetchMoreData = () => {
    // Simulate network delay for "AI generation" feel
    setTimeout(() => {
      const currentLength = displayPosts.length;
      const nextSlice = gridSource.slice(currentLength, currentLength + PAGE_SIZE);
      
      setDisplayPosts(prev => [...prev, ...nextSlice]);
      
      if (currentLength + nextSlice.length >= gridSource.length) {
        setHasMore(false);
      }
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin"></div>
          <p className="text-brand-muted animate-pulse">Initializing Feed Protocols...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO />
      
      {/* Featured Section (Hide on search) */}
      {!searchQuery && <Hero featured={featured} />}

      {/* Grid Header */}
      <div className="flex items-end justify-between border-b border-white/10 pb-4 mb-8">
        <div>
           <h2 className="text-3xl font-bold text-white mb-1">
             {searchQuery ? `Search Results: "${searchQuery}"` : (activeCategory === 'All' ? 'Latest Dispatches' : `${activeCategory} Feed`)}
           </h2>
           <p className="text-sm text-brand-muted font-mono">
             {gridSource.length} articles indexed
           </p>
        </div>
      </div>

      {/* Masonry-ish Grid with Infinite Scroll */}
      <InfiniteScroll
        dataLength={displayPosts.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
             {[1, 2, 3].map(i => (
               <div key={i} className="bg-brand-dark/30 rounded-xl h-64 animate-pulse border border-white/5">
                  <div className="h-32 bg-white/5 rounded-t-xl mb-4"></div>
                  <div className="px-4 space-y-2">
                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                    <div className="h-3 bg-white/5 rounded w-full"></div>
                    <div className="h-3 bg-white/5 rounded w-1/2"></div>
                  </div>
               </div>
             ))}
          </div>
        }
        endMessage={
          gridSource.length > 0 && (
            <div className="py-12 text-center">
              <div className="inline-block px-4 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-brand-muted">
                 All feeds synced. No further signals.
              </div>
            </div>
          )
        }
        className="!overflow-visible" 
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </InfiniteScroll>

      {gridSource.length === 0 && (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-gray-500">No content signals detected for this query.</p>
        </div>
      )}

      {/* HOME PAGE AD SPOT - Bottom */}
      <AdUnit slotId="1122334455" />
    </div>
  );
};