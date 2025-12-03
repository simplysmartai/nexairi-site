
import React from 'react';

interface StaticPageProps {
  title: string;
  content: React.ReactNode;
}

export const StaticPage: React.FC<StaticPageProps> = ({ title, content }) => {
  return (
    <div className="pt-48 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="mb-12 border-b border-brand-border pb-8">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4">{title}</h1>
      </div>
      <div className="prose prose-invert prose-lg max-w-none text-gray-300">
        {content}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => (
  <div className="pt-48 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
    <div className="mb-12 text-center">
      <span className="text-brand-cyan font-mono text-xs tracking-widest uppercase mb-2 block">Get in Touch</span>
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Contact Intelligence</h1>
      <p className="text-xl text-brand-muted max-w-2xl mx-auto">
        Have a tip, a correction, or an inquiry about our AI models? Deploy a signal below.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="space-y-8">
        <div>
          <h3 className="text-white font-bold text-lg mb-2">Editorial</h3>
          <p className="text-gray-400 text-sm">For pitch decks, press releases, and corrections.</p>
          <a href="mailto:editor@nexairi.com" className="text-brand-cyan hover:text-white transition-colors mt-1 block">editor@nexairi.com</a>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-2">Partnerships</h3>
          <p className="text-gray-400 text-sm">For advertising, syndication, and AI integration.</p>
          <a href="mailto:partners@nexairi.com" className="text-brand-cyan hover:text-white transition-colors mt-1 block">partners@nexairi.com</a>
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-2">Location</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            Nexairi Mentis HQ<br />
            100 Cybernetics Way, Suite 404<br />
            San Francisco, CA 94107
          </p>
        </div>
      </div>

      <form className="space-y-4 bg-brand-dark/30 p-8 rounded-2xl border border-brand-border">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</label>
          <input type="text" className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none transition-colors" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email</label>
          <input type="email" className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none transition-colors" placeholder="jane@example.com" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Message</label>
          <textarea rows={4} className="w-full bg-brand-black border border-brand-border rounded-lg px-4 py-3 text-white focus:border-brand-cyan focus:outline-none transition-colors" placeholder="Transmission content..."></textarea>
        </div>
        <button type="button" className="w-full bg-brand-cyan text-brand-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-white transition-colors">
          Send Transmission
        </button>
      </form>
    </div>
  </div>
);