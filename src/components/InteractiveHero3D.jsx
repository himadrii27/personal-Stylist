import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Meteors } from './ui/meteors';
import { Particles } from './ui/particles';
import { BlurFade } from './ui/blur-fade';

const LENS_PX = 132;
const CARD_W = 150;
const CARD_H = 220;

/* ─── 12 Aesthetic SVG sketches ────────────────────────────────────────── */

const MinimalistSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="m1a" x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stopColor="#F5EEE4"/>
        <stop offset="60%" stopColor="#EDE5D8"/>
        <stop offset="100%" stopColor="#BEB0A0"/>
      </linearGradient>
    </defs>
    {/* Straps */}
    <line x1="56" y1="24" x2="53" y2="10" stroke="#9A8E7E" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="94" y1="24" x2="97" y2="10" stroke="#9A8E7E" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Dress body with gradient */}
    <path d="M53 24 Q50 50 44 205 Q75 212 106 205 Q100 50 97 24 Q75 20 53 24Z" fill="url(#m1a)" stroke="#9A8E7E" strokeWidth="1.2"/>
    {/* Shadow left side */}
    <path d="M53 24 Q50 50 47 130 Q52 128 55 130 Q55 65 53 24Z" fill="rgba(0,0,0,0.09)"/>
    {/* Shadow right side */}
    <path d="M97 24 Q100 50 103 130 Q98 128 95 130 Q95 65 97 24Z" fill="rgba(0,0,0,0.09)"/>
    {/* Waist pull shadow */}
    <path d="M51 100 Q75 95 99 100 Q96 108 75 110 Q54 108 51 100Z" fill="rgba(0,0,0,0.07)"/>
    {/* Empire seam */}
    <path d="M57 46 Q75 43 93 46" fill="none" stroke="#9A8E7E" strokeWidth="1"/>
    {/* Fabric drape folds */}
    <path d="M62 55 Q60 110 58 170" fill="none" stroke="rgba(160,140,120,0.42)" strokeWidth="0.9" strokeLinecap="round"/>
    <path d="M88 55 Q90 110 92 170" fill="none" stroke="rgba(160,140,120,0.42)" strokeWidth="0.9" strokeLinecap="round"/>
    <path d="M72 80 Q70 135 68 185" fill="none" stroke="rgba(160,140,120,0.28)" strokeWidth="0.7"/>
    <path d="M78 80 Q80 135 82 185" fill="none" stroke="rgba(160,140,120,0.28)" strokeWidth="0.7"/>
    {/* Hem */}
    <path d="M44 205 Q75 212 106 205" fill="none" stroke="#9A8E7E" strokeWidth="1.1"/>
    {/* Silk highlight streak */}
    <path d="M62 26 Q61 80 60 148" fill="none" stroke="rgba(255,248,240,0.65)" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const StreetwearSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sw1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4A4A4A"/>
        <stop offset="100%" stopColor="#1C1C1C"/>
      </linearGradient>
      <linearGradient id="sw2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6B6048"/>
        <stop offset="100%" stopColor="#3C3020"/>
      </linearGradient>
    </defs>
    {/* Hood outer */}
    <path d="M36 42 Q30 12 75 10 Q120 12 114 42 Q96 28 75 26 Q54 28 36 42Z" fill="url(#sw1)" stroke="#111" strokeWidth="1.3"/>
    <path d="M48 42 Q75 32 102 42 Q96 28 75 26 Q54 28 48 42Z" fill="#141414"/>
    {/* Hood highlight */}
    <path d="M50 14 Q65 10 75 10" fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="2" strokeLinecap="round"/>
    {/* Body */}
    <path d="M28 44 L22 128 L128 128 L122 44 Z" fill="url(#sw1)" stroke="#111" strokeWidth="1.3"/>
    <path d="M28 44 L22 128 L32 128 L36 44Z" fill="rgba(0,0,0,0.22)"/>
    <path d="M122 44 L128 128 L118 128 L114 44Z" fill="rgba(0,0,0,0.22)"/>
    {/* Left sleeve */}
    <path d="M28 44 L8 118 L22 123 L34 58 Z" fill="url(#sw1)" stroke="#111" strokeWidth="1.3"/>
    <path d="M10 116 L22 123 L22 115 L12 112Z" fill="rgba(0,0,0,0.28)"/>
    {/* Right sleeve */}
    <path d="M122 44 L142 118 L128 123 L116 58 Z" fill="url(#sw1)" stroke="#111" strokeWidth="1.3"/>
    <path d="M140 116 L128 123 L128 115 L138 112Z" fill="rgba(0,0,0,0.28)"/>
    {/* Kangaroo pocket */}
    <path d="M46 92 L46 122 Q75 127 104 122 L104 92 Q75 88 46 92Z" fill="#232323" stroke="#111" strokeWidth="0.9"/>
    <path d="M46 92 L46 99 Q75 96 104 99 L104 92 Q75 88 46 92Z" fill="rgba(255,255,255,0.04)"/>
    {/* Cuffs + hem */}
    <rect x="8" y="116" width="14" height="8" rx="2" fill="#181818" stroke="#111" strokeWidth="0.9"/>
    <rect x="128" y="116" width="14" height="8" rx="2" fill="#181818" stroke="#111" strokeWidth="0.9"/>
    <rect x="22" y="121" width="106" height="8" rx="2" fill="#181818" stroke="#111" strokeWidth="0.9"/>
    {/* Cargo pants */}
    <path d="M30 128 L22 205 L68 205 L75 158 L82 205 L128 205 L120 128 Z" fill="url(#sw2)" stroke="#111" strokeWidth="1.2"/>
    <path d="M30 128 L22 205 L32 205 L38 128Z" fill="rgba(0,0,0,0.18)"/>
    <path d="M120 128 L128 205 L118 205 L112 128Z" fill="rgba(0,0,0,0.18)"/>
    {/* Cargo pockets with flap shadow */}
    <rect x="28" y="148" width="24" height="18" rx="2" fill="rgba(0,0,0,0.28)" stroke="#333" strokeWidth="0.9"/>
    <rect x="30" y="149" width="20" height="4" rx="1" fill="rgba(255,255,255,0.05)"/>
    <rect x="98" y="148" width="24" height="18" rx="2" fill="rgba(0,0,0,0.28)" stroke="#333" strokeWidth="0.9"/>
    <rect x="100" y="149" width="20" height="4" rx="1" fill="rgba(255,255,255,0.05)"/>
    {/* Chunky sneakers */}
    <path d="M20 205 Q16 214 26 216 L68 216 L70 205 Z" fill="#555" stroke="#111" strokeWidth="1.1"/>
    <path d="M80 205 L82 216 L124 216 Q134 214 130 205 Z" fill="#555" stroke="#111" strokeWidth="1.1"/>
    <rect x="16" y="212" width="56" height="6" rx="2" fill="#3A3A3A" stroke="#111" strokeWidth="0.9"/>
    <rect x="78" y="212" width="56" height="6" rx="2" fill="#3A3A3A" stroke="#111" strokeWidth="0.9"/>
    <path d="M20 208 L66 208" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
    <path d="M84 208 L128 208" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8"/>
  </svg>
);

const VintageSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="vt1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#E8C0C0"/>
        <stop offset="100%" stopColor="#B88080"/>
      </linearGradient>
      <linearGradient id="vt2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9EBE9A"/>
        <stop offset="100%" stopColor="#5A7A56"/>
      </linearGradient>
    </defs>
    {/* Puff sleeves with volume shading */}
    <ellipse cx="26" cy="46" rx="20" ry="14" fill="url(#vt1)" stroke="#8B6060" strokeWidth="1.2"/>
    <path d="M16 44 Q20 52 26 54 Q32 52 36 44 Q30 48 26 46 Q22 48 16 44Z" fill="rgba(0,0,0,0.11)"/>
    <path d="M18 40 Q22 46 18 52" fill="none" stroke="rgba(160,100,100,0.5)" strokeWidth="0.8"/>
    <path d="M24 38 Q26 44 24 50" fill="none" stroke="rgba(160,100,100,0.5)" strokeWidth="0.8"/>
    <ellipse cx="124" cy="46" rx="20" ry="14" fill="url(#vt1)" stroke="#8B6060" strokeWidth="1.2"/>
    <path d="M114 44 Q118 52 124 54 Q130 52 134 44 Q128 48 124 46 Q120 48 114 44Z" fill="rgba(0,0,0,0.11)"/>
    <path d="M122 38 Q124 44 122 50" fill="none" stroke="rgba(160,100,100,0.5)" strokeWidth="0.8"/>
    <path d="M128 40 Q132 46 128 52" fill="none" stroke="rgba(160,100,100,0.5)" strokeWidth="0.8"/>
    {/* Fitted forearms */}
    <path d="M22 58 L18 110 L30 110 L36 58 Z" fill="url(#vt1)" stroke="#8B6060" strokeWidth="1.1"/>
    <path d="M128 58 L132 110 L120 110 L114 58 Z" fill="url(#vt1)" stroke="#8B6060" strokeWidth="1.1"/>
    {/* High neck */}
    <path d="M55 14 Q75 8 95 14 Q90 24 75 22 Q60 24 55 14Z" fill="url(#vt1)" stroke="#8B6060" strokeWidth="1.1"/>
    {/* Blouse body */}
    <path d="M36 44 L32 98 L118 98 L114 44 Q95 34 75 32 Q55 34 36 44Z" fill="url(#vt1)" stroke="#8B6060" strokeWidth="1.2"/>
    <path d="M36 44 L32 98 L42 98 L44 44Z" fill="rgba(0,0,0,0.09)"/>
    {/* Bow detail */}
    <path d="M62 22 Q75 30 88 22" fill="none" stroke="#8B6060" strokeWidth="1.1"/>
    <path d="M70 30 L60 36 M80 30 L90 36" stroke="#8B6060" strokeWidth="1" strokeLinecap="round"/>
    {/* Pintucks */}
    <line x1="68" y1="40" x2="66" y2="92" stroke="rgba(170,110,110,0.55)" strokeWidth="0.8" strokeDasharray="3 2"/>
    <line x1="75" y1="38" x2="75" y2="94" stroke="rgba(170,110,110,0.55)" strokeWidth="0.8" strokeDasharray="3 2"/>
    <line x1="82" y1="40" x2="84" y2="92" stroke="rgba(170,110,110,0.55)" strokeWidth="0.8" strokeDasharray="3 2"/>
    {/* Belt with highlight */}
    <rect x="32" y="96" width="86" height="10" rx="2" fill="#8B6060" stroke="#6B4848" strokeWidth="1.1"/>
    <path d="M32 96 L118 96 L118 100 L32 100Z" fill="rgba(255,255,255,0.09)"/>
    <rect x="70" y="97" width="10" height="8" rx="1" fill="#6B4848" stroke="#4a3030" strokeWidth="0.9"/>
    {/* Wide-leg trousers */}
    <path d="M32 106 L10 210 L62 210 L75 155 L88 210 L140 210 L118 106 Z" fill="url(#vt2)" stroke="#5a7558" strokeWidth="1.2"/>
    <path d="M32 106 L10 210 L22 210 L40 106Z" fill="rgba(0,0,0,0.11)"/>
    <path d="M118 106 L140 210 L128 210 L110 106Z" fill="rgba(0,0,0,0.11)"/>
    <line x1="38" y1="112" x2="22" y2="205" stroke="rgba(130,175,125,0.6)" strokeWidth="1" strokeDasharray="5 3"/>
    <line x1="112" y1="112" x2="128" y2="205" stroke="rgba(130,175,125,0.6)" strokeWidth="1" strokeDasharray="5 3"/>
    {/* Highlight on trouser front */}
    <path d="M76 112 Q76 155 77 200" fill="none" stroke="rgba(180,220,175,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const OldMoneySVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="om1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2A5080"/>
        <stop offset="100%" stopColor="#0E1E38"/>
      </linearGradient>
      <linearGradient id="om2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0EBE0"/>
        <stop offset="100%" stopColor="#D4CCBE"/>
      </linearGradient>
    </defs>
    {/* Turtleneck with ribbing */}
    <path d="M57 8 Q75 4 93 8 L96 28 Q75 24 54 28 Z" fill="url(#om1)" stroke="#0d2340" strokeWidth="1.2"/>
    {[63,70,75,80,87].map(x => (
      <line key={x} x1={x} y1="8" x2={x} y2="27" stroke="rgba(255,255,255,0.1)" strokeWidth="0.7"/>
    ))}
    {/* Fitted knit top */}
    <path d="M38 42 L36 100 L114 100 L112 42 Q95 34 75 32 Q55 34 38 42Z" fill="url(#om1)" stroke="#0d2340" strokeWidth="1.2"/>
    <path d="M38 42 L36 100 L46 100 L47 42Z" fill="rgba(0,0,0,0.18)"/>
    {/* Chest highlight */}
    <path d="M62 34 Q62 68 61 96" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" strokeLinecap="round"/>
    {/* Sleeves */}
    <path d="M38 42 L24 96 L36 100 L46 52 Z" fill="url(#om1)" stroke="#0d2340" strokeWidth="1.2"/>
    <path d="M112 42 L126 96 L114 100 L104 52 Z" fill="url(#om1)" stroke="#0d2340" strokeWidth="1.2"/>
    {/* Belt with highlight */}
    <rect x="34" y="98" width="82" height="8" rx="2" fill="#9B7820" stroke="#6B4F0F" strokeWidth="1.1"/>
    <path d="M34 98 L116 98 L116 102 L34 102Z" fill="rgba(255,255,255,0.12)"/>
    <rect x="71" y="99" width="8" height="6" rx="1" fill="#6B4F0F" stroke="#4a3508" strokeWidth="0.9"/>
    {/* Tailored trousers */}
    <path d="M34 106 L30 208 L70 208 L75 155 L80 208 L120 208 L116 106 Z" fill="url(#om2)" stroke="#A09A8A" strokeWidth="1.2"/>
    <path d="M34 106 L30 208 L40 208 L46 106Z" fill="rgba(0,0,0,0.07)"/>
    <path d="M116 106 L120 208 L110 208 L104 106Z" fill="rgba(0,0,0,0.07)"/>
    {/* Sharp creases */}
    <line x1="52" y1="108" x2="42" y2="205" stroke="rgba(190,180,165,0.75)" strokeWidth="1.1" strokeDasharray="6 3"/>
    <line x1="98" y1="108" x2="108" y2="205" stroke="rgba(190,180,165,0.75)" strokeWidth="1.1" strokeDasharray="6 3"/>
    {/* Trouser highlight */}
    <path d="M76 110 Q76 155 77 200" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Oxford shoes */}
    <path d="M28 208 Q24 216 36 217 L68 217 L70 208 Z" fill="#3D2B1A" stroke="#1a0f08" strokeWidth="1.1"/>
    <path d="M80 208 L82 217 L114 217 Q126 216 122 208 Z" fill="#3D2B1A" stroke="#1a0f08" strokeWidth="1.1"/>
    <path d="M28 209 Q48 213 70 209" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.9"/>
    <path d="M80 209 Q100 213 122 209" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.9"/>
    <line x1="35" y1="211" x2="67" y2="211" stroke="#5a3f28" strokeWidth="0.8"/>
    <line x1="83" y1="211" x2="115" y2="211" stroke="#5a3f28" strokeWidth="0.8"/>
  </svg>
);

const SportySVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sp1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#252545"/>
        <stop offset="100%" stopColor="#0C0C1C"/>
      </linearGradient>
      <linearGradient id="sp2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1A2A6C"/>
        <stop offset="100%" stopColor="#3A5ACC"/>
      </linearGradient>
    </defs>
    {/* Open zip jacket */}
    <path d="M20 30 L14 175 L44 175 L44 66 L106 66 L106 175 L136 175 L130 30 Q108 20 75 18 Q42 20 20 30Z" fill="url(#sp1)" stroke="#111" strokeWidth="1.2"/>
    <path d="M20 30 L14 175 L24 175 L26 30Z" fill="rgba(0,0,0,0.22)"/>
    <path d="M130 30 L136 175 L126 175 L124 30Z" fill="rgba(0,0,0,0.22)"/>
    {/* Jacket lapels */}
    <path d="M44 30 L44 66 L68 50 Z" fill="#181830" stroke="#111" strokeWidth="1"/>
    <path d="M106 30 L106 66 L82 50 Z" fill="#181830" stroke="#111" strokeWidth="1"/>
    <path d="M44 30 L52 55" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.9"/>
    {/* Zip */}
    <line x1="75" y1="28" x2="75" y2="66" stroke="#404040" strokeWidth="1.5" strokeDasharray="4 2"/>
    {/* Sleeves */}
    <path d="M20 30 L6 120 L18 124 L30 46 Z" fill="url(#sp1)" stroke="#111" strokeWidth="1.2"/>
    <path d="M130 30 L144 120 L132 124 L120 46 Z" fill="url(#sp1)" stroke="#111" strokeWidth="1.2"/>
    <path d="M22 32 Q24 70 22 108" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Sports bra */}
    <path d="M50 46 Q50 70 75 72 Q100 70 100 46 Q88 36 75 34 Q62 36 50 46Z" fill="url(#sp2)" stroke="#1a44aa" strokeWidth="1.1"/>
    <path d="M56 52 Q75 66 94 52" fill="none" stroke="rgba(100,150,255,0.5)" strokeWidth="1"/>
    <path d="M52 46 Q56 56 52 66" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round"/>
    {/* High-waist leggings */}
    <path d="M44 80 L38 208 L72 208 L75 155 L78 208 L112 208 L106 80 Z" fill="#0C0C0C" stroke="#1E1E1E" strokeWidth="1.2"/>
    <path d="M44 80 L38 208 L46 208 L50 80Z" fill="rgba(255,255,255,0.035)"/>
    <line x1="75" y1="80" x2="75" y2="152" stroke="#1E1E1E" strokeWidth="0.8"/>
    {/* Side stripes with glow */}
    <path d="M104 82 Q108 140 110 204" fill="none" stroke="#2255CC" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M46 82 Q42 140 40 204" fill="none" stroke="#2255CC" strokeWidth="2.5" strokeLinecap="round"/>
    {/* Sneakers */}
    <path d="M36 208 Q32 217 44 218 L72 218 L74 208 Z" fill="#ECECEC" stroke="#999" strokeWidth="1.1"/>
    <path d="M76 208 L78 218 L106 218 Q118 217 114 208 Z" fill="#ECECEC" stroke="#999" strokeWidth="1.1"/>
    <rect x="32" y="213" width="44" height="5" rx="2" fill="#C4C4C4" stroke="#999" strokeWidth="0.8"/>
    <rect x="74" y="213" width="44" height="5" rx="2" fill="#C4C4C4" stroke="#999" strokeWidth="0.8"/>
    <path d="M38 210 L70 210" fill="none" stroke="#2255CC" strokeWidth="1.2"/>
    <path d="M80 210 L112 210" fill="none" stroke="#2255CC" strokeWidth="1.2"/>
  </svg>
);

const BohemianSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bo1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D88840"/>
        <stop offset="100%" stopColor="#9C5018"/>
      </linearGradient>
      <linearGradient id="bo2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#C07030"/>
        <stop offset="100%" stopColor="#7A3A10"/>
      </linearGradient>
    </defs>
    {/* Bell sleeves with drape shadow */}
    <path d="M36 36 Q16 60 10 90 L30 90 Q38 70 48 58 Z" fill="url(#bo1)" stroke="#8B4A20" strokeWidth="1.2"/>
    <path d="M16 72 Q18 80 14 88 L24 88 Q26 80 24 72Z" fill="rgba(0,0,0,0.12)"/>
    <path d="M114 36 Q134 60 140 90 L120 90 Q112 70 102 58 Z" fill="url(#bo1)" stroke="#8B4A20" strokeWidth="1.2"/>
    {/* Off-shoulder neckline */}
    <path d="M28 36 Q75 28 122 36 Q110 46 75 44 Q40 46 28 36Z" fill="url(#bo1)" stroke="#8B4A20" strokeWidth="1.2"/>
    {/* Bodice */}
    <path d="M28 36 L30 92 L120 92 L122 36 Q95 28 75 26 Q55 28 28 36Z" fill="url(#bo1)" stroke="#8B4A20" strokeWidth="1.2"/>
    <path d="M28 36 L30 92 L38 92 L36 36Z" fill="rgba(0,0,0,0.1)"/>
    {/* Embroidery — 3 rows */}
    {[50,62,75,88,100].map(x => (
      <circle key={x} cx={x} cy={54} r="2.2" fill="#F0A860" stroke="#8B4A20" strokeWidth="0.6"/>
    ))}
    {[56,68,82,94].map(x => (
      <circle key={x} cx={x} cy={66} r="2.2" fill="#F0A860" stroke="#8B4A20" strokeWidth="0.6"/>
    ))}
    {[62,75,88].map(x => (
      <circle key={x} cx={x} cy={78} r="1.8" fill="#E0C070" stroke="#8B4A20" strokeWidth="0.5"/>
    ))}
    {/* Waist sash */}
    <path d="M30 90 Q75 98 120 90 Q112 104 75 106 Q38 104 30 90Z" fill="#D4AA70" stroke="#A07A30" strokeWidth="1.1"/>
    <path d="M30 90 Q75 94 120 90 Q120 92 75 94 Q30 92 30 90Z" fill="rgba(255,255,255,0.1)"/>
    {/* Tier 1 */}
    <path d="M30 100 L18 148 L132 148 L120 100 Z" fill="url(#bo1)" stroke="#8B4A20" strokeWidth="1.1"/>
    <path d="M30 100 L18 148 L28 148 L36 100Z" fill="rgba(0,0,0,0.1)"/>
    {/* Tier 2 */}
    <path d="M18 144 L8 192 L142 192 L132 144 Z" fill="url(#bo2)" stroke="#8B4A20" strokeWidth="1.1"/>
    {/* Tier 3 + fringe */}
    <path d="M8 188 L4 215 L146 215 L142 188 Z" fill="#7A3A10" stroke="#8B4A20" strokeWidth="1.1"/>
    {[12,22,32,42,52,62,72,82,92,102,112,122,132,142].map(x => (
      <line key={x} x1={x} y1="190" x2={x-2} y2="216" stroke="rgba(220,160,80,0.75)" strokeWidth="1.1" strokeLinecap="round"/>
    ))}
    <line x1="18" y1="148" x2="132" y2="148" stroke="rgba(220,160,80,0.38)" strokeWidth="0.9" strokeDasharray="4 3"/>
    <line x1="8" y1="192" x2="142" y2="192" stroke="rgba(220,160,80,0.38)" strokeWidth="0.9" strokeDasharray="4 3"/>
  </svg>
);

const GothicSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="go1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2C1035"/>
        <stop offset="100%" stopColor="#080410"/>
      </linearGradient>
    </defs>
    {/* High collar */}
    <path d="M54 8 Q75 4 96 8 L98 24 Q86 20 75 18 Q64 20 52 24 Z" fill="url(#go1)" stroke="#3d1a4a" strokeWidth="1.2"/>
    {/* Main coat */}
    <path d="M24 28 L16 195 L134 195 L126 28 Q100 18 75 16 Q50 18 24 28Z" fill="url(#go1)" stroke="#3d1a4a" strokeWidth="1.3"/>
    {/* Shadow edges */}
    <path d="M24 28 L16 195 L28 195 L32 28Z" fill="rgba(0,0,0,0.3)"/>
    <path d="M126 28 L134 195 L122 195 L118 28Z" fill="rgba(0,0,0,0.3)"/>
    {/* Subtle purple highlight */}
    <path d="M42 30 Q42 112 40 188" fill="none" stroke="rgba(140,70,200,0.13)" strokeWidth="2" strokeLinecap="round"/>
    {/* Lapels */}
    <path d="M48 28 L38 80 L70 70 L66 30 Z" fill="#0A0410" stroke="#3d1a4a" strokeWidth="1.1"/>
    <path d="M102 28 L112 80 L80 70 L84 30 Z" fill="#0A0410" stroke="#3d1a4a" strokeWidth="1.1"/>
    <path d="M48 30 L52 62 L68 57" fill="none" stroke="rgba(140,70,200,0.14)" strokeWidth="0.9"/>
    {/* Sleeves */}
    <path d="M24 28 L8 125 L22 130 L34 42 Z" fill="url(#go1)" stroke="#3d1a4a" strokeWidth="1.3"/>
    <path d="M126 28 L142 125 L128 130 L116 42 Z" fill="url(#go1)" stroke="#3d1a4a" strokeWidth="1.3"/>
    {/* Double-breasted buttons with sheen */}
    {[90,106,122].map(y => (
      <React.Fragment key={y}>
        <circle cx="64" cy={y} r="3.5" fill="#6B0F1A" stroke="#3d1a4a" strokeWidth="0.9"/>
        <circle cx="64" cy={y} r="1.3" fill="rgba(255,80,80,0.3)"/>
        <circle cx="86" cy={y} r="3.5" fill="#6B0F1A" stroke="#3d1a4a" strokeWidth="0.9"/>
        <circle cx="86" cy={y} r="1.3" fill="rgba(255,80,80,0.3)"/>
      </React.Fragment>
    ))}
    {/* Hem detail */}
    <line x1="16" y1="187" x2="134" y2="187" stroke="rgba(100,40,130,0.4)" strokeWidth="1"/>
    {/* Platform boots */}
    <path d="M20 196 L24 218 L62 218 L58 196 Z" fill="#2d0a38" stroke="#3d1a4a" strokeWidth="1.1"/>
    <path d="M92 196 L96 218 L130 218 L126 196 Z" fill="#2d0a38" stroke="#3d1a4a" strokeWidth="1.1"/>
    <path d="M22 197 L57 197" fill="none" stroke="rgba(150,80,200,0.2)" strokeWidth="0.9"/>
    <rect x="20" y="210" width="44" height="10" rx="2" fill="#16001E" stroke="#3d1a4a" strokeWidth="0.9"/>
    <rect x="88" y="210" width="44" height="10" rx="2" fill="#16001E" stroke="#3d1a4a" strokeWidth="0.9"/>
    <rect x="30" y="205" width="14" height="4" rx="1" fill="#6B0F1A" stroke="#3d1a4a" strokeWidth="0.8"/>
    <rect x="98" y="205" width="14" height="4" rx="1" fill="#6B0F1A" stroke="#3d1a4a" strokeWidth="0.8"/>
  </svg>
);

const Y2KSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="yk1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFD0DE"/>
        <stop offset="100%" stopColor="#E86888"/>
      </linearGradient>
      <linearGradient id="yk2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#80B0DC"/>
        <stop offset="100%" stopColor="#3A5888"/>
      </linearGradient>
    </defs>
    {/* Straps */}
    <line x1="60" y1="26" x2="58" y2="12" stroke="#E8779A" strokeWidth="1.4" strokeLinecap="round"/>
    <line x1="90" y1="26" x2="92" y2="12" stroke="#E8779A" strokeWidth="1.4" strokeLinecap="round"/>
    {/* Crop top */}
    <path d="M50 26 L46 62 L104 62 L100 26 Q75 20 50 26Z" fill="url(#yk1)" stroke="#E8779A" strokeWidth="1.2"/>
    <path d="M50 26 L48 62 L56 62 L56 26Z" fill="rgba(0,0,0,0.09)"/>
    {/* Rhinestones */}
    {[[60,36],[68,33],[76,34],[84,32],[92,35],[65,45],[75,43],[85,45]].map(([x,y],i) => (
      <circle key={i} cx={x} cy={y} r="1.4" fill="rgba(255,240,250,0.9)" stroke="#E8779A" strokeWidth="0.4"/>
    ))}
    {/* Butterfly */}
    <path d="M66 50 Q60 44 56 50 Q60 56 66 50Z" fill="rgba(255,200,215,0.85)" stroke="#E8779A" strokeWidth="0.8"/>
    <path d="M84 50 Q90 44 94 50 Q90 56 84 50Z" fill="rgba(255,200,215,0.85)" stroke="#E8779A" strokeWidth="0.8"/>
    <path d="M66 50 Q75 47 84 50" fill="none" stroke="#E8779A" strokeWidth="0.9"/>
    {/* Low-rise waistband */}
    <rect x="40" y="72" width="70" height="10" rx="2" fill="#3D6B99" stroke="#2a5280" strokeWidth="1.1"/>
    <path d="M40 72 L110 72 L110 76 L40 76Z" fill="rgba(255,255,255,0.12)"/>
    {/* Flared jeans */}
    <path d="M40 82 L16 205 L68 205 L75 152 L82 205 L134 205 L110 82 Z" fill="url(#yk2)" stroke="#2a5280" strokeWidth="1.2"/>
    <path d="M40 82 L16 205 L26 205 L46 82Z" fill="rgba(0,0,0,0.09)"/>
    {/* Flares */}
    <path d="M16 190 L6 210 L74 210 L68 190 Z" fill="#325070" stroke="#2a5280" strokeWidth="0.9"/>
    <path d="M82 190 L76 210 L144 210 L134 190 Z" fill="#325070" stroke="#2a5280" strokeWidth="0.9"/>
    <line x1="75" y1="82" x2="75" y2="150" stroke="rgba(80,120,180,0.5)" strokeWidth="0.9"/>
    {/* Pocket stitching */}
    <path d="M48 86 Q56 84 62 90" fill="none" stroke="rgba(150,195,230,0.65)" strokeWidth="0.9"/>
    <path d="M102 86 Q94 84 88 90" fill="none" stroke="rgba(150,195,230,0.65)" strokeWidth="0.9"/>
    {/* Denim highlight */}
    <path d="M76 86 Q76 135 77 195" fill="none" stroke="rgba(180,220,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* Platform shoes */}
    <path d="M4 210 Q2 218 16 218 L74 218 L76 210 Z" fill="url(#yk1)" stroke="#E8779A" strokeWidth="1.1"/>
    <path d="M74 210 L76 218 L134 218 Q148 218 146 210 Z" fill="url(#yk1)" stroke="#E8779A" strokeWidth="1.1"/>
    <rect x="2" y="214" width="74" height="6" rx="2" fill="#E8779A" stroke="#cc5580" strokeWidth="0.8"/>
    <rect x="74" y="214" width="74" height="6" rx="2" fill="#E8779A" stroke="#cc5580" strokeWidth="0.8"/>
  </svg>
);

const PreppySVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="pr1" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#4A8C55"/>
        <stop offset="55%" stopColor="#355E3B"/>
        <stop offset="100%" stopColor="#1A3C22"/>
      </linearGradient>
      <linearGradient id="pr2" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#EEE8D8"/>
        <stop offset="60%" stopColor="#D8D0B8"/>
        <stop offset="100%" stopColor="#C0B090"/>
      </linearGradient>
      <linearGradient id="pr3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#EBF2FF"/>
        <stop offset="50%" stopColor="#F5F8FF"/>
        <stop offset="100%" stopColor="#DDE8FF"/>
      </linearGradient>
    </defs>
    {/* collared shirt underneath */}
    <path d="M56 16 Q75 12 94 16 L96 28 Q86 24 75 22 Q64 24 54 28 Z" fill="url(#pr3)" stroke="#9BA8C0" strokeWidth="1"/>
    <path d="M65 22 L70 36 M85 22 L80 36" stroke="#9BA8C0" strokeWidth="1" strokeLinecap="round"/>
    {/* v-neck sweater vest */}
    <path d="M34 40 L32 108 L118 108 L116 40 Q95 32 75 30 Q55 32 34 40Z"
      fill="url(#pr1)" stroke="#1d3d22" strokeWidth="1.3" strokeLinejoin="round"/>
    {/* Left edge shadow */}
    <path d="M34 40 L32 108 L42 108 L44 40Z" fill="rgba(0,0,0,0.15)"/>
    {/* Right edge shadow */}
    <path d="M116 40 L118 108 L108 108 L106 40Z" fill="rgba(0,0,0,0.15)"/>
    {/* V-neck opening showing shirt */}
    <path d="M56 40 L75 68 L94 40 Q75 36 56 40Z" fill="url(#pr3)" stroke="#9BA8C0" strokeWidth="1"/>
    {/* Wool texture highlight */}
    <path d="M46 44 Q46 76 45 104" fill="none" stroke="rgba(120,200,130,0.18)" strokeWidth="1.8" strokeLinecap="round"/>
    {/* argyle pattern on vest */}
    <path d="M42 52 L75 68 L108 52 L75 36 Z" fill="none" stroke="rgba(42,77,48,0.6)" strokeWidth="0.7" strokeDasharray="3 2"/>
    <line x1="42" y1="80" x2="108" y2="80" stroke="rgba(42,77,48,0.5)" strokeWidth="0.7" strokeDasharray="3 2"/>
    <line x1="42" y1="95" x2="108" y2="95" stroke="rgba(42,77,48,0.5)" strokeWidth="0.7" strokeDasharray="3 2"/>
    {/* plaid mini skirt */}
    <path d="M30 108 L24 162 L126 162 L120 108 Z" fill="url(#pr2)" stroke="#A09080" strokeWidth="1.3" strokeLinejoin="round"/>
    {/* Skirt left shadow */}
    <path d="M30 108 L24 162 L34 162 L38 108Z" fill="rgba(0,0,0,0.1)"/>
    {/* Skirt right shadow */}
    <path d="M120 108 L126 162 L116 162 L112 108Z" fill="rgba(0,0,0,0.1)"/>
    {/* plaid lines horizontal */}
    <line x1="30" y1="118" x2="118" y2="118" stroke="rgba(180,40,40,0.75)" strokeWidth="1.5"/>
    <line x1="28" y1="132" x2="120" y2="132" stroke="rgba(180,40,40,0.75)" strokeWidth="1.5"/>
    <line x1="26" y1="148" x2="122" y2="148" stroke="rgba(180,40,40,0.75)" strokeWidth="1.5"/>
    {/* plaid lines vertical */}
    <line x1="54" y1="108" x2="48" y2="162" stroke="rgba(180,40,40,0.6)" strokeWidth="1"/>
    <line x1="75" y1="108" x2="75" y2="162" stroke="rgba(180,40,40,0.6)" strokeWidth="1"/>
    <line x1="96" y1="108" x2="102" y2="162" stroke="rgba(180,40,40,0.6)" strokeWidth="1"/>
    {/* Skirt highlight */}
    <path d="M76 110 Q76 136 77 160" fill="none" stroke="rgba(255,248,235,0.35)" strokeWidth="1.6" strokeLinecap="round"/>
    {/* knee socks */}
    <rect x="40" y="162" width="22" height="46" rx="10" fill="url(#pr3)" stroke="#9BA8C0" strokeWidth="1.2"/>
    <rect x="88" y="162" width="22" height="46" rx="10" fill="url(#pr3)" stroke="#9BA8C0" strokeWidth="1.2"/>
    {/* sock trim */}
    <line x1="40" y1="170" x2="62" y2="170" stroke="#2A5030" strokeWidth="1.8"/>
    <line x1="88" y1="170" x2="110" y2="170" stroke="#2A5030" strokeWidth="1.8"/>
    {/* loafers */}
    <path d="M34 207 Q30 218 44 218 L64 218 L64 207 Z" fill="#3D2B1A" stroke="#1a0f08" strokeWidth="1.2"/>
    <path d="M86 207 L86 218 L106 218 Q120 218 116 207 Z" fill="#3D2B1A" stroke="#1a0f08" strokeWidth="1.2"/>
    <ellipse cx="49" cy="210" rx="8" ry="4" fill="#5a3f28" stroke="#3D2B1A" strokeWidth="0.8"/>
    <ellipse cx="101" cy="210" rx="8" ry="4" fill="#5a3f28" stroke="#3D2B1A" strokeWidth="0.8"/>
    {/* Shoe highlight */}
    <path d="M36 209 Q44 208 58 209" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const EdgeySVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ed1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2E2E2E"/>
        <stop offset="50%" stopColor="#111111"/>
        <stop offset="100%" stopColor="#050505"/>
      </linearGradient>
      <linearGradient id="ed2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#252525"/>
        <stop offset="50%" stopColor="#0F0F0F"/>
        <stop offset="100%" stopColor="#050505"/>
      </linearGradient>
      <linearGradient id="ed3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3A3A3A"/>
        <stop offset="100%" stopColor="#111111"/>
      </linearGradient>
    </defs>
    {/* asymmetric one-shoulder jacket */}
    <path d="M30 24 L24 130 L126 130 L130 38 Q105 20 75 18 Q52 20 30 24Z"
      fill="url(#ed1)" stroke="#333" strokeWidth="1.4" strokeLinejoin="round"/>
    {/* Deep left edge shadow */}
    <path d="M30 24 L24 130 L34 130 L38 24Z" fill="rgba(0,0,0,0.4)"/>
    {/* left shoulder – bare/cut */}
    <path d="M30 24 L46 24 L52 56 L36 60 Z" fill="#1E1E1E" stroke="#333" strokeWidth="1"/>
    {/* right sleeve full */}
    <path d="M130 38 L144 115 L128 120 L118 52 Z" fill="url(#ed3)" stroke="#333" strokeWidth="1.4"/>
    {/* Sleeve right shadow */}
    <path d="M130 38 L144 115 L138 116 L124 42Z" fill="rgba(0,0,0,0.3)"/>
    {/* Leather jacket highlight streak */}
    <path d="M88 26 Q90 78 92 126" fill="none" stroke="rgba(180,180,180,0.12)" strokeWidth="1.8" strokeLinecap="round"/>
    {/* diagonal cut across jacket */}
    <line x1="46" y1="26" x2="116" y2="80" stroke="rgba(100,100,100,0.7)" strokeWidth="1.2"/>
    {/* zipper/hardware detail */}
    <line x1="72" y1="28" x2="68" y2="126" stroke="rgba(160,160,160,0.8)" strokeWidth="1.5" strokeDasharray="4 3"/>
    {/* moto hardware */}
    <circle cx="60" cy="42" r="3.5" fill="#D0D0D0" stroke="#888" strokeWidth="1"/>
    <circle cx="60" cy="42" r="1.4" fill="rgba(255,255,255,0.5)"/>
    <circle cx="60" cy="56" r="3.5" fill="#D0D0D0" stroke="#888" strokeWidth="1"/>
    <circle cx="60" cy="56" r="1.4" fill="rgba(255,255,255,0.5)"/>
    <circle cx="60" cy="70" r="3.5" fill="#D0D0D0" stroke="#888" strokeWidth="1"/>
    <circle cx="60" cy="70" r="1.4" fill="rgba(255,255,255,0.5)"/>
    {/* seam detail */}
    <line x1="96" y1="36" x2="100" y2="126" stroke="rgba(80,80,80,0.8)" strokeWidth="0.9"/>
    {/* vinyl/leather trousers */}
    <path d="M28 130 L24 210 L68 210 L75 160 L82 210 L126 210 L122 130 Z"
      fill="url(#ed2)" stroke="#444" strokeWidth="1.3" strokeLinejoin="round"/>
    {/* Trouser left shadow */}
    <path d="M28 130 L24 210 L34 210 L36 130Z" fill="rgba(0,0,0,0.3)"/>
    {/* Trouser right shadow */}
    <path d="M122 130 L126 210 L116 210 L114 130Z" fill="rgba(0,0,0,0.3)"/>
    {/* leather sheen – wet look */}
    <path d="M36 134 Q44 158 40 200" fill="none" stroke="rgba(160,160,160,0.14)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M114 134 Q106 158 110 200" fill="none" stroke="rgba(160,160,160,0.14)" strokeWidth="2" strokeLinecap="round"/>
    {/* combat boots */}
    <path d="M22 210 L20 218 L70 218 L68 210 Z" fill="#222" stroke="#333" strokeWidth="1.2"/>
    <path d="M80 210 L82 218 L130 218 L128 210 Z" fill="#222" stroke="#333" strokeWidth="1.2"/>
    <rect x="20" y="214" width="52" height="6" rx="1" fill="#111" stroke="#333" strokeWidth="0.8"/>
    <rect x="78" y="214" width="52" height="6" rx="1" fill="#111" stroke="#333" strokeWidth="0.8"/>
    {/* boot buckle with shine */}
    <rect x="28" y="206" width="16" height="5" rx="1" fill="#A0A0A0" stroke="#666" strokeWidth="0.8"/>
    <rect x="106" y="206" width="16" height="5" rx="1" fill="#A0A0A0" stroke="#666" strokeWidth="0.8"/>
    <line x1="30" y1="208" x2="42" y2="208" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
    <line x1="108" y1="208" x2="120" y2="208" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8"/>
  </svg>
);

const SmartCasualSVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sc1" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#E8F2FF"/>
        <stop offset="55%" stopColor="#C8DCFF"/>
        <stop offset="100%" stopColor="#A8C4F0"/>
      </linearGradient>
      <linearGradient id="sc2" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#D8BC80"/>
        <stop offset="55%" stopColor="#C4AD8A"/>
        <stop offset="100%" stopColor="#907040"/>
      </linearGradient>
      <linearGradient id="sc3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0F6FF"/>
        <stop offset="100%" stopColor="#D8E8FF"/>
      </linearGradient>
    </defs>
    {/* collar */}
    <path d="M57 12 L54 28 L64 32 L75 20 L86 32 L96 28 L93 12 Q75 8 57 12Z"
      fill="url(#sc3)" stroke="#8A9EC0" strokeWidth="1.2"/>
    {/* shirt body */}
    <path d="M36 38 L34 108 L116 108 L114 38 Q95 28 75 26 Q55 28 36 38Z"
      fill="url(#sc1)" stroke="#8A9EC0" strokeWidth="1.3" strokeLinejoin="round"/>
    {/* Left shadow */}
    <path d="M36 38 L34 108 L44 108 L46 38Z" fill="rgba(0,0,0,0.08)"/>
    {/* Right shadow */}
    <path d="M114 38 L116 108 L106 108 L104 38Z" fill="rgba(0,0,0,0.08)"/>
    {/* left sleeve */}
    <path d="M36 38 L22 100 L34 104 L44 50 Z" fill="url(#sc1)" stroke="#8A9EC0" strokeWidth="1.3"/>
    {/* right sleeve */}
    <path d="M114 38 L128 100 L116 104 L106 50 Z" fill="url(#sc1)" stroke="#8A9EC0" strokeWidth="1.3"/>
    {/* Shirt highlight streak */}
    <path d="M62 30 Q62 68 61 104" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.6" strokeLinecap="round"/>
    {/* button placket */}
    <line x1="75" y1="26" x2="75" y2="108" stroke="rgba(100,130,180,0.6)" strokeWidth="0.8"/>
    {/* buttons with sheen */}
    {[44, 58, 72, 86].map(cy => (
      <React.Fragment key={cy}>
        <circle cx="75" cy={cy} r="2.2" fill="#8A9EC0" stroke="#6A7EA0" strokeWidth="0.6"/>
        <circle cx="75" cy={cy} r="0.9" fill="rgba(255,255,255,0.5)"/>
      </React.Fragment>
    ))}
    {/* sleeve roll detail */}
    <line x1="26" y1="88" x2="36" y2="90" stroke="#8A9EC0" strokeWidth="1"/>
    <line x1="24" y1="94" x2="34" y2="97" stroke="#8A9EC0" strokeWidth="1"/>
    {/* tailored chinos */}
    <path d="M34 106 L30 206 L70 206 L75 155 L80 206 L120 206 L116 106 Z"
      fill="url(#sc2)" stroke="#8B7558" strokeWidth="1.3" strokeLinejoin="round"/>
    {/* Chino left shadow */}
    <path d="M34 106 L30 206 L40 206 L42 106Z" fill="rgba(0,0,0,0.1)"/>
    {/* Chino right shadow */}
    <path d="M116 106 L120 206 L110 206 L108 106Z" fill="rgba(0,0,0,0.1)"/>
    {/* Chino highlight */}
    <path d="M76 110 Q77 153 78 204" fill="none" stroke="rgba(255,240,200,0.22)" strokeWidth="1.6" strokeLinecap="round"/>
    {/* chino crease */}
    <line x1="52" y1="110" x2="42" y2="202" stroke="rgba(180,160,120,0.7)" strokeWidth="0.9" strokeDasharray="5 3"/>
    <line x1="98" y1="110" x2="108" y2="202" stroke="rgba(180,160,120,0.7)" strokeWidth="0.9" strokeDasharray="5 3"/>
    {/* chelsea boots */}
    <path d="M28 206 Q24 216 38 217 L70 217 L70 206 Z" fill="#2A1F14" stroke="#111" strokeWidth="1.2"/>
    <path d="M80 206 L80 217 L112 217 Q126 216 122 206 Z" fill="#2A1F14" stroke="#111" strokeWidth="1.2"/>
    {/* Boot shine */}
    <path d="M30 208 Q44 207 66 209" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round"/>
    {/* elastic side panels */}
    <rect x="28" y="208" width="6" height="10" rx="1" fill="#555" stroke="#333" strokeWidth="0.8"/>
    <rect x="116" y="208" width="6" height="10" rx="1" fill="#555" stroke="#333" strokeWidth="0.8"/>
    {/* heel */}
    <rect x="62" y="213" width="10" height="6" rx="1" fill="#1a1108" stroke="#111" strokeWidth="0.8"/>
    <rect x="78" y="213" width="10" height="6" rx="1" fill="#1a1108" stroke="#111" strokeWidth="0.8"/>
  </svg>
);

const LuxurySVG = () => (
  <svg viewBox="0 0 150 220" width={CARD_W} height={CARD_H} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lx1" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#D8B882"/>
        <stop offset="50%" stopColor="#C19A6B"/>
        <stop offset="100%" stopColor="#8B6A3A"/>
      </linearGradient>
      <linearGradient id="lx2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#C08848"/>
        <stop offset="100%" stopColor="#7A5218"/>
      </linearGradient>
      <linearGradient id="lx3" x1="10%" y1="0%" x2="90%" y2="100%">
        <stop offset="0%" stopColor="#F8F0E8"/>
        <stop offset="60%" stopColor="#EEE6DA"/>
        <stop offset="100%" stopColor="#D0C8B8"/>
      </linearGradient>
    </defs>
    {/* structured longline coat */}
    <path d="M22 30 L14 205 L136 205 L128 30 Q105 18 75 16 Q45 18 22 30Z"
      fill="url(#lx1)" stroke="#8B6A3A" strokeWidth="1.4" strokeLinejoin="round"/>
    {/* Deep coat left shadow */}
    <path d="M22 30 L14 205 L26 205 L30 30Z" fill="rgba(0,0,0,0.18)"/>
    {/* Deep coat right shadow */}
    <path d="M128 30 L136 205 L124 205 L120 30Z" fill="rgba(0,0,0,0.18)"/>
    {/* Center fold shadow */}
    <path d="M72 34 L70 202 Q75 200 80 202 L78 34 Q75 32 72 34Z" fill="rgba(0,0,0,0.1)"/>
    {/* large notched lapels */}
    <path d="M46 30 L34 100 L68 85 L62 34 Z" fill="url(#lx2)" stroke="#8B6A3A" strokeWidth="1.3"/>
    <path d="M104 30 L116 100 L82 85 L88 34 Z" fill="url(#lx2)" stroke="#8B6A3A" strokeWidth="1.3"/>
    {/* Lapel highlight */}
    <path d="M64 36 Q56 62 38 98" fill="none" stroke="rgba(220,185,120,0.2)" strokeWidth="1.5" strokeLinecap="round"/>
    {/* left sleeve */}
    <path d="M22 30 L6 142 L22 148 L34 46 Z" fill="url(#lx1)" stroke="#8B6A3A" strokeWidth="1.4"/>
    {/* right sleeve */}
    <path d="M128 30 L144 142 L128 148 L116 46 Z" fill="url(#lx1)" stroke="#8B6A3A" strokeWidth="1.4"/>
    {/* Camel highlight streak */}
    <path d="M86 22 Q88 80 90 194" fill="none" stroke="rgba(255,240,200,0.22)" strokeWidth="2" strokeLinecap="round"/>
    {/* fur/satin trim collar */}
    <path d="M46 30 Q75 38 104 30 Q96 42 75 44 Q54 42 46 30Z" fill="#EED8A8" stroke="#C4A870" strokeWidth="1"/>
    {/* Fur texture lines */}
    {[0,6,12,18,24,30,36,42,48].map(i => (
      <line key={i} x1={50+i} y1="31" x2={51+i} y2="43" stroke="rgba(200,170,100,0.3)" strokeWidth="0.8" strokeLinecap="round"/>
    ))}
    {/* fur cuff trim */}
    <rect x="6" y="140" width="18" height="10" rx="3" fill="#EED8A8" stroke="#C4A870" strokeWidth="1"/>
    <rect x="126" y="140" width="18" height="10" rx="3" fill="#EED8A8" stroke="#C4A870" strokeWidth="1"/>
    {/* coat buttons (large, gold) */}
    {[[70,108],[80,108],[70,130],[80,130]].map(([cx,cy]) => (
      <React.Fragment key={`${cx}-${cy}`}>
        <circle cx={cx} cy={cy} r="5" fill="#A07830" stroke="#6B4A1A" strokeWidth="1.2"/>
        <circle cx={cx} cy={cy} r="2" fill="rgba(255,220,130,0.5)"/>
      </React.Fragment>
    ))}
    {/* wide-leg trousers visible at hem */}
    <path d="M32 192 L24 218 L70 218 L75 205 L80 218 L126 218 L118 192 Z"
      fill="url(#lx3)" stroke="#C0B8A8" strokeWidth="1.2" strokeLinejoin="round"/>
    {/* Trouser left shadow */}
    <path d="M32 192 L24 218 L32 218 L38 192Z" fill="rgba(0,0,0,0.08)"/>
    {/* Trouser right shadow */}
    <path d="M118 192 L126 218 L118 218 L112 192Z" fill="rgba(0,0,0,0.08)"/>
    {/* trouser crease */}
    <line x1="55" y1="194" x2="46" y2="216" stroke="rgba(180,170,155,0.7)" strokeWidth="0.9"/>
    <line x1="95" y1="194" x2="104" y2="216" stroke="rgba(180,170,155,0.7)" strokeWidth="0.9"/>
    {/* pointed heels */}
    <path d="M24 218 L28 222 L66 222 L70 218 Z" fill="#2A2018" stroke="#111" strokeWidth="1"/>
    <path d="M80 218 L84 222 L122 222 L126 218 Z" fill="#2A2018" stroke="#111" strokeWidth="1"/>
    {/* Heel shine */}
    <path d="M26 219 Q44 218 66 219" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" strokeLinecap="round"/>
    <rect x="58" y="219" width="8" height="6" rx="1" fill="#1a1208" stroke="#111" strokeWidth="0.8"/>
    <rect x="84" y="219" width="8" height="6" rx="1" fill="#1a1208" stroke="#111" strokeWidth="0.8"/>
  </svg>
);

/* ─── Aesthetic data ───────────────────────────────────────────────────── */

const AESTHETICS = [
  { id: 'minimalist',   label: 'Minimalist',            accentColor: '#EDE5D8', svg: <MinimalistSVG /> },
  { id: 'streetwear',   label: 'Streetwear',             accentColor: '#5B5240', svg: <StreetwearSVG /> },
  { id: 'vintage',      label: 'Vintage',                accentColor: '#D4A0A0', svg: <VintageSVG /> },
  { id: 'oldmoney',     label: 'Old Money',              accentColor: '#1B3A5C', svg: <OldMoneySVG /> },
  { id: 'sporty',       label: 'Sporty / Athleisure',   accentColor: '#2255CC', svg: <SportySVG /> },
  { id: 'bohemian',     label: 'Bohemian',               accentColor: '#C4733A', svg: <BohemianSVG /> },
  { id: 'gothic',       label: 'Dark / Gothic',          accentColor: '#6B0F1A', svg: <GothicSVG /> },
  { id: 'y2k',          label: 'Trendy / Y2K',           accentColor: '#FFB6C1', svg: <Y2KSVG /> },
  { id: 'preppy',       label: 'Preppy',                 accentColor: '#355E3B', svg: <PreppySVG /> },
  { id: 'edgy',         label: 'Edgy / Experimental',   accentColor: '#888888', svg: <EdgeySVG /> },
  { id: 'smartcasual',  label: 'Smart Casual',           accentColor: '#D4E4FF', svg: <SmartCasualSVG /> },
  { id: 'luxury',       label: 'Luxury',                 accentColor: '#C19A6B', svg: <LuxurySVG /> },
];

/* ─── Garment card with lens magnifier ────────────────────────────────── */

function GarmentCard({ item, index }) {
  const [pos, setPos] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  const handleMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  // Clamp so lens never escapes card bounds
  const lensLeft = pos ? Math.max(0, Math.min(pos.x - LENS_PX / 2, CARD_W - LENS_PX)) : 0;
  const lensTop  = pos ? Math.max(0, Math.min(pos.y - LENS_PX / 2, CARD_H - LENS_PX)) : 0;

  return (
    <motion.div
      ref={ref}
      className="garment-card"
      onMouseMove={handleMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setPos(null); setIsHovered(false); }}
      style={{
        width: CARD_W,
        height: CARD_H,
        flexShrink: 0,
        margin: '0 18px',
        position: 'relative',
        '--beam-color': item.accentColor,
        boxShadow: isHovered
          ? `0 0 0 1px ${item.accentColor}40, 0 10px 40px rgba(0,0,0,0.6), 0 0 28px ${item.accentColor}20`
          : '0 2px 12px rgba(0,0,0,0.4)',
      }}
      animate={{ y: isHovered ? -6 : 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      {/* Animated border beam on hover */}
      <div className="card-beam" />

      {/* Base: grayscale sketch */}
      <div className="garment-sketch">
        {item.svg}
      </div>

      {/* Label */}
      <div
        className="garment-label"
        style={{
          borderColor: item.accentColor + '80',
          color: item.accentColor,
          textShadow: isHovered ? `0 0 12px ${item.accentColor}99` : 'none',
        }}
      >
        {item.label}
      </div>

      {/* Circular lens with glow */}
      <AnimatePresence>
        {pos && (
          <motion.div
            className="garment-lens"
            style={{
              left: lensLeft,
              top: lensTop,
              boxShadow: `
                0 0 0 2px rgba(255,255,255,0.9),
                0 0 0 3px rgba(0,0,0,0.7),
                0 0 22px 6px ${item.accentColor}70,
                0 0 44px 12px rgba(192,132,252,0.25),
                0 12px 40px rgba(0,0,0,0.85)
              `,
            }}
            initial={{ scale: 0.45, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* Inner mask for soft edges */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              overflow: 'hidden',
              maskImage: 'radial-gradient(circle at center, black 55%, rgba(0,0,0,0.85) 75%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 55%, rgba(0,0,0,0.85) 75%, transparent 100%)',
            }}>
              {/* Full colour SVG — vibrant filter */}
              <div style={{
                position: 'absolute',
                left: -lensLeft,
                top: -lensTop,
                width: CARD_W,
                height: CARD_H,
                pointerEvents: 'none',
                filter: 'saturate(1.7) brightness(1.25) contrast(1.08)',
              }}>
                {item.svg}
              </div>
            </div>

            {/* Prismatic inner ring highlight */}
            <div style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `1px solid ${item.accentColor}55`,
              pointerEvents: 'none',
              background: `radial-gradient(circle at 35% 25%, rgba(255,255,255,0.12), transparent 60%)`,
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Rotating subtitle ────────────────────────────────────────────────── */

const SUBTITLES = [
  'Hover to reveal your palette.',
  'Twelve aesthetics. One you.',
  'From runway vibes to everyday wear.',
  'Dress the mood, own the room.',
];

function RotatingSubtitle() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SUBTITLES.length), 3400);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.p
      key={idx}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="hero-subtitle"
    >
      {SUBTITLES[idx]}
    </motion.p>
  );
}

/* ─── Main component ───────────────────────────────────────────────────── */

export default function InteractiveHero3D({ onCtaClick }) {
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const followerX = useSpring(cursorX, { stiffness: 90, damping: 22 });
  const followerY = useSpring(cursorY, { stiffness: 90, damping: 22 });

  useEffect(() => {
    const onMove = (e) => {
      cursorX.set(e.clientX - 220);
      cursorY.set(e.clientY - 220);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [cursorX, cursorY]);

  // Double for seamless loop
  const doubled = [...AESTHETICS, ...AESTHETICS];

  return (
    <>
      <style>{`
        .clothes-hero {
          position: relative;
          min-height: 100vh;
          background: #080808;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        /* Single scrolling row */
        @keyframes scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .scroll-track {
          display: flex;
          align-items: center;
          animation: scroll-left 72s linear infinite;
          will-change: transform;
        }
        .scroll-track:hover {
          animation-play-state: paused;
        }
        .scroll-row-wrap {
          width: 100%;
          overflow: hidden;
          padding: 20px 0;
        }

        /* Garment card */
        .garment-card {
          cursor: crosshair;
          border-radius: 12px;
          overflow: visible;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .garment-card:hover {
          border-color: rgba(255,107,157,0.28);
        }

        /* inner clip needed so SVG doesn't overflow rounded corners */
        .garment-card > .garment-sketch {
          border-radius: 12px;
          overflow: hidden;
        }

        /* Sketch layer – deeper grayscale for stronger contrast reveal */
        .garment-sketch {
          width: 100%;
          height: 100%;
          filter: grayscale(1) brightness(0.48) contrast(1.1);
          display: block;
        }

        /* Label – slides up on hover */
        .garment-label {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          white-space: nowrap;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(6px);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.28s ease, transform 0.28s ease;
          z-index: 5;
        }
        .garment-card:hover .garment-label {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        /* Circular glowing lens */
        .garment-lens {
          position: absolute;
          width: ${LENS_PX}px;
          height: ${LENS_PX}px;
          overflow: hidden;
          pointer-events: none;
          z-index: 20;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.88);
        }

        /* Hero text overlay */
        .hero-text {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 0 24px 32px;
          max-width: 700px;
        }
        .hero-title {
          font-size: clamp(48px, 7.5vw, 92px);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.04em;
          line-height: 1.0;
          margin: 0 0 16px;
          text-shadow: 0 2px 40px rgba(0,0,0,0.9);
        }
        .hero-title span {
          background: linear-gradient(130deg, #FF6B9D 0%, #C084FC 55%, #60A5FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-subtitle {
          font-size: clamp(15px, 2vw, 20px);
          color: rgba(255,255,255,0.52);
          font-weight: 300;
          margin: 0 0 36px;
          letter-spacing: 0.01em;
        }
        .hero-cta {
          background: linear-gradient(135deg, #FF6B9D, #C084FC);
          color: #fff;
          border: none;
          padding: 15px 42px;
          font-size: 16px;
          font-weight: 600;
          border-radius: 13px;
          cursor: pointer;
          letter-spacing: 0.01em;
          box-shadow: 0 8px 28px -4px rgba(255,107,157,0.5);
          transition: transform 0.25s, box-shadow 0.25s;
          position: relative;
          overflow: hidden;
        }
        .hero-cta::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .hero-cta:hover::before { left: 100%; }
        .hero-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px -4px rgba(255,107,157,0.7);
        }

        /* Card animated border beam */
        @keyframes beam-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .card-beam {
          position: absolute;
          inset: -1px;
          border-radius: 13px;
          overflow: hidden;
          pointer-events: none;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .garment-card:hover .card-beam {
          opacity: 1;
        }
        .card-beam::before {
          content: '';
          position: absolute;
          inset: -50%;
          background: conic-gradient(
            from 0deg,
            transparent 0%,
            var(--beam-color, rgba(255,107,157,0.8)) 8%,
            transparent 18%
          );
          animation: beam-orbit 3.2s linear infinite;
        }
        .card-beam::after {
          content: '';
          position: absolute;
          inset: 1px;
          border-radius: 12px;
          background: rgba(8,8,8,0.96);
        }

        /* Edge fade on row */
        .row-fade-left {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 100px;
          background: linear-gradient(to right, #080808, transparent);
          z-index: 5;
          pointer-events: none;
        }
        .row-fade-right {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 100px;
          background: linear-gradient(to left, #080808, transparent);
          z-index: 5;
          pointer-events: none;
        }

        /* Cursor glow */
        .cursor-glow {
          position: fixed;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          background: radial-gradient(circle,
            rgba(255,107,157,0.13) 0%,
            rgba(192,132,252,0.08) 40%,
            transparent 70%
          );
          pointer-events: none;
          z-index: 0;
          filter: blur(60px);
        }
      `}</style>

      <div className="clothes-hero">
        {/* Meteor shower background */}
        <Meteors number={16} />

        {/* Ambient particle field */}
        <Particles color="#C084FC" quantity={65} staticity={70} ease={60} size={0.35} />

        {/* Cursor glow */}
        <motion.div className="cursor-glow" style={{ x: followerX, y: followerY }} />

        {/* Hero headline */}
        <div className="hero-text">
          <BlurFade delay={0} duration={0.7} direction="up">
            <h1 className="hero-title">
              Discover Your <span>Style.</span>
            </h1>
          </BlurFade>
          <BlurFade delay={0.14} duration={0.6} direction="up">
            <RotatingSubtitle />
          </BlurFade>
          <BlurFade delay={0.26} duration={0.6} direction="up">
            <motion.button
              type="button"
              className="hero-cta"
              onClick={onCtaClick}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Your Style Journey
            </motion.button>
          </BlurFade>
        </div>

        {/* Single scrolling row */}
        <div style={{ position: 'relative', width: '100%' }}>
          <div className="row-fade-left" />
          <div className="row-fade-right" />
          <div className="scroll-row-wrap">
            <div className="scroll-track">
              {doubled.map((item, i) => (
                <GarmentCard key={`${item.id}-${i}`} item={item} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
