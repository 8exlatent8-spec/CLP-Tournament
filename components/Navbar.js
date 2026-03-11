import { useEffect, useRef, useState } from "react";
import styled, { createGlobalStyle, keyframes, css } from "styled-components";
import gsap from "gsap";
import { useStateContext } from "@/context/StateContext";
import { adminLogin } from "@/backend/Auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/backend/Firebase";

// ─── Keyframes (only for things GSAP doesn't own) ─────────────────────────────

const hexPulse = keyframes`
  0%, 100% { opacity: 0.04; }
  50%       { opacity: 0.11; }
`;

const innerRotate = keyframes`
  0%   { transform: rotate(0deg);   }
  100% { transform: rotate(360deg); }
`;

const innerRotateRev = keyframes`
  0%   { transform: rotate(0deg);    }
  100% { transform: rotate(-360deg); }
`;

const shimmer2 = keyframes`
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
`;

const nameGlow = keyframes`
  0%, 100% { text-shadow: 0 0 8px rgba(200,170,110,0.4), 0 0 20px rgba(200,170,110,0.15); }
  50%       { text-shadow: 0 0 16px rgba(240,230,210,0.8), 0 0 35px rgba(200,170,110,0.4), 0 0 60px rgba(120,90,40,0.2); }
`;

// ─── Global ───────────────────────────────────────────────────────────────────

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`;

// ─── Root nav ─────────────────────────────────────────────────────────────────

const NavRoot = styled.nav`
  position: relative;
  width: 100%;
  height: 72px;
  display: flex;
  align-items: stretch;
  overflow: visible;
  z-index: 100;
`;

// ─── Border lines ─────────────────────────────────────────────────────────────

const BorderLine = styled.div`
  position: absolute;
  left: 0; right: 0;
  height: 1px;
  ${p => p.$top ? "top: 0;" : "bottom: 0;"}
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(120,90,40,0.2) 3%,
    rgba(200,170,110,0.6) 15%,
    rgba(240,230,210,0.95) 50%,
    rgba(200,170,110,0.6) 85%,
    rgba(120,90,40,0.2) 97%,
    transparent 100%
  );
  opacity: 0;
  pointer-events: none;
  z-index: 40;
`;

// ─── Hex texture ──────────────────────────────────────────────────────────────

const HexTexture = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(60deg,  rgba(200,170,110,0.022) 0, transparent 1px, transparent 20px),
    repeating-linear-gradient(-60deg, rgba(200,170,110,0.022) 0, transparent 1px, transparent 20px),
    repeating-linear-gradient(0deg,   rgba(200,170,110,0.012) 0, transparent 1px, transparent 20px);
  animation: ${hexPulse} 4.5s ease-in-out infinite;
  pointer-events: none;
`;

// ─── Wing lines ───────────────────────────────────────────────────────────────

const WingLines = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px 0;
  pointer-events: none;
`;

const WingLine = styled.div`
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200,170,110,${p => (p.$opacity || 0.18) * 0.3}) 10%,
    rgba(200,170,110,${p => p.$opacity || 0.18}) 35%,
    rgba(200,170,110,${p => (p.$opacity || 0.18) * 1.4}) 50%,
    rgba(200,170,110,${p => p.$opacity || 0.18}) 65%,
    rgba(200,170,110,${p => (p.$opacity || 0.18) * 0.3}) 90%,
    transparent 100%
  );
  transform: scaleX(0);
  transform-origin: center;
  opacity: 0;
`;

// ─── Canvas (GSAP particles + scanline) ──────────────────────────────────────

const NavCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
`;

// ─── Wing arc SVG ─────────────────────────────────────────────────────────────

const WingArcSVG = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
`;

// ─── Vertical dividers ────────────────────────────────────────────────────────

const VertDivider = styled.div`
  position: absolute;
  top: 10%; bottom: 10%;
  width: 1px;
  left: ${p => p.$x}%;
  background: linear-gradient(180deg,
    transparent,
    rgba(200,170,110,0.5) 30%,
    rgba(200,170,110,0.5) 70%,
    transparent
  );
  opacity: 0;
  pointer-events: none;
`;

// ─── Rune glyphs ──────────────────────────────────────────────────────────────

const RuneGlyph = styled.span`
  position: absolute;
  font-size: ${p => p.$size || 10}px;
  color: rgba(200,170,110,0.2);
  pointer-events: none;
  user-select: none;
  font-family: serif;
  left: ${p => p.$x}%;
  top: ${p => p.$y}%;
  opacity: 0;
`;

// ─── Accent dots ──────────────────────────────────────────────────────────────

const AccentDot = styled.div`
  position: absolute;
  left: ${p => p.$x}%;
  top: ${p => p.$y}%;
  width: ${p => p.$size || 3}px;
  height: ${p => p.$size || 3}px;
  border-radius: 50%;
  background: radial-gradient(circle, #f0e6d2, #c8aa6e);
  pointer-events: none;
  opacity: 0;
`;

// ─── Diamond ornament ─────────────────────────────────────────────────────────

const DiamondOrn = styled.div`
  position: absolute;
  left: ${p => p.$x}%;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0;
`;

// ─── Full bar ─────────────────────────────────────────────────────────────────

const FullBar = styled.div`
  position: relative;
  width: 100%;
  height: 72px;
  display: flex;
  align-items: stretch;
  overflow: visible;
  background: linear-gradient(180deg, #0b0c11 0%, #0e1018 50%, #0b0c11 100%);
`;

// ─── Medallion ────────────────────────────────────────────────────────────────

const medallionGlow = keyframes`
  0%, 100% {
    box-shadow:
      0 0 8px 2px rgba(200,170,110,0.25),
      0 0 20px 4px rgba(200,170,110,0.12),
      inset 0 0 12px rgba(200,170,110,0.06);
  }
  50% {
    box-shadow:
      0 0 16px 4px rgba(240,230,210,0.45),
      0 0 40px 10px rgba(200,170,110,0.22),
      inset 0 0 20px rgba(200,170,110,0.12);
  }
`;

const MedallionWrap = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%) scaleY(0.3) scaleX(0.6);
  width: 260px;
  height: 72px;
  overflow: visible;
  z-index: 30;
  opacity: 0;
  pointer-events: all;
  cursor: pointer;
`;
const MedallionWing = styled.div`
  position: absolute;
  top: 0;
  height: 72px;
  width: 180px;
  ${p => p.$left ? "right: 100%;" : "left: 100%;"}
  pointer-events: none;
  opacity: 0;
  overflow: hidden;
`;

const MedallionWingSVG = styled.svg`
  position: absolute;
  top: 0;
  ${p => p.$left ? "right: 0;" : "left: 0;"}
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const MedallionBg = styled.div`
  position: absolute;
  inset: 0;
  clip-path: polygon(
    18px 0%,
    calc(100% - 18px) 0%,
    100% 22%,
    100% 58%,
    50% 100%,
    0% 58%,
    0% 22%
  );
  background: linear-gradient(
    160deg,
    #0c0e15 0%,
    #111827 35%,
    #0e1520 65%,
    #0a0c12 100%
  );
  animation: ${medallionGlow} 3s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 50% 20%, rgba(200,170,110,0.10) 0%, transparent 65%),
      radial-gradient(ellipse 60% 80% at 50% 100%, rgba(120,90,40,0.08) 0%, transparent 60%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(60deg,  rgba(200,170,110,0.03) 0, transparent 1px, transparent 14px),
      repeating-linear-gradient(-60deg, rgba(200,170,110,0.03) 0, transparent 1px, transparent 14px);
    animation: ${hexPulse} 3s ease-in-out infinite;
  }
`;

const MedallionBorder = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  overflow: visible;
  pointer-events: none;
  z-index: 10;
`;

const MedallionInner = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-bottom: 8px;
  gap: 2px;
`;

const InnerRingWrap = styled.div`
  position: absolute;
  top: 8px; left: 50%;
  transform: translateX(-50%);
  width: 42px; height: 42px;
  opacity: 0.35;
`;

const RingOuter = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(200,170,110,0.6);
  animation: ${innerRotate} 12s linear infinite;
`;

const RingInner = styled.div`
  position: absolute;
  inset: 6px;
  border-radius: 50%;
  border: 1px dashed rgba(200,170,110,0.5);
  animation: ${innerRotateRev} 8s linear infinite;
`;

const MedallionName = styled.h2`
  position: relative;
  z-index: 2;
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: transparent;
  background: linear-gradient(90deg,
    #7a5c28 0%,
    #c8aa6e 20%,
    #f0e6d2 50%,
    #c8aa6e 80%,
    #7a5c28 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  animation:
    ${shimmer2} 8s linear infinite,
    ${nameGlow} 5s ease-in-out infinite;
  user-select: none;
  white-space: nowrap;
  margin-top: 2px;
`;

const MedallionSub = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.38rem;
  letter-spacing: 0.55em;
  text-transform: uppercase;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.6), transparent);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  user-select: none;
`;

const TopPin = styled.div`
  position: absolute;
  top: -4px; left: 50%;
  transform: translateX(-50%);
  width: 8px; height: 8px;
  opacity: 0;
`;

// ─── Popup ────────────────────────────────────────────────────────────────────

const PopupOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2,3,6,0);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: backdrop-filter 0.4s ease;
  backdrop-filter: blur(6px);
`;

const PopupBox = styled.div`
  position: relative;
  width: 340px;
  background: linear-gradient(160deg, #0c0e15 0%, #111827 50%, #0a0c12 100%);
  clip-path: polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0% calc(100% - 18px), 0% 18px);
  padding: 42px 36px 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  border: 1px solid rgba(200,170,110,0.3);
  box-shadow:
    0 0 40px rgba(200,170,110,0.08),
    0 0 80px rgba(0,0,0,0.6),
    inset 0 0 30px rgba(200,170,110,0.03);
`;

const PopupCornerSVG = styled.svg`
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  overflow: visible;
`;

const PopupCanvasBg = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  border-radius: 0;
  z-index: 0;
`;

const PopupDivider = styled.div`
  width: 80%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.4), transparent);
`;

const PopupTitle = styled.h3`
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 0.6em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.8);
  user-select: none;
  text-align: center;
`;

const PopupRune = styled.div`
  font-size: 1.4rem;
  color: rgba(200,170,110,0.25);
  user-select: none;
  font-family: serif;
`;

const PopupInput = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.04);
  border: 1px solid rgba(200,170,110,0.2);
  border-bottom: 1px solid rgba(200,170,110,0.5);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  letter-spacing: 0.3em;
  padding: 12px 16px;
  outline: none;
  text-align: center;
  transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% 100%, 0% 100%, 0% 6px);
  &::placeholder { color: rgba(200,170,110,0.18); letter-spacing: 0.1em; }
  &:focus {
    border-color: rgba(200,170,110,0.7);
    background: rgba(200,170,110,0.07);
    box-shadow: 0 0 12px rgba(200,170,110,0.1), inset 0 0 8px rgba(200,170,110,0.04);
  }
`;

const PopupButton = styled.button`
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: #0a0c12;
  background: linear-gradient(90deg, #7a5c28 0%, #c8aa6e 30%, #f0e6d2 50%, #c8aa6e 70%, #7a5c28 100%);
  background-size: 250% auto;
  background-position: left center;
  border: none;
  padding: 12px 32px;
  cursor: pointer;
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px);
  transition: background-position 0.6s ease, box-shadow 0.3s ease, transform 0.2s ease;
  box-shadow: 0 0 0px rgba(200,170,110,0);
  &:hover {
    background-position: right center;
    box-shadow: 0 0 18px rgba(200,170,110,0.35), 0 0 6px rgba(240,230,210,0.2);
    transform: translateY(-1px);
  }
  &:active {
    transform: translateY(0px);
  }
`;

const PopupError = styled.p`
  font-family: 'Cinzel', serif;
  font-size: 0.52rem;
  letter-spacing: 0.35em;
  color: rgba(220,80,80,0.9);
  user-select: none;
  text-align: center;
`;

// ─── Data ─────────────────────────────────────────────────────────────────────

const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];

const ALL_RUNES = [
  { x:4,  y:28, dur:5.2, size:12 },
  { x:10, y:62, dur:7.1, size:9  },
  { x:17, y:38, dur:6.0, size:8  },
  { x:24, y:20, dur:5.5, size:7  },
  { x:31, y:70, dur:6.8, size:8  },
  { x:38, y:45, dur:5.9, size:7  },
  { x:45, y:25, dur:6.3, size:6  },
  { x:52, y:65, dur:7.4, size:6  },
  { x:58, y:35, dur:6.1, size:6  },
  { x:65, y:58, dur:5.7, size:7  },
  { x:72, y:22, dur:6.5, size:8  },
  { x:79, y:48, dur:5.3, size:7  },
  { x:86, y:72, dur:7.2, size:9  },
  { x:93, y:30, dur:6.0, size:12 },
];

const ALL_DOTS = [
  { x:5,  y:50, size:2.5, dur:2.8 },
  { x:13, y:50, size:2,   dur:3.4 },
  { x:21, y:50, size:3,   dur:2.5 },
  { x:29, y:50, size:2,   dur:3.8 },
  { x:37, y:50, size:2.5, dur:2.9 },
  { x:45, y:50, size:2,   dur:3.2 },
  { x:53, y:50, size:3,   dur:2.6 },
  { x:61, y:50, size:2,   dur:3.1 },
  { x:69, y:50, size:2.5, dur:3.5 },
  { x:77, y:50, size:2,   dur:2.9 },
  { x:85, y:50, size:3,   dur:3.3 },
  { x:93, y:50, size:2.5, dur:2.7 },
  { x:15, y:22, size:1.5, dur:4.1 },
  { x:35, y:75, size:1.5, dur:3.7 },
  { x:55, y:20, size:1.5, dur:4.3 },
  { x:75, y:78, size:1.5, dur:3.5 },
  { x:95, y:25, size:1.5, dur:4.0 },
];

const ALL_DIAMONDS = [
  { x:8,  size:10, dur:4.0 },
  { x:23, size:7,  dur:3.5 },
  { x:38, size:8,  dur:4.3 },
  { x:50, size:11, dur:3.8 },
  { x:62, size:8,  dur:4.1 },
  { x:77, size:7,  dur:3.6 },
  { x:92, size:10, dur:4.2 },
];

// ─── SVG arc decoration ───────────────────────────────────────────────────────

const arcGlow = keyframes`
  0%, 100% { stroke-opacity: 0.25; }
  50%       { stroke-opacity: 0.75; }
`;

const emblemBreath = keyframes`
  0%, 100% { transform: scale(1)    rotate(0deg);   filter: drop-shadow(0 0 4px #c8aa6e); }
  50%       { transform: scale(1.08) rotate(0.8deg); filter: drop-shadow(0 0 14px #f0e6d2) drop-shadow(0 0 28px #c8aa6e); }
`;

function FullWingArcs() {
  const an = { animationIterationCount:"infinite", animationTimingFunction:"ease-in-out" };
  return (
    <WingArcSVG viewBox="0 0 1200 72" preserveAspectRatio="none">
      <defs>
        <linearGradient id="fullgrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0"/>
          <stop offset="15%"  stopColor="#c8aa6e" stopOpacity="0.6"/>
          <stop offset="50%"  stopColor="#f0e6d2" stopOpacity="0.9"/>
          <stop offset="85%"  stopColor="#c8aa6e" stopOpacity="0.6"/>
          <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="fullgrad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0"/>
          <stop offset="20%"  stopColor="#c8aa6e" stopOpacity="0.35"/>
          <stop offset="50%"  stopColor="#f0e6d2" stopOpacity="0.55"/>
          <stop offset="80%"  stopColor="#c8aa6e" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
        </linearGradient>
      </defs>

      <line x1="0" y1="18" x2="1200" y2="18" stroke="url(#fullgrad2)" strokeWidth="0.8"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"4s" }}/>
      <line x1="0" y1="36" x2="1200" y2="36" stroke="url(#fullgrad)" strokeWidth="1.2"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"3.5s", animationDelay:"0.8s" }}/>
      <line x1="0" y1="54" x2="1200" y2="54" stroke="url(#fullgrad2)" strokeWidth="0.8"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"4.2s", animationDelay:"1.6s" }}/>

      <path d="M 0 4 Q 300 36 0 68"    fill="none" stroke="rgba(200,170,110,0.10)" strokeWidth="1"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"5s" }}/>
      <path d="M 1200 4 Q 900 36 1200 68" fill="none" stroke="rgba(200,170,110,0.10)" strokeWidth="1"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"5s", animationDelay:"0.5s" }}/>
      <path d="M 60 4 Q 350 36 60 68"  fill="none" stroke="rgba(200,170,110,0.07)" strokeWidth="0.7"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"6s", animationDelay:"1s" }}/>
      <path d="M 1140 4 Q 850 36 1140 68" fill="none" stroke="rgba(200,170,110,0.07)" strokeWidth="0.7"
        style={{ ...an, animationName: arcGlow.name, animationDuration:"6s", animationDelay:"1.5s" }}/>

      {[120,200,280,360,440,520,600,680,760,840,920,1000,1080].map((x) => (
        <g key={x} opacity={0.18}>
          <line x1={x} y1="28" x2={x+8} y2="36" stroke="#c8aa6e" strokeWidth="0.7"/>
          <line x1={x+8} y1="36" x2={x} y2="44" stroke="#c8aa6e" strokeWidth="0.7"/>
        </g>
      ))}

      {[10,20,30,40,50,60].map(x => (
        <line key={x} x1={x} y1="8" x2={x+8} y2="64" stroke="rgba(200,170,110,0.07)" strokeWidth="0.5"/>
      ))}
      {[1140,1150,1160,1170,1180,1190].map(x => (
        <line key={x} x1={x} y1="8" x2={x-8} y2="64" stroke="rgba(200,170,110,0.07)" strokeWidth="0.5"/>
      ))}

      {[20, 1180].map((cx, i) => (
        <g key={cx} transform={`translate(${cx},36)`}
          style={{ animationName: emblemBreath.name, animationDuration:"3s", animationDelay:`${i*1}s`, animationIterationCount:"infinite", animationTimingFunction:"ease-in-out" }}>
          <path d="M0,-8 L8,0 L0,8 L-8,0 Z" fill="rgba(200,170,110,0.12)" stroke="#c8aa6e" strokeWidth="0.9"/>
          <circle cx="0" cy="0" r="1.5" fill="#f0e6d2"/>
        </g>
      ))}
      <g transform="translate(600,36)"
        style={{ animationName: emblemBreath.name, animationDuration:"3.5s", animationDelay:"0.5s", animationIterationCount:"infinite", animationTimingFunction:"ease-in-out" }}>
        <path d="M0,-9 L9,0 L0,9 L-9,0 Z" fill="rgba(200,170,110,0.15)" stroke="#c8aa6e" strokeWidth="1"/>
        <path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="rgba(200,170,110,0.2)"  stroke="#c8aa6e" strokeWidth="0.6"/>
        <circle cx="0" cy="0" r="1.8" fill="#f0e6d2"/>
      </g>

      {Array.from({length:40},(_,i) => {
        const x = 15 + i * 30;
        return <g key={i}>
          <line x1={x} y1="0"  x2={x} y2={i%4===0?5:3}  stroke="rgba(200,170,110,0.35)" strokeWidth="0.6"/>
          <line x1={x} y1="72" x2={x} y2={72-(i%4===0?5:3)} stroke="rgba(200,170,110,0.35)" strokeWidth="0.6"/>
        </g>;
      })}
    </WingArcSVG>
  );
}

// ─── GSAP canvas: particles + scanline ───────────────────────────────────────

function useNavCanvas(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, rafId;
    const particles = [];
    const scanlines = [];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const gold  = a => `rgba(200,170,110,${a})`;
    const cream = a => `rgba(240,230,210,${a})`;

    for (let i = 0; i < 28; i++) {
      const p = {
        ox: Math.random() * 100,
        oy: 10 + Math.random() * 80,
        dx: (Math.random() - 0.5) * 45,
        dy: -(10 + Math.random() * 30),
        size: 0.6 + Math.random() * 1.8,
        progress: 0,
      };
      particles.push(p);
      const dur = 3 + Math.random() * 4;
      gsap.to(p, {
        progress: 1,
        duration: dur,
        ease: "power1.out",
        delay: Math.random() * dur,
        repeat: -1,
        repeatDelay: Math.random() * 2,
        onRepeat() {
          p.ox = Math.random() * 100;
          p.oy = 10 + Math.random() * 80;
          p.dx = (Math.random() - 0.5) * 45;
          p.dy = -(10 + Math.random() * 30);
        },
      });
    }

    function spawnScanline() {
      const sl = { x: -80, alpha: 0 };
      scanlines.push(sl);
      gsap.timeline({ repeat: -1, delay: Math.random() * 7 })
        .set(sl, { x: -80, alpha: 0 })
        .to(sl, { x: W + 80, alpha: 0.5, duration: 7, ease: "none" })
        .to(sl, { alpha: 0, duration: 1 }, "-=1");
    }
    spawnScanline();
    spawnScanline();

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (const sl of scanlines) {
        if (sl.alpha <= 0) continue;
        const g = ctx.createLinearGradient(sl.x - 40, 0, sl.x + 40, 0);
        g.addColorStop(0,   "transparent");
        g.addColorStop(0.5, cream(sl.alpha * 0.18));
        g.addColorStop(1,   "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(sl.x - 40, 0, 80, H);
      }

      for (const p of particles) {
        const t = p.progress;
        if (t <= 0 || t >= 1) continue;
        let a;
        if      (t < 0.10) a = t / 0.10;
        else if (t < 0.85) a = 1;
        else               a = (1 - t) / 0.15;
        a *= 0.80;

        const px = (p.ox / 100) * W + (p.dx * t);
        const py = (p.oy / 100) * H + (p.dy * t);
        const r  = p.size * 2;

        const grd = ctx.createRadialGradient(px, py, 0, px, py, r);
        grd.addColorStop(0,   cream(a));
        grd.addColorStop(0.5, gold(a * 0.65));
        grd.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);
}

// ─── GSAP entrance + ongoing loops ───────────────────────────────────────────

function useNavGSAP(refs) {
  useEffect(() => {
    const {
      borderTop, borderBot,
      wingLines, vertDividers,
      runes, dots, diamonds,
      medallion, topPin,
      medallionPath,
    } = refs;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      [borderTop.current, borderBot.current],
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 0.85, duration: 1.0, stagger: 0.15, transformOrigin: "center", ease: "power2.inOut" },
      0
    );

    tl.to(wingLines.current, {
      scaleX: 1, opacity: 1,
      duration: 0.9, stagger: 0.1, ease: "power2.inOut",
    }, 0.2);

    tl.fromTo(vertDividers.current,
      { opacity: 0, scaleY: 0 },
      { opacity: 0.6, scaleY: 1, duration: 0.7, stagger: { each: 0.04, from: "center" }, transformOrigin: "center", ease: "back.out(1.2)" },
      0.35
    );

    tl.to(medallion.current, {
      opacity: 1,
      transformOrigin: "50% 0%",
      ease: "back.out(1.6)",
      duration: 1.0,
      onStart() {
        gsap.to(medallion.current, {
          transform: "translateX(-50%) scaleY(1) scaleX(1)",
          duration: 1.0,
          ease: "back.out(1.6)",
        });
      },
    }, 0.1);

    tl.fromTo(topPin.current,
      { opacity: 0, y: -6 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(2)" },
      0.9
    );

    tl.to(runes.current, {
      opacity: 0.2, duration: 0.6,
      stagger: { each: 0.06, from: "random" },
      ease: "power1.out",
    }, 0.6);

    tl.fromTo(dots.current,
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.4, stagger: { each: 0.03, from: "center" }, ease: "back.out(2)" },
      0.5
    );

    tl.fromTo(diamonds.current,
      { opacity: 0, scale: 0 },
      { opacity: 1, scale: 1, duration: 0.5, stagger: { each: 0.07, from: "center" }, ease: "back.out(1.5)", transformOrigin: "center" },
      0.7
    );

    // ── Ongoing loops ──────────────────────────────────────────────────────

    gsap.to([borderTop.current, borderBot.current], {
      opacity: 1,
      duration: 1.9,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
      stagger: 1.9,
      delay: 1.2,
    });

    runes.current.forEach((el, i) => {
      if (!el) return;
      const dur = 5 + (i % 5) * 0.4;
      gsap.to(el, {
        y: -5 + (i % 3) * 2,
        rotation: -3 + (i % 3) * 3,
        opacity: 0.28,
        duration: dur,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.18,
      });
    });

    dots.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        scale: 1.5,
        opacity: 0.9,
        duration: 2.5 + (i % 4) * 0.3,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.12,
      });
    });

    diamonds.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        scale: 1.1,
        opacity: 0.85,
        duration: 3.5 + i * 0.2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.25,
        filter: "drop-shadow(0 0 6px rgba(200,170,110,0.7))",
      });
    });

    vertDividers.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        opacity: 0.9,
        duration: 3 + i * 0.15,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: i * 0.15,
      });
    });

    if (topPin.current) {
      gsap.to(topPin.current, {
        scale: 1.3,
        filter: "drop-shadow(0 0 4px #c8aa6e)",
        duration: 2.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 1,
        transformOrigin: "center",
      });
    }
    

    // ── Hover-driven medallion border ──────────────────────────────────────
    if (medallionPath.current && medallion.current) {
      const path = medallionPath.current;
      const len  = 760;

      gsap.set(path, { attr: { "stroke-dasharray": len, "stroke-dashoffset": len }, opacity: 0.85 });

      const fillTween = gsap.to(path, {
        attr: { "stroke-dashoffset": 0 },
        duration: 1,
        ease: "power2.inOut",
        paused: true,

      });

      const onEnter = () => {
        gsap.killTweensOf(path, "opacity");
        gsap.set(path, { opacity: 0.85 });
        fillTween.seek(0.3);
        fillTween.play();
      };
      const onLeave = () => {
        gsap.to(path, { opacity: 0, duration: 0.25, ease: "power2.inOut", onComplete: () => {
          fillTween.pause(0);
        }});
      };

      medallion.current.addEventListener("mouseenter", onEnter);
      medallion.current.addEventListener("mouseleave", onLeave);

      return () => {
        medallion.current?.removeEventListener("mouseenter", onEnter);
        medallion.current?.removeEventListener("mouseleave", onLeave);
      };
    }

  }, []);
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HextechNavbar({ onTabChange } = {}) {
  const { setAdmin } = useStateContext();
const [showPopup, setShowPopup]   = useState(false);
const [password, setPassword]     = useState("");
const [error, setError]           = useState("");
const [signOutMode, setSignOutMode] = useState(false);
const { admin } = useStateContext();
const [inputVal, setInputVal]     = useState("");

  const popupOverlayRef = useRef(null);
  const popupBoxRef     = useRef(null);
  const popupCanvasRef  = useRef(null);
  const medallionWingRefs  = useRef([]);
  const wingLineElRefs     = useRef([]);

  const handleMedallionClick = () => {
    if (admin) {
      setSignOutMode(true);
    } else {
      setSignOutMode(false);
      setPassword("");
      setError("");
    }
    setShowPopup(true);
  };

  // ── Popup entrance animation ──────────────────────────────────────────────
  useEffect(() => {
    if (!showPopup) return;
    const overlay = popupOverlayRef.current;
    const box     = popupBoxRef.current;
    if (!overlay || !box) return;

    const tl = gsap.timeline();

    tl.fromTo(overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: "power2.out" },
      0
    );

    tl.fromTo(box,
      { opacity: 0, scale: 0.82, y: 28, rotationX: 8 },
      { opacity: 1, scale: 1,    y: 0,  rotationX: 0, duration: 0.6, ease: "back.out(1.8)" },
      0.05
    );

    const children = [...box.children].slice(1);
    tl.fromTo(children,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" },
      0.22
    );

    const rune = children[0];
    if (rune) {
      gsap.to(rune, {
        opacity: 0.5,
        scale: 1.15,
        duration: 2,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.8,
      });
    }

    const cvs = popupCanvasRef.current;
    if (!cvs) return;
    const ctx2 = cvs.getContext("2d");
    cvs.width  = cvs.offsetWidth;
    cvs.height = cvs.offsetHeight;
    const W2 = cvs.width, H2 = cvs.height;

    const pts = Array.from({ length: 18 }, () => ({
      x: Math.random() * W2,
      y: Math.random() * H2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.2 + Math.random() * 0.5),
      r: 1 + Math.random() * 2,
      a: 0,
    }));

    pts.forEach(p => {
      gsap.to(p, {
        a: 0.7,
        duration: 1 + Math.random(),
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: Math.random() * 2,
      });
    });

    let rafId2;
    function drawPopup() {
      ctx2.clearRect(0, 0, W2, H2);
      const t = Date.now() / 3000;
      const gx = W2 / 2 + Math.sin(t) * 40;
      const gy = H2 / 2 + Math.cos(t * 0.7) * 30;
      const grad = ctx2.createRadialGradient(gx, gy, 0, gx, gy, W2 * 0.7);
      grad.addColorStop(0,   "rgba(200,170,110,0.06)");
      grad.addColorStop(0.5, "rgba(200,170,110,0.02)");
      grad.addColorStop(1,   "transparent");
      ctx2.fillStyle = grad;
      ctx2.fillRect(0, 0, W2, H2);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4)     p.y = H2 + 4;
        if (p.x < -4)     p.x = W2 + 4;
        if (p.x > W2 + 4) p.x = -4;

        const g2 = ctx2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.5);
        g2.addColorStop(0,   `rgba(240,230,210,${p.a})`);
        g2.addColorStop(0.5, `rgba(200,170,110,${p.a * 0.5})`);
        g2.addColorStop(1,   "transparent");
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
        ctx2.fillStyle = g2;
        ctx2.fill();
      }

      rafId2 = requestAnimationFrame(drawPopup);
    }
    drawPopup();

    return () => cancelAnimationFrame(rafId2);
  }, [showPopup]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user?.email === "admin@gmail.com") {
        setAdmin(true);
      } else {
        setAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  const handleSend = async () => {
    try {
      await adminLogin(password);
      setAdmin(true);
      setShowPopup(false);
    } catch (e) {
      console.log("AUTH ERROR:", e.code, e.message);
      setError("Incorrect Message");
    }
  };

  const handleSignOut = async () => {
    try {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      setAdmin(false);
      setShowPopup(false);
    } catch (e) {
      console.log("SIGN OUT ERROR:", e);
    }
  };

  const canvasRef        = useRef(null);
  const borderTopRef     = useRef(null);
  const borderBotRef     = useRef(null);
  const wingLineRefs     = useRef([]);
  const vertDivRefs      = useRef([]);
  const runeRefs         = useRef([]);
  const dotRefs          = useRef([]);
  const diamondRefs      = useRef([]);
  const medallionRef     = useRef(null);
  const topPinRef        = useRef(null);
  const medallionPathRef = useRef(null);

  useNavCanvas(canvasRef);

  // Admin medallion glow effect
  useEffect(() => {
    if (!medallionRef.current) return;
    if (admin) {
      gsap.to(medallionRef.current, {
        filter: "drop-shadow(0 0 6px rgba(200,170,110,0.45)) drop-shadow(0 0 14px rgba(240,230,210,0.25))",
        duration: 0.6,
        ease: "power2.out",
      });
      gsap.to(medallionRef.current, {
        filter: "drop-shadow(0 0 9px rgba(200,170,110,0.5)) drop-shadow(0 0 20px rgba(240,230,210,0.35))",
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        delay: 0.6,
        id: "adminPulse",
      });
    } else {
      gsap.killTweensOf(medallionRef.current);
      gsap.to(medallionRef.current, {
        filter: "none",
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [admin]);

  useNavGSAP({
    borderTop:     borderTopRef,
    borderBot:     borderBotRef,
    wingLines:     wingLineRefs,
    vertDividers:  vertDivRefs,
    runes:         runeRefs,
    dots:          dotRefs,
    diamonds:      diamondRefs,
    medallion:     medallionRef,
    topPin:        topPinRef,
    medallionPath: medallionPathRef,
  });

  return (
    <>
      <GlobalStyle />

      {/* ── ADMIN POPUP — rendered outside NavRoot so no stacking context traps it ── */}
      {showPopup && (
        <PopupOverlay ref={popupOverlayRef} onClick={() => setShowPopup(false)}>
          <PopupBox ref={popupBoxRef} onClick={e => e.stopPropagation()}>
            <PopupCanvasBg ref={popupCanvasRef} />
            <PopupCornerSVG viewBox="0 0 340 260" preserveAspectRatio="none">
              <line x1="18"  y1="1"   x2="70"  y2="1"   stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="1"   y1="18"  x2="1"   y2="70"  stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="322" y1="1"   x2="270" y2="1"   stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="339" y1="18"  x2="339" y2="70"  stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="18"  y1="259" x2="70"  y2="259" stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="1"   y1="242" x2="1"   y2="190" stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="322" y1="259" x2="270" y2="259" stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <line x1="339" y1="242" x2="339" y2="190" stroke="rgba(200,170,110,0.6)" strokeWidth="1.5"/>
              <circle cx="18"  cy="1"   r="3" fill="#c8aa6e" opacity="0.9"/>
              <circle cx="322" cy="1"   r="3" fill="#c8aa6e" opacity="0.9"/>
              <circle cx="18"  cy="259" r="3" fill="#c8aa6e" opacity="0.9"/>
              <circle cx="322" cy="259" r="3" fill="#c8aa6e" opacity="0.9"/>
            </PopupCornerSVG>
            {signOutMode ? (
              <>
                <PopupTitle>Would you like to sign out?</PopupTitle>
                <PopupDivider />
                <PopupButton onClick={handleSignOut}>Yes</PopupButton>
              </>
            ) : (
              <>
                <PopupTitle>What&apos;s the Message</PopupTitle>
                <PopupDivider />
<PopupInput
  type="text"
  inputMode="none"
  placeholder="· · · · · · · ·"
  value={"•".repeat(password.length)}
  onChange={e => {
    const newVal = e.target.value;
    if (newVal.length < password.length) {
      const diff = password.length - newVal.length;
      setPassword(prev => prev.slice(0, -diff));
    } else {
      const added = newVal.replace(/•/g, "");
      setPassword(prev => prev + added);
    }
    setError("");
  }}
  onKeyDown={e => {
    if (e.key === "Enter") handleSend();
    if (e.key === "Backspace") {
      e.preventDefault();
      setPassword(prev => prev.slice(0, -1));
    }
  }}
  onPaste={e => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    setPassword(prev => prev + pasted);
    setError("");
  }}
  autoFocus
  autoComplete="off"
  autoCorrect="off"
  autoCapitalize="off"
  spellCheck="false"
  data-lpignore="true"
  data-form-type="other"
/>
                {error && <PopupError>⟡ {error} ⟡</PopupError>}
                <PopupButton onClick={handleSend}>Send</PopupButton>
              </>
            )}
          </PopupBox>
        </PopupOverlay>
      )}

      <NavRoot>
        <BorderLine $top  ref={borderTopRef} />
        <BorderLine       ref={borderBotRef} />

        <FullBar>
          <NavCanvas ref={canvasRef} />
          <HexTexture />
          <FullWingArcs />

          <WingLines>
            {[
              { $opacity: 0.18 },
              { $opacity: 0.30 },
              { $opacity: 0.18 },
            ].map((p, i) => (
              <WingLine key={i} ref={el => { wingLineRefs.current[i] = el; }} {...p} />
            ))}
          </WingLines>

          {[8,20,32,44,56,68,80,92].map((x, i) => (
            <VertDivider
              key={x}
              $x={x}
              ref={el => { vertDivRefs.current[i] = el; }}
            />
          ))}

          {ALL_RUNES.map((r, i) => (
            <RuneGlyph
              key={i}
              $x={r.x} $y={r.y} $size={r.size}
              ref={el => { runeRefs.current[i] = el; }}
            >
              {RUNES[i % RUNES.length]}
            </RuneGlyph>
          ))}

          {ALL_DOTS.map((d, i) => (
            <AccentDot
              key={i}
              $x={d.x} $y={d.y} $size={d.size}
              ref={el => { dotRefs.current[i] = el; }}
            />
          ))}

          {ALL_DIAMONDS.map((d, i) => (
            <DiamondOrn
              key={i}
              $x={d.x}
              ref={el => { diamondRefs.current[i] = el; }}
            >
              <svg viewBox="0 0 14 14" fill="none" width={d.size} height={d.size}>
                <path d="M7 0 L14 7 L7 14 L0 7 Z" stroke="#c8aa6e" strokeWidth="1"   fill="rgba(200,170,110,0.07)"/>
                <path d="M7 3 L11 7 L7 11 L3 7 Z" stroke="#c8aa6e" strokeWidth="0.6" fill="rgba(200,170,110,0.1)"/>
                <circle cx="7" cy="7" r="1.2" fill="#f0e6d2"/>
              </svg>
            </DiamondOrn>
          ))}
        </FullBar>

        {/* ── MEDALLION WINGS ── */}
        <MedallionWing $left ref={el => { medallionWingRefs.current[0] = el; }}>
          <MedallionWingSVG $left viewBox="0 0 180 72" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wgl" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0.9"/>
                <stop offset="40%"  stopColor="#c8aa6e" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="wgl2" x1="100%" y1="0%" x2="0%" y2="0%">
                <stop offset="0%"   stopColor="#f0e6d2" stopOpacity="0.6"/>
                <stop offset="30%"  stopColor="#c8aa6e" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* main spine line */}
            <line x1="180" y1="36" x2="0" y2="36" stroke="url(#wgl)" strokeWidth="1.2" ref={el => wingLineElRefs.current[0] = el}/>
            {/* upper parallel */}
            <line x1="180" y1="26" x2="20" y2="26" stroke="url(#wgl)" strokeWidth="0.5" opacity="0.5"/>
            {/* lower parallel */}
            <line x1="180" y1="46" x2="20" y2="46" stroke="url(#wgl)" strokeWidth="0.5" opacity="0.5"/>
            {/* taper lines from medallion edge */}
            <line x1="180" y1="36" x2="140" y2="18" stroke="url(#wgl2)" strokeWidth="0.6" opacity="0.7"/>
            <line x1="180" y1="36" x2="140" y2="54" stroke="url(#wgl2)" strokeWidth="0.6" opacity="0.7"/>
            <line x1="180" y1="36" x2="80"  y2="20" stroke="url(#wgl2)" strokeWidth="0.4" opacity="0.4"/>
            <line x1="180" y1="36" x2="80"  y2="52" stroke="url(#wgl2)" strokeWidth="0.4" opacity="0.4"/>
            {/* tick marks along spine */}
            {[160,140,120,100,80,60,40].map((x, i) => (
              <g key={x} opacity={0.6 - i * 0.07}>
                <line x1={x} y1={36 - (i % 2 === 0 ? 5 : 3)} x2={x} y2={36 + (i % 2 === 0 ? 5 : 3)} stroke="#c8aa6e" strokeWidth="0.7"/>
              </g>
            ))}
            {/* accent dots along spine */}
            {[155, 125, 90].map((x, i) => (
              <circle key={x} cx={x} cy="36" r={1.5 - i * 0.3} fill="#f0e6d2" opacity={0.8 - i * 0.2}/>
            ))}
            {/* diamond accent near medallion */}
            <path d="M172,36 L178,30 L184,36 L178,42 Z" fill="rgba(200,170,110,0.15)" stroke="#c8aa6e" strokeWidth="0.7"/>
            <circle cx="178" cy="36" r="1" fill="#f0e6d2" opacity="0.9"/>
          </MedallionWingSVG>
        </MedallionWing>

        <MedallionWing ref={el => { medallionWingRefs.current[1] = el; }}>
          <MedallionWingSVG viewBox="0 0 180 72" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wgr" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0.9"/>
                <stop offset="40%"  stopColor="#c8aa6e" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="wgr2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#f0e6d2" stopOpacity="0.6"/>
                <stop offset="30%"  stopColor="#c8aa6e" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <line x1="0"   y1="36" x2="180" y2="36" stroke="url(#wgr)" strokeWidth="1.2"/>
            <line x1="0"   y1="26" x2="160" y2="26" stroke="url(#wgr)" strokeWidth="0.5" opacity="0.5"/>
            <line x1="0"   y1="46" x2="160" y2="46" stroke="url(#wgr)" strokeWidth="0.5" opacity="0.5"/>
            <line x1="0"   y1="36" x2="40"  y2="18" stroke="url(#wgr2)" strokeWidth="0.6" opacity="0.7"/>
            <line x1="0"   y1="36" x2="40"  y2="54" stroke="url(#wgr2)" strokeWidth="0.6" opacity="0.7"/>
            <line x1="0"   y1="36" x2="100" y2="20" stroke="url(#wgr2)" strokeWidth="0.4" opacity="0.4"/>
            <line x1="0"   y1="36" x2="100" y2="52" stroke="url(#wgr2)" strokeWidth="0.4" opacity="0.4"/>
            {[20,40,60,80,100,120,140].map((x, i) => (
              <g key={x} opacity={0.6 - i * 0.07}>
                <line x1={x} y1={36 - (i % 2 === 0 ? 5 : 3)} x2={x} y2={36 + (i % 2 === 0 ? 5 : 3)} stroke="#c8aa6e" strokeWidth="0.7"/>
              </g>
            ))}
            {[25, 55, 90].map((x, i) => (
              <circle key={x} cx={x} cy="36" r={1.5 - i * 0.3} fill="#f0e6d2" opacity={0.8 - i * 0.2}/>
            ))}
            <path d="M-4,36 L2,30 L8,36 L2,42 Z" fill="rgba(200,170,110,0.15)" stroke="#c8aa6e" strokeWidth="0.7"/>
            <circle cx="2" cy="36" r="1" fill="#f0e6d2" opacity="0.9"/>
          </MedallionWingSVG>
        </MedallionWing>

        {/* ── CENTER MEDALLION ── */}
        <MedallionWrap ref={medallionRef} onClick={handleMedallionClick}>
          <MedallionBg />

          <MedallionBorder viewBox="0 0 260 134" preserveAspectRatio="none">
            <defs>
              <linearGradient id="mgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#7a5c28" stopOpacity="0.4"/>
                <stop offset="30%"  stopColor="#c8aa6e" stopOpacity="0.9"/>
                <stop offset="50%"  stopColor="#f0e6d2" stopOpacity="1"/>
                <stop offset="70%"  stopColor="#c8aa6e" stopOpacity="0.9"/>
                <stop offset="100%" stopColor="#7a5c28" stopOpacity="0.4"/>
              </linearGradient>
              <filter id="mglow">
                <feGaussianBlur stdDeviation="1.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            <path d="M20,0 L240,0 L260,30 L260,78 L130,134 L0,78 L0,30 Z"
              fill="none" stroke="rgba(200,170,110,0.2)" strokeWidth="1"/>
            <path
              ref={medallionPathRef}
              d="M20,0 L240,0 L260,30 L260,78 L130,134 L0,78 L0,30 Z"
              fill="none"
              stroke="url(#mgrad)"
              strokeWidth="1.5"
              strokeDasharray="760"
              strokeDashoffset="0"
              filter="url(#mglow)"
              opacity="0"
            />
            {[[20,0],[240,0],[260,30],[260,78],[130,134],[0,78],[0,30]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="2.5"
                fill="rgba(200,170,110,0.15)" stroke="#c8aa6e" strokeWidth="0.7"/>
            ))}
            <line x1="50"  y1="18" x2="210" y2="18" stroke="rgba(200,170,110,0.2)"  strokeWidth="0.6"/>
            <line x1="65"  y1="22" x2="195" y2="22" stroke="rgba(200,170,110,0.12)" strokeWidth="0.4"/>
            <line x1="110" y1="112" x2="150" y2="112" stroke="rgba(200,170,110,0.18)" strokeWidth="0.5"/>
          </MedallionBorder>

          <MedallionInner>
            <InnerRingWrap>
              <RingOuter/>
              <RingInner/>
              {Array.from({length:8},(_,i) => {
                const angle = (i/8)*Math.PI*2;
                const r = 20;
                const cx = 21 + r*Math.cos(angle);
                const cy = 21 + r*Math.sin(angle);
                return <div key={i} style={{
                  position:'absolute', left:cx-1, top:cy-1,
                  width:2, height:2, borderRadius:'50%',
                  background:'rgba(200,170,110,0.7)'
                }}/>;
              })}
            </InnerRingWrap>

            <MedallionName>Clapped</MedallionName>
          </MedallionInner>

          <TopPin ref={topPinRef}>
            <svg viewBox="0 0 8 8" width="8" height="8" fill="none">
              <path d="M4 0 L8 4 L4 8 L0 4 Z" fill="rgba(200,170,110,0.3)" stroke="#c8aa6e" strokeWidth="0.8"/>
              <circle cx="4" cy="4" r="1" fill="#f0e6d2"/>
            </svg>
          </TopPin>
        </MedallionWrap>
      </NavRoot>
    </>
  );
}