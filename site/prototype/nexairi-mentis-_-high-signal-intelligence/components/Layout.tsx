import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  selectedCategory?: string | null;
  onNavigate: (view: string, category?: string) => void;
  onSearch?: (query: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, selectedCategory, onNavigate, onSearch }) => {
  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col font-sans overflow-x-hidden selection:bg-brand-cyan selection:text-brand-black">
      {/* Global Background Grid & Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:50px_50px] opacity-[0.07]"></div>
        <div className="absolute inset-0 bg-cyber-gradient opacity-80"></div>
      </div>

      {/* Semantic Page Structure */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onNavigate={onNavigate} currentView={currentView} selectedCategory={selectedCategory} />
        
        <main id="main-content" className="flex-grow focus:outline-none" tabIndex={-1} role="main">
          {children}
        </main>

        <Footer onSearch={onSearch} />
      </div>
    </div>
  );
};
