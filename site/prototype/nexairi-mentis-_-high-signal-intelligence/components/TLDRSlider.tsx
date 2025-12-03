
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface TLDRProps {
  content: string;
}

interface SummaryData {
  skim: string;
  standard: string;
  deep: string;
}

export const TLDRSlider: React.FC<TLDRProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<number>(1); // 0: Skim, 1: Standard, 2: Deep

  const cleanAndParseJSON = (text: string) => {
    try {
      // 1. Try direct parse
      return JSON.parse(text);
    } catch (e) {
      // 2. Try stripping markdown code blocks
      const markdownMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      if (markdownMatch) {
        try {
          return JSON.parse(markdownMatch[1]);
        } catch (e2) { /* continue */ }
      }
      
      // 3. Brute force find the object
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1));
      }
      throw new Error("Could not parse AI response");
    }
  };

  const generateSummary = async () => {
    setIsLoading(true);
    setIsOpen(true);
    setError(null);
    
    try {
      if (!process.env.API_KEY) {
        throw new Error("Missing API Key. Please add API_KEY to Cloudflare Settings > Environment Variables.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the following article text. Generate 3 distinct summaries:
        1. "skim": A single, punchy sentence (max 20 words) capturing the core hook.
        2. "standard": A standard executive summary paragraph (max 60 words).
        3. "deep": A comprehensive breakdown with 3-5 bullet points highlighting key takeaways.
        
        Return ONLY valid JSON in this format: { "skim": "...", "standard": "...", "deep": "..." }
        
        ARTICLE TEXT:
        ${content.substring(0, 20000)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { 
          responseMimeType: "application/json" 
        }
      });

      if (response.text) {
        const data = cleanAndParseJSON(response.text);
        setSummary(data);
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      console.error("Summary generation failed", err);
      setError(err.message || "Failed to generate summary");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !summary) {
    return (
      <button 
        onClick={generateSummary}
        className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-cyan border border-brand-cyan/30 bg-brand-cyan/5 px-4 py-2 rounded-full hover:bg-brand-cyan/20 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI Summarize
      </button>
    );
  }

  return (
    <div className="mb-12 bg-brand-dark/40 border border-brand-border rounded-xl p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 bg-brand-cyan rounded-full animate-pulse"></span>
           <h3 className="text-sm font-bold text-white uppercase tracking-widest">AI Briefing</h3>
        </div>
        {isLoading && <span className="text-xs text-brand-muted animate-pulse">Processing content...</span>}
      </div>

      {error ? (
        <div className="text-red-400 text-sm border border-red-500/30 bg-red-500/10 p-4 rounded">
          <strong>Configuration Error:</strong> {error}
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <div className="h-2 bg-brand-border/50 rounded w-full animate-pulse"></div>
          <div className="h-2 bg-brand-border/50 rounded w-5/6 animate-pulse"></div>
          <div className="h-2 bg-brand-border/50 rounded w-4/6 animate-pulse"></div>
        </div>
      ) : summary ? (
        <div>
          {/* Slider Controls */}
          <div className="mb-6 relative pt-6 pb-2 px-2">
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="1" 
              value={level} 
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="w-full h-1 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-cyan"
            />
            <div className="flex justify-between mt-2 text-[10px] uppercase font-bold tracking-widest text-gray-500">
              <span className={level === 0 ? 'text-brand-cyan' : ''}>The Gist</span>
              <span className={level === 1 ? 'text-brand-cyan' : ''}>Brief</span>
              <span className={level === 2 ? 'text-brand-cyan' : ''}>Deep Dive</span>
            </div>
          </div>

          {/* Content Area */}
          <div className="min-h-[100px] text-gray-300 leading-relaxed transition-all duration-300">
            {level === 0 && (
              <p className="text-lg font-medium text-white italic">"{summary.skim}"</p>
            )}
            {level === 1 && (
              <p>{summary.standard}</p>
            )}
            {level === 2 && (
              <div className="space-y-2">
                {summary.deep.split('\n').map((line, i) => (
                  <p key={i} className="text-sm">{line.replace(/^-\s*/, '• ')}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
