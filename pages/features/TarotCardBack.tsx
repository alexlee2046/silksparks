import React from "react";

interface TarotCardBackProps {
  showPattern?: boolean;
}

export const TarotCardBack: React.FC<TarotCardBackProps> = ({ showPattern = true }) => (
  <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-[#0d0d0d] via-[#0a0a0a] to-[#0d0d0d] border border-[#F4C025]/40 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
    {/* Subtle Background Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#F4C025]/5 via-transparent to-[#F4C025]/3"></div>

    {/* Geometric Dot Pattern */}
    <div
      className="absolute inset-0 opacity-[0.08]"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #F4C025 1px, transparent 1px)",
        backgroundSize: "16px 16px",
      }}
    ></div>

    {/* Outer Decorative Border */}
    <div className="absolute inset-2 border border-[#F4C025]/20 rounded-xl pointer-events-none"></div>

    {/* Inner Frame with dual borders */}
    <div className="absolute inset-4 border-2 border-[#F4C025]/50 rounded-lg flex items-center justify-center">
      <div className="absolute inset-1.5 border border-[#F4C025]/25 rounded-md"></div>

      {/* Corner Ornaments - More elegant L-shaped */}
      {[0, 90, 180, 270].map((rot) => (
        <div
          key={rot}
          className="absolute w-6 h-6 pointer-events-none"
          style={{
            transform: `rotate(${rot}deg)`,
            top: rot === 180 || rot === 270 ? "auto" : -1,
            left: rot === 90 || rot === 180 ? "auto" : -1,
            bottom: rot === 180 || rot === 270 ? -1 : "auto",
            right: rot === 90 || rot === 180 ? -1 : "auto",
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-[#F4C025]">
            <path
              d="M0,0 L100,0 L100,15 L15,15 L15,100 L0,100 Z"
              opacity="0.9"
            />
            <circle cx="25" cy="25" r="4" opacity="0.7" />
          </svg>
        </div>
      ))}
    </div>

    {/* Flower of Life - SVG Sacred Geometry */}
    <div className="relative z-10 w-44 h-44 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
      {/* Glow Effect */}
      <div className="absolute inset-0 rounded-full bg-[#F4C025]/15 blur-2xl opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>

      {/* Flower of Life SVG - 19 circles pattern */}
      <svg
        viewBox="0 0 200 200"
        className="w-40 h-40"
        style={{ opacity: showPattern ? 0.9 : 0.35 }}
      >
        <defs>
          <radialGradient id="flowerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F4C025" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F4C025" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glow */}
        <circle cx="100" cy="100" r="85" fill="url(#flowerGlow)" />

        {/* Flower of Life Pattern */}
        {/* Center circle */}
        <circle
          cx="100"
          cy="100"
          r="30"
          fill="none"
          stroke="#F4C025"
          strokeWidth="1"
          opacity="0.8"
        />

        {/* First ring: 6 circles */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 100 + 30 * Math.cos(rad);
          const cy = 100 + 30 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke="#F4C025"
              strokeWidth="1"
              opacity="0.8"
            />
          );
        })}

        {/* Second ring: 6 circles */}
        {[30, 90, 150, 210, 270, 330].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 100 + 52 * Math.cos(rad);
          const cy = 100 + 52 * Math.sin(rad);
          return (
            <circle
              key={`outer-${angle}`}
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke="#F4C025"
              strokeWidth="1"
              opacity="0.7"
            />
          );
        })}

        {/* Outer ring: 6 circles */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 100 + 60 * Math.cos(rad);
          const cy = 100 + 60 * Math.sin(rad);
          return (
            <circle
              key={`outer2-${angle}`}
              cx={cx}
              cy={cy}
              r="30"
              fill="none"
              stroke="#F4C025"
              strokeWidth="1"
              opacity="0.6"
            />
          );
        })}

        {/* Outer boundary circles */}
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="#F4C025"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <circle
          cx="100"
          cy="100"
          r="92"
          fill="none"
          stroke="#F4C025"
          strokeWidth="0.5"
          opacity="0.3"
        />
      </svg>
    </div>

    {/* Top Decorative Element */}
    <div className="absolute top-6 flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#F4C025]/50 to-transparent"></div>
        <svg className="w-3 h-3 fill-[#F4C025]/60" viewBox="0 0 24 24">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <div className="w-8 h-px bg-gradient-to-r from-transparent via-[#F4C025]/50 to-transparent"></div>
      </div>
      <span className="text-[#F4C025]/50 text-[7px] font-serif tracking-[0.4em] uppercase">
        Divine Guidance
      </span>
    </div>

    {/* Bottom Logo - Silk&Sparks */}
    <div className="absolute bottom-5 flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-px bg-gradient-to-r from-transparent to-[#F4C025]/40"></div>
        <svg className="w-2.5 h-2.5 fill-[#F4C025]/50" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="6" />
        </svg>
        <div className="w-6 h-px bg-gradient-to-r from-[#F4C025]/40 to-transparent"></div>
      </div>
      <div className="text-center">
        <span className="text-[#F4C025]/80 text-[9px] font-serif tracking-[0.2em] uppercase font-medium">
          Silk<span className="text-[#F4C025]/50">&</span>Sparks
        </span>
      </div>
    </div>

    {/* Ambient Shine Effect */}
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
  </div>
);

export default TarotCardBack;
