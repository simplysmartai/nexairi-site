
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { PostCard } from './components/PostCard';
import { Sidebar } from './components/Sidebar';
import { Sandbox } from './components/Sandbox';
import { StaticPage, ContactPage } from './components/StaticPage';
import { PostDetail } from './components/PostDetail';
import { HappyHound } from './components/HappyHound';
import { CollegePlanner } from './components/CollegePlanner';
import { GiftHound } from './components/GiftHound';
import { PixelStudio } from './components/PixelStudio';
import { SEOHead } from './components/SEOHead';
import { ScrollToTop } from './components/ScrollToTop';
import { BlogPost } from './types';
import { FALLBACK_POST_IMAGE } from './constants/media';

// --- STATIC CONTENT DEFINITIONS ---
const MISSION_CONTENT = (
  <div className="space-y-6">
    <p><strong>Nexairi Mentis</strong> exists at the convergence of biological creativity and synthetic intelligence. We believe the future of publishing isn't about replacing human insight—it's about removing the noise so that insight can be heard.</p>
    
    <h3>The Signal in the Noise</h3>
    <p>Our mission is to curate high-signal intelligence across Technology, Lifestyle, and Travel. We utilize advanced AI agents to process global data streams, identify emerging patterns, and draft initial frameworks. Then, human editors refine, verify, and inject the nuance that machines cannot replicate.</p>
    
    <h3>Our Core Protocols</h3>
    <ul>
      <li><strong>Radical Transparency:</strong> We openly disclose the role of AI in our workflow.</li>
      <li><strong>Signal over Noise:</strong> We respect your attention span. No fluff, just density.</li>
      <li><strong>Hybrid Curiosity:</strong> We explore the edges of what's possible when humans and AI collaborate.</li>
    </ul>
  </div>
);

const PRIVACY_CONTENT = (
  <div className="space-y-6">
    <p>Last updated: Nov 24, 2025</p>
    <p>At Nexairi Mentis, digital sovereignty is a core value. We collect the absolute minimum data necessary to operate this site.</p>
    <h3>Data We Collect</h3>
    <ul>
      <li><strong>Usage Metrics:</strong> We use anonymous, privacy-preserving analytics to understand which articles resonate.</li>
      <li><strong>Functional Cookies:</strong> Only what is strictly required for site operation.</li>
    </ul>
    <h3>Your Rights</h3>
    <p>You have the right to request deletion of any personal data we may hold. Contact us at privacy@nexairi.com.</p>
  </div>
);

const TERMS_CONTENT = (
  <div className="space-y-6">
    <p>By accessing Nexairi Mentis, you agree to these terms. Our content is for informational purposes only.</p>
    <h3>Intellectual Property</h3>
    <p>All content, including text, graphics, and code, is the property of Nexairi Mentis or its content suppliers. You may not reproduce our content without explicit permission.</p>
    <h3>AI Disclaimer</h3>
    <p>Some content on this site is assisted by Artificial Intelligence. While we strive for accuracy, users should verify critical information independently.</p>
  </div>
);

const EDITORIAL_CONTENT = (
  <div className="space-y-6">
    <p>Our editorial process is a hybrid engine of human and machine.</p>
    <h3>The Pipeline</h3>
    <ol>
      <li><strong>AI Discovery:</strong> Our agents scan for trending topics and data anomalies.</li>
      <li><strong>Drafting:</strong> LLMs generate initial structures and summaries.</li>
      <li><strong>Human Review:</strong> Editors verify facts, adjust tone, and ensure ethical alignment.</li>
      <li><strong>Publication:</strong> Content is deployed to our edge network.</li>
    </ol>
    <p>We do not publish AI hallucinations. Fact-checking is a human responsibility.</p>
  </div>
);

const SITEMAP_CONTENT = (posts: BlogPost[]) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    <div>
      <h3 className="text-brand-cyan font-bold mb-4">Main Sections</h3>
      <ul className="space-y-2">
        <li><a href="#" className="hover:text-white">Home</a></li>
        <li><a href="#technology" className="hover:text-white">Technology</a></li>
        <li><a href="#lifestyle" className="hover:text-white">Lifestyle</a></li>
        <li><a href="#travel" className="hover:text-white">Travel</a></li>
        <li><a href="#sports" className="hover:text-white">Sports</a></li>
        <li><a href="#sandbox" className="hover:text-white">Sandbox (Apps)</a></li>
      </ul>
    </div>
    <div>
      <h3 className="text-brand-cyan font-bold mb-4">Latest Articles</h3>
      <ul className="space-y-2 text-sm text-gray-400">
        {posts.slice(0, 20).map(post => (
          <li key={post.id}>
            <a href={`#${post.slug}`} className="hover:text-white">{post.title}</a>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

function App() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingError, setLoadingError] = useState(false);
  
  // Pagination State
  const [visibleCount, setVisibleCount] = useState(9); // Initial number of posts to show

  // Fetch Data on Mount
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/posts.json');
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          console.error("Invalid data format: Expected array", data);
          setLoadingError(true);
        }
      } catch (error) {
        console.error("Error loading content:", error);
        setLoadingError(true);
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Handle hash changes for simple routing
  useEffect(() => {
    if (posts.length === 0) return; // Wait for data

    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      // Specific Pages
      if (['mission', 'privacy', 'terms', 'editorial', 'contact', 'sitemap', 'sandbox', 'sandbox-happy-hound', 'sandbox-college-planner', 'sandbox-gift-hound', 'sandbox-pixel-studio'].includes(hash)) {
        setCurrentView(hash);
        setSelectedCategory(null);
        setSelectedPost(null);
        setSearchQuery('');
        window.scrollTo(0, 0);
        return;
      }

      // Categories
      if (['technology', 'lifestyle', 'travel', 'sports'].includes(hash)) {
        setCurrentView('home');
        setSelectedCategory(hash.charAt(0).toUpperCase() + hash.slice(1));
        setSelectedPost(null);
        setSearchQuery('');
        window.scrollTo(0, 0);
        return;
      }

      // Search View (Internal handling)
      if (hash === 'search') {
        setCurrentView('search');
        setSelectedCategory(null);
        setSelectedPost(null);
        window.scrollTo(0, 0);
        return;
      }

      // Default Home
      if (hash === '' || hash === 'home') {
        setCurrentView('home');
        setSelectedCategory(null);
        setSelectedPost(null);
        setSearchQuery('');
        window.scrollTo(0, 0);
        return;
      }

      // Check if hash is a post slug
      const foundPost = posts.find(p => p.slug === hash);
      if (foundPost) {
        setCurrentView('post');
        setSelectedPost(foundPost);
        setSelectedCategory(null);
        setSearchQuery('');
        window.scrollTo(0, 0);
        return;
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Initial check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [posts]); // Re-run when posts are loaded

  const handleNavigate = (view: string, category?: string) => {
    if (view === 'home' && category) {
      window.location.hash = category.toLowerCase();
    } else if (view === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = view;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    window.location.hash = 'search';
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 9);
  };

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-brand-muted text-sm uppercase tracking-widest animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (loadingError && posts.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center text-center p-4">
        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="text-2xl font-bold text-white mb-2">System Interruption</h1>
        <p className="text-brand-muted max-w-md mx-auto mb-6">We encountered an error loading the intelligence feed. The data link may be corrupted or inaccessible.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-brand-cyan text-brand-black font-bold rounded hover:bg-white transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  // Logic to identify dynamic content
  const featuredPost = posts.find(p => p.isFeatured) || posts[0];
  
  // Find all series (grouping by series name)
  const seriesGroups = posts.reduce((acc, post) => {
    if (post.series) {
      if (!acc[post.series]) acc[post.series] = [];
      acc[post.series].push(post);
    }
    return acc;
  }, {} as Record<string, BlogPost[]>);

  // For the homepage, prioritize the Holiday Shopping series
  const spotlightSeriesName = 'Holiday Shopping';
  const spotlightPosts = (seriesGroups[spotlightSeriesName] || []).sort((a, b) => {
    // Sort by Label if exists, otherwise by date
    if (a.seriesLabel && b.seriesLabel) return a.seriesLabel.localeCompare(b.seriesLabel);
    return 0;
  });

  let filteredPosts = posts;
  
  if (currentView === 'search') {
    const q = searchQuery.toLowerCase();
    filteredPosts = posts.filter(post => 
      post.title.toLowerCase().includes(q) || 
      post.excerpt.toLowerCase().includes(q) ||
      post.category.toLowerCase().includes(q)
    );
  } else if (selectedCategory) {
    filteredPosts = posts.filter(post => post.category.toLowerCase() === selectedCategory.toLowerCase());
  } else {
    // Default Home View: 
    // 1. Filter out featured post (it's in Hero)
    // 2. Filter out active series posts (they are in spotlight)
    // 3. Filter out legacy Thanksgiving posts (optional cleanup)
    filteredPosts = posts
      .filter(post => post.id !== featuredPost?.id && !post.series)
      .filter(post => !post.slug.includes('thanksgiving') && !post.title.toLowerCase().includes('thanksgiving'));
  }

  // Apply Pagination
  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMorePosts = filteredPosts.length > visibleCount;

  // RENDER PAGE CONTENT BASED ON VIEW
  const renderContent = () => {
    // Inject dynamic SEO for every view
    const getSEO = () => {
        if (currentView === 'post' && selectedPost) return <SEOHead post={selectedPost} type="article" />;
        if (selectedCategory) return <SEOHead title={`${selectedCategory} | Nexairi Mentis`} />;
        if (currentView === 'search') return <SEOHead title={`Search: ${searchQuery}`} />;
        return <SEOHead />;
    };

    switch (currentView) {
      case 'mission': return <><SEOHead title="Our Mission" /><StaticPage title="Our Mission" content={MISSION_CONTENT} /></>;
      case 'privacy': return <><SEOHead title="Privacy Policy" /><StaticPage title="Privacy Policy" content={PRIVACY_CONTENT} /></>;
      case 'terms': return <><SEOHead title="Terms of Service" /><StaticPage title="Terms of Service" content={TERMS_CONTENT} /></>;
      case 'editorial': return <><SEOHead title="Editorial Guidelines" /><StaticPage title="Editorial Guidelines" content={EDITORIAL_CONTENT} /></>;
      case 'sitemap': return <><SEOHead title="Site Map" /><StaticPage title="Site Map" content={SITEMAP_CONTENT(posts)} /></>;
      case 'contact': return <><SEOHead title="Contact" /><ContactPage /></>;
      case 'sandbox': return <><SEOHead title="The Sandbox" /><Sandbox onNavigate={handleNavigate} /></>;
      case 'sandbox-happy-hound': return <><SEOHead title="Happy Hound Plan" /><HappyHound onBack={() => handleNavigate('sandbox')} /></>;
      case 'sandbox-college-planner': return <><SEOHead title="Future Focus" /><CollegePlanner onBack={() => handleNavigate('sandbox')} /></>;
      case 'sandbox-gift-hound': return <><SEOHead title="Gift Hound" /><GiftHound onBack={() => handleNavigate('sandbox')} /></>;
      case 'sandbox-pixel-studio': return <><SEOHead title="Pixel Studio" /><PixelStudio onBack={() => handleNavigate('sandbox')} /></>;
      case 'post': return selectedPost ? <><SEOHead post={selectedPost} type="article" /><PostDetail post={selectedPost} allPosts={posts} /></> : <div className="pt-32 text-center">Article not found.</div>;
      case 'search': 
      default: // HOME VIEW & SEARCH VIEW
        return (
          <>
            {getSEO()}
            {currentView === 'home' && !selectedCategory && !searchQuery && <Hero post={featuredPost} />}
            <div className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 ${selectedCategory || currentView === 'search' ? 'pt-48' : 'pt-16'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-9 space-y-16">
                  
                  {/* Header for Category or Search */}
                  {(selectedCategory || currentView === 'search') && (
                    <div className="border-b border-brand-border pb-6 mb-8 animate-fade-in-up">
                       <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">
                         {currentView === 'search' ? `Search Results: "${searchQuery}"` : selectedCategory}
                       </h1>
                       <p className="text-brand-muted text-lg">
                         {currentView === 'search' 
                           ? `Found ${filteredPosts.length} intelligence briefings matching your query.`
                           : `Latest intelligence and analysis in ${selectedCategory?.toLowerCase()}.`
                         }
                       </p>
                    </div>
                  )}

                  {/* Series Spotlight (Only on main home) */}
                  {currentView === 'home' && !selectedCategory && !searchQuery && spotlightPosts.length > 0 && (
                    <section id="series-spotlight" className="relative mb-16">
                      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                          <h2 className="text-3xl font-serif font-bold text-white mb-2">Holiday Shopping Guides</h2>
                          <p className="text-brand-muted text-sm">Curated lists for everyone on your list.</p>
                        </div>
                        <span className="text-brand-cyan text-xs font-bold uppercase tracking-widest border border-brand-cyan/30 px-3 py-1 rounded bg-brand-cyan/5">Signature Collection</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {spotlightPosts.map((post) => {
                          const spotlightImage = post.imageUrl || FALLBACK_POST_IMAGE;
                          return (
                            <a key={post.id} href={`#${post.slug}`} className="group block relative">
                              <div className="relative aspect-[4/3] mb-3 overflow-hidden rounded-lg border border-brand-border group-hover:border-brand-cyan/50 transition-colors">
                                <img
                                  src={spotlightImage}
                                  alt={post.title}
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = FALLBACK_POST_IMAGE;
                                  }}
                                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                />
                              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/90 via-transparent to-transparent"></div>
                              <div className="absolute top-2 left-2">
                                 <span className="bg-brand-black/90 backdrop-blur border border-brand-border/50 text-[10px] font-bold text-brand-cyan px-2 py-1 uppercase tracking-wider rounded shadow-sm group-hover:bg-brand-cyan group-hover:text-black transition-colors">
                                   {post.seriesLabel || 'Guide'}
                                 </span>
                              </div>
                              </div>
                              <h3 className="text-sm font-bold text-gray-200 leading-tight group-hover:text-brand-cyan transition-colors">{post.title}</h3>
                            </a>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Main Feed */}
                  <section id="latest">
                    {!selectedCategory && currentView !== 'search' && (
                      <div className="mb-8 border-b border-brand-border pb-4 flex justify-between items-end">
                        <h2 className="text-xs font-bold text-brand-blue uppercase tracking-[0.2em] flex items-center gap-3">
                          <span className="w-8 h-[2px] bg-brand-blue"></span>
                          Latest Intelligence
                        </h2>
                      </div>
                    )}
                    {displayedPosts.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                          {displayedPosts.map(post => <PostCard key={post.id} post={post} />)}
                        </div>
                        
                        {/* Pagination Button */}
                        {hasMorePosts && (
                          <div className="mt-16 text-center">
                            <button 
                              onClick={handleLoadMore}
                              className="px-8 py-3 border border-brand-border text-brand-text font-bold uppercase tracking-widest text-xs hover:bg-brand-dark hover:border-brand-cyan transition-all"
                            >
                              Load More Intelligence
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-brand-muted">
                        <p className="text-xl mb-4">No articles found.</p>
                        <button onClick={() => {setSearchQuery(''); handleNavigate('home');}} className="text-brand-cyan underline hover:text-white">Return to Home</button>
                      </div>
                    )}
                  </section>
                </div>
                <div className="lg:col-span-3"><Sidebar posts={posts} /></div>
              </div>
            </div>
            <section className="bg-brand-dark/30 py-12 border-t border-brand-border backdrop-blur-sm">
               <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                     <h4 className="text-brand-cyan font-bold text-xs uppercase tracking-widest mb-2">Nexairi Mentis</h4>
                     <p className="text-gray-500 text-sm max-w-md">Where human creativity meets algorithmic precision.</p>
                  </div>
                  <button onClick={() => handleNavigate('sandbox')} className="px-6 py-3 border border-brand-border text-brand-text text-xs font-bold uppercase tracking-widest hover:bg-brand-cyan hover:text-brand-black hover:border-transparent transition-all">Open Sandbox</button>
               </div>
            </section>
          </>
        );
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate} selectedCategory={selectedCategory} onSearch={handleSearch}>
      <ScrollToTop />
      {renderContent()}
    </Layout>
  );
}

export default App;
