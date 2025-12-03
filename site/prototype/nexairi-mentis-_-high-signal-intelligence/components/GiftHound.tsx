
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { siteConfig } from '../config';

interface GiftHoundProps {
  onBack: () => void;
}

export const GiftHound: React.FC<GiftHoundProps> = ({ onBack }) => {
  const [mode, setMode] = useState<'form' | 'chat'>('form');
  const [step, setStep] = useState<'input' | 'loading' | 'results'>('input');
  const hasApiKey = !!process.env.API_KEY;
  
  // Form State
  const [formData, setFormData] = useState({
    recipient: 'Partner',
    age: '',
    interests: '',
    budget: '$50-100',
    vibe: 'Practical',
  });

  // Chat State
  const [chatInput, setChatInput] = useState('');

  const [suggestions, setSuggestions] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateGifts = async () => {
    setStep('loading');
    try {
      if (!process.env.API_KEY) throw new Error("Missing API Key");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      let context = "";
      if (mode === 'form') {
        context = `Recipient: ${formData.recipient}, Age: ${formData.age}, Budget: ${formData.budget}, Vibe: ${formData.vibe}, Interests: ${formData.interests}`;
      } else {
        context = `User Request: "${chatInput}"`;
      }

      const prompt = `
        You are "Gift Hound," an expert personal shopper.
        Suggest 5 specific, high-quality gift ideas based on this context:
        ${context}

        STRICT RULES:
        1. Never guess URLs.
        2. You MUST return a valid Amazon ASIN for each product.
        3. Do NOT generate full links in the JSON, only the ASIN.
        4. If you cannot find a valid ASIN, do not suggest the product.
        
        OUTPUT JSON (Strict):
        {
          "ideas": [
            { "product_name": "String", "reason": "String", "estimated_price": "String", "asin": "String" }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setSuggestions(data.ideas);
        setStep('results');
      }
    } catch (error) {
      console.error("AI Error", error);
      alert("Gift retrieval failed.");
      setStep('input');
    }
  };

  const getAmazonLink = (asin: string) => {
    const tag = siteConfig.affiliates.amazonTag || 'nexairimentis-20';
    return `https://www.amazon.com/dp/${asin}/?tag=${tag}`;
  };

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <button onClick={onBack} className="text-brand-cyan hover:text-white text-sm mb-2 flex items-center gap-2">← Back to Sandbox</button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            Gift Hound 
            <span className="text-lg bg-brand-cyan text-brand-black px-2 py-1 rounded font-mono">BETA</span>
          </h1>
          <p className="text-brand-muted">The context-aware gifting engine. No more generic candles.</p>
        </div>
      </div>

      {step === 'loading' ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 border-4 border-brand-cyan border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-bold text-white">Sniffing out the best deals...</h3>
        </div>
      ) : step === 'results' ? (
        <div>
          <div className="grid grid-cols-1 gap-6">
            {suggestions.map((item, idx) => (
              <div key={idx} className="bg-brand-dark/40 border border-brand-border rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start hover:border-brand-cyan/30 transition-all">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{item.product_name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{item.reason}</p>
                  <div className="flex gap-4 items-center">
                    <span className="text-xs font-mono text-brand-cyan bg-brand-black/50 px-2 py-1 rounded">{item.estimated_price}</span>
                    <a 
                      href={getAmazonLink(item.asin)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-brand-text text-brand-black font-bold text-xs uppercase tracking-widest rounded hover:bg-brand-cyan transition-colors"
                    >
                      Buy on Amazon
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep('input')} className="mt-8 w-full py-4 border border-brand-border text-brand-muted hover:text-white font-bold uppercase tracking-widest rounded transition-colors">
            Start New Search
          </button>
        </div>
      ) : (
        <div className="bg-brand-dark/30 border border-brand-border rounded-2xl p-8 backdrop-blur-sm">
          
          {!hasApiKey && (
             <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
               <strong>System Offline:</strong> Please configure a valid API Key in the environment settings to use generative features.
             </div>
          )}

          {/* Mode Switcher */}
          <div className="flex border-b border-brand-border mb-8">
            <button 
              onClick={() => setMode('form')}
              className={`flex-1 pb-4 text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'form' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-500 hover:text-white'}`}
            >
              Guided Mode
            </button>
            <button 
              onClick={() => setMode('chat')}
              className={`flex-1 pb-4 text-sm font-bold uppercase tracking-widest transition-colors ${mode === 'chat' ? 'text-brand-cyan border-b-2 border-brand-cyan' : 'text-gray-500 hover:text-white'}`}
            >
              Chat Mode
            </button>
          </div>

          {mode === 'form' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Who is it for?</label>
                  <input type="text" name="recipient" value={formData.recipient} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="e.g. Dad, Best Friend, Boss" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Age (Approx)</label>
                  <input type="text" name="age" value={formData.age} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" placeholder="e.g. 30s" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase mb-2">Interests & Hobbies</label>
                <textarea name="interests" value={formData.interests} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50" rows={3} placeholder="e.g. Cooking, Star Wars, Gardening, Coffee..." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Budget Range</label>
                  <select name="budget" value={formData.budget} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50">
                    <option value="$0-25">Under $25</option>
                    <option value="$25-50">$25 - $50</option>
                    <option value="$50-100">$50 - $100</option>
                    <option value="$100-250">$100 - $250</option>
                    <option value="$250+">$250+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 uppercase mb-2">Vibe</label>
                  <select name="vibe" value={formData.vibe} onChange={handleInputChange} disabled={!hasApiKey} className="w-full bg-brand-black border border-brand-border rounded p-3 text-white focus:border-brand-cyan outline-none disabled:opacity-50">
                    <option value="Practical">Practical / Useful</option>
                    <option value="Sentimental">Sentimental / Meaningful</option>
                    <option value="Funny">Funny / Gag Gift</option>
                    <option value="Luxury">Luxury / Treat</option>
                    <option value="Experience">Experience / Consumable</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">Describe the situation</label>
              <textarea 
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                disabled={!hasApiKey}
                className="w-full bg-brand-black border border-brand-border rounded p-4 text-white focus:border-brand-cyan outline-none h-48 disabled:opacity-50"
                placeholder="Example: I need a gift for my sister who just moved into a new apartment. She loves plants but kills them, drinks tea, and likes mid-century modern style. Budget is around $50." 
              />
            </div>
          )}

          <button 
            onClick={generateGifts}
            disabled={!hasApiKey}
            className={`w-full mt-8 py-4 font-bold uppercase tracking-widest rounded-lg transition-all ${
              hasApiKey
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-purple-500/20'
                : 'bg-brand-border text-gray-500 cursor-not-allowed'
            }`}
          >
            Find Perfect Gifts
          </button>
        </div>
      )}
    </div>
  );
};