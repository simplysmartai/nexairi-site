
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-black border-t border-brand-border pt-20 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 pr-8">
            <div className="flex items-center gap-4 mb-6">
               {/* Replicated Logo for Footer */}
               <div className="relative scale-75 origin-left">
                 <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow" aria-hidden="true">
                    <defs>
                      <linearGradient id="spiralGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#cbd5e1" />
                      </linearGradient>
                      <linearGradient id="centerGradientFooter" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                    <path d="M50 50 m-40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0" stroke="url(#spiralGradientFooter)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5" />
                    <path d="M50 50 m-30 0 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0" stroke="url(#spiralGradientFooter)" strokeWidth="1.5" strokeDasharray="10 15" />
                    <circle cx="50" cy="50" r="8" fill="none" stroke="url(#centerGradientFooter)" strokeWidth="3" />
                    <circle cx="50" cy="50" r="4" fill="url(#centerGradientFooter)" />
                 </svg>
               </div>
               <div className="flex items-baseline gap-2 leading-none">
                 <span className="font-sans font-bold text-2xl text-gray-200">Nexairi</span>
                 <span className="font-sans text-2xl text-brand-cyan font-light uppercase">Mentis</span>
               </div>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed max-w-sm">
              Nexairi Mentis is an AI-assisted magazine dedicated to curating high-quality insights across technology, lifestyle, and culture. We blend algorithmic efficiency with human editorial oversight for the modern era.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-brand-border pb-2 inline-block">Sections</h4>
            <ul className="space-y-3">
              {['Technology', 'Lifestyle', 'Travel', 'Sports'].map((item) => (
                <li key={item}>
                  <a href={`#${item.toLowerCase()}`} className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-brand-border pb-2 inline-block">Legal</h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Editorial Guidelines', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-500 hover:text-brand-cyan transition-colors text-sm font-medium">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-brand-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Nexairi Mentis. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {/* Social placeholders */}
            {[1, 2, 3].map((i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-full bg-brand-dark border border-brand-border flex items-center justify-center hover:border-brand-cyan hover:bg-brand-cyan/10 transition-all group">
                 <div className="w-4 h-4 bg-gray-500 group-hover:bg-brand-cyan transition-colors"></div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
