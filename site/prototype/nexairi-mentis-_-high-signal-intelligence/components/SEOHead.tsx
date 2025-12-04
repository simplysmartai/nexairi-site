import React, { useEffect } from 'react';
import { BlogPost } from '../types';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: 'website' | 'article';
  post?: BlogPost;
}

export const SEOHead: React.FC<SEOHeadProps> = ({ 
  title = "Nexairi Mentis - AI Assisted Intelligence", 
  description = "Nexairi Mentis bridges human creativity and algorithmic precision. Curated insights on technology, lifestyle, travel, and sports.",
  image = "/favicon.svg", // Default image
  type = "website",
  post
}) => {
  
  const siteTitle = post ? `${post.title} | Nexairi Mentis` : title;
  const metaDesc = post ? post.excerpt.substring(0, 160) : description;
  const metaImage = post ? post.imageUrl : image;

  useEffect(() => {
    // Update Title
    document.title = siteTitle;

    // Helper to update meta tags
    const updateMeta = (name: string, content: string, attribute: string = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Standard SEO
    updateMeta('description', metaDesc);

    // Open Graph / Facebook
    updateMeta('og:type', type, 'property');
    updateMeta('og:title', siteTitle, 'property');
    updateMeta('og:description', metaDesc, 'property');
    updateMeta('og:image', metaImage, 'property');
    updateMeta('og:url', window.location.href, 'property');

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', siteTitle);
    updateMeta('twitter:description', metaDesc);
    updateMeta('twitter:image', metaImage);

  }, [siteTitle, metaDesc, metaImage, type]);

  return null; // This component doesn't render visible UI
};
