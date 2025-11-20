import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="relative pt-40 pb-20 md:pt-56 md:pb-32 overflow-hidden">
      {/* Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-brand-cyan/30 bg-brand-cyan/10 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse"></span>
          <span className="text-xs font-bold tracking-widest text-brand-cyan uppercase">
            AI-Assisted • Human-Approved
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white tracking-tight mb-6 leading-tight drop-shadow-xl">
          Intelligence for the <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-blue-500 to-purple-600 animate-gradient-x">
            Modern Mind
          </span>
        </h1>
        
        <p className="mt-6 max-w-2xl mx-auto text-xl text-brand-muted mb-12 font-light leading-relaxed">
          Exploring the intersection of technology, lifestyle, and the human experience through an advanced, algorithmically curated editorial lens.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center nx-cta">
          <a 
            href="#latest" 
            className="w-full sm:w-auto px-8 py-4 bg-brand-cyan text-brand-black font-bold rounded-lg hover:bg-cyan-300 transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:-translate-y-1"
          >
            Read Latest
          </a>
          <a 
            href="#about" 
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-brand-border text-brand-text font-medium rounded-lg hover:bg-brand-dark/50 hover:border-brand-cyan/50 hover:text-white transition-all duration-200 backdrop-blur-sm nx-btn--ghost"
          >
            Our Process
          </a>
        </div>
      </div>

      {/* Digital Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
         {/* Grid Overlay */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         
         {/* Glowing Orbs */}
         <div className="absolute -top-24 left-1/4 w-[500px] h-[500px] bg-brand-blue/20 rounded-full blur-[120px] animate-pulse-glow"></div>
         <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-brand-cyan/10 rounded-full blur-[120px]"></div>
         
         {/* Tech Lines */}
         <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-border to-transparent opacity-50"></div>
         <div className="absolute top-0 left-1/2 h-full w-px bg-gradient-to-b from-transparent via-brand-border to-transparent opacity-50"></div>
      </div>
    </section>
  );
};