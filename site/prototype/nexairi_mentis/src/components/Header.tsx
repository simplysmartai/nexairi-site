import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NexairiLogo } from './Logo';
import { useStore } from '../store/useStore';
import { Category } from '../types';
import { Menu, X, ChevronRight } from 'lucide-react';

export const Header: React.FC = () => {
  const { setCategory } = useStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const handleNav = (cat: Category | 'All') => {
    setCategory(cat);
    window.scrollTo(0, 0);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, label, cat, active }: { to: string, label: string, cat?: Category | 'All', active: boolean }) => (
    <Link 
      to={to} 
      onClick={() => cat && handleNav(cat)}
      className={`text-sm font-medium transition-all tracking-wide uppercase relative group py-2 ${active ? 'text-brand-cyan' : 'text-gray-400 hover:text-white'}`}
    >
      {label}
      <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-cyan transition-all duration-300 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}/>
    </Link>
  );

  const MobileNavLink = ({ to, label, cat, active }: { to: string, label: string, cat?: Category | 'All', active: boolean }) => (
    <Link 
      to={to} 
      onClick={() => cat && handleNav(cat)}
      className={`flex items-center justify-between text-2xl font-bold uppercase tracking-wider py-4 border-b border-white/5 ${active ? 'text-brand-cyan' : 'text-gray-300'}`}
    >
      {label}
      {active && <ChevronRight className="text-brand-cyan" />}
    </Link>
  );

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-brand-black/90 backdrop-blur-md border-b border-brand-border shadow-lg shadow-brand-cyan/5 h-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex justify-between items-center h-full">
            {/* Logo component */}
            <div onClick={() => handleNav('All')} className="z-50 relative">
               <NexairiLogo />
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 h-full items-center">
              <NavLink to="/" label="Technology" cat="Technology" active={false} />
              <NavLink to="/" label="Lifestyle" cat="Lifestyle" active={false} />
              <NavLink to="/" label="Travel" cat="Travel" active={false} />
              <NavLink to="/" label="Sports" cat="Sports" active={false} />
              <NavLink to="/mission" label="Our Mission" active={isActive('/mission')} />
              <NavLink to="/_ai" label="Sandbox" active={isActive('/_ai')} />
            </nav>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-gray-300 hover:text-white p-2 z-50 relative"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 bg-brand-black/95 backdrop-blur-xl transition-transform duration-300 md:hidden flex flex-col pt-32 px-6 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="flex flex-col space-y-2">
          <MobileNavLink to="/" label="Home" cat="All" active={location.pathname === '/' && useStore.getState().activeCategory === 'All'} />
          <MobileNavLink to="/" label="Technology" cat="Technology" active={useStore.getState().activeCategory === 'Technology'} />
          <MobileNavLink to="/" label="Lifestyle" cat="Lifestyle" active={useStore.getState().activeCategory === 'Lifestyle'} />
          <MobileNavLink to="/" label="Travel" cat="Travel" active={useStore.getState().activeCategory === 'Travel'} />
          <MobileNavLink to="/" label="Sports" cat="Sports" active={useStore.getState().activeCategory === 'Sports'} />
          <MobileNavLink to="/mission" label="Our Mission" active={isActive('/mission')} />
          <MobileNavLink to="/_ai" label="Sandbox" active={isActive('/_ai')} />
        </nav>

        <div className="mt-auto mb-8 p-6 bg-brand-dark/50 rounded-xl border border-white/5">
           <p className="text-xs text-brand-muted uppercase tracking-widest mb-2">System Status</p>
           <div className="flex items-center gap-2">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <span className="text-sm text-white">All Agents Operational</span>
           </div>
        </div>
      </div>
    </>
  );
};