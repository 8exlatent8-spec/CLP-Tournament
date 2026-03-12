"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useStateContext } from "../context/StateContext";
import styled, { keyframes, css } from "styled-components";
import gsap from "gsap";

// ─── CSS keyframes ────────────────────────────────────────────────────────────

const hexPulse = keyframes`
  0%, 100% { opacity: 0.022; }
  50%       { opacity: 0.048; }
`;

const slowVignette = keyframes`
  0%, 100% { opacity: 0.9; }
  50%       { opacity: 1;   }
`;

const innerRotate = keyframes`
  0%   { transform: rotate(0deg);   }
  100% { transform: rotate(360deg); }
`;

const innerRotateRev = keyframes`
  0%   { transform: rotate(0deg);    }
  100% { transform: rotate(-360deg); }
`;

const shimmer = keyframes`
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
`;

const nameGlow = keyframes`
  0%, 100% { text-shadow: 0 0 8px rgba(200,170,110,0.4), 0 0 20px rgba(200,170,110,0.15); }
  50%       { text-shadow: 0 0 16px rgba(240,230,210,0.8), 0 0 35px rgba(200,170,110,0.4), 0 0 60px rgba(120,90,40,0.2); }
`;

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
  top: 0; left: 0; right: 0;
  height: 100vh;
  background:
    radial-gradient(ellipse 80% 55% at 50% 0%,   rgba(200,170,110,0.055) 0%, transparent 65%),
    radial-gradient(ellipse 60% 45% at 50% 100%, rgba(100,75,30,0.07)   0%, transparent 60%),
    linear-gradient(180deg, #050609 0%, #07080d 45%, #050608 100%);
  pointer-events: none;
`;

const HexGrid = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 100vh;
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
  top: 0; left: 0; right: 0;
  height: 100vh;
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
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: 2;
`;

const DecoSVG = styled.svg`
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 100vh;
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

// ─── Tab wings ────────────────────────────────────────────────────────────────

const TabBar = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 56px;
  z-index: 20;
  pointer-events: none;
  overflow: visible;
  clip-path: inset(0px 0px -100px 0px);
`;

const TabWing = styled.button`
  position: absolute;
  top: 3px;
  height: fit-content;
  min-height: 46px;
  padding-top: 10px;
  padding-bottom: 10px;
  width: clamp(120px, calc(50% - 6vw), 340px);
  ${p => p.$left
    ? "right: calc(50% + 0px);"
    : "left:  calc(50% + 0px);"}

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  padding: ${p => p.$left ? "10px clamp(16px, 4vw, 48px) 10px 16px" : "10px 16px 10px clamp(16px, 4vw, 48px)"};
  min-width: 0;

  background: linear-gradient(180deg, #0b0c11 0%, #0e1018 60%, rgba(11,12,17,0.55) 100%);
  clip-path: ${p => p.$left
    ? "polygon(22px 0%, 100% 0%, 100% 100%, 22px 100%, 0% 50%)"
    : "polygon(0% 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 0% 100%)"};

  border: none;
  cursor: pointer;
  z-index: 20;
  outline: none;
  overflow: hidden;
  pointer-events: all;

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

const TabLabel = styled.span`
  position: relative;
  z-index: 2;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.62rem, 1.4vw, 0.85rem);
  font-weight: 600;
  letter-spacing: clamp(0.1em, 0.4vw, 0.22em);
  text-transform: uppercase;
  color: ${p => p.$active ? "#f0e6d2" : "rgba(200,170,110,0.5)"};
  transition: color 0.4s ease, text-shadow 0.4s ease;
  user-select: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-shadow: ${p => p.$active
    ? "0 0 12px rgba(200,170,110,0.7), 0 0 28px rgba(200,170,110,0.35)"
    : "none"};
`;

const TabDot = styled.div`
  position: relative;
  z-index: 2;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: ${p => p.$active ? "rgba(240,230,210,0.95)" : "rgba(200,170,110,0.2)"};
  box-shadow: ${p => p.$active ? "0 0 5px rgba(200,170,110,0.9)" : "none"};
  transition: all 0.4s ease;
`;

const TabUnderline = styled.div`
  position: relative;
  z-index: 2;
  height: 1px;
  width: ${p => p.$active ? "70%" : "20%"};
  background: ${p => p.$active
    ? "linear-gradient(90deg, transparent, rgba(200,170,110,0.8), transparent)"
    : "linear-gradient(90deg, transparent, rgba(200,170,110,0.1), transparent)"};
  transition: width 0.45s ease, background 0.45s ease;
`;

// ─── Content area ─────────────────────────────────────────────────────────────

const ContentArea = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  flex: 1;
  overflow: hidden;
  margin-top: 62px;
`;

const SlideTrack = styled.div`
  display: flex;
  width: 200%;
  height: 100%;
  will-change: transform;
`;

const TabPanel = styled.div`
  width: 50%;
  min-height: calc(100vh - 72px - 62px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 10%;

  @media (max-height: 600px) {
    min-height: auto;
    padding: 32px 10%;
    justify-content: flex-start;
    padding-top: 40px;
  }
`;

// ─── Search bar ───────────────────────────────────────────────────────────────

const SearchWrap = styled.div`
  position: absolute;
  top: 78px;
  left: 50%;
  transform: translateX(-50%);
  width: clamp(280px, 44%, 520px);
  z-index: 15;
  opacity: 0;
  pointer-events: none;
`;

const SearchOuter = styled.div`
  position: relative;
  width: 100%;
  clip-path: polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px);
`;

const SearchInput = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.07);
  border: 1px solid rgba(200,170,110,0.35);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.25em;
  padding: 14px 48px 14px 44px;
  outline: none;
  transition: border-color 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
  &::placeholder { color: rgba(200,170,110,0.45); letter-spacing: 0.15em; }
  &:focus {
    border-color: rgba(200,170,110,0.75);
    background: rgba(200,170,110,0.11);
    box-shadow: 0 0 22px rgba(200,170,110,0.14), inset 0 0 12px rgba(200,170,110,0.05);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.4;
`;

const SearchCornerSVG = styled.svg`
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  overflow: visible;
`;

const SearchUnderline = styled.div`
  position: absolute;
  bottom: 0; left: 10%; right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.5), transparent);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.4s ease;
  pointer-events: none;
  ${SearchInput}:focus ~ & { transform: scaleX(1); }
`;

// ─── Placeholder content ──────────────────────────────────────────────────────

const SectionTitle = styled.h3`
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.5);
  margin-bottom: 24px;
  user-select: none;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const EmptyIcon = styled.svg`
  opacity: 0.18;
`;

const EmptyText = styled.p`
  font-family: 'Cinzel', serif;
  font-size: 0.55rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.35);
  user-select: none;
`;

// ─── Tab border glow line ─────────────────────────────────────────────────────

const TabBorderLine = styled.div`
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200,170,110,0.15) 15%,
    rgba(200,170,110,0.45) 50%,
    rgba(200,170,110,0.15) 85%,
    transparent 100%
  );
  z-index: 5;
  pointer-events: none;
`;

const TabSplitter = styled.div`
  position: absolute;
  left: 50%;
  top: -15px;
  transform: translateX(-50%);
  height: 62px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  pointer-events: none;
  overflow: hidden;
`;

const SplitterLine = styled.div`
  width: 1px;
  height: ${p => p.$h || 10}px;
  background: linear-gradient(180deg,
    transparent,
    rgba(200,170,110,${p => p.$op || 0.6}),
    transparent
  );
`;

const SplitterDiamond = styled.div`
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f0e6d2 0%, #c8aa6e 50%, #7a5c28 100%);
  transform: rotate(45deg);
  box-shadow:
    0 0 6px rgba(200,170,110,0.9),
    0 0 14px rgba(200,170,110,0.5),
    0 0 24px rgba(200,170,110,0.2);
`;

// ─── Static data ──────────────────────────────────────────────────────────────

const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];

// ─── Tournament card styles ───────────────────────────────────────────────────

const prizeGlow = keyframes`
  0%, 100% {
    text-shadow:
      0 0 6px rgba(200,170,110,0.6),
      0 0 18px rgba(200,170,110,0.35),
      0 0 36px rgba(200,170,110,0.18);
    color: #e8d49a;
  }
  50% {
    text-shadow:
      0 0 10px rgba(240,220,140,0.9),
      0 0 28px rgba(200,170,110,0.6),
      0 0 55px rgba(160,130,70,0.3);
    color: #f5e8b8;
  }
`;

const cardShimmer = keyframes`
  0%   { transform: translateX(-120%) skewX(-18deg); }
  100% { transform: translateX(220%)  skewX(-18deg); }
`;

const scanPulse = keyframes`
  0%, 100% { opacity: 0; }
  50%       { opacity: 1; }
`;

const TournamentGridWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1100px;

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const TCard = styled.div`
  position: relative;
  background: linear-gradient(135deg,
    rgba(8,9,14,0.96) 0%,
    rgba(12,13,20,0.92) 50%,
    rgba(8,9,14,0.96) 100%
  );
  border: 1px solid rgba(200,170,110,0.22);
  clip-path: polygon(
    16px 0%,
    calc(100% - 16px) 0%,
    100% 16px,
    100% calc(100% - 16px),
    calc(100% - 16px) 100%,
    16px 100%,
    0% calc(100% - 16px),
    0% 16px
  );
  overflow: hidden;
  opacity: 0;
  transform: translateY(28px);
  transition: border-color 0.35s ease;
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      60deg,
      rgba(200,170,110,0.012) 0,
      transparent 1px,
      transparent 18px
    );
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 45%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.06), transparent);
    transform: translateX(-120%) skewX(-18deg);
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    border-color: rgba(200,170,110,0.5);
    &::after {
      animation: ${cardShimmer} 0.75s ease forwards;
    }
  }
`;

const TCardScan = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.55), transparent);
  animation: ${scanPulse} 3.5s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
`;

const TCardInner = styled.div`
  position: relative;
  z-index: 3;
  padding: 20px 20px 16px;
`;

const TCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 12px;
`;

const TCardNumber = styled.div`
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: rgba(200,170,110,0.5);
  padding: 3px 8px;
  border: 1px solid rgba(200,170,110,0.2);
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  background: rgba(200,170,110,0.06);
  white-space: nowrap;
  flex-shrink: 0;
  margin-top: 2px;
`;

const TCardTitleWrap = styled.div`
  flex: 1;
  min-width: 0;
`;

const TCardName = styled.h3`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.75rem, 1.25vw, 0.95rem);
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #f0e6d2;
  text-transform: uppercase;
  margin: 0 0 7px;
  text-shadow: 0 0 20px rgba(200,170,110,0.25);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 72px;
`;

const TCardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const TCardMetaItem = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.58rem;
  letter-spacing: 0.18em;
  color: rgba(200,170,110,0.45);
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 5px;

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(200,170,110,0.4);
    flex-shrink: 0;
  }
`;

const TCardDivider = styled.div`
  position: relative;
  margin: 14px 0 12px;
  height: 1px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(200,170,110,0.12) 15%,
    rgba(200,170,110,0.35) 50%,
    rgba(200,170,110,0.12) 85%,
    transparent 100%
  );

  &::before, &::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
    width: 5px;
    height: 5px;
    background: rgba(200,170,110,0.45);
    border: 1px solid rgba(200,170,110,0.6);
  }
  &::before { left: 12%; }
  &::after  { right: 12%; }
`;

const TCardDividerLabel = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #0a0b10;
  padding: 0 10px;
  font-family: 'Cinzel', serif;
  font-size: 0.46rem;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.55);
  white-space: nowrap;
`;

const TCardPrize = styled.p`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.6rem, 1vw, 0.72rem);
  letter-spacing: 0.12em;
  line-height: 1.75;
  animation: ${prizeGlow} 3.2s ease-in-out infinite;
  margin: 0 0 14px;
  text-align: center;
  word-break: break-word;
`;

const TCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const TCardBtn = styled.button`
  font-family: 'Cinzel', serif;
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.85);
  background: transparent;
  border: 1px solid rgba(200,170,110,0.3);
  padding: 7px 20px;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease, border-color 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(200,170,110,0);
    transition: background 0.3s ease;
  }

  &:hover {
    color: #f0e6d2;
    border-color: rgba(200,170,110,0.7);
    &::before { background: rgba(200,170,110,0.1); }
  }

  &:active { transform: scale(0.97); }
`;


const DeleteTournamentBtn = styled.button`
  font-family: 'Cinzel', serif;
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(220,100,80,0.75);
  background: transparent;
  border: 1px solid rgba(220,100,80,0.25);
  padding: 7px 16px;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: color 0.3s ease, border-color 0.3s ease;
  margin-right: 8px;

  &:hover {
    color: #ffaaaa;
    border-color: rgba(220,80,80,0.7);
    background: rgba(200,60,60,0.1);
  }
  &:active { transform: scale(0.97); }
`;

const StatusBadge = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  font-family: 'Cinzel', serif;
  font-size: 0.45rem;
  font-weight: 700;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  padding: 4px 10px;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  border: 1px solid ${p => p.$ongoing
    ? "rgba(100,220,140,0.55)"
    : "rgba(200,170,110,0.35)"};
  background: ${p => p.$ongoing
    ? "rgba(60,180,100,0.1)"
    : "rgba(200,170,110,0.07)"};
  color: ${p => p.$ongoing
    ? "rgba(120,230,160,0.95)"
    : "rgba(200,170,110,0.6)"};
  box-shadow: ${p => p.$ongoing
    ? "0 0 10px rgba(80,200,120,0.18)"
    : "none"};
  z-index: 4;
  pointer-events: none;
  white-space: nowrap;
`;

// ─── Member card styles ───────────────────────────────────────────────────────

const memberNameGlow = keyframes`
  0%, 100% { text-shadow: 0 0 10px rgba(200,170,110,0.5), 0 0 24px rgba(200,170,110,0.2); color: #f0e6d2; }
  50%       { text-shadow: 0 0 18px rgba(255,240,200,0.9), 0 0 40px rgba(200,170,110,0.5), 0 0 70px rgba(160,130,70,0.25); color: #fff8e8; }
`;

const avatarReveal = keyframes`
  0%   { clip-path: inset(100% 0% 0% 0%); }
  100% { clip-path: inset(0% 0% 0% 0%); }
`;

const MemberGridWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 770px;

  @media (max-width: 1000px) { grid-template-columns: repeat(3, 1fr); }
  @media (max-width: 680px)  { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 420px)  { grid-template-columns: repeat(3, 1fr); }
`;

const MCard = styled.div`
  position: relative;
  background: linear-gradient(160deg, rgba(10,11,18,0.97) 0%, rgba(14,15,24,0.93) 60%, rgba(9,10,16,0.97) 100%);
  border: 1px solid rgba(200,170,110,0.2);
  clip-path: polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px);
  overflow: hidden;
  opacity: 0;
  transform: translateY(24px);
  transition: border-color 0.35s ease;
  cursor: default;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,170,110,0.01) 0, transparent 1px, transparent 16px);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.055), transparent);
    transform: translateX(-120%) skewX(-18deg);
    pointer-events: none;
    z-index: 1;
  }

  &:hover {
    border-color: rgba(200,170,110,0.48);
    &::after { animation: ${cardShimmer} 0.8s ease forwards; }
  }
`;

const MCardScan = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.5), transparent);
  animation: ${scanPulse} 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
`;

const MCardAvatarWrap = styled.div`
  position: relative;
  z-index: 3;
  width: 100%;
  overflow: hidden;
  border-bottom: 1px solid rgba(200,170,110,0.18);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 60%, rgba(8,9,14,0.5) 85%, rgba(8,9,14,0.88) 100%);
    pointer-events: none;
    z-index: 1;
  }
`;

const MCardAvatar = styled.img`
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  filter: sepia(0.08) brightness(0.92) contrast(1.06);
  transition: transform 0.6s ease, filter 0.5s ease;

  ${MCard}:hover & {
    transform: scale(1.03);
    filter: sepia(0) brightness(1.02) contrast(1.08);
  }
`;

const MCardAvatarBorderSVG = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
`;

const MCardBody = styled.div`
  position: relative;
  z-index: 3;
  padding: 14px 9px 6px;
`;

const MCardNameRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

const MCardName = styled.h3`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.66rem, 1.1vw, 0.84rem);
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  margin: 0 0 2px;
  animation: ${memberNameGlow} 3.5s ease-in-out infinite;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MCardParticipations = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
`;

const MCardPartNum = styled.span`
  font-family: 'Cinzel Decorative', 'Cinzel', serif;
  font-size: 0.74rem;
  font-weight: 700;
  color: rgba(200,170,110,0.9);
  line-height: 1;
  text-shadow: 0 0 12px rgba(200,170,110,0.5);
`;

const MCardPartLabel = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.32rem;
  letter-spacing: 0.3em;
  color: rgba(200,170,110,0.4);
  text-transform: uppercase;
  white-space: nowrap;
`;

const MCardDivider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.2) 30%, rgba(200,170,110,0.4) 50%, rgba(200,170,110,0.2) 70%, transparent);
  margin-bottom: 6px;
`;

const MCardStats = styled.div`
  display: flex;
  justify-content: space-around;
  gap: 4px;
`;

const MCardStat = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  flex: 1;
  justify-content: center;
`;

const MCardStatNum = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: ${p => p.$color || "rgba(200,170,110,0.7)"};
  text-shadow: ${p => p.$glow || "none"};
`;

const CardIconBtn = styled.button`
  position: absolute;
  width: 26px;
  height: 26px;
  background: rgba(4,5,10,0.72);
  border: 1px solid rgba(200,170,110,0.4);
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
  color: rgba(200,170,110,0.8);
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.2s ease, border-color 0.2s ease;

  ${MCard}:hover & {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.35 !important;
    cursor: not-allowed;
    pointer-events: none;
  }

  &:hover {
    background: rgba(200,170,110,0.18);
    border-color: rgba(200,170,110,0.8);
    color: #f0e6d2;
  }
  &:active { transform: scale(0.93); }
`;

const EditBtn = styled(CardIconBtn)`
  top: 8px;
  right: 8px;

  @media (hover: none) {
    opacity: 1;
  }
`;

const DeleteBtn = styled(CardIconBtn)`
  top: 8px;
  right: 40px;

  @media (hover: none) {
    opacity: 1;
  }

  &:hover {
    background: rgba(200,60,60,0.2);
    border-color: rgba(220,80,80,0.7);
    color: #ffaaaa;
  }
`;

const PlusBtn = styled.button`
  position: absolute;
  right: -44px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  background: rgba(200,170,110,0.07);
  border: 1px solid rgba(200,170,110,0.35);
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px);
  color: rgba(200,170,110,0.8);
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    background: rgba(200,170,110,0.16);
    border-color: rgba(200,170,110,0.75);
    color: #f0e6d2;
    box-shadow: 0 0 14px rgba(200,170,110,0.2);
  }
  &:active { transform: translateY(-50%) scale(0.94); }
`;
// ─── Add Member Modal ─────────────────────────────────────────────────────────

const modalBackdropIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const modalSlideIn = keyframes`
  from { opacity: 0; transform: translateY(28px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(2, 3, 6, 0.82);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${modalBackdropIn} 0.25s ease forwards;
`;

const ModalBox = styled.div`
  position: relative;
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(14,15,24,0.97) 100%);
  border: 1px solid rgba(200,170,110,0.3);
  clip-path: polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0% calc(100% - 18px), 0% 18px);
  width: clamp(300px, 90vw, 460px);
  padding: 32px 28px 26px;
  animation: ${modalSlideIn} 0.3s cubic-bezier(0.22,1,0.36,1) forwards;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,170,110,0.012) 0, transparent 1px, transparent 18px);
    pointer-events: none;
    z-index: 0;
  }
`;

const ModalScanLine = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.6), transparent);
  animation: ${scanPulse} 3s ease-in-out infinite;
  pointer-events: none;
`;

const ModalTitle = styled.h2`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.9);
  margin: 0 0 24px;
  text-align: center;
  text-shadow: 0 0 20px rgba(200,170,110,0.4);
`;

const ModalDivider = styled.div`
  position: relative;
  z-index: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.35) 30%, rgba(200,170,110,0.6) 50%, rgba(200,170,110,0.35) 70%, transparent);
  margin: 0 0 22px;
`;

const ModalField = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
`;

const ModalLabel = styled.label`
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.48rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.5);
  margin-bottom: 6px;
`;

const ModalInput = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.055);
  border: 1px solid rgba(200,170,110,0.22);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  letter-spacing: 0.15em;
  padding: 10px 14px;
  outline: none;
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px);
  transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;

  &::placeholder { color: rgba(200,170,110,0.25); }
  &:focus {
    border-color: rgba(200,170,110,0.6);
    background: rgba(200,170,110,0.09);
    box-shadow: 0 0 16px rgba(200,170,110,0.1);
  }

  /* hide number arrows */
  &[type=number]::-webkit-inner-spin-button,
  &[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  &[type=number] { -moz-appearance: textfield; }
`;

const ModalStatsRow = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
`;

const ModalStatField = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
`;

const ModalStatInput = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.055);
  border: 1px solid rgba(200,170,110,0.22);
  color: ${p => p.$color || "#f0e6d2"};
  font-family: 'Cinzel', serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  padding: 8px 6px;
  outline: none;
  text-align: center;
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
  transition: border-color 0.3s ease, background 0.3s ease;
  box-sizing: border-box;

  &:focus {
    border-color: ${p => p.$borderFocus || "rgba(200,170,110,0.6)"};
    background: rgba(200,170,110,0.09);
    outline: none;
  }

  &[type=number]::-webkit-inner-spin-button,
  &[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  &[type=number] { -moz-appearance: textfield; }
`;

const ModalFooter = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 22px;
`;

const ModalBtn = styled.button`
  font-family: 'Cinzel', serif;
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  padding: 9px 22px;
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  cursor: pointer;
  border: 1px solid ${p => p.$primary ? "rgba(200,170,110,0.6)" : "rgba(200,170,110,0.2)"};
  background: ${p => p.$primary ? "rgba(200,170,110,0.12)" : "transparent"};
  color: ${p => p.$primary ? "#f0e6d2" : "rgba(200,170,110,0.45)"};
  transition: all 0.25s ease;

  &:hover {
    border-color: rgba(200,170,110,0.85);
    color: #fff8e8;
    background: ${p => p.$primary ? "rgba(200,170,110,0.2)" : "rgba(200,170,110,0.06)"};
  }
  &:active { transform: scale(0.97); }
`;

const ModalError = styled.p`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.48rem;
  letter-spacing: 0.2em;
  color: rgba(220,100,80,0.85);
  text-align: center;
  margin: 8px 0 0;
`;

const ModalSuccess = styled.p`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.48rem;
  letter-spacing: 0.2em;
  color: rgba(100,200,120,0.85);
  text-align: center;
  margin: 8px 0 0;
`;

const ModalTextarea = styled.textarea`
  width: 100%;
  background: rgba(200,170,110,0.055);
  border: 1px solid rgba(200,170,110,0.22);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  line-height: 1.7;
  padding: 10px 14px;
  outline: none;
  resize: none;
  min-height: 80px;
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px);
  transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;

  &::placeholder { color: rgba(200,170,110,0.25); }
  &:focus {
    border-color: rgba(200,170,110,0.6);
    background: rgba(200,170,110,0.09);
    box-shadow: 0 0 16px rgba(200,170,110,0.1);
  }
`;

const ParticipantsBox = styled.div`
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
`;

const ParticipantsLabel = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.48rem;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.5);
  margin-bottom: 8px;
`;

const ParticipantsContainer = styled.div`
  border: 1px solid rgba(200,170,110,0.22);
  background: rgba(200,170,110,0.03);
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px);
  overflow: hidden;
`;

const ParticipantsSearch = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.06);
  border: none;
  border-bottom: 1px solid rgba(200,170,110,0.15);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 0.2em;
  padding: 9px 14px 9px 36px;
  outline: none;
  box-sizing: border-box;
  transition: background 0.25s ease;

  &::placeholder { color: rgba(200,170,110,0.3); }
  &:focus { background: rgba(200,170,110,0.1); }
`;

const ParticipantsSearchWrap = styled.div`
  position: relative;
`;

const ParticipantsSearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.35;
`;

const ParticipantsList = styled.div`
  height: 180px;
  overflow-y: scroll;
  overflow-x: hidden;

  &::-webkit-scrollbar { display: none; }
  scrollbar-width: none;
`;

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid rgba(200,170,110,0.06);

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(200,170,110,0.07); }
`;

const ParticipantCheckbox = styled.div`
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  border: 1px solid ${p => p.$checked ? "rgba(200,170,110,0.8)" : "rgba(200,170,110,0.25)"};
  background: ${p => p.$checked ? "rgba(200,170,110,0.2)" : "transparent"};
  clip-path: polygon(3px 0%, 100% 0%, calc(100% - 3px) 100%, 0% 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
`;

const ParticipantName = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.6rem;
  letter-spacing: 0.15em;
  color: ${p => p.$checked ? "#f0e6d2" : "rgba(200,170,110,0.55)"};
  text-transform: uppercase;
  transition: color 0.2s ease;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ParticipantCount = styled.div`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.42rem;
  letter-spacing: 0.3em;
  color: rgba(200,170,110,0.35);
  text-align: right;
  margin-top: 5px;
  text-transform: uppercase;
`;

// ─── Add Member Modal Component ───────────────────────────────────────────────

function AddTournamentModal({ onClose, onAdded }) {
  const router = useRouter();
  const { setTournamentName } = useStateContext();
  const [form, setForm] = useState({ name: "", prizes: "", format: "Double-Elimination" });
  const formatOptions = ["Double-Elimination", "Single-Elimination"];
  const [members, setMembers]           = useState([]);
  const [selected, setSelected]         = useState(new Set());
  const [memberSearch, setMemberSearch] = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [nameError, setNameError]       = useState("");
  const [success, setSuccess]           = useState(false);
  const [mounted, setMounted]           = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function loadMembers() {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const { database } = await import("../backend/Firebase");
        const q = query(collection(database, "members"), orderBy("first", "desc"));
        console.log("📖 READ: fetching members list for tournament modal");
        const snap = await getDocs(q);
        console.log(`📖 READ: received ${snap.docs.length} members for tournament modal`);
        setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Failed to load members:", e);
      }
    }
    loadMembers();
  }, []);

  if (!mounted) return null;

  const toggleMember = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleStart = async () => {
    if (!form.name.trim()) { setNameError("Tournament name is required."); return; }
    setLoading(true); setError(""); setNameError("");
    try {
      const { getDocs, collection, query, orderBy, setDoc, doc } = await import("firebase/firestore");
      const { database } = await import("../backend/Firebase");
      console.log("📖 READ: fetching tournaments to determine next number");
      const snap = await getDocs(query(collection(database, "tournaments"), orderBy("number", "asc")));
      console.log(`📖 READ: received ${snap.docs.length} tournaments for numbering`);
      const nextNumber = snap.docs.length + 1;
      const participantNames = members
        .filter(m => selected.has(m.id))
        .map(m => m.name);
      const tournamentName = form.name.trim();
      const { addDoc } = await import("firebase/firestore");
      console.log("✏️ WRITE: creating new tournament document");
const newRef = await addDoc(collection(database, "tournaments"), {
  name:              tournamentName,
  prizes:            form.prizes.trim(),
  format:            form.format,
  participants:      participantNames,
  totalParticipants: participantNames.length,
  number:            nextNumber,
  status:            "ongoing",
  totalTeams:        0,
  phase:             1,
});
setSuccess(true);
setTimeout(() => { onAdded(); onClose(); setTournamentName(newRef.id); router.push("/tournamentslive"); }, 800);    } catch (e) {
      setError("Failed to create tournament.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <ModalBackdrop onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalBox>
        <ModalScanLine />
        <CardCorner style={{ top: 0, left: 0 }} />
        <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

        <ModalTitle>New Tournament</ModalTitle>
        <ModalDivider />

        <ModalField>
          <ModalLabel>Format</ModalLabel>
          <div style={{ position: "relative", zIndex: 1, display: "flex", border: "1px solid rgba(200,170,110,0.2)", background: "rgba(200,170,110,0.03)", overflow: "hidden" }}>
            {/* sliding highlight */}
            <div style={{
              position: "absolute",
              top: 0, bottom: 0,
              width: `${100 / formatOptions.length}%`,
              left: `${(formatOptions.indexOf(form.format) / formatOptions.length) * 100}%`,
              background: "rgba(200,170,110,0.13)",
              borderLeft: "1px solid rgba(200,170,110,0.6)",
              borderRight: "1px solid rgba(200,170,110,0.6)",
              boxShadow: "0 0 18px rgba(200,170,110,0.12) inset",
              transition: "left 0.35s cubic-bezier(0.65,0,0.35,1)",
              pointerEvents: "none",
            }} />
            {formatOptions.map((fmt, i) => (
              <button
                key={fmt}
                onClick={() => setForm(f => ({ ...f, format: fmt }))}
                style={{
                  flex: 1,
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.48rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "10px 4px",
                  cursor: "pointer",
                  border: "none",
                  borderLeft: i !== 0 ? "1px solid rgba(200,170,110,0.1)" : "none",
                  background: "transparent",
                  color: form.format === fmt ? "#f0e6d2" : "rgba(200,170,110,0.38)",
                  transition: "color 0.3s ease",
                  position: "relative",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  zIndex: 1,
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </ModalField>

        <ModalField>
          <ModalLabel>Tournament Name</ModalLabel>
          <ModalInput
            placeholder="Enter name..."
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setNameError(""); }}
            style={nameError ? { borderColor: "rgba(220,80,60,0.7)", background: "rgba(220,60,40,0.06)" } : {}}
          />
          {nameError && <ModalError style={{ margin: "6px 0 0", textAlign: "left" }}>{nameError}</ModalError>}
        </ModalField>

        <ModalField>
          <ModalLabel>Prizes</ModalLabel>
          <ModalTextarea
            placeholder="Describe the prizes..."
            value={form.prizes}
            onChange={e => setForm(f => ({ ...f, prizes: e.target.value }))}
          />
        </ModalField>

        <ParticipantsBox>
          <ParticipantsLabel>Participants {selected.size > 0 && <span style={{ color: "rgba(200,170,110,0.75)", fontFamily: "'Cinzel', serif" }}>({selected.size})</span>}</ParticipantsLabel>
          <ParticipantsContainer>
            <ParticipantsSearchWrap>
              <ParticipantsSearchIcon>
                <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="#c8aa6e" strokeWidth="1"/>
                  <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#c8aa6e" strokeWidth="1" strokeLinecap="round"/>
                </svg>
              </ParticipantsSearchIcon>
              <ParticipantsSearch
                placeholder="Search members..."
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
              />
            </ParticipantsSearchWrap>
            <ParticipantsList>
              {filtered.length === 0 ? (
                <ParticipantRow style={{ justifyContent: "center", cursor: "default" }}>
                  <ParticipantName style={{ textAlign: "center", color: "rgba(200,170,110,0.2)" }}>
                    No members found
                  </ParticipantName>
                </ParticipantRow>
              ) : filtered.map(m => (
                <ParticipantRow key={m.id} onClick={() => toggleMember(m.id)}>
                  <ParticipantCheckbox $checked={selected.has(m.id)}>
                    {selected.has(m.id) && (
                      <svg viewBox="0 0 8 8" width="7" height="7" fill="none">
                        <path d="M1 4 L3 6 L7 2" stroke="rgba(200,170,110,0.9)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </ParticipantCheckbox>
                  <ParticipantName $checked={selected.has(m.id)}>{m.name}</ParticipantName>
                </ParticipantRow>
              ))}
            </ParticipantsList>
          </ParticipantsContainer>
          <ParticipantCount style={{ opacity: 0 }} aria-hidden="true">&nbsp;</ParticipantCount>
        </ParticipantsBox>

        {error   && <ModalError>{error}</ModalError>}
        {success && <ModalSuccess>Tournament started!</ModalSuccess>}

        <ModalFooter>
          <ModalBtn onClick={onClose} disabled={loading}>Cancel</ModalBtn>
          <ModalBtn $primary onClick={handleStart} disabled={loading}>
            {loading ? "Starting..." : "Start"}
          </ModalBtn>
        </ModalFooter>
      </ModalBox>
    </ModalBackdrop>,
    document.body
  );
}

function AddMemberModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: "", imglink: "", participations: 0, first: 0, second: 0, third: 0,
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [nameError, setNameError] = useState("");
  const [success, setSuccess]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === "name") setNameError("");
  };

  const handleAdd = async () => {
    if (!form.name.trim()) { setNameError("Name is required."); return; }
    setLoading(true); setNameError(""); setError("");
    try {
      const { doc, setDoc, getDoc } = await import("firebase/firestore");
      const { database }    = await import("../backend/Firebase");
      console.log(`📖 READ: checking if member "${form.name.trim()}" already exists`);
      const existing = await getDoc(doc(database, "members", form.name.trim()));
      if (existing.exists()) {
        setNameError("Username already exists.");
        setLoading(false);
        return;
      }
      console.log(`✏️ WRITE: creating new member doc "${form.name.trim()}"`);
      await setDoc(doc(database, "members", form.name.trim()), {
        name:           form.name.trim(),
        imglink:        form.imglink.trim(),
        participations: Number(form.participations),
        first:          Number(form.first),
        second:         Number(form.second),
        third:          Number(form.third),
      });
      setSuccess(true);
      setTimeout(() => { onAdded(); onClose(); }, 800);
    } catch (e) {
      setError("Failed to add member. Check console.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <ModalBackdrop onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalBox>
        <ModalScanLine />
        <CardCorner style={{ top: 0, left: 0 }} />
        <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

        <ModalTitle>Add Member</ModalTitle>
        <ModalDivider />

        <ModalField>
          <ModalLabel>Name</ModalLabel>
          <ModalInput
            placeholder="Username"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            style={nameError ? { borderColor: "rgba(220,80,60,0.7)", background: "rgba(220,60,40,0.06)" } : {}}
          />
          {nameError && <ModalError style={{ margin: "6px 0 0", textAlign: "left" }}>{nameError}</ModalError>}
        </ModalField>

        <ModalField>
          <ModalLabel>Image Link</ModalLabel>
          <ModalInput
            placeholder="https://..."
            value={form.imglink}
            onChange={e => set("imglink", e.target.value)}
          />
        </ModalField>

        <ModalField>
          <ModalLabel>Participations</ModalLabel>
          <ModalInput
            type="number" min="0"
            value={form.participations}
            onChange={e => set("participations", e.target.value)}
          />
        </ModalField>

        {/* First / Second / Third in one row with trophy icons */}
        <ModalStatsRow>
          <ModalStatField>
            <TrophyGold />
            <ModalStatInput
              type="number" min="0"
              value={form.first}
              onChange={e => set("first", e.target.value)}
              $color="#ffe066"
              $borderFocus="rgba(255,210,50,0.5)"
            />
          </ModalStatField>
          <ModalStatField>
            <TrophySilver />
            <ModalStatInput
              type="number" min="0"
              value={form.second}
              onChange={e => set("second", e.target.value)}
              $color="#d8d8d8"
              $borderFocus="rgba(200,200,200,0.4)"
            />
          </ModalStatField>
          <ModalStatField>
            <TrophyBronze />
            <ModalStatInput
              type="number" min="0"
              value={form.third}
              onChange={e => set("third", e.target.value)}
              $color="#c07040"
              $borderFocus="rgba(160,100,50,0.4)"
            />
          </ModalStatField>
        </ModalStatsRow>

        {error   && <ModalError>{error}</ModalError>}
        {success && <ModalSuccess>Member added!</ModalSuccess>}

        <ModalFooter>
          <ModalBtn onClick={onClose} disabled={loading}>Cancel</ModalBtn>
          <ModalBtn $primary onClick={handleAdd} disabled={loading}>
            {loading ? "Adding..." : "Add"}
          </ModalBtn>
        </ModalFooter>
</ModalBox>
    </ModalBackdrop>,
    document.body
  );
}

// ─── Edit Member Modal Component ─────────────────────────────────────────────

function EditMemberModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:           member.name        ?? "",
    imglink:        member.imglink     ?? "",
    participations: member.participations ?? 0,
    first:          member.first       ?? 0,
    second:         member.second      ?? 0,
    third:          member.third       ?? 0,
  });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [nameError, setNameError] = useState("");
  const [success, setSuccess]   = useState(false);
  const [mounted, setMounted]   = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === "name") setNameError("");
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setLoading(true); setError("");
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { database }       = await import("../backend/Firebase");
      console.log(`✏️ WRITE: updating member doc "${member.id}"`);
      await updateDoc(doc(database, "members", member.id), {
        name:           form.name.trim(),
        imglink:        form.imglink.trim(),
        participations: Number(form.participations),
        first:          Number(form.first),
        second:         Number(form.second),
        third:          Number(form.third),
      });
      setSuccess(true);
      setTimeout(() => { onSaved(); onClose(); }, 700);
    } catch (e) {
      setError("Failed to save. Check console.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

return createPortal(
    <ModalBackdrop onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalBox>
        <ModalScanLine />
        <CardCorner style={{ top: 0, left: 0 }} />
        <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

        <ModalTitle>Edit Member</ModalTitle>
        <ModalDivider />

        <ModalField>
          <ModalLabel>Name</ModalLabel>
          <ModalInput
            placeholder="Username"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            style={nameError ? { borderColor: "rgba(220,80,60,0.7)", background: "rgba(220,60,40,0.06)" } : {}}
          />
          {nameError && <ModalError style={{ margin: "6px 0 0", textAlign: "left" }}>{nameError}</ModalError>}
        </ModalField>

        <ModalField>
          <ModalLabel>Image Link</ModalLabel>
          <ModalInput
            placeholder="https://..."
            value={form.imglink}
            onChange={e => set("imglink", e.target.value)}
          />
        </ModalField>

        <ModalField>
          <ModalLabel>Participations</ModalLabel>
          <ModalInput
            type="number" min="0"
            value={form.participations}
            onChange={e => set("participations", e.target.value)}
          />
        </ModalField>

        <ModalStatsRow>
          <ModalStatField>
            <TrophyGold />
            <ModalStatInput
              type="number" min="0"
              value={form.first}
              onChange={e => set("first", e.target.value)}
              $color="#ffe066"
              $borderFocus="rgba(255,210,50,0.5)"
            />
          </ModalStatField>
          <ModalStatField>
            <TrophySilver />
            <ModalStatInput
              type="number" min="0"
              value={form.second}
              onChange={e => set("second", e.target.value)}
              $color="#d8d8d8"
              $borderFocus="rgba(200,200,200,0.4)"
            />
          </ModalStatField>
          <ModalStatField>
            <TrophyBronze />
            <ModalStatInput
              type="number" min="0"
              value={form.third}
              onChange={e => set("third", e.target.value)}
              $color="#c07040"
              $borderFocus="rgba(160,100,50,0.4)"
            />
          </ModalStatField>
        </ModalStatsRow>

        {error   && <ModalError>{error}</ModalError>}
        {success && <ModalSuccess>Saved!</ModalSuccess>}

        <ModalFooter>
          <ModalBtn onClick={onClose} disabled={loading}>Cancel</ModalBtn>
          <ModalBtn $primary onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </ModalBtn>
        </ModalFooter>
      </ModalBox>
    </ModalBackdrop>,
    document.body
  );
}

// ─── Trophy SVG components ────────────────────────────────────────────────────

function TrophyGold() {
  return (
    <svg width="13" height="14" viewBox="0 0 28 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <linearGradient id="tgCup" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%"   stopColor="#fff0a0"/>
          <stop offset="40%"  stopColor="#e8b830"/>
          <stop offset="100%" stopColor="#7a5010"/>
        </linearGradient>
        <filter id="tgGlow">
          <feGaussianBlur stdDeviation="1.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="tgShine" cx="35%" cy="30%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,255,220,0.9)"/>
          <stop offset="100%" stopColor="rgba(255,255,220,0)"/>
        </radialGradient>
      </defs>
      {/* Base plate */}
      <rect x="6" y="28" width="16" height="3" rx="1" fill="url(#tgBase)" filter="url(#tgGlow)"/>
      <rect x="8" y="26.5" width="12" height="2" rx="0.8" fill="url(#tgBase)"/>
      {/* Stem */}
      <rect x="11.5" y="21" width="5" height="6" rx="0.5" fill="url(#tgBody)"/>
      <rect x="12" y="21" width="1.5" height="6" fill="rgba(255,240,140,0.3)" rx="0.3"/>
      {/* Cup body */}
      <path d="M5 4 Q5 20 14 21 Q23 20 23 4 Z" fill="url(#tgCup)" filter="url(#tgGlow)"/>
      {/* Cup shine highlight */}
      <path d="M8 5 Q8 14 11 17" stroke="rgba(255,255,200,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx="11" cy="7" rx="2" ry="3" fill="url(#tgShine)" opacity="0.7"/>
      {/* Cup rim */}
      <path d="M5 4 Q14 7 23 4" stroke="rgba(255,220,60,0.9)" strokeWidth="1.2" fill="none"/>
      {/* Handles */}
      <path d="M5 6 Q1 8 2 12 Q3 16 6 15" stroke="url(#tgBody)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M23 6 Q27 8 26 12 Q25 16 22 15" stroke="url(#tgBody)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      {/* Star on cup */}
      <path d="M14 8 L14.9 10.7 L17.8 10.7 L15.5 12.3 L16.4 15 L14 13.4 L11.6 15 L12.5 12.3 L10.2 10.7 L13.1 10.7 Z" fill="rgba(255,245,180,0.95)" filter="url(#tgGlow)"/>
      {/* Top embellishment */}
      <circle cx="14" cy="3.5" r="1.5" fill="rgba(255,240,100,0.9)" filter="url(#tgGlow)"/>
      <path d="M12 3.5 L14 1 L16 3.5" stroke="rgba(255,220,60,0.8)" strokeWidth="0.8" fill="none"/>
    </svg>
  );
}

function TrophySilver() {
  return (
    <svg width="11" height="13" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <path d="M6.5 5 Q6.5 12 9 15" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinecap="round"/>
      <path d="M4 3 Q12 6 20 3" stroke="rgba(200,200,200,0.7)" strokeWidth="1" fill="none"/>
      <path d="M4 5 Q1 7 2 11 Q3 14 5 13" stroke="url(#tsBody)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M20 5 Q23 7 22 11 Q21 14 19 13" stroke="url(#tsBody)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M12 7 L12.7 9.2 L15 9.2 L13.2 10.5 L13.9 12.8 L12 11.5 L10.1 12.8 L10.8 10.5 L9 9.2 L11.3 9.2 Z" fill="rgba(240,240,240,0.85)"/>
    </svg>
  );
}

function TrophyBronze() {
  return (
    <svg width="10" height="12" viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <path d="M5.5 4.5 Q5.5 11 8 13" stroke="rgba(200,130,80,0.4)" strokeWidth="1" strokeLinecap="round"/>
      <path d="M3 3 Q11 5.5 19 3" stroke="rgba(180,100,60,0.6)" strokeWidth="0.9" fill="none"/>
      <path d="M3 5 Q0.5 6.5 1.5 10 Q2.5 13 4.5 12" stroke="url(#tbBody)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M19 5 Q21.5 6.5 20.5 10 Q19.5 13 17.5 12" stroke="url(#tbBody)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Member grid component ────────────────────────────────────────────────────

function cleanImgUrl(url = "") {
  if (!url || !url.trim()) return "/question.jpg";
  const match = url.match(/\/https\/(.+)$/);
  return match ? "https://" + match[1] : url;
}

function MemberGrid({ refreshKey = 0, onRefresh, searchQuery = "" }) {
  const [members, setMembers] = useState([]);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [viewingMember, setViewingMember] = useState(null);
  const { admin: isAdmin } = useStateContext();
  const cardRefs = useRef([]);

  const handleDelete = async (m) => {
    setDeletingId(m.id);
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { database } = await import("../backend/Firebase");
      console.log(`✏️ WRITE: deleting member doc "${m.id}"`);
      await deleteDoc(doc(database, "members", m.id));
      onRefresh?.();
    } catch (e) {
      console.error("Failed to delete member:", e);
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const { database } = await import("../backend/Firebase");
        const q = query(collection(database, "members"), orderBy("first", "desc"));
        console.log("📖 READ: fetching all members");
        const snap = await getDocs(q);
        console.log(`📖 READ: received ${snap.docs.length} member docs`);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(data);
      } catch (e) {
        console.error("Failed to load members:", e);
        setMembers([]);
      }
    }
    load();
  }, [refreshKey]);

  useEffect(() => {
    if (!members.length) return;
    const listeners = [];
    cardRefs.current.filter(Boolean).forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 36, rotateX: 10, scale: 0.94 },
        { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.75, ease: "power3.out", delay: 0.08 * i }
      );
      const onEnter = () => gsap.to(card, { rotateY: 3, rotateX: -2, scale: 1.02, duration: 0.35, ease: "power2.out" });
      const onLeave = () => gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.45, ease: "power2.inOut" });
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      listeners.push({ card, onEnter, onLeave });
    });
    return () => listeners.forEach(({ card, onEnter, onLeave }) => {
      card.removeEventListener("mouseenter", onEnter);
      card.removeEventListener("mouseleave", onLeave);
    });
  }, [members]);

  if (!members.length) {
    return (
      <EmptyState>
        <EmptyIcon viewBox="0 0 48 48" width="64" height="64" fill="none">
          <circle cx="24" cy="16" r="7" stroke="#c8aa6e" strokeWidth="1"/>
          <path d="M8 40 C8 30 40 30 40 40" stroke="#c8aa6e" strokeWidth="1" fill="none"/>
        </EmptyIcon>
        <EmptyText>No members yet</EmptyText>
      </EmptyState>
    );
  }

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    <MemberGridWrap>
      {filtered.map((m, i) => (
        <MCard key={m.id} ref={el => { cardRefs.current[i] = el; }} style={{ opacity: 1, transform: "none" }} onClick={(e) => { if (!e.target.closest('button')) setViewingMember(m); }}>
          <MCardScan />
          <CardCorner style={{ top: 0, left: 0 }} />
          <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
          <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
          <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

          {/* Avatar — 70% of card height */}
          <MCardAvatarWrap>
            {isAdmin && (
              <>
<DeleteBtn
  onClick={() => setConfirmDelete(m)}
  disabled={deletingId === m.id}
>
                  {deletingId === m.id ? (
                    <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="rgba(220,80,80,0.6)" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="0">
                        <animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite"/>
                      </circle>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                      <path d="M3 4 L13 4" stroke="rgba(220,100,100,0.9)" strokeWidth="1.2" strokeLinecap="round"/>
                      <path d="M6 4 L6 2 L10 2 L10 4" stroke="rgba(220,100,100,0.9)" strokeWidth="1.1" strokeLinejoin="round"/>
                      <path d="M5 4 L5.5 13 L10.5 13 L11 4" stroke="rgba(220,100,100,0.9)" strokeWidth="1.1" strokeLinejoin="round"/>
                      <line x1="7" y1="6" x2="7" y2="11" stroke="rgba(220,100,100,0.7)" strokeWidth="0.9"/>
                      <line x1="9" y1="6" x2="9" y2="11" stroke="rgba(220,100,100,0.7)" strokeWidth="0.9"/>
                    </svg>
                  )}
                </DeleteBtn>
                <EditBtn
                  onClick={() => setEditingMember(m)}
                  disabled={deletingId === m.id}
                >
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
                    <path d="M11 2 L14 5 L5 14 L2 14 L2 11 Z" stroke="rgba(200,170,110,0.9)" strokeWidth="1.2" strokeLinejoin="round"/>
                    <line x1="9" y1="4" x2="12" y2="7" stroke="rgba(200,170,110,0.9)" strokeWidth="1.2"/>
                  </svg>
                </EditBtn>
              </>
            )}
            <MCardAvatar src={cleanImgUrl(m.imglink)} alt={m.name} loading="lazy" onError={e => { e.currentTarget.src = "/question.jpg"; }} />
            <MCardAvatarBorderSVG viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="0.5" y="0.5" width="99" height="99"
                fill="none"
                stroke="rgba(200,170,110,0.3)"
                strokeWidth="0.8"
              />
              {/* corner ticks */}
              {[[0,0,1,0],[100,0,-1,0],[0,100,1,0],[100,100,-1,0]].map(([cx,cy,dx,dy],k) => (
                <g key={k}>
                  <line x1={cx} y1={cy} x2={cx+dx*12} y2={cy} stroke="rgba(200,170,110,0.7)" strokeWidth="1.2"/>
                  <line x1={cx} y1={cy} x2={cx} y2={cy+(dy===0?dx:dy)*12} stroke="rgba(200,170,110,0.7)" strokeWidth="1.2"/>
                </g>
              ))}
            </MCardAvatarBorderSVG>
          </MCardAvatarWrap>

          <MCardBody>
            <MCardNameRow>
              <MCardName>{m.name}</MCardName>
              <MCardParticipations>
                <MCardPartNum>{m.participations ?? 0}</MCardPartNum>
                <MCardPartLabel>Events</MCardPartLabel>
              </MCardParticipations>
            </MCardNameRow>

            <MCardDivider />

            <MCardStats>
              {/* Gold */}
              <MCardStat>
                <TrophyGold />
                <MCardStatNum $color="#ffe066" $glow="0 0 8px rgba(255,210,50,0.6)">{m.first ?? 0}</MCardStatNum>
              </MCardStat>
              {/* Silver */}
              <MCardStat>
                <TrophySilver />
                <MCardStatNum $color="#d8d8d8" $glow="0 0 6px rgba(200,200,200,0.4)">{m.second ?? 0}</MCardStatNum>
              </MCardStat>
              {/* Bronze */}
              <MCardStat>
                <TrophyBronze />
                <MCardStatNum $color="#c07040" $glow="0 0 6px rgba(160,100,50,0.4)">{m.third ?? 0}</MCardStatNum>
              </MCardStat>
            </MCardStats>
          </MCardBody>
        </MCard>
      ))}
    </MemberGridWrap>
    {confirmDelete && (
        <ConfirmModal
          message={`Delete "${confirmDelete.name}"?`}
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={() => { setEditingMember(null); onRefresh?.(); }}
        />
      )}
    {viewingMember && (
        <MemberHistoryModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
        />
      )}
    </>
  );
}

// ─── Member History Modal ─────────────────────────────────────────────────────

function MemberHistoryModal({ member, onClose }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    async function load() {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const { database } = await import("../backend/Firebase");
        const q = query(collection(database, "tournaments"), orderBy("number", "asc"));
        console.log(`📖 READ: fetching all tournaments for member history ("${member.name}")`);
        const snap = await getDocs(q);
        console.log(`📖 READ: received ${snap.docs.length} tournaments for member history`);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const participated = all.filter(t =>
          Array.isArray(t.participants) && t.participants.includes(member.name)
        );
        setTournaments(participated);
      } catch (e) {
        console.error("Failed to load tournament history:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member.name]);

  if (!mounted) return null;

  const getRank = (t) => {
const inFirst  = t.firstTeam  === member.name;
const inSecond = t.secondTeam === member.name;
const inThird  = t.thirdTeam  === member.name;
    if (inFirst)  return 1;
    if (inSecond) return 2;
    if (inThird)  return 3;
    return null;
  };

  const isSingleElim = (t) =>
    t.format && t.format.toLowerCase().includes("single");

  return createPortal(
    <ModalBackdrop onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalBox style={{ width: "clamp(300px, 92vw, 540px)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <ModalScanLine />
        <CardCorner style={{ top: 0, left: 0 }} />
        <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

        <ModalTitle style={{ marginBottom: 6 }}>{member.name}</ModalTitle>
        <p style={{
          position: "relative", zIndex: 1,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.44rem",
          letterSpacing: "0.4em",
          color: "rgba(200,170,110,0.4)",
          textAlign: "center",
          textTransform: "uppercase",
          margin: "0 0 18px",
        }}>Tournament History</p>
        <ModalDivider />

        <div style={{ overflowY: "auto", flex: 1, scrollbarWidth: "none" }}>
          {loading ? (
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: "0.55rem",
              letterSpacing: "0.3em", color: "rgba(200,170,110,0.35)",
              textAlign: "center", padding: "32px 0", textTransform: "uppercase",
            }}>Loading...</p>
          ) : tournaments.length === 0 ? (
            <p style={{
              fontFamily: "'Cinzel', serif", fontSize: "0.55rem",
              letterSpacing: "0.3em", color: "rgba(200,170,110,0.25)",
              textAlign: "center", padding: "32px 0", textTransform: "uppercase",
            }}>No tournaments found</p>
          ) : tournaments.map((t, i) => {
            const rank = getRank(t);
            const single = isSingleElim(t);
            const showQuestion = rank === null || (single && rank === 3);

            return (
              <div key={t.id} style={{
                position: "relative", zIndex: 1,
                borderBottom: i < tournaments.length - 1 ? "1px solid rgba(200,170,110,0.08)" : "none",
                padding: "14px 4px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}>
                {/* Number badge */}
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.5rem",
                  letterSpacing: "0.15em",
                  color: "rgba(200,170,110,0.4)",
                  flexShrink: 0,
                  width: 28,
                  textAlign: "center",
                }}>#{t.number}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#f0e6d2",
                    textTransform: "uppercase",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 5,
                  }}>{t.name}</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
                    <span style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.45rem",
                      letterSpacing: "0.2em",
                      color: "rgba(200,170,110,0.4)",
                      textTransform: "uppercase",
                    }}>{t.totalParticipants ?? 0} Participants</span>
                    <span style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.45rem",
                      letterSpacing: "0.2em",
                      color: "rgba(200,170,110,0.4)",
                      textTransform: "uppercase",
                    }}>{t.totalTeams ?? 0} Teams</span>
                    <span style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.45rem",
                      letterSpacing: "0.2em",
                      color: "rgba(200,170,110,0.35)",
                      textTransform: "uppercase",
                    }}>{t.format ?? "—"}</span>
                  </div>
                  {t.prizes && t.prizes.trim() && (
                    <div style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: "0.48rem",
                      letterSpacing: "0.12em",
                      lineHeight: 1.7,
                      color: "rgba(200,170,110,0.6)",
                      fontStyle: "italic",
                      borderLeft: "1px solid rgba(200,170,110,0.2)",
                      paddingLeft: 8,
                      marginTop: 2,
                    }}>{t.prizes}</div>
                  )}
                </div>

                {/* Rank icon */}
                <div style={{
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  width: 36,
                }}>
                  {showQuestion ? (
                    <>
                      <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "1rem",
                        color: "rgba(200,170,110,0.2)",
                        lineHeight: 1,
                      }}>?</span>
                      <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.38rem",
                        letterSpacing: "0.2em",
                        color: "rgba(200,170,110,0.2)",
                        textTransform: "uppercase",
                      }}>Rank</span>
                    </>
                  ) : rank === 1 ? (
                    <>
                      <TrophyGold />
                      <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.38rem",
                        letterSpacing: "0.2em",
                        color: "#ffe066",
                        textTransform: "uppercase",
                        textShadow: "0 0 8px rgba(255,210,50,0.5)",
                      }}>1st</span>
                    </>
                  ) : rank === 2 ? (
                    <>
                      <TrophySilver />
                      <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.38rem",
                        letterSpacing: "0.2em",
                        color: "#d8d8d8",
                        textTransform: "uppercase",
                      }}>2nd</span>
                    </>
                  ) : rank === 3 ? (
                    <>
                      <TrophyBronze />
                      <span style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.38rem",
                        letterSpacing: "0.2em",
                        color: "#c07040",
                        textTransform: "uppercase",
                      }}>3rd</span>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <ModalFooter style={{ marginTop: 16, justifyContent: "center" }}>
          <ModalBtn $primary onClick={onClose}>Close</ModalBtn>
        </ModalFooter>
      </ModalBox>
    </ModalBackdrop>,
    document.body
  );
}

// ─── Corner accent SVG for cards ─────────────────────────────────────────────

function CardCorner({ style }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
      style={{ position: "absolute", pointerEvents: "none", zIndex: 4, ...style }}>
      <path d="M1 10 L1 1 L10 1" stroke="rgba(200,170,110,0.55)" strokeWidth="1"/>
      <circle cx="1" cy="1" r="1.2" fill="rgba(200,170,110,0.5)"/>
    </svg>
  );
}

// ─── Tournament grid component ────────────────────────────────────────────────


function ConfirmModal({ message, onConfirm, onCancel }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <ModalBackdrop onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <ModalBox style={{ maxWidth: 360 }}>
        <ModalScanLine />
        <CardCorner style={{ top: 0, left: 0 }} />
        <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

        <ModalTitle>Confirm Action</ModalTitle>
        <ModalDivider />

        <p style={{
          position: "relative", zIndex: 1,
          fontFamily: "'Cinzel', serif",
          fontSize: "0.62rem",
          letterSpacing: "0.18em",
          color: "rgba(240,230,210,0.75)",
          textAlign: "center",
          lineHeight: 1.9,
          margin: "0 0 24px",
          textTransform: "uppercase",
        }}>
          {message}
        </p>

        <ModalFooter style={{ justifyContent: "center", gap: 14 }}>
          <ModalBtn onClick={onCancel}>Cancel</ModalBtn>
          <ModalBtn $primary onClick={onConfirm} style={{
            borderColor: "rgba(220,80,60,0.6)",
            color: "#ffaaaa",
            background: "rgba(200,60,40,0.1)",
          }}>Delete</ModalBtn>
        </ModalFooter>
      </ModalBox>
    </ModalBackdrop>,
    document.body
  );
}


function TournamentGrid({ tournamentsRef, searchQuery = "" }) {
  const [tournaments, setTournaments] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const cardRefs = useRef([]);
  const router = useRouter();
  const { setTournamentName, admin: isAdmin } = useStateContext();
  const [confirmDelete, setConfirmDelete] = useState(null); // holds tournament object

  // Fetch from Firestore
  useEffect(() => {
    async function load() {
      try {
        const { getDocs, collection, query, orderBy } = await import("firebase/firestore");
        const { database } = await import("../backend/Firebase");
        const q = query(collection(database, "tournaments"), orderBy("number", "asc"));
        console.log("📖 READ: fetching all tournaments");
        const snap = await getDocs(q);
        console.log(`📖 READ: received ${snap.docs.length} tournament docs`);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTournaments(data.filter(t => t.name)); // ignore empty/corrupt docs
      } catch (e) {
        console.error("Failed to load tournaments:", e);
        setTournaments([]);
      }
    }
    load();
  }, [refreshKey]);

  // GSAP card entrance
  useEffect(() => {
    if (!tournaments.length) return;
    cardRefs.current.filter(Boolean).forEach((card, i) => {
      gsap.fromTo(card,
        { opacity: 0, y: 32, rotateX: 6 },
        { opacity: 1, y: 0, rotateX: 0, duration: 0.75, ease: "power3.out", delay: 0.12 * i }
      );
    });
  }, [tournaments]);

const handleDeleteTournament = async (t) => {
    try {
      const {
        doc, deleteDoc, getDoc, updateDoc, increment
      } = await import("firebase/firestore");
      const { database } = await import("../backend/Firebase");

      const isFinished = t.status !== "ongoing";

if (isFinished && t.participants?.length) {
  for (const name of t.participants) {
    if (!name || typeof name !== "string") continue;
    const memberRef = doc(database, "members", name);
    console.log(`📖 READ: fetching member "${name}" for participations decrement`);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      console.log(`✏️ WRITE: decrementing participations for "${name}"`);
      await updateDoc(memberRef, { participations: increment(-1) });
    }
  }
}

      if (isFinished) {
const podium = [
  { field: "first",  name: t.firstTeam  ?? "" },
  { field: "second", name: t.secondTeam ?? "" },
  { field: "third",  name: t.thirdTeam  ?? "" },
];
for (const { field, name } of podium) {
  if (!name || typeof name !== "string") continue;
  const memberRef = doc(database, "members", name);
  console.log(`📖 READ: fetching member "${name}" for ${field} decrement`);
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists()) {
    console.log(`✏️ WRITE: decrementing ${field} for "${name}"`);
    await updateDoc(memberRef, { [field]: increment(-1) });
  }
}
      }

      console.log(`✏️ WRITE: deleting tournament doc "${t.id}"`);
      await deleteDoc(doc(database, "tournaments", t.id));
      setConfirmDelete(null);
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error("Failed to delete tournament:", e);
      setConfirmDelete(null);
    }
  };

  if (!tournaments.length) {
    return (
      <EmptyState>
        <EmptyIcon viewBox="0 0 48 48" width="64" height="64" fill="none">
          <path d="M12 8 L36 8 L42 14 L42 34 L24 44 L6 34 L6 14 Z" stroke="#c8aa6e" strokeWidth="1"/>
          <path d="M24 16 L28 22 L35 23 L30 28 L31 35 L24 31 L17 35 L18 28 L13 23 L20 22 Z" stroke="#c8aa6e" strokeWidth="0.8" fill="rgba(200,170,110,0.06)"/>
        </EmptyIcon>
        <EmptyText>No tournaments yet</EmptyText>
      </EmptyState>
    );
  }

  const filtered = tournaments.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    <TournamentGridWrap ref={tournamentsRef}>
      {filtered.map((t, i) => (
        <TCard key={t.id} ref={el => { cardRefs.current[i] = el; }} style={{ opacity: 1, transform: "none" }}>
          <TCardScan />
          <CardCorner style={{ top: 0, left: 0 }} />
          <CardCorner style={{ top: 0, right: 0,  transform: "scaleX(-1)" }} />
          <CardCorner style={{ bottom: 0, left: 0,  transform: "scaleY(-1)" }} />
          <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

          <StatusBadge $ongoing={t.status === "ongoing"}>
            {t.status === "ongoing" ? "Ongoing" : "Finished"}
          </StatusBadge>

          <TCardInner>
            <TCardHeader>
              <TCardNumber>#{t.number}</TCardNumber>
              <TCardTitleWrap>
                <TCardName>{t.name}</TCardName>
                <TCardMeta>
                  <TCardMetaItem>{t.totalParticipants ?? "—"} Participants</TCardMetaItem>
                  <TCardMetaItem>{t.totalTeams ?? "—"} Teams</TCardMetaItem>
                </TCardMeta>
              </TCardTitleWrap>
            </TCardHeader>

            <TCardDivider>
              <TCardDividerLabel>Prizes</TCardDividerLabel>
            </TCardDivider>

            <TCardPrize>{t.prizes ?? "To be announced"}</TCardPrize>

<TCardFooter>
  {isAdmin && (
    <DeleteTournamentBtn onClick={() => setConfirmDelete(t)}>
      Delete
    </DeleteTournamentBtn>
  )}
  {t.status === "ongoing" && isAdmin ? (
    <TCardBtn onClick={() => {
      setTournamentName(t.id);
      router.push("/tournamentslive");
    }}>Continue</TCardBtn>
  ) : t.status !== "ongoing" ? (
    <>
      {isAdmin && (
        <TCardBtn
          onClick={() => {
            setTournamentName(t.id);
            router.push("/tournamentslive");
          }}
          style={{ marginRight: "8px" }}
        >
          Edit
        </TCardBtn>
      )}
      <TCardBtn onClick={() => {
        setTournamentName(t.id);
        router.push("/tournaments");
      }}>Details</TCardBtn>
    </>
  ) : null}
</TCardFooter>
          </TCardInner>
        </TCard>
      ))}
    </TournamentGridWrap>
    {confirmDelete && (
      <ConfirmModal
        message={`Delete "${confirmDelete.name}"? All participant stats will be updated.`}
        onConfirm={() => handleDeleteTournament(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    )}
    </>
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

    for (let i = 0; i < 20; i++) {
      const p = {
        ox: Math.random() * 100, oy: 0.15 * 100 + Math.random() * 0.7 * 100,
        dx: (Math.random() - 0.5) * 80, dy: -(25 + Math.random() * 80),
        size: 0.6 + Math.random() * 1.4, progress: 0,
      };
      particles.push(p);
      const dur = 7 + Math.random() * 6;
      gsap.to(p, {
        progress: 1, duration: dur, ease: "power1.out",
        delay: Math.random() * dur, repeat: -1, repeatDelay: 1 + Math.random() * 4,
        onRepeat() {
          p.ox = Math.random() * 100; p.oy = 15 + Math.random() * 70;
          p.dx = (Math.random() - 0.5) * 80; p.dy = -(25 + Math.random() * 80);
        },
      });
    }

    for (let i = 0; i < 10; i++) {
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

    for (let i = 0; i < 2; i++) {
      const ring = { r: 0, alpha: 0 };
      pulseRings.push(ring);
      gsap.timeline({ repeat: -1, delay: i * 5.5, repeatDelay: 10 + Math.random() * 6 })
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
        a *= 0.55;
        const px = (p.ox / 100) * W + p.dx * t;
        const py = (p.oy / 100) * H + p.dy * t;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = gold(a);
        ctx.fill();
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
    const { corners, hRules, vRules, rings, centerDiamond, medalPath } = refs;
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

    // Medallion border trace
    if (medalPath.current) {
      const path = medalPath.current;
      gsap.timeline({ repeat: -1 })
        .set(path, { attr: { "stroke-dasharray": 680, "stroke-dashoffset": 0 }, opacity: 0.85 })
        .to({}, { duration: 1.2 })
        .to(path, { attr: { "stroke-dashoffset": 680 }, opacity: 0.85, duration: 2.2, ease: "power1.inOut" })
        .to(path, { opacity: 0, duration: 0.2 })
        .set(path, { attr: { "stroke-dashoffset": -680 }, opacity: 0 })
        .to({}, { duration: 0.3 })
        .to(path, { opacity: 0.85, duration: 0.25 })
        .to(path, { attr: { "stroke-dashoffset": 0 }, duration: 2.4, ease: "power1.inOut" })
        .to({}, { duration: 0.8 });
    }

    // search bar entrance — only animate in the first one (tournaments)
    if (refs.searchBars?.current) {
      const first = refs.searchBars.current[0];
      if (first) {
        gsap.fromTo(first,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 1.0,
            onComplete: () => { first.style.pointerEvents = "all"; }
          }
        );
      }
      // keep members bar hidden and non-interactive on mount
      const second = refs.searchBars.current[1];
      if (second) {
        gsap.set(second, { opacity: 0, y: 12 });
        second.style.pointerEvents = "none";
      }
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

// ─── Search bar component ─────────────────────────────────────────────────────

function SearchBar({ placeholder, searchRef }) {
  return (
    <SearchWrap ref={searchRef}>
      <SearchOuter>
        <SearchIcon>
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#c8aa6e" strokeWidth="1"/>
            <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#c8aa6e" strokeWidth="1" strokeLinecap="round"/>
          </svg>
        </SearchIcon>
        <SearchInput placeholder={placeholder} />
      </SearchOuter>
      <SearchUnderline />
    </SearchWrap>
  );
}

// ─── Tab slide hook ───────────────────────────────────────────────────────────

function useTabSlide(trackRef, activeTab, searchRefs) {
  const prevTab = useRef(activeTab);

  useEffect(() => {
    if (!trackRef.current) return;
    const dir = activeTab === "members" ? -50 : 0;

    gsap.to(trackRef.current, {
      xPercent: dir,
      duration: 0.65,
      ease: "power3.inOut",
    });

    // skip search bar swap on initial mount
    if (prevTab.current === activeTab) return;

    const entering = activeTab === "members" ? 1 : 0;
    const leaving  = activeTab === "members" ? 0 : 1;
    const inEl  = searchRefs?.current?.[entering];
    const outEl = searchRefs?.current?.[leaving];

    if (outEl) {
      gsap.to(outEl, { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" });
      outEl.style.pointerEvents = "none";
    }
    if (inEl) {
      gsap.fromTo(inEl,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.45, ease: "power2.out", delay: 0.2,
          onComplete: () => { inEl.style.pointerEvents = "all"; }
        }
      );
    }

    prevTab.current = activeTab;
  }, [activeTab]);
}

// ─── Tab flash effect on click ────────────────────────────────────────────────

function useTabFlash(btnRefs) {
  return (idx) => {};
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Hero() {
  const [activeTab, setActiveTab] = useState("tournaments");
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [showMemberModal, setShowMemberModal]         = useState(false);
  const [memberRefreshKey, setMemberRefreshKey]       = useState(0);
  const [tournamentSearch, setTournamentSearch]       = useState("");
  const [memberSearch, setMemberSearch]               = useState("");
  const { admin: isAdmin } = useStateContext();

  const canvasRef        = useRef(null);
  const cornersRef       = useRef([]);
  const hRulesRef        = useRef([]);
  const vRulesRef        = useRef([]);
  const ringRefs         = useRef([]);
  const centerDiamondRef = useRef(null);
  const medalPath = useRef(null); // unused, kept for hook compat
  const trackRef         = useRef(null);
  const tabBtnRefs       = useRef([]);
  const searchRefs         = useRef([]);
  const tournamentsGridRef = useRef(null);

  useCanvasSystem(canvasRef);
  useTabSlide(trackRef, activeTab, searchRefs);
  const flashTab = useTabFlash(tabBtnRefs);

  useEffect(() => {
    centerDiamondRef.current = document.getElementById("centerDiamond");
  }, []);

  useEntranceAnims({
    corners:       cornersRef,
    hRules:        hRulesRef,
    vRules:        vRulesRef,
    rings:         ringRefs,
    centerDiamond: centerDiamondRef,
    medalPath:     medalPath,
    searchBars:    searchRefs,
  });

  const handleTab = (tab, idx) => {
    if (tab === activeTab) return;
    flashTab(idx);
    setActiveTab(tab);
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

      {/* ── tab wings ── */}
      <TabBar>
        <TabSplitter>
          <SplitterLine $h={12} $op={0.6} />
          <SplitterDiamond />
          <SplitterLine $h={12} $op={0.6} />
        </TabSplitter>

        <TabWing $left
          ref={el => { tabBtnRefs.current[0] = el; }}
          onClick={() => handleTab("tournaments", 0)}
        >
          <TabDot $active={activeTab === "tournaments"} />
          <TabLabel $active={activeTab === "tournaments"}>Tournaments</TabLabel>
          <TabUnderline $active={activeTab === "tournaments"} />
        </TabWing>

        <TabWing
          ref={el => { tabBtnRefs.current[1] = el; }}
          onClick={() => handleTab("members", 1)}
        >
          <TabDot $active={activeTab === "members"} />
          <TabLabel $active={activeTab === "members"}>Members</TabLabel>
          <TabUnderline $active={activeTab === "members"} />
        </TabWing>
      </TabBar>

      {/* ── sliding content ── */}
      <ContentArea>
        <SlideTrack ref={trackRef}>
          {/* Tournaments panel */}
          <TabPanel style={{ justifyContent: "flex-start", paddingTop: "90px", gap: "0", alignItems: "center", padding: "90px 5% 48px" }}>
            <SectionTitle>Active Tournaments</SectionTitle>
            <TournamentGrid tournamentsRef={tournamentsGridRef} searchQuery={tournamentSearch} />
          </TabPanel>

{/* Members panel */}
<TabPanel style={{ justifyContent: "flex-start", paddingTop: "90px", alignItems: "center", padding: "90px 5% 48px" }}>
  <SectionTitle>Guild Members</SectionTitle>
  <MemberGrid refreshKey={memberRefreshKey} onRefresh={() => setMemberRefreshKey(k => k + 1)} searchQuery={memberSearch} />
</TabPanel>
        </SlideTrack>
      </ContentArea>
    {/* ── modals ── */}
      {showTournamentModal && (
        <AddTournamentModal
          onClose={() => setShowTournamentModal(false)}
          onAdded={() => { setShowTournamentModal(false); }}
        />
      )}
      {showMemberModal && (
        <AddMemberModal
          onClose={() => setShowMemberModal(false)}
          onAdded={() => { setMemberRefreshKey(k => k + 1); }}
        />
      )}

    {/* ── floating search bars ── */}
      <SearchWrap ref={el => { searchRefs.current[0] = el; }}>
        <SearchOuter>
          <SearchIcon>
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#c8aa6e" strokeWidth="1"/>
              <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#c8aa6e" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </SearchIcon>
          <SearchInput
            placeholder="Search Tournaments..."
            value={tournamentSearch}
            onChange={e => setTournamentSearch(e.target.value)}
          />
        </SearchOuter>
        <SearchUnderline />
        {isAdmin && (
          <PlusBtn onClick={() => setShowTournamentModal(true)}>+</PlusBtn>
        )}
      </SearchWrap>

      <SearchWrap ref={el => { searchRefs.current[1] = el; }} style={{ top: "78px" }}>
        <SearchOuter>
          <SearchIcon>
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#c8aa6e" strokeWidth="1"/>
              <line x1="10.5" y1="10.5" x2="14.5" y2="14.5" stroke="#c8aa6e" strokeWidth="1" strokeLinecap="round"/>
            </svg>
          </SearchIcon>
          <SearchInput
            placeholder="Search Members..."
            value={memberSearch}
            onChange={e => setMemberSearch(e.target.value)}
          />
        </SearchOuter>
        <SearchUnderline />
        {isAdmin && (
          <PlusBtn onClick={() => setShowMemberModal(true)}>+</PlusBtn>
        )}
      </SearchWrap>

    </HeroRoot>
  );
}