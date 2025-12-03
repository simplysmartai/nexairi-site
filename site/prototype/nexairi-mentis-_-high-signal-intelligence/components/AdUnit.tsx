
import React, { useEffect } from 'react';
import { siteConfig } from '../config';

interface AdUnitProps {
  size?: 'small' | 'medium' | 'banner';
  className?: string;
  slotId?: string; // Optional: Specific slot ID from Google
}

export const AdUnit: React.FC<AdUnitProps> = ({ size = 'medium', className = '', slotId = "1234567890" }) => {
  
  useEffect(() => {
    if (siteConfig.adSense.enabled) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense Error", e);
      }
    }
  }, []);

  // Dimensions based on common IAB standards
  const dimensions = {
    small: { w: 300, h: 250 }, // Medium Rectangle
    medium: { w: 300, h: 600 }, // Half Page
    banner: { w: 728, h: 90 },  // Leaderboard
  };

  const dim = dimensions[size];

  if (!siteConfig.adSense.enabled) {
    // Fallback Placeholder (when ads are disabled or ID is missing)
    return (
      <div className={`bg-brand-dark/30 border border-brand-border border-dashed flex items-center justify-center relative overflow-hidden mx-auto my-8 ${className}`} style={{ width: dim.w, height: dim.h }}>
        <span className="text-xs font-mono text-brand-muted uppercase tracking-widest z-10">Advertisement</span>
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      </div>
    );
  }

  return (
    <div className={`mx-auto my-8 flex justify-center ${className}`} style={{ minHeight: dim.h }}>
      <ins className="adsbygoogle"
           style={{ display: 'block', width: dim.w, height: dim.h }}
           data-ad-client={siteConfig.adSense.publisherId}
           data-ad-slot={slotId}
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>
    </div>
  );
};
