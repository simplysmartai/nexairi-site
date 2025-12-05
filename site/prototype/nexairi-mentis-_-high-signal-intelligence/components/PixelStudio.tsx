import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

// Declare the window interface for the AI Studio key selection helper
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface PixelStudioProps {
  onBack: () => void;
}

export const PixelStudio: React.FC<PixelStudioProps> = ({ onBack }) => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if we have a key (either from env or selected in session)
  const [hasAccess, setHasAccess] = useState(!!process.env.API_KEY);

  const handleConnect = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Optimistically assume success per system instructions
        setHasAccess(true);
        // Clear any previous errors
        setError(null);
      } catch (e) {
        console.error("Key selection failed", e);
      }
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    
    // Double check access before running
    if (!hasAccess && !process.env.API_KEY) {
      setError("Please connect an API Key to generate images.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Initialize AI client right before call to ensure it grabs the latest key
      // If process.env.API_KEY is empty, the client might throw, but if window.aistudio injected it, it should work.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const finalPrompt = `Professional editorial photography, high resolution, minimalist and cinematic lighting. Subject: ${prompt}`;

      // Upgraded to Gemini 3 Pro Image for higher quality and tool support
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:2", // Editorial Landscape
            imageSize: "1K"
          }
        }
      });

      // Parse response to find image part
      let foundImage = false;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64String = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            setGeneratedImage(`data:${mimeType};base64,${base64String}`);
            foundImage = true;
            break;
          }
        }
      }

      if (!foundImage) {
        throw new Error("No image data found in response.");
      }

    } catch (err: any) {
      console.error("Generation failed", err);
      // If the error suggests auth failure, prompt to reconnect
      if (err.message?.includes("API key") || err.toString().includes("403")) {
         setError("API Key invalid or expired. Please reconnect.");
         setHasAccess(false);
      } else {
         setError(err.message || "Failed to generate image.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      // Suggest a filename based on the prompt
      const filename = prompt.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase();
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-12">
        <div>
          <button onClick={onBack} className="text-brand-cyan hover:text-white text-sm mb-2 flex items-center gap-2">← Back to Sandbox</button>
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            Pixel Studio
            <span className="text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white border border-white/20 px-2 py-1 rounded font-mono uppercase tracking-wide">Pro Vision</span>
          </h1>
          <p className="text-brand-muted">Generate editorial illustrations directly in the browser.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Input Section */}
        <div className="bg-brand-dark/30 border border-brand-border rounded-2xl p-8 backdrop-blur-sm h-fit">
          <label className="block text-xs text-brand-cyan uppercase tracking-widest mb-3 font-bold">Image Prompt</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={!hasAccess}
            className="w-full bg-brand-black border border-brand-border rounded-xl p-4 text-white focus:border-brand-cyan outline-none min-h-[160px] text-lg leading-relaxed mb-6 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={hasAccess ? "Describe the image... e.g. 'A futuristic city with vertical gardens, cinematic lighting, photorealistic'" : "Please connect AI to start prompting..."}
          />
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {!hasAccess ? (
             <div className="mb-6">
               <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-200 text-sm mb-4">
                 <strong>Setup Required:</strong> Connect your Google AI API key to enable the generator.
               </div>
               <button 
                 onClick={handleConnect}
                 className="w-full py-4 rounded-xl font-bold uppercase tracking-widest bg-yellow-500 text-black hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
               >
                 Connect Google AI
               </button>
             </div>
          ) : (
            <button 
              onClick={handleGenerate}
              disabled={isLoading || !prompt}
              className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all ${
                isLoading || !prompt
                  ? 'bg-brand-border text-gray-500 cursor-not-allowed'
                  : 'bg-brand-cyan text-brand-black hover:bg-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Rendering High-Res...
                </span>
              ) : (
                "Generate Image"
              )}
            </button>
          )}
        </div>

        {/* Preview Section */}
        <div className="flex flex-col">
          <div className={`aspect-[3/2] rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all ${
            generatedImage ? 'border-brand-cyan bg-brand-black' : 'border-brand-border bg-brand-dark/20'
          }`}>
            {generatedImage ? (
              <img src={generatedImage} alt="Generated" className="w-full h-full object-contain" />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-4 text-brand-muted">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">Preview will appear here</p>
              </div>
            )}
          </div>

          {generatedImage && (
            <div className="mt-6 animate-fade-in-up">
              <button 
                onClick={handleDownload}
                className="w-full py-3 border border-brand-border hover:border-brand-cyan text-brand-text hover:text-white rounded-lg font-bold uppercase tracking-widest text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PNG
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                If you are using custom images, please ensure they are in your <code>public/Images/</code> folder.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};