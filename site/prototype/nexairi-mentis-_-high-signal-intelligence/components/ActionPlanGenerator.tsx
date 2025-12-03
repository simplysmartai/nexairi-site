
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface ActionPlanProps {
  content: string;
}

interface ActionItem {
  id: string;
  text: string;
  checked: boolean;
}

export const ActionPlanGenerator: React.FC<ActionPlanProps> = ({ content }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<ActionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const generatePlan = async () => {
    setIsLoading(true);
    setIsOpen(true);
    setError(null);
    
    try {
      if (!process.env.API_KEY) {
        throw new Error("Missing API Key. Please add API_KEY to Cloudflare Settings > Environment Variables.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Analyze the following article. Extract specific, actionable steps, tasks, or shopping items into a checklist.
        Ignore general theory; focus on concrete actions "Do this" or "Buy this".
        
        Return ONLY valid JSON in this format: { "items": ["Step 1", "Step 2", ...] }
        
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
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items.map((text: string, idx: number) => ({
            id: `task-${idx}`,
            text,
            checked: false
          })));
        } else {
          throw new Error("Invalid data format from AI");
        }
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (err: any) {
      console.error("Action Plan generation failed", err);
      setError(err.message || "Failed to generate plan");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  if (!isOpen && !isLoading) {
    return (
      <button 
        onClick={generatePlan}
        className="w-full mb-8 border border-dashed border-brand-border rounded-xl p-4 flex items-center justify-center gap-3 text-brand-muted hover:text-white hover:border-brand-cyan/50 hover:bg-brand-dark/30 transition-all group"
      >
        <div className="p-2 bg-brand-dark rounded-lg text-brand-cyan group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span className="text-sm font-bold uppercase tracking-wider">Generate Action Plan</span>
      </button>
    );
  }

  return (
    <div className="mb-12 bg-brand-black border border-brand-border rounded-xl overflow-hidden">
      <div className="bg-brand-dark/50 p-4 border-b border-brand-border flex justify-between items-center">
        <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
          <svg className="w-4 h-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Action Items
        </h3>
        {isLoading && <span className="text-xs text-brand-muted animate-pulse">Extracting tasks...</span>}
      </div>
      
      <div className="p-4">
        {error ? (
          <div className="text-red-400 text-sm border border-red-500/30 bg-red-500/10 p-4 rounded">
            <strong>Configuration Error:</strong> {error}
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-5 h-5 rounded bg-brand-border/30 animate-pulse"></div>
                <div className="h-5 bg-brand-border/30 rounded w-3/4 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-3 group cursor-pointer" onClick={() => toggleItem(item.id)}>
                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  item.checked 
                    ? 'bg-brand-cyan border-brand-cyan text-brand-black' 
                    : 'border-brand-border group-hover:border-brand-cyan/50'
                }`}>
                  {item.checked && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
                <span className={`text-sm leading-relaxed transition-colors ${
                  item.checked ? 'text-gray-600 line-through' : 'text-gray-300 group-hover:text-white'
                }`}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {items.length > 0 && (
        <div className="bg-brand-dark/30 p-3 text-center border-t border-brand-border">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">
            {items.filter(i => i.checked).length} of {items.length} completed
          </p>
        </div>
      )}
    </div>
  );
};
