import React, { useEffect } from 'react';

interface AdUnitProps {
  slotId?: string; // The Ad Unit ID from Google Ads
  format?: 'auto' | 'fluid' | 'rectangle';
  className?: string;
}

export const AdUnit: React.FC<AdUnitProps> = ({ slotId = "0000000000", format = "auto", className = "" }) => {
  useEffect(() => {
    try {
      // Push to the adsbygoogle array to trigger the script
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // Standard error when adblockers are active or script isn't loaded yet
      console.debug("AdSense trigger skipped (dev mode or blocked).");
    }
  }, []);

  return (
    <div className={`w-full my-12 relative flex justify-center bg-brand-dark/20 border-y border-white/5 py-4 ${className}`}>
      <div className="w-full max-w-4xl min-h-[250px] relative bg-brand-black/40 rounded flex flex-col items-center justify-center overflow-hidden">
        
        {/* Google AdSense Tag */}
        {/* REPLACE ca-pub-YOUR_CLIENT_ID_HERE WITH YOUR ACTUAL ID */}
        <ins className="adsbygoogle"
             style={{ display: 'block', width: '100%', textAlign: 'center' }}
             data-ad-client="ca-pub-YOUR_CLIENT_ID_HERE"
             data-ad-slot={slotId}
             data-ad-format={format}
             data-full-width-responsive="true"></ins>

        {/* Visual Placeholder (Visible if ads fail to load or in dev) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-brand-muted border border-brand-muted/30 px-4 py-1 rounded-sm mb-2">
                Advertisement
            </span>
            <span className="text-[10px] text-brand-muted/50 font-mono">
                Ad Space / Slot {slotId}
            </span>
        </div>

      </div>
    </div>
  );
};