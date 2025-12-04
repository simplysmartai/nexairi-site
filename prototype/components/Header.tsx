import React, { useState, useEffect } from 'react';
import { NavItem } from '../types';

const NAV_ITEMS: NavItem[] = [
  { label: 'Technology', href: '#technology' },
  { label: 'Lifestyle', href: '#lifestyle' },
  { label: 'Travel', href: '#travel' },
  { label: 'Sports', href: '#sports' },
  { label: 'Sandbox', href: '#sandbox' },
];

interface HeaderProps {
  onNavigate: (view: string, category?: string) => void;
  currentView: string;
  selectedCategory?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, currentView, selectedCategory }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    e.preventDefault();
    if (item.label === 'Sandbox') {
      onNavigate('sandbox');
    } else {
      // Pass the label as the category filter
      onNavigate('home', item.label);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate('home', undefined); // Clear category
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled 
          ? 'bg-brand-black/90 backdrop-blur-md border-brand-border shadow-lg shadow-brand-cyan/5' 
          : 'bg-transparent border-transparent'
      }`}
      role="banner"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-20' : 'h-28'}`}>
          
          {/* Custom Spiral Logo - Side by Side Layout */}
          <a 
            href="/" 
            onClick={handleLogoClick}
            className="flex-shrink-0 group focus:outline-none focus:ring-2 focus:ring-brand-cyan rounded-lg p-1"
            aria-label="Nexairi Mentis Home"
          >
            <div className="flex items-center gap-5">
              {/* Animated Spiral SVG */}
              <div className={`relative ${isScrolled ? 'scale-90' : 'scale-110'} transition-transform duration-300`}>
                 <svg width="56" height="56" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow" aria-hidden="true">
                    <defs>
                      <linearGradient id="spiralGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                      <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <path d="M50 50 m-40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0" stroke="url(#spiralGradient)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
                    <path d="M50 50 m-30 0 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0" stroke="url(#spiralGradient)" strokeWidth="1.5" strokeDasharray="10 15" />
                    <path d="M50 50 m-20 0 a 20 20 0 1 1 40 0 a 20 20 0 1 1 -40 0" stroke="url(#spiralGradient)" strokeWidth="2" strokeDasharray="2 4" />
                    <circle cx="50" cy="50" r="8" fill="none" stroke="url(#centerGradient)" strokeWidth="3" className="animate-pulse" />
                    <circle cx="50" cy="50" r="4" fill="url(#centerGradient)" />
                 </svg>
              </div>
              
              {/* Logo Text - Increased Size */}
              <div className="flex items-baseline gap-2 leading-none">
                <span className="font-sans font-bold text-4xl md:text-5xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 drop-shadow-sm">
                  Nexairi
                </span>
                <span className="font-sans text-4xl md:text-5xl tracking-widest text-brand-cyan font-light uppercase">
                  Mentis
                </span>
              </div>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-10" role="navigation" aria-label="Desktop Navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className={`text-sm font-medium transition-all duration-200 tracking-wide uppercase relative group py-2 ${
                  (item.label === 'Sandbox' && currentView === 'sandbox') || (item.label === selectedCategory)
                    ? 'text-brand-cyan' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-brand-cyan transition-all duration-300 group-hover:w-full ${
                   (item.label === 'Sandbox' && currentView === 'sandbox') || (item.label === selectedCategory) ? 'w-full' : ''
                }`}></span>
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-cyan border border-brand-border"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <nav className="lg:hidden bg-brand-dark border-b border-brand-border shadow-xl absolute w-full backdrop-blur-xl" aria-label="Mobile Navigation">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-brand-cyan hover:bg-brand-black/50"
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};