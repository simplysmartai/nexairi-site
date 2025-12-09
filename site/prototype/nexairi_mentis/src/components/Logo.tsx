import React from 'react';
import { Link } from 'react-router-dom';

export const NexairiLogo: React.FC = () => (
  <Link to="/" className="flex-shrink-0 group block">
    <div className="flex items-center gap-3 sm:gap-5">
      <div className="relative transition-transform duration-300 group-hover:scale-105 scale-75 sm:scale-100 origin-left">
        <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
          <defs>
            <linearGradient id="spiralGradientStatic" x1="10%" y1="10%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="centerGradientStatic" x1="10%" y1="10%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <path d="M50 50 m-40 0 a 40 40 0 1 1 80 0 a 40 40 0 1 1 -80 0" stroke="url(#spiralGradientStatic)" strokeWidth="1" strokeDasharray="4 6" opacity="0.5"/>
          <path d="M50 50 m-30 0 a 30 30 0 1 1 60 0 a 30 30 0 1 1 -60 0" stroke="url(#spiralGradientStatic)" strokeWidth="1.5" strokeDasharray="10 15"/>
          <circle cx="50" cy="50" r="8" fill="none" stroke="url(#centerGradientStatic)" strokeWidth="3"/>
          <circle cx="50" cy="50" r="4" fill="url(#centerGradientStatic)"/>
        </svg>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-3 leading-none">
        <span className="font-sans font-bold text-2xl sm:text-3xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-100 to-gray-400 drop-shadow-sm">
          Nexairi
        </span>
        <span className="font-sans text-sm sm:text-xl tracking-[0.15em] sm:tracking-[0.2em] text-brand-cyan font-light uppercase opacity-90">
          Mentis
        </span>
      </div>
    </div>
  </Link>
);