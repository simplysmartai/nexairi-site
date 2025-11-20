import React, { useState } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PostCard } from './components/PostCard';
import { Footer } from './components/Footer';
import { Sandbox } from './components/Sandbox';
import { BlogPost } from './types';

// Mock Data
const FEATURED_POST: BlogPost = {
  id: '1',
  title: 'The Future of Sustainable AI in Urban Planning',
  slug: 'future-sustainable-ai',
  excerpt: 'How city planners are utilizing next-generation algorithms to reduce carbon footprints and optimize traffic flow without compromising privacy.',
  category: 'Technology',
  author: 'Dr. Elena Vance',
  date: 'Oct 12, 2023',
  imageUrl: 'https://picsum.photos/seed/tech/1200/800'
};

const LATEST_POSTS: BlogPost[] = [
  {
    id: '2',
    title: 'Minimalist Travel: Packing Smart for Long Hauls',
    slug: 'minimalist-travel-packing',
    excerpt: 'A comprehensive guide to reducing luggage weight while maximizing utility on international trips.',
    category: 'Travel',
    author: 'Marcus Chen',
    date: 'Oct 10, 2023',
    imageUrl: 'https://picsum.photos/seed/travel/800/600'
  },
  {
    id: '3',
    title: 'Cognitive Benefits of High-Intensity Interval Training',
    slug: 'hiit-cognitive-benefits',
    excerpt: 'New research suggests short bursts of intense exercise may have neuroprotective effects for aging adults.',
    category: 'Sports',
    author: 'Sarah Jenkins',
    date: 'Oct 08, 2023',
    imageUrl: 'https://picsum.photos/seed/sports/800/600'
  },
  {
    id: '4',
    title: 'Digital Detox: Reclaiming Attention in the Economy of Distraction',
    slug: 'digital-detox-guide',
    excerpt: 'Practical strategies for setting boundaries with technology to improve mental clarity and focus.',
    category: 'Lifestyle',
    author: 'Alex Thorne',
    date: 'Oct 05, 2023',
    imageUrl: 'https://picsum.photos/seed/life/800/600'
  }
];

function App() {
  const [currentView, setCurrentView] = useState('home');

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col font-sans overflow-x-hidden">
      {/* Global Background Grid for the 'AI Digital' feel */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:50px_50px] opacity-[0.07]"></div>
        <div className="absolute inset-0 bg-cyber-gradient opacity-80"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onNavigate={setCurrentView} currentView={currentView} />
        
        <main className="flex-grow">
          {currentView === 'home' ? (
            <>
              <Hero />
              
              <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="latest">
                <div className="mb-12 border-b border-brand-border pb-4 flex justify-between items-end">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="w-2 h-8 bg-brand-cyan rounded-sm"></span>
                    Featured Story
                  </h2>
                </div>
                
                <PostCard post={FEATURED_POST} featured={true} />

                <div className="mb-8 border-b border-brand-border pb-4 flex justify-between items-end mt-24">
                  <h2 className="text-2xl font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="w-2 h-8 bg-brand-blue rounded-sm"></span>
                    Latest Articles
                  </h2>
                  <a href="/posts" className="text-brand-cyan hover:text-cyan-300 text-sm font-bold uppercase tracking-wider transition-colors">View All →</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {LATEST_POSTS.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </section>

              {/* TL;DR Style Guide / Article Demo */}
              <section className="bg-brand-dark/30 py-16 border-y border-brand-border backdrop-blur-sm">
                 <div className="max-w-3xl mx-auto px-4">
                   <div className="flex items-center justify-center gap-2 mb-8">
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                      <h3 className="text-center text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">Article Shell Preview</h3>
                      <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                   </div>
                   
                   <div className="bg-brand-dark/80 p-10 rounded-xl border border-brand-border shadow-2xl mx-auto relative overflow-hidden">
                     {/* Decorative accent */}
                     <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-cyan to-brand-blue"></div>
                     
                     <div className="bg-brand-blue/10 border-l-2 border-brand-cyan p-6 mb-8 rounded-r-lg">
                       <h4 className="text-brand-cyan font-bold text-xs uppercase tracking-widest mb-2">AI Summary • TL;DR</h4>
                       <p className="text-gray-300 text-sm m-0 leading-relaxed">
                         This is the standardized summary block. It uses high contrast text against the dark theme, ensuring readability while maintaining the digital aesthetic.
                       </p>
                     </div>
                     <h2 className="text-2xl font-serif font-bold text-white mb-4">Typography Standards</h2>
                     <p className="text-brand-muted text-lg leading-relaxed">
                       Body text uses <strong>Inter</strong> for high legibility. The dark mode implementation uses off-white (#E2E8F0) to reduce eye strain, with <a href="#" className="text-brand-cyan underline decoration-brand-cyan/30 underline-offset-4 hover:text-white transition-colors">interactive elements</a> clearly distinguished by the brand cyan color.
                     </p>
                   </div>
                 </div>
              </section>
            </>
          ) : (
            <Sandbox />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;