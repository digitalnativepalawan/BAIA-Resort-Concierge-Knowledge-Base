import React from 'react';

interface KapwaLogoProps {
  className?: string;
  showText?: boolean;
  iconOnly?: boolean;
  lightMode?: boolean;
}

export const KapwaLogo: React.FC<KapwaLogoProps> = ({
  className = '',
  showText = true,
  iconOnly = false,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Emblem SVG */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-8 h-8 text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Central Dot */}
          <circle cx="50" cy="50" r="5" fill="currentColor" />

          {/* 4 Compass Triangles pointing outwards */}
          <polygon points="50,35 46.5,41 53.5,41" fill="currentColor" />
          <polygon points="50,65 46.5,59 53.5,59" fill="currentColor" />
          <polygon points="35,50 41,46.5 41,53.5" fill="currentColor" />
          <polygon points="65,50 59,46.5 59,53.5" fill="currentColor" />

          {/* 4 Curved Quarter Tracks */}
          {/* Top-Left curve */}
          <path
            d="M 43,15 A 28 28 0 0 0 15,43"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Top-Right curve */}
          <path
            d="M 57,15 A 28 28 0 0 1 85,43"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Bottom-Left curve */}
          <path
            d="M 43,85 A 28 28 0 0 1 15,57"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Bottom-Right curve */}
          <path
            d="M 57,85 A 28 28 0 0 0 85,57"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Typography: KAPWA HOSPITALITY GROUP */}
      {!iconOnly && showText && (
        <div className="flex flex-col font-inter leading-none">
          <div className="flex items-center gap-2">
            <span className="text-sm font-light text-white tracking-[0.25em]">
              KΛPWΛ
            </span>
            <span className="text-[10px] font-medium text-[#00f0ff] px-2 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/25 rounded-md tracking-wider">
              TALA
            </span>
          </div>
          <span className="text-[9px] font-light text-gray-400 tracking-[0.2em] uppercase mt-1">
            Hospitality Group • BAIA Resort
          </span>
        </div>
      )}
    </div>
  );
};
