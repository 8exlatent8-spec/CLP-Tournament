"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes, css } from "styled-components";
import gsap from "gsap";
import { BracketView } from "@/components/tournamentslive/tournament-systems";
import { useStateContext } from "@/context/StateContext";

// ─── CSS keyframes ────────────────────────────────────────────────────────────

const hexPulse = keyframes`
  0%, 100% { opacity: 0.022; }
  50%       { opacity: 0.048; }
`;

const slowVignette = keyframes`
  0%, 100% { opacity: 0.9; }
  50%       { opacity: 1;   }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────

const HeroRoot = styled.section`
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background: #04050a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  @media (max-width: 480px) {
    min-height: 100dvh;
  }
`;

const BgBase = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 55% at 50% 0%,   rgba(200,170,110,0.055) 0%, transparent 65%),
    radial-gradient(ellipse 60% 45% at 50% 100%, rgba(100,75,30,0.07)   0%, transparent 60%),
    linear-gradient(180deg, #050609 0%, #07080d 45%, #050608 100%);
  pointer-events: none;
`;

const HexGrid = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(60deg,  rgba(200,170,110,1) 0, transparent 1px, transparent 30px),
    repeating-linear-gradient(-60deg, rgba(200,170,110,1) 0, transparent 1px, transparent 30px),
    repeating-linear-gradient(0deg,   rgba(200,170,110,1) 0, transparent 1px, transparent 30px);
  opacity: 0.018;
  animation: ${hexPulse} 7s ease-in-out infinite;
  pointer-events: none;
`;

const Vignette = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 95% 95% at 50% 50%,
    transparent 35%,
    rgba(3,4,7,0.55) 68%,
    rgba(2,3,6,0.97) 100%
  );
  animation: ${slowVignette} 10s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
`;

const AnimCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
`;

const DecoSVG = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
  z-index: 3;
`;

const CornerSVG = styled.svg`
  position: absolute;
  width: 90px;
  height: 90px;
  pointer-events: none;
  z-index: 4;
  opacity: 0;
  ${p => p.$tl && css`top: 20px; left: 20px;`}
  ${p => p.$tr && css`top: 20px; right: 20px; transform: scaleX(-1);`}
  ${p => p.$bl && css`bottom: 20px; left: 20px; transform: scaleY(-1);`}
  ${p => p.$br && css`bottom: 20px; right: 20px; transform: scale(-1);`}
`;

const HRule = styled.div`
  position: absolute;
  left: ${p => p.$l || "8%"};
  right: ${p => p.$r || "8%"};
  top: ${p => p.$top};
  bottom: ${p => p.$bot};
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200,170,110,${p => p.$op || 0.07}) 20%,
    rgba(200,170,110,${p => (p.$op || 0.07) * 2}) 50%,
    rgba(200,170,110,${p => p.$op || 0.07}) 80%,
    transparent 100%
  );
  transform-origin: left center;
  transform: scaleX(0);
  opacity: 0;
  pointer-events: none;
  z-index: 4;
`;

const VRule = styled.div`
  position: absolute;
  top: ${p => p.$top || "12%"};
  bottom: ${p => p.$bot || "12%"};
  left: ${p => p.$l};
  width: 1px;
  background: linear-gradient(180deg,
    transparent 0%,
    rgba(200,170,110,${p => p.$op || 0.05}) 30%,
    rgba(200,170,110,${p => (p.$op || 0.05) * 1.8}) 50%,
    rgba(200,170,110,${p => p.$op || 0.05}) 70%,
    transparent 100%
  );
  transform-origin: center top;
  transform: scaleY(0);
  opacity: 0;
  pointer-events: none;
  z-index: 4;
`;

// ─── Back button ──────────────────────────────────────────────────────────────

const BackBar = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 56px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  overflow: visible;
`;

const BackBtn = styled.button`
  position: relative;
  top: 3px;
  height: fit-content;
  min-height: 46px;
  width: clamp(160px, 22vw, 280px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  padding: 10px 32px;

  background: linear-gradient(180deg, #0b0c11 0%, #0e1018 60%, rgba(11,12,17,0.55) 100%);
  clip-path: polygon(22px 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0% 50%);

  border: none;
  cursor: pointer;
  z-index: 20;
  outline: none;
  overflow: hidden;
  pointer-events: all;
  opacity: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(60deg,  rgba(200,170,110,0.018) 0, transparent 1px, transparent 20px),
      repeating-linear-gradient(-60deg, rgba(200,170,110,0.018) 0, transparent 1px, transparent 20px);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent,
      rgba(200,170,110,0.3) 30%,
      rgba(200,170,110,0.3) 70%,
      transparent
    );
    pointer-events: none;
    z-index: 0;
  }

  &:focus-visible { outline: none; }
`;

const BackLabel = styled.span`
  position: relative;
  z-index: 2;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.62rem, 1.4vw, 0.85rem);
  font-weight: 600;
  letter-spacing: clamp(0.1em, 0.4vw, 0.22em);
  text-transform: uppercase;
  color: rgba(200,170,110,0.7);
  transition: color 0.4s ease, text-shadow 0.4s ease;
  user-select: none;
  white-space: nowrap;

  ${BackBtn}:hover & {
    color: #f0e6d2;
    text-shadow: 0 0 12px rgba(200,170,110,0.7), 0 0 28px rgba(200,170,110,0.35);
  }
`;

const BackUnderline = styled.div`
  position: relative;
  z-index: 2;
  height: 1px;
  width: 20%;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.1), transparent);
  transition: width 0.45s ease, background 0.45s ease;

  ${BackBtn}:hover & {
    width: 70%;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.8), transparent);
  }
`;

// ─── Standings + bracket layout ───────────────────────────────────────────────

const PageGrid = styled.div`
  position: relative;
  z-index: 10;
  width: 92%;
  max-width: 1400px;
  margin-top: 80px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const StandingsPanel = styled.div`
  background: linear-gradient(160deg, rgba(10,11,18,0.97) 0%, rgba(14,15,24,0.95) 100%);
  border: 1px solid rgba(200,170,110,0.2);
  clip-path: polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px);
  padding: 24px 20px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,170,110,0.01) 0, transparent 1px, transparent 18px);
    pointer-events: none;
  }
`;

const StandingsTitle = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.5rem;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.55);
  text-align: center;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(200,170,110,0.12);
  position: relative;
  z-index: 1;
`;

const StandingsScrollWrap = styled.div`
  height: calc(5 * 58px);
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
  position: relative;
  z-index: 1;
`;

const LeaderboardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  margin-bottom: 7px;
  cursor: pointer;
  background: ${p => p.$active
    ? 'rgba(200,170,110,0.14)'
    : p.$rank === 1
      ? 'rgba(200,170,110,0.1)'
      : p.$rank === 2
        ? 'rgba(180,180,200,0.06)'
        : p.$rank === 3
          ? 'rgba(180,120,60,0.07)'
          : 'rgba(200,170,110,0.025)'};
  border: 1px solid ${p => p.$active
    ? 'rgba(200,170,110,0.7)'
    : p.$rank === 1
      ? 'rgba(200,170,110,0.4)'
      : p.$rank === 2
        ? 'rgba(180,180,200,0.2)'
        : p.$rank === 3
          ? 'rgba(180,120,60,0.25)'
          : 'rgba(200,170,110,0.1)'};
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px);
  transition: background 0.25s ease, border-color 0.25s ease;
`;

const LeaderboardRank = styled.div`
  font-family: 'Cinzel', serif;
  font-size: ${p => p.$rank <= 3 ? '1.0rem' : '0.6rem'};
  font-weight: 700;
  min-width: 26px;
  text-align: center;
  color: ${p => p.$rank === 1
    ? '#f0e6d2'
    : p.$rank === 2
      ? 'rgba(200,210,230,0.85)'
      : p.$rank === 3
        ? 'rgba(200,140,80,0.9)'
        : 'rgba(200,170,110,0.35)'};
  text-shadow: ${p => p.$rank === 1 ? '0 0 18px rgba(200,170,110,0.7)' : 'none'};
  flex-shrink: 0;
`;

const LeaderboardTeamImg = styled.img`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(200,170,110,0.25);
  flex-shrink: 0;
`;

const LeaderboardTeamName = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  color: ${p => p.$rank === 1 ? '#f0e6d2' : 'rgba(200,170,110,0.75)'};
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-shadow: ${p => p.$rank === 1 ? '0 0 12px rgba(200,170,110,0.4)' : 'none'};
`;

const MembersPanel = styled.div`
  margin-top: 14px;
  border-top: 1px solid rgba(200,170,110,0.12);
  padding-top: 12px;
  position: relative;
  z-index: 1;
`;

const MembersPanelTitle = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.42rem;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.4);
  text-align: center;
  margin-bottom: 10px;
`;

const MembersScrollWrap = styled.div`
  height: calc(5 * 42px);
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
  margin-bottom: 5px;
  background: rgba(200,170,110,0.03);
  border: 1px solid rgba(200,170,110,0.09);
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
`;

const MemberAvatar = styled.img`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(200,170,110,0.2);
  flex-shrink: 0;
`;

const MemberName = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.54rem;
  letter-spacing: 0.1em;
  color: rgba(200,170,110,0.7);
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// ─── Static data ──────────────────────────────────────────────────────────────

const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];

// ─── Trophy icons ─────────────────────────────────────────────────────────────

function TrophyGold() {
  return (
    <svg width="13" height="14" viewBox="0 0 28 32" fill="none">
      <defs>
        <linearGradient id="tgBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7a5c1a"/>
          <stop offset="20%"  stopColor="#c8a030"/>
          <stop offset="45%"  stopColor="#ffe066"/>
          <stop offset="65%"  stopColor="#d4a020"/>
          <stop offset="85%"  stopColor="#f5d060"/>
          <stop offset="100%" stopColor="#8a6820"/>
        </linearGradient>
        <linearGradient id="tgBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#c8aa3a"/>
          <stop offset="50%"  stopColor="#ffe070"/>
          <stop offset="100%" stopColor="#8a6010"/>
        </linearGradient>
        <filter id="tgGlow">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect x="6" y="28" width="16" height="3" rx="1" fill="url(#tgBase)" filter="url(#tgGlow)"/>
      <rect x="8" y="26.5" width="12" height="2" rx="0.8" fill="url(#tgBase)"/>
      <rect x="11.5" y="21" width="5" height="6" rx="0.5" fill="url(#tgBody)"/>
      <path d="M5 4 Q5 20 14 21 Q23 20 23 4 Z" fill="url(#tgBody)" filter="url(#tgGlow)"/>
      <path d="M5 6 Q1 8 2 12 Q3 16 6 15" stroke="url(#tgBody)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M23 6 Q27 8 26 12 Q25 16 22 15" stroke="url(#tgBody)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M14 8 L14.9 10.7 L17.8 10.7 L15.5 12.3 L16.4 15 L14 13.4 L11.6 15 L12.5 12.3 L10.2 10.7 L13.1 10.7 Z" fill="rgba(255,245,180,0.95)" filter="url(#tgGlow)"/>
    </svg>
  );
}

function TrophySilver() {
  return (
    <svg width="11" height="13" viewBox="0 0 24 28" fill="none">
      <defs>
        <linearGradient id="tsBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#555"/>
          <stop offset="35%"  stopColor="#bbb"/>
          <stop offset="55%"  stopColor="#e8e8e8"/>
          <stop offset="80%"  stopColor="#999"/>
          <stop offset="100%" stopColor="#666"/>
        </linearGradient>
        <linearGradient id="tsBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#aaa"/>
          <stop offset="50%"  stopColor="#ddd"/>
          <stop offset="100%" stopColor="#777"/>
        </linearGradient>
      </defs>
      <rect x="5" y="24" width="14" height="3" rx="1" fill="url(#tsBase)"/>
      <rect x="7" y="22.5" width="10" height="2" rx="0.7" fill="url(#tsBase)"/>
      <rect x="10" y="18" width="4" height="5" rx="0.4" fill="url(#tsBody)"/>
      <path d="M4 3 Q4 18 12 19 Q20 18 20 3 Z" fill="url(#tsBody)"/>
      <path d="M4 5 Q1 7 2 11 Q3 14 5 13" stroke="url(#tsBody)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M20 5 Q23 7 22 11 Q21 14 19 13" stroke="url(#tsBody)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M12 7 L12.7 9.2 L15 9.2 L13.2 10.5 L13.9 12.8 L12 11.5 L10.1 12.8 L10.8 10.5 L9 9.2 L11.3 9.2 Z" fill="rgba(240,240,240,0.85)"/>
    </svg>
  );
}

function TrophyBronze() {
  return (
    <svg width="10" height="12" viewBox="0 0 22 26" fill="none">
      <defs>
        <linearGradient id="tbBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#5a2a0a"/>
          <stop offset="35%"  stopColor="#a05020"/>
          <stop offset="55%"  stopColor="#c87040"/>
          <stop offset="85%"  stopColor="#8a4015"/>
          <stop offset="100%" stopColor="#4a1a05"/>
        </linearGradient>
        <linearGradient id="tbBase" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#9a5025"/>
          <stop offset="50%"  stopColor="#c06030"/>
          <stop offset="100%" stopColor="#5a2808"/>
        </linearGradient>
      </defs>
      <rect x="4" y="22" width="14" height="3" rx="1" fill="url(#tbBase)"/>
      <rect x="6" y="20.5" width="10" height="2" rx="0.7" fill="url(#tbBase)"/>
      <rect x="9" y="16.5" width="4" height="5" rx="0.4" fill="url(#tbBody)"/>
      <path d="M3 3 Q3 17 11 18 Q19 17 19 3 Z" fill="url(#tbBody)"/>
      <path d="M3 5 Q0.5 6.5 1.5 10 Q2.5 13 4.5 12" stroke="url(#tbBody)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M19 5 Q21.5 6.5 20.5 10 Q19.5 13 17.5 12" stroke="url(#tbBody)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Canvas system ────────────────────────────────────────────────────────────

function useCanvasSystem(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, rafId;
    const particles = [], runes = [], scanlines = [], pulseRings = [];

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const gold  = a => `rgba(200,170,110,${a})`;
    const cream = a => `rgba(240,230,210,${a})`;

    for (let i = 0; i < 40; i++) {
      const p = {
        ox: Math.random() * 100, oy: 0.15 * 100 + Math.random() * 0.7 * 100,
        dx: (Math.random() - 0.5) * 80, dy: -(25 + Math.random() * 80),
        size: 0.5 + Math.random() * 1.8, progress: 0,
      };
      particles.push(p);
      const dur = 6 + Math.random() * 7;
      gsap.to(p, {
        progress: 1, duration: dur, ease: "power1.out",
        delay: Math.random() * dur, repeat: -1, repeatDelay: Math.random() * 3,
        onRepeat() {
          p.ox = Math.random() * 100; p.oy = 15 + Math.random() * 70;
          p.dx = (Math.random() - 0.5) * 80; p.dy = -(25 + Math.random() * 80);
        },
      });
    }

    for (let i = 0; i < 22; i++) {
      const r = {
        x: Math.random() * 1440, y: Math.random() * 900,
        char: RUNES[i % RUNES.length],
        size: 9 + Math.random() * 8, alpha: 0,
        rotation: (Math.random() - 0.5) * 0.3, floatY: 0,
      };
      runes.push(r);
      const maxA = 0.04 + Math.random() * 0.05;
      const dur  = 8 + Math.random() * 8;
      gsap.timeline({ repeat: -1, delay: Math.random() * 6 })
        .to(r, { alpha: maxA, floatY: -10, duration: dur * 0.4, ease: "sine.inOut" })
        .to(r, { alpha: 0, floatY: 0, duration: dur * 0.4, ease: "sine.inOut" })
        .to(r, { duration: dur * 0.2, onComplete() { r.x = Math.random() * 1440; r.y = Math.random() * 900; } });
    }

    for (let i = 0; i < 2; i++) {
      const sl = { y: -10, alpha: 0 };
      scanlines.push(sl);
      gsap.timeline({ repeat: -1, delay: i * 11 })
        .set(sl, { y: -10, alpha: 0 })
        .to(sl, { y: 910, alpha: 0.09, duration: 22, ease: "none" })
        .to(sl, { alpha: 0, duration: 2 }, "-=2");
    }

    for (let i = 0; i < 3; i++) {
      const ring = { r: 0, alpha: 0 };
      pulseRings.push(ring);
      gsap.timeline({ repeat: -1, delay: i * 4.5, repeatDelay: 8 + Math.random() * 6 })
        .set(ring, { r: 60, alpha: 0 })
        .to(ring, { r: 520, alpha: 0.08, duration: 0.6, ease: "power2.out" }, 0)
        .to(ring, { alpha: 0, duration: 3.5, ease: "power1.in" }, 0.6);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      for (const ring of pulseRings) {
        if (ring.alpha <= 0) continue;
        ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = gold(ring.alpha); ctx.lineWidth = 1; ctx.stroke();
      }

      for (const sl of scanlines) {
        if (sl.alpha <= 0) continue;
        const g = ctx.createLinearGradient(0, sl.y - 2, 0, sl.y + 2);
        g.addColorStop(0, "transparent"); g.addColorStop(0.5, cream(sl.alpha)); g.addColorStop(1, "transparent");
        ctx.fillStyle = g; ctx.fillRect(0, sl.y - 2, W, 4);
      }

      for (const p of particles) {
        const t = p.progress;
        if (t <= 0 || t >= 1) continue;
        let a = t < 0.10 ? t / 0.10 : t < 0.85 ? 1 : (1 - t) / 0.15;
        a *= 0.75;
        const px = (p.ox / 100) * W + p.dx * t;
        const py = (p.oy / 100) * H + p.dy * t;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5);
        grd.addColorStop(0, cream(a)); grd.addColorStop(0.5, gold(a * 0.7)); grd.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
      }

      for (const r of runes) {
        if (r.alpha <= 0) continue;
        const rx = (r.x / 1440) * W, ry = (r.y / 900) * H;
        ctx.save(); ctx.translate(rx, ry + r.floatY); ctx.rotate(r.rotation);
        ctx.font = `${r.size}px serif`; ctx.fillStyle = gold(r.alpha);
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(r.char, 0, 0); ctx.restore();
      }

      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafId); };
  }, []);
}

// ─── Entrance animations ──────────────────────────────────────────────────────

function useEntranceAnims(refs) {
  useEffect(() => {
    const { corners, hRules, vRules, rings, centerDiamond, backBtn } = refs;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(corners.current.filter(Boolean), {
      opacity: 1, stagger: { each: 0.15, from: "edges" }, duration: 0.8, ease: "back.out(1.4)",
    }, 0);

    tl.to(hRules.current.filter(Boolean), {
      scaleX: 1, opacity: 1, stagger: 0.14, duration: 1.3, ease: "power2.inOut",
    }, 0.3);

    tl.to(vRules.current.filter(Boolean), {
      scaleY: 1, opacity: 1, stagger: 0.10, duration: 1.5, ease: "power2.inOut",
    }, 0.5);

    rings.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el,
        { attr: { r: 0 }, opacity: 0 },
        { attr: { r: el.dataset.r }, opacity: 1, duration: 1.8 + i * 0.4, delay: 0.6 + i * 0.3, ease: "power2.out" }
      );
      gsap.to(el, { attr: { "stroke-opacity": 0.18 }, duration: 3 + i * 0.8, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2 + i * 0.5 });
    });

    if (centerDiamond.current) {
      gsap.to(centerDiamond.current, {
        scale: 1.14, opacity: 0.55, duration: 2.8, ease: "sine.inOut",
        repeat: -1, yoyo: true, transformOrigin: "720px 450px",
      });
    }

    if (backBtn.current) {
      gsap.fromTo(backBtn.current,
        { opacity: 0, y: -18, clipPath: "polygon(50% 0%, 50% 0%, 50% 50%, 50% 100%, 50% 100%, 50% 50%)" },
        {
          opacity: 1, y: 0,
          clipPath: "polygon(22px 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0% 50%)",
          duration: 0.9, ease: "power3.out", delay: 0.6,
        }
      );
      gsap.to(backBtn.current, {
        boxShadow: "0 0 18px rgba(200,170,110,0.12), 0 0 40px rgba(200,170,110,0.06)",
        duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.8,
      });
    }

    corners.current.filter(Boolean).forEach((el, i) => {
      gsap.to(el, { opacity: 0.55, duration: 2.5 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1 + i * 0.6 });
    });
    hRules.current.filter(Boolean).forEach((el, i) => {
      gsap.to(el, { opacity: 0.55, duration: 3 + i * 0.5, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.5 + i * 0.3 });
    });
    vRules.current.filter(Boolean).forEach((el, i) => {
      gsap.to(el, { opacity: 0.45, duration: 4 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2 + i * 0.4 });
    });
  }, []);
}

// ─── SVG background deco ──────────────────────────────────────────────────────

function BgDecoSVG({ ringRefs }) {
  const RINGS = [{ r: 140 }, { r: 230 }, { r: 340 }, { r: 460 }];
  return (
    <DecoSVG viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0"/>
          <stop offset="25%"  stopColor="#c8aa6e" stopOpacity="0.12"/>
          <stop offset="50%"  stopColor="#f0e6d2" stopOpacity="0.20"/>
          <stop offset="75%"  stopColor="#c8aa6e" stopOpacity="0.12"/>
          <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="vg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0"/>
          <stop offset="40%"  stopColor="#c8aa6e" stopOpacity="0.09"/>
          <stop offset="60%"  stopColor="#c8aa6e" stopOpacity="0.09"/>
          <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
        </linearGradient>
        <radialGradient id="cg" cx="50%" cy="50%" r="28%">
          <stop offset="0%"   stopColor="#c8aa6e" stopOpacity="0.07"/>
          <stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="mgrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7a5c28" stopOpacity="0.4"/>
          <stop offset="30%"  stopColor="#c8aa6e" stopOpacity="0.9"/>
          <stop offset="50%"  stopColor="#f0e6d2" stopOpacity="1"/>
          <stop offset="70%"  stopColor="#c8aa6e" stopOpacity="0.9"/>
          <stop offset="100%" stopColor="#7a5c28" stopOpacity="0.4"/>
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      <ellipse cx="720" cy="450" rx="460" ry="300" fill="url(#cg)" opacity="0.8"/>

      {[160, 300, 450, 600, 740].map(y => (
        <line key={y} x1="0" y1={y} x2="1440" y2={y} stroke="url(#hg)" strokeWidth={y===450?"0.9":"0.5"} opacity="0.7"/>
      ))}
      {[200, 400, 600, 720, 840, 1040, 1240].map(x => (
        <line key={x} x1={x} y1="0" x2={x} y2="900" stroke="url(#vg)" strokeWidth="0.5" opacity="0.7"/>
      ))}

      {RINGS.map((ring, i) => (
        <circle key={i} ref={el => { if (ringRefs.current) ringRefs.current[i] = el; }}
          data-r={ring.r} cx="720" cy="450" r="0"
          fill="none" stroke="rgba(200,170,110,0.09)"
          strokeWidth={i===0?"1":"0.6"} filter={i===0?"url(#glow)":undefined} opacity="0"/>
      ))}

      <path d="M 0 900 Q 360 450 720 180 Q 1080 450 1440 900" fill="none" stroke="rgba(200,170,110,0.045)" strokeWidth="0.9"/>
      <path d="M 0 0 Q 360 450 720 720 Q 1080 450 1440 0"     fill="none" stroke="rgba(200,170,110,0.035)" strokeWidth="0.7"/>
      <path d="M 0 80   Q 210 450 0 820"    fill="none" stroke="rgba(200,170,110,0.07)" strokeWidth="0.8"/>
      <path d="M 70 120 Q 260 450 70 780"   fill="none" stroke="rgba(200,170,110,0.04)" strokeWidth="0.5"/>
      <path d="M 1440 80   Q 1230 450 1440 820"  fill="none" stroke="rgba(200,170,110,0.07)" strokeWidth="0.8"/>
      <path d="M 1370 120  Q 1180 450 1370 780"  fill="none" stroke="rgba(200,170,110,0.04)" strokeWidth="0.5"/>

      {[130,240,360,490,650,790,950,1080,1200,1310].map(x => (
        <g key={x} opacity={0.2}>
          <line x1={x}   y1="439" x2={x+9}  y2="450" stroke="#c8aa6e" strokeWidth="0.7"/>
          <line x1={x+9} y1="450" x2={x}    y2="461" stroke="#c8aa6e" strokeWidth="0.7"/>
        </g>
      ))}

      {Array.from({length:32},(_,i) => { const x=45*i+22; return <g key={i}>
        <line x1={x} y1="0"   x2={x} y2={i%4===0?12:7}       stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/>
        <line x1={x} y1="900" x2={x} y2={900-(i%4===0?12:7)} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/>
      </g>; })}

      {Array.from({length:22},(_,i) => { const y=41*i+20; return <g key={i}>
        <line x1="0"    y1={y} x2={i%4===0?12:7}        y2={y} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/>
        <line x1="1440" y1={y} x2={1440-(i%4===0?12:7)} y2={y} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/>
      </g>; })}

      {[[180,180],[440,700],[650,140],[800,760],[1000,180],[1220,660],[310,480],[720,280],[1080,520],[560,620]].map(([x,y],i) => (
        <g key={i} opacity={0.13}>
          <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="#c8aa6e" strokeWidth="0.6"/>
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="#c8aa6e" strokeWidth="0.6"/>
        </g>
      ))}

      {[[60,450],[1380,450]].map(([x,y],i) => (
        <g key={i} opacity={0.3}>
          <path d={`M${x},${y-14} L${x+14},${y} L${x},${y+14} L${x-14},${y} Z`} fill="rgba(200,170,110,0.04)" stroke="#c8aa6e" strokeWidth="0.8"/>
          <path d={`M${x},${y-7}  L${x+7}, ${y} L${x},${y+7}  L${x-7}, ${y} Z`} fill="rgba(200,170,110,0.07)" stroke="#c8aa6e" strokeWidth="0.5"/>
          <circle cx={x} cy={y} r="1.8" fill="#f0e6d2" opacity="0.6"/>
        </g>
      ))}
    </DecoSVG>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Hero() {
  const router = useRouter();
  const { tournamentName, isLoading } = useStateContext();
  const [teams, setTeams] = useState([]);
  const [standings, setStandings] = useState([]);
  const [format, setFormat] = useState("Double-Elimination");
  const [matchVideoMap, setMatchVideoMap] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [memberProfiles, setMemberProfiles] = useState({});

  useEffect(() => {
    async function loadProfiles() {
      try {
        const { getDocs, collection } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");
        const snap = await getDocs(collection(database, "members"));
        const map = {};
        snap.docs.forEach(d => { map[d.id] = d.data(); });
        setMemberProfiles(map);
      } catch (e) { console.error("Failed to load member profiles:", e); }
    }
    loadProfiles();
  }, []);

  // ── load teams ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !tournamentName) return;
    async function loadTeams() {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");
        const q = query(
          collection(database, "tournaments", tournamentName, "teams"),
          orderBy("createdAt", "asc")
        );
        const snap = await getDocs(q);
        setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error("Failed to load teams:", e); }
    }
    loadTeams();
  }, [tournamentName, isLoading]);

  // ── load standings ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoading || !tournamentName || !teams.length) return;
    async function load() {
      try {
        const { getDocs, collection, getDoc, doc } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");

        const tDoc = await getDoc(doc(database, "tournaments", tournamentName));
        const tFormat = tDoc.exists() ? (tDoc.data().format || "Double-Elimination") : "Double-Elimination";
        setFormat(tFormat);

        const snap = await getDocs(collection(database, "tournaments", tournamentName, "matches"));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const videoMap = {};
        all.forEach(m => { if (m.videoLink) videoMap[m.id] = m.videoLink; });
        setMatchVideoMap(videoMap);

        const rankMap = {};
        const getLoser = m => (!m.winner ? null : m.team1Id === m.winner ? m.team2Id : m.team1Id);
        const wbAll = all.filter(m => m.type === "winner" && m.status === "complete" && !m.isBye && !m.isGhost);
        const lbAll = all.filter(m => m.type === "loser"  && m.status === "complete" && !m.isGhost);

        if (tFormat === "Single-Elimination") {
          const wbRoundsSorted = [...new Set(wbAll.map(m => m.round))].sort((a, b) => b - a);
          let nextRank = 1;
          wbRoundsSorted.forEach(r => {
            const roundMatches = wbAll.filter(m => m.round === r);
            if (nextRank === 1) {
              roundMatches.forEach(m => {
                if (m.winner && !rankMap[m.winner]) rankMap[m.winner] = nextRank++;
                const loser = getLoser(m);
                if (loser && !rankMap[loser]) rankMap[loser] = nextRank++;
              });
            } else {
              roundMatches.forEach(m => {
                const loser = getLoser(m);
                if (loser && !rankMap[loser]) rankMap[loser] = nextRank++;
              });
            }
          });
        } else {
          const gf = all.find(m => m.type === "grand_final" && m.status === "complete");
          if (gf?.winner) {
            rankMap[gf.winner] = 1;
            const l = getLoser(gf);
            if (l) rankMap[l] = 2;
          }
          const thirdMatch = all.find(m => m.type === "placement" && m.status === "complete");
          if (thirdMatch?.winner) {
            if (!rankMap[thirdMatch.winner]) rankMap[thirdMatch.winner] = 3;
            const l = getLoser(thirdMatch);
            if (l && !rankMap[l]) rankMap[l] = rankMap[thirdMatch.winner] < 3 ? 3 : 4;
          }
          const lbRoundsSorted = [...new Set(lbAll.map(m => m.round))].sort((a, b) => b - a);
          let nextRank = Object.values(rankMap).length ? Math.max(...Object.values(rankMap)) + 1 : 5;
          lbRoundsSorted.forEach(r => {
            const losers = lbAll.filter(m => m.round === r).map(m => getLoser(m)).filter(id => id && !rankMap[id]);
            losers.forEach(id => { rankMap[id] = nextRank; });
            nextRank += losers.length;
          });
          const teamsInLB = new Set();
          lbAll.forEach(m => { if (m.team1Id) teamsInLB.add(m.team1Id); if (m.team2Id) teamsInLB.add(m.team2Id); });
          const wbRoundsSorted = [...new Set(wbAll.map(m => m.round))].sort((a, b) => b - a);
          wbRoundsSorted.forEach(r => {
            wbAll.filter(m => m.round === r).forEach(m => {
              const loser = getLoser(m);
              if (loser && !rankMap[loser] && !teamsInLB.has(loser)) rankMap[loser] = nextRank++;
            });
          });
        }

        let fallback = Object.values(rankMap).length ? Math.max(...Object.values(rankMap)) + 1 : 1;
        teams.filter(t => !rankMap[t.id]).forEach(t => { rankMap[t.id] = fallback++; });

        setStandings(
          teams.map(t => ({ ...t, rank: rankMap[t.id] ?? 999 })).sort((a, b) => a.rank - b.rank)
        );
      } catch (e) { console.error("Standings load error:", e); }
    }
    load();
  }, [tournamentName, teams, isLoading]);

  const rankIcon = rank => {
    if (rank === 1) return <TrophyGold />;
    if (rank === 2) return <TrophySilver />;
    if (rank === 3) return <TrophyBronze />;
    return <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.6rem", color: "rgba(200,170,110,0.35)" }}>#{rank}</span>;
  };

  const canvasRef        = useRef(null);
  const cornersRef       = useRef([]);
  const hRulesRef        = useRef([]);
  const vRulesRef        = useRef([]);
  const ringRefs         = useRef([]);
  const centerDiamondRef = useRef(null);
  const backBtnRef       = useRef(null);

  useCanvasSystem(canvasRef);

  useEffect(() => {
    centerDiamondRef.current = document.getElementById("centerDiamond");
  }, []);

  useEntranceAnims({
    corners:       cornersRef,
    hRules:        hRulesRef,
    vRules:        vRulesRef,
    rings:         ringRefs,
    centerDiamond: centerDiamondRef,
    backBtn:       backBtnRef,
  });

  const handleMatchClick = (match) => {
    const link = matchVideoMap[match.id];
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  const handleBack = () => {
    if (!backBtnRef.current) { router.push("/"); return; }
    gsap.timeline()
      .to(backBtnRef.current, {
        scale: 0.92,
        boxShadow: "0 0 32px rgba(200,170,110,0.5), 0 0 80px rgba(200,170,110,0.2)",
        duration: 0.18, ease: "power2.in",
      })
      .to(backBtnRef.current, {
        opacity: 0, y: -14, scale: 1.04,
        duration: 0.32, ease: "power2.out",
        onComplete: () => router.push("/"),
      });
  };

  return (
    <HeroRoot>
      {/* ── background ── */}
      <BgBase />
      <HexGrid />
      <Vignette />
      <AnimCanvas ref={canvasRef} />
      <BgDecoSVG ringRefs={ringRefs} />

      {/* ── corner frames ── */}
      {[{ $tl: true }, { $tr: true }, { $bl: true }, { $br: true }].map((props, i) => (
        <CornerSVG key={i} viewBox="0 0 90 90" fill="none"
          ref={el => { cornersRef.current[i] = el; }} {...props}>
          <path d="M5 50 L5 5 L50 5"    stroke="#c8aa6e" strokeWidth="0.9" strokeOpacity="0.55"/>
          <path d="M5 5 L22 5"          stroke="#c8aa6e" strokeWidth="1.6" strokeOpacity="0.85"/>
          <path d="M5 5 L5 22"          stroke="#c8aa6e" strokeWidth="1.6" strokeOpacity="0.85"/>
          <path d="M14 5 L14 14 L5 14"  stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/>
          <circle cx="5" cy="5" r="2.5" fill="rgba(200,170,110,0.35)" stroke="#c8aa6e" strokeWidth="0.7"/>
          <circle cx="5" cy="5" r="0.9" fill="#f0e6d2" opacity="0.8"/>
        </CornerSVG>
      ))}

      {/* ── hairlines ── */}
      {[
        { $top: "15%", $l: "7%",  $r: "7%",  $op: 0.07 },
        { $top: "50%", $l: "20%", $r: "20%", $op: 0.11 },
        { $bot: "15%", $l: "7%",  $r: "7%",  $op: 0.07 },
      ].map((p, i) => (
        <HRule key={i} ref={el => { hRulesRef.current[i] = el; }} {...p} />
      ))}
      {[
        { $l: "10%", $op: 0.05 }, { $l: "22%", $op: 0.04 },
        { $l: "78%", $op: 0.04 }, { $l: "90%", $op: 0.05 },
      ].map((p, i) => (
        <VRule key={i} ref={el => { vRulesRef.current[i] = el; }} {...p} />
      ))}

      {/* ── back button ── */}
      <BackBar>
        <BackBtn ref={backBtnRef} onClick={handleBack}>
          <BackLabel>Back</BackLabel>
          <BackUnderline />
        </BackBtn>
      </BackBar>

      {/* ── two-column layout: standings left, bracket right ── */}
      <PageGrid>
        <StandingsPanel>
          <StandingsTitle>Final Standings</StandingsTitle>
          <StandingsScrollWrap>
            {standings.map(team => (
              <LeaderboardRow
                key={team.id}
                $rank={team.rank}
                $active={selectedTeam?.id === team.id}
                onClick={() => setSelectedTeam(prev => prev?.id === team.id ? null : team)}
              >
                <LeaderboardRank $rank={team.rank} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {rankIcon(team.rank)}
                </LeaderboardRank>
                {(team.imgLink || team.imgUrl) && (
                  <LeaderboardTeamImg
                    src={team.imgLink || team.imgUrl}
                    alt={team.name}
                    onError={e => { e.target.src = '/question.jpg'; }}
                  />
                )}
                <LeaderboardTeamName $rank={team.rank}>{team.name}</LeaderboardTeamName>
              </LeaderboardRow>
            ))}
          </StandingsScrollWrap>

          {selectedTeam && (
            <MembersPanel>
              <MembersPanelTitle>{selectedTeam.name} — Members</MembersPanelTitle>
              <MembersScrollWrap>
                {(selectedTeam.members ?? []).map((memberName, i) => {
                  const profile = memberProfiles[memberName];
                  return (
                    <MemberRow key={i}>
                      <MemberAvatar
                        src={profile?.imglink || '/question.jpg'}
                        alt={memberName}
                        onError={e => { e.target.src = '/question.jpg'; }}
                      />
                      <MemberName>{memberName}</MemberName>
                    </MemberRow>
                  );
                })}
              </MembersScrollWrap>
            </MembersPanel>
          )}
        </StandingsPanel>

        <BracketView
          teams={teams}
          tournamentName={tournamentName}
          format={format}
          readOnly
          onMatchClick={handleMatchClick}
        />
      </PageGrid>

    </HeroRoot>
  );
}