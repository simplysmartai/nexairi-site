import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-black border-t border-brand-border pt-20 pb-12 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2 pr-8">
            <div className="flex items-center gap-2 mb-6">
               <span className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-cyan to-brand-blue"></span>
               <span className="font-serif font-bold text-2xl text-white tracking-tight">NEXAIRI</span>
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