"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes, css } from "styled-components";
import gsap from "gsap";
import { useStateContext } from "@/context/StateContext";
import {
  BracketView,
  generateDoubleElimBracket,
  generateSingleElimBracket,
  generateSwissBracket,
  PickWinnerModal,
} from "@/components/tournamentslive/tournament-systems";
// ─── CSS keyframes ────────────────────────────────────────────────────────────

const hexPulse = keyframes`
  0%, 100% { opacity: 0.022; }
  50%       { opacity: 0.048; }
`;

const slowVignette = keyframes`
  0%, 100% { opacity: 0.9; }
  50%       { opacity: 1;   }
`;

const modalBackdropIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const modalSlideIn = keyframes`
  from { opacity: 0; transform: translateY(28px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

const scanPulse = keyframes`
  0%, 100% { opacity: 0; }
  50%       { opacity: 1; }
`;

const cardShimmer = keyframes`
  0%   { transform: translateX(-120%) skewX(-18deg); }
  100% { transform: translateX(220%)  skewX(-18deg); }
`;

const runeRing = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const runeRingReverse = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(-360deg); }
`;

const cardGlow = keyframes`
  0%,100% { box-shadow: 0 0 30px rgba(200,170,110,0.3), 0 0 80px rgba(200,170,110,0.1); }
  50%      { box-shadow: 0 0 60px rgba(200,170,110,0.6), 0 0 120px rgba(200,170,110,0.25), 0 0 200px rgba(200,170,110,0.08); }
`;

const shimmerSweep = keyframes`
  0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
  30%  { opacity: 1; }
  100% { transform: translateX(200%)  skewX(-15deg); opacity: 0; }
`;

const hexBackGlow = keyframes`
  0%,100% { opacity: 0.18; filter: blur(0px); }
  50%      { opacity: 0.55; filter: blur(1px); }
`;

const circuitPulse = keyframes`
  0%,100% { stroke-dashoffset: 200; opacity: 0.25; }
  50%      { stroke-dashoffset: 0;   opacity: 0.75; }
`;

const questionFlicker = keyframes`
  0%,100% { text-shadow: 0 0 18px rgba(200,170,110,0.7), 0 0 40px rgba(200,170,110,0.3); opacity: 0.85; }
  33%      { text-shadow: 0 0 40px rgba(200,170,110,1.0), 0 0 80px rgba(200,170,110,0.5), 0 0 120px rgba(200,170,110,0.2); opacity: 1; }
  66%      { text-shadow: 0 0 10px rgba(200,170,110,0.4), 0 0 20px rgba(200,170,110,0.15); opacity: 0.7; }
`;

const orbPulse = keyframes`
  0%,100% { transform: scale(1);    opacity: 0.5; }
  50%      { transform: scale(1.18); opacity: 1;   }
`;

// Styled SVG paths with animations baked in
const AnimatedPathPulse3s = styled.path`
  animation: ${circuitPulse} 3s ease-in-out infinite;
`;

const AnimatedPathPulse3s06 = styled.path`
  animation: ${circuitPulse} 3s ease-in-out infinite 0.6s;
`;

const AnimatedPathPulse34s03 = styled.path`
  animation: ${circuitPulse} 3.4s ease-in-out infinite 0.3s;
`;

const AnimatedPathPulse34s11 = styled.path`
  animation: ${circuitPulse} 3.4s ease-in-out infinite 1.1s;
`;

const AnimatedPathPulse4s02 = styled.path`
  animation: ${circuitPulse} 4s ease-in-out infinite 0.2s;
`;

const AnimatedPathPulse4s08 = styled.path`
  animation: ${circuitPulse} 4s ease-in-out infinite 0.8s;
`;

const AnimatedPathPulse4s14 = styled.path`
  animation: ${circuitPulse} 4s ease-in-out infinite 1.4s;
`;

const AnimatedPathPulse4s20 = styled.path`
  animation: ${circuitPulse} 4s ease-in-out infinite 2.0s;
`;

const AnimatedCircleOrb = styled.circle`
  animation: ${orbPulse} 2s ease-in-out infinite;
`;

const AnimatedCircleOrb05 = styled.circle`
  animation: ${orbPulse} 2s ease-in-out infinite 0.5s;
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
  width: clamp(55px, 8vw, 90px);
  height: clamp(55px, 8vw, 90px);
  pointer-events: none;
  z-index: 4;
  opacity: 0;
  ${p => p.$tl && css`top: 16px; left: 16px;`}
  ${p => p.$tr && css`top: 16px; right: 16px; transform: scaleX(-1);`}
  ${p => p.$bl && css`bottom: 16px; left: 16px; transform: scaleY(-1);`}
  ${p => p.$br && css`bottom: 16px; right: 16px; transform: scale(-1);`}

  @media (max-width: 480px) {
    ${p => p.$tl && css`top: 10px; left: 10px;`}
    ${p => p.$tr && css`top: 10px; right: 10px; transform: scaleX(-1);`}
    ${p => p.$bl && css`bottom: 10px; left: 10px; transform: scaleY(-1);`}
    ${p => p.$br && css`bottom: 10px; right: 10px; transform: scale(-1);`}
  }
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
  height: clamp(46px, 8vw, 56px);
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
  min-height: clamp(36px, 7vw, 46px);
  width: clamp(120px, 20vw, 280px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
  padding: clamp(6px, 1.5vw, 10px) clamp(16px, 4vw, 32px);

  background: linear-gradient(180deg, #0b0c11 0%, #0e1018 60%, rgba(11,12,17,0.55) 100%);
  clip-path: polygon(22px 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0% 50%);

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

const BackLabel = styled.span`
  position: relative;
  z-index: 2;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.55rem, 1.4vw, 0.85rem);
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

// ─── Phase navigation ─────────────────────────────────────────────────────────

const PhaseContainer = styled.div`
  position: absolute;
  top: clamp(58px, 10vw, 80px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  display: flex;
  align-items: center;
  gap: clamp(6px, 2.5vw, 40px);
  width: 100%;
  justify-content: center;
  padding: 0 12px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    top: 56px;
    gap: 4px;
  }
`;

const PhaseNavBtn = styled.button`
  height: clamp(30px, 6vw, 40px);
  width: clamp(72px, 16vw, 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  background: linear-gradient(180deg, #0b0c11 0%, #0e1018 60%, rgba(11,12,17,0.55) 100%);
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%);

  border: none;
  cursor: pointer;
  outline: none;
  pointer-events: all;
  overflow: hidden;
  position: relative;

  font-family: 'Cinzel', serif;
  font-size: clamp(0.48rem, 1.3vw, 0.75rem);
  font-weight: 600;
  letter-spacing: clamp(0.04em, 0.2vw, 0.1em);
  text-transform: uppercase;
  color: rgba(200,170,110,0.7);
  transition: color 0.3s ease, text-shadow 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(60deg,  rgba(200,170,110,0.018) 0, transparent 1px, transparent 15px),
      repeating-linear-gradient(-60deg, rgba(200,170,110,0.018) 0, transparent 1px, transparent 15px);
    pointer-events: none;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.3) 30%, rgba(200,170,110,0.3) 70%, transparent);
    pointer-events: none;
    z-index: 0;
  }

  span { position: relative; z-index: 2; }

  &:hover {
    color: #f0e6d2;
    text-shadow: 0 0 12px rgba(200,170,110,0.7), 0 0 20px rgba(200,170,110,0.35);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    &:hover { color: rgba(200,170,110,0.7); text-shadow: none; }
  }

  @media (max-width: 400px) {
    width: clamp(58px, 20vw, 80px);
    font-size: 0.44rem;
    letter-spacing: 0.02em;
  }
`;

const PhaseTabsContainer = styled.div`
  display: flex;
  gap: clamp(4px, 1.5vw, 12px);
  align-items: center;
  flex-shrink: 0;
`;

const PhaseTab = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(3px, 1vw, 6px);
  min-width: clamp(44px, 9vw, 80px);
  font-family: 'Cinzel', serif;
  font-size: clamp(0.48rem, 1.1vw, 0.7rem);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  position: relative;
`;

const PhaseTabCircle = styled.div`
  width: clamp(22px, 4.5vw, 32px);
  height: clamp(22px, 4.5vw, 32px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(200,170,110,0.3);
  transition: all 0.3s ease;
  cursor: default;

  ${p => p.$active && css`
    border-color: #c8aa6e;
    background: rgba(200,170,110,0.15);
    box-shadow: 0 0 16px rgba(200,170,110,0.4);
    span { color: #f0e6d2; text-shadow: 0 0 8px rgba(200,170,110,0.6); }
  `}

  span {
    color: rgba(200,170,110,0.6);
    font-size: clamp(0.55rem, 1.3vw, 0.75rem);
    font-weight: 700;
    transition: color 0.3s ease, text-shadow 0.3s ease;
  }
`;

const PhaseTabLabel = styled.span`
  color: ${p => p.$active ? '#f0e6d2' : 'rgba(200,170,110,0.6)'};
  transition: color 0.3s ease;

  @media (max-width: 400px) {
    display: none;
  }
`;

// ─── Phase content ────────────────────────────────────────────────────────────

const PhaseContentContainer = styled.div`
  position: relative;
  z-index: 10;
  width: 95%;
  max-width: 1200px;
  margin-top: clamp(118px, 18vw, 160px);
  padding: clamp(14px, 3.5vw, 40px);

  @media (max-width: 600px) {
    width: 100%;
    padding: 10px;
    margin-top: 118px;
  }
`;

const TopActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 16px);
  flex-wrap: wrap;
`;

const AddTeamsBtn = styled.button`
  height: clamp(38px, 7vw, 50px);
  width: clamp(110px, 22vw, 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #0b0c11 0%, #0e1018 60%, rgba(11,12,17,0.55) 100%);
  clip-path: polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%);
  border: none;
  cursor: pointer;
  outline: none;
  pointer-events: all;
  overflow: hidden;
  position: relative;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.6rem, 1.5vw, 0.85rem);
  font-weight: 600;
  letter-spacing: clamp(0.06em, 0.3vw, 0.12em);
  text-transform: uppercase;
  color: rgba(200,170,110,0.8);
  transition: color 0.3s ease, text-shadow 0.3s ease;

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
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.3) 30%, rgba(200,170,110,0.3) 70%, transparent);
    pointer-events: none;
    z-index: 0;
  }

  span { position: relative; z-index: 2; }

  &:hover {
    color: #f0e6d2;
    text-shadow: 0 0 12px rgba(200,170,110,0.7), 0 0 20px rgba(200,170,110,0.35);
  }
`;

const ParticipantsBtn = styled(AddTeamsBtn)``;

const TeamsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(clamp(140px, 28vw, 200px), 1fr));
  gap: clamp(10px, 2.5vw, 24px);
  margin-top: clamp(18px, 4vw, 40px);
`;

const TeamCard = styled.div`
  position: relative;
  background: linear-gradient(135deg, rgba(11,12,17,0.97) 0%, rgba(15,17,25,0.93) 100%);
  border: 1px solid rgba(200,170,110,0.2);
  clip-path: polygon(
    14px 0%, calc(100% - 14px) 0%, 100% 14px,
    100% calc(100% - 14px), calc(100% - 14px) 100%,
    14px 100%, 0% calc(100% - 14px), 0% 14px
  );
  overflow: hidden;
  transition: border-color 0.35s ease;
  opacity: 0;
  transform: translateY(28px);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      60deg, rgba(200,170,110,0.01) 0, transparent 1px, transparent 18px
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

const TeamCardScan = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.5), transparent);
  animation: ${scanPulse} 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 2;
`;

const TeamCardImageWrapper = styled.div`
  position: relative;
  overflow: hidden;
  height: clamp(90px, 18vw, 160px);
  border-bottom: 1px solid rgba(200,170,110,0.15);

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 60%, rgba(8,9,14,0.5) 85%, rgba(8,9,14,0.88) 100%);
    pointer-events: none;
    z-index: 1;
  }
`;

const TeamCardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(0.06) brightness(0.93) contrast(1.04);
  transition: transform 0.5s ease, filter 0.4s ease;

  ${TeamCard}:hover & {
    transform: scale(1.05);
    filter: sepia(0) brightness(1.0) contrast(1.06);
  }
`;

const TeamCardEditBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  background: rgba(4,5,10,0.78);
  border: 1px solid rgba(200,170,110,0.4);
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  svg {
    width: 13px;
    height: 13px;
    stroke: rgba(200,170,110,0.7);
    transition: stroke 0.2s ease;
  }

  &:hover {
    background: rgba(200,170,110,0.16);
    border-color: rgba(200,170,110,0.8);
    box-shadow: 0 0 10px rgba(200,170,110,0.3);
    svg { stroke: #f0e6d2; }
  }

  &:active { transform: scale(0.93); }
`;

const TeamCardDeleteBtn = styled.button`
  position: absolute;
  top: 8px;
  right: 44px;
  width: 28px;
  height: 28px;
  background: rgba(4,5,10,0.78);
  border: 1px solid rgba(200,80,80,0.35);
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  svg {
    width: 13px;
    height: 13px;
    stroke: rgba(200,80,80,0.65);
    transition: stroke 0.2s ease;
  }

  &:hover {
    background: rgba(200,80,80,0.18);
    border-color: rgba(200,80,80,0.8);
    box-shadow: 0 0 10px rgba(200,80,80,0.3);
    svg { stroke: #ff9999; }
  }

  &:active { transform: scale(0.93); }
`;

const DeleteConfirmBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 400;
  background: rgba(2,3,6,0.88);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${modalBackdropIn} 0.2s ease forwards;
`;

const DeleteConfirmBox = styled.div`
  position: relative;
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(18,10,10,0.97) 100%);
  border: 1px solid rgba(200,80,80,0.35);
  clip-path: polygon(14px 0%, calc(100% - 14px) 0%, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0% calc(100% - 14px), 0% 14px);
  width: clamp(260px, 88vw, 380px);
  padding: clamp(18px, 4vw, 28px) clamp(14px, 3vw, 24px) clamp(14px, 3vw, 22px);
  animation: ${modalSlideIn} 0.25s cubic-bezier(0.22,1,0.36,1) forwards;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,80,80,0.008) 0, transparent 1px, transparent 18px);
    pointer-events: none;
    z-index: 0;
  }
`;

const DeleteConfirmTitle = styled.h2`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.55rem, 1.4vw, 0.65rem);
  font-weight: 700;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(220,100,100,0.9);
  margin: 0 0 8px;
  text-align: center;
`;

const DeleteConfirmText = styled.p`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.48rem, 1.2vw, 0.55rem);
  letter-spacing: 0.15em;
  color: rgba(200,170,110,0.55);
  text-align: center;
  margin: 0 0 22px;
  line-height: 1.7;
`;

const DeleteConfirmButtons = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  position: relative;
  z-index: 1;
`;

const TeamCardContent = styled.div`
  padding: clamp(8px, 2vw, 16px);
  position: relative;
  z-index: 3;
`;

const TeamCardName = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.72rem, 1.8vw, 0.92rem);
  font-weight: 600;
  color: #f0e6d2;
  margin-bottom: clamp(6px, 1.5vw, 12px);
  text-align: center;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  word-break: break-word;
  text-shadow: 0 0 18px rgba(200,170,110,0.2);
`;

const TeamCardMembers = styled.div`
  min-height: 40px;
  max-height: 100px;
  overflow-y: auto;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(200,170,110,0.04);
  border: 1px solid rgba(200,170,110,0.1);
  clip-path: polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px);

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  font-size: clamp(0.6rem, 1.4vw, 0.75rem);
  color: rgba(200,170,110,0.8);
  padding: 4px 0;
  border-bottom: 1px solid rgba(200,170,110,0.05);
  font-family: 'Cinzel', serif;
  letter-spacing: 0.08em;
  text-shadow: 0 0 8px rgba(200,170,110,0.4);

  &:last-child { border-bottom: none; }
`;

const MemberAvatar = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 6px;
  background: rgba(240,230,210,0.3);
`;

const RemoveBtn = styled.span`
  margin-left: auto;
  cursor: pointer;
  font-size: 0.75rem;
  color: rgba(200,170,110,0.7);
  padding: 0 6px;
  user-select: none;
  transition: all 0.3s ease;
  &:hover {
    color: rgba(200,170,110,1);
    transform: scale(1.2);
    text-shadow: 0 0 6px rgba(200,170,110,0.6);
  }
`;

const TeamCardButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const TeamCardBtn = styled.button`
  flex: 1;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.44rem, 1.1vw, 0.52rem);
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.85);
  background: transparent;
  border: 1px solid rgba(200,170,110,0.3);
  padding: clamp(5px, 1.2vw, 8px) 12px;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
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

  &:active { transform: scale(0.96); }
`;

// ─── Modal — shared backdrop ──────────────────────────────────────────────────

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(2,3,6,0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${modalBackdropIn} 0.25s ease forwards;
  padding: 16px;
  box-sizing: border-box;
`;

// ─── Modal — Add Teams ────────────────────────────────────────────────────────

const ModalBox = styled.div`
  position: relative;
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(14,15,24,0.97) 100%);
  border: 1px solid rgba(200,170,110,0.3);
  clip-path: polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0% calc(100% - 18px), 0% 18px);
  width: clamp(280px, 92vw, 440px);
  padding: clamp(20px, 5vw, 32px) clamp(16px, 4vw, 28px) clamp(16px, 4vw, 26px);
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
  z-index: 5;
`;

const ModalTitle = styled.h2`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.58rem, 1.4vw, 0.7rem);
  font-weight: 700;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.9);
  margin: 0 0 16px;
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
  font-size: clamp(0.38rem, 1vw, 0.46rem);
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.5);
  margin-bottom: 7px;
`;

const ModalInput = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.055);
  border: 1px solid rgba(200,170,110,0.22);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.6rem, 1.4vw, 0.72rem);
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
  flex-wrap: wrap;
`;

const ModalBtn = styled.button`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.46rem, 1.1vw, 0.55rem);
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  padding: clamp(7px, 1.5vw, 9px) clamp(14px, 3.5vw, 22px);
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

// ─── Modal — Add Members checkbox list ───────────────────────────────────────

const MemberCheckboxContainer = styled.div`
  position: relative;
  z-index: 1;
  max-height: clamp(160px, 35vh, 240px);
  overflow-y: auto;
  margin: 0 0 4px;
  border: 1px solid rgba(200,170,110,0.12);
  background: rgba(200,170,110,0.03);
  clip-path: polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px);

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const MemberCheckboxRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.2s ease;
  border-bottom: 1px solid rgba(200,170,110,0.06);

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(200,170,110,0.07); }
`;

const MemberCheckbox = styled.div`
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

const MemberName = styled.span`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.5rem, 1.2vw, 0.6rem);
  letter-spacing: 0.15em;
  color: ${p => p.$checked ? "#f0e6d2" : "rgba(200,170,110,0.55)"};
  text-transform: uppercase;
  transition: color 0.2s ease;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SelectedCount = styled.div`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.42rem;
  letter-spacing: 0.3em;
  color: rgba(200,170,110,0.35);
  text-align: right;
  margin: 5px 0 0;
  text-transform: uppercase;
`;

// ─── Participants Split Modal ─────────────────────────────────────────────────

const SplitModalBox = styled.div`
  position: relative;
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(14,15,24,0.97) 100%);
  border: 1px solid rgba(200,170,110,0.3);
  clip-path: polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0% calc(100% - 18px), 0% 18px);
  width: clamp(300px, 96vw, 820px);
  max-height: 92vh;
  overflow-y: auto;
  padding: clamp(16px, 4vw, 32px) clamp(12px, 3vw, 28px) clamp(14px, 3vw, 26px);
  animation: ${modalSlideIn} 0.3s cubic-bezier(0.22,1,0.36,1) forwards;

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,170,110,0.012) 0, transparent 1px, transparent 18px);
    pointer-events: none;
    z-index: 0;
  }
`;

const SplitBody = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  gap: 0 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 20px 0;
  }
`;

const SplitDivider = styled.div`
  background: linear-gradient(180deg, transparent, rgba(200,170,110,0.25) 30%, rgba(200,170,110,0.25) 70%, transparent);
  width: 1px;

  @media (max-width: 560px) {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.25) 30%, rgba(200,170,110,0.25) 70%, transparent);
  }
`;

const SplitPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
`;

const SplitPanelTitle = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.42rem, 1vw, 0.5rem);
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.6);
  text-align: center;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(200,170,110,0.1);
`;

const SplitSearchInput = styled.input`
  width: 100%;
  background: rgba(200,170,110,0.045);
  border: 1px solid rgba(200,170,110,0.18);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.52rem, 1.2vw, 0.6rem);
  letter-spacing: 0.12em;
  padding: 7px 12px;
  outline: none;
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
  box-sizing: border-box;
  transition: border-color 0.25s ease, background 0.25s ease;

  &::placeholder { color: rgba(200,170,110,0.22); }
  &:focus {
    border-color: rgba(200,170,110,0.5);
    background: rgba(200,170,110,0.08);
  }
`;

const SplitList = styled.div`
  height: clamp(160px, 32vh, 280px);
  overflow-y: auto;
  border: 1px solid rgba(200,170,110,0.1);
  background: rgba(200,170,110,0.025);
  clip-path: polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px);
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`;

const SplitRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(200,170,110,0.05);
  transition: background 0.2s ease;

  &:last-child { border-bottom: none; }
  &:hover { background: rgba(200,170,110,0.06); }
`;

const SplitAvatar = styled.img`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  background: rgba(200,170,110,0.1);
`;

const SplitName = styled.span`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.5rem, 1.1vw, 0.58rem);
  letter-spacing: 0.1em;
  color: rgba(200,170,110,0.8);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-transform: uppercase;
`;

const SplitActionBtn = styled.button`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid ${p => p.$remove ? "rgba(200,80,80,0.5)" : "rgba(200,170,110,0.5)"};
  background: ${p => p.$remove ? "rgba(200,80,80,0.08)" : "rgba(200,170,110,0.08)"};
  color: ${p => p.$remove ? "rgba(220,100,100,0.9)" : "rgba(200,170,110,0.9)"};
  font-size: 0.75rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background: ${p => p.$remove ? "rgba(200,80,80,0.22)" : "rgba(200,170,110,0.22)"};
    border-color: ${p => p.$remove ? "rgba(200,80,80,0.9)" : "rgba(200,170,110,0.9)"};
    transform: scale(1.15);
  }
  &:active { transform: scale(0.92); }
`;

const SplitCount = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.38rem;
  letter-spacing: 0.3em;
  color: rgba(200,170,110,0.3);
  text-align: right;
  text-transform: uppercase;
`;

// ─── Random Reveal Overlay ────────────────────────────────────────────────────

const RevealRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: all;
`;

const RevealDarkBg = styled.div`
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,170,110,0.05) 0%, rgba(1,2,4,0.97) 70%);
  opacity: 0;
`;

const RevealParticleCanvas = styled.canvas`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
`;

const RevealRingOuter = styled.div`
  position: absolute;
  width: clamp(260px, 55vw, 520px);
  height: clamp(260px, 55vw, 520px);
  border-radius: 50%;
  border: 1px solid rgba(200,170,110,0.1);
  opacity: 0;
  animation: ${runeRing} 18s linear infinite;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RevealRingMid = styled.div`
  position: absolute;
  width: clamp(180px, 38vw, 360px);
  height: clamp(180px, 38vw, 360px);
  border-radius: 50%;
  border: 1px solid rgba(200,170,110,0.14);
  opacity: 0;
  animation: ${runeRingReverse} 12s linear infinite;
`;

const RevealRingInner = styled.div`
  position: absolute;
  width: clamp(120px, 25vw, 240px);
  height: clamp(120px, 25vw, 240px);
  border-radius: 50%;
  border: 1px solid rgba(200,170,110,0.22);
  opacity: 0;
  animation: ${runeRing} 7s linear infinite;
`;

const RevealRuneOnRing = styled.span`
  position: absolute;
  font-family: serif;
  font-size: clamp(0.55rem, 1.2vw, 0.75rem);
  color: rgba(200,170,110,0.5);
  pointer-events: none;
  user-select: none;
`;

// ─── Reveal Card — perspective wrapper ────────────────────────────────────────

const RevealCardScene = styled.div`
  position: relative;
  width: clamp(180px, 46vw, 260px);
  height: clamp(228px, 58vw, 330px);
  perspective: 900px;
  opacity: 0;
  overflow: visible;
  background: transparent;
  isolation: isolate;
`;

const RevealCardInner = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: ${cardGlow} 2.2s ease-in-out infinite;
  will-change: transform;
`;

// ─── Shared face base ─────────────────────────────────────────────────────────

const cardFaceBase = css`
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 4px;
`;

// ─── BACK face — hextech mystery ─────────────────────────────────────────────

const RevealCardBack = styled.div`
  ${cardFaceBase}
  background: linear-gradient(160deg, rgba(6,7,14,1) 0%, rgba(12,14,24,1) 100%);
  border: 1px solid rgba(200,170,110,0.5);
    transform: rotateY(0deg);
  backface-visibility: visible;
  -webkit-backface-visibility: visible;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`;

const BackHexGrid = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.13;
  pointer-events: none;
`;

const BackCircuitSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
`;

const BackCenterOrb = styled.div`
  position: absolute;
  width: clamp(60px, 14vw, 90px);
  height: clamp(60px, 14vw, 90px);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(200,170,110,0.22) 0%, rgba(200,170,110,0.06) 50%, transparent 75%);
  animation: ${orbPulse} 2.4s ease-in-out infinite;
  pointer-events: none;
`;

const BackQuestion = styled.div`
  position: relative;
  font-family: 'Cinzel', serif;
  font-size: clamp(2.8rem, 8vw, 4.2rem);
  font-weight: 900;
  color: rgba(200,170,110,0.88);
  animation: ${questionFlicker} 3.1s ease-in-out infinite;
  z-index: 5;
  line-height: 1;
  user-select: none;
  pointer-events: none;
`;

const RevealLabel = styled.div`
  position: absolute;
  bottom: clamp(14px, 3vw, 28px);
  left: 0; right: 0;
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.3rem, 0.7vw, 0.38rem);
  letter-spacing: 0.65em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.35);
  pointer-events: none;
`;

const BackTopLabel = styled.div`
  position: absolute;
  top: clamp(12px, 2.5vw, 22px);
  left: 0; right: 0;
  text-align: center;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.3rem, 0.7vw, 0.38rem);
  letter-spacing: 0.65em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.35);
  pointer-events: none;
`;

const BackGlowLine = styled.div`
  position: absolute;
  left: 14%; right: 14%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.6), transparent);
  animation: ${scanPulse} 2.6s ease-in-out infinite;
  pointer-events: none;
`;

const BackCornerGem = styled.div`
  position: absolute;
  width: clamp(5px, 1.2vw, 8px);
  height: clamp(5px, 1.2vw, 8px);
  background: rgba(200,170,110,0.55);
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  animation: ${hexBackGlow} 2s ease-in-out infinite;
  pointer-events: none;
`;

// ─── FRONT face — member reveal ───────────────────────────────────────────────

const RevealCardFront = styled.div`
  ${cardFaceBase}
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(16,18,28,0.98) 100%);
  border: 1px solid rgba(200,170,110,0.45);
  transform: rotateY(180deg);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  flex-direction: column;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,170,110,0.018) 0, transparent 1px, transparent 14px);
    pointer-events: none;
    z-index: 0;
    clip-path: inherit;
  }
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(200,170,110,0.06) 50%, transparent 70%);
    animation: ${shimmerSweep} 3s ease-in-out infinite 1.5s;
    pointer-events: none;
    z-index: 1;
    clip-path: inherit;
  }
`;

const RevealCardTopLine = styled.div`
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.8), transparent);
  animation: ${scanPulse} 2s ease-in-out infinite;
  z-index: 5;
`;

const RevealCardImageWrap = styled.div`
  position: relative;
  width: 100%;
  height: clamp(160px, 42vw, 270px);
  overflow: hidden;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(8,9,14,0.97) 100%);
    z-index: 1;
  }
`;

const RevealCardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: sepia(0.08) brightness(0.88) contrast(1.06);
  opacity: 0;
  display: block;
`;

const RevealCardContent = styled.div`
  padding: clamp(4px, 1.2vw, 8px) clamp(8px, 2.5vw, 16px) clamp(6px, 1.5vw, 10px);
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex-shrink: 0;
`;

const RevealCardLabel = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.3rem, 0.7vw, 0.4rem);
  letter-spacing: 0.55em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.4);
  opacity: 0;
  height: 0;
  overflow: hidden;
`;

const RevealCardDivider = styled.div`
  width: 60%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.5), transparent);
  opacity: 0;
  margin: 0;
  padding: 0;
`;

const RevealCardName = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.7rem, 2.5vw, 1.0rem);
  font-weight: 700;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: #f0e6d2;
  text-align: center;
  text-shadow: 0 0 24px rgba(200,170,110,0.7), 0 0 48px rgba(200,170,110,0.3);
  opacity: 0;
  word-break: break-word;
  padding: 0 8px;
  line-height: 1.2;
`;

const RevealDismissBtn = styled.button`
  position: absolute;
  bottom: clamp(-68px, -13vw, -58px);
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-size: clamp(0.36rem, 1vw, 0.48rem);
  font-weight: 700;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.5);
  background: transparent;
  border: 1px solid rgba(200,170,110,0.2);
  padding: clamp(6px, 1.5vw, 9px) clamp(14px, 4vw, 28px);
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  cursor: pointer;
  opacity: 0;
  white-space: nowrap;
  transition: color 0.3s ease, border-color 0.3s ease, background 0.3s ease;
  z-index: 10;

  &:hover {
    color: #f0e6d2;
    border-color: rgba(200,170,110,0.6);
    background: rgba(200,170,110,0.07);
  }
`;

const RevealAddBtn = styled.button`
  position: absolute;
  bottom: clamp(-118px, -22vw, -100px);
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-size: clamp(0.36rem, 1vw, 0.48rem);
  font-weight: 700;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: #f0e6d2;
  background: rgba(200,170,110,0.12);
  border: 1px solid rgba(200,170,110,0.55);
  padding: clamp(6px, 1.5vw, 9px) clamp(14px, 4vw, 28px);
  clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%);
  cursor: pointer;
  opacity: 0;
  white-space: nowrap;
  transition: background 0.3s ease, border-color 0.3s ease;
  z-index: 10;

  &:hover {
    background: rgba(200,170,110,0.22);
    border-color: rgba(200,170,110,0.85);
  }
`;

// ─── Full-screen shimmer flash ────────────────────────────────────────────────

const RevealShimmerFlash = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(105deg,
    transparent 15%,
    rgba(200,170,110,0.12) 38%,
    rgba(240,230,210,0.28) 50%,
    rgba(200,170,110,0.12) 62%,
    transparent 85%
  );
  transform: translateX(-120%) skewX(-12deg);
  pointer-events: none;
  z-index: 600;
`;

// ─── Results Styled Components ────────────────────────────────────────────────

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: clamp(220px, 28vw, 340px) 1fr;
  gap: clamp(14px, 3vw, 28px);
  align-items: start;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ResultsPanel = styled.div`
  background: linear-gradient(160deg, rgba(10,11,18,0.97) 0%, rgba(14,15,24,0.95) 100%);
  border: 1px solid rgba(200,170,110,0.2);
  clip-path: polygon(12px 0%, calc(100% - 12px) 0%, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0% calc(100% - 12px), 0% 12px);
  padding: clamp(14px, 3vw, 28px) clamp(12px, 2.5vw, 24px);
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

const ResultsPanelTitle = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.42rem, 1vw, 0.5rem);
  letter-spacing: 0.5em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.55);
  text-align: center;
  margin-bottom: clamp(12px, 3vw, 20px);
  padding-bottom: clamp(8px, 2vw, 14px);
  border-bottom: 1px solid rgba(200,170,110,0.12);
  position: relative;
  z-index: 1;
`;

const LeaderboardRow = styled.div`
  display: flex;
  align-items: center;
  gap: clamp(6px, 2vw, 12px);
  padding: clamp(7px, 1.5vw, 10px) clamp(8px, 2vw, 12px);
  margin-bottom: clamp(4px, 1vw, 8px);
  background: ${p => p.$rank === 1
    ? 'rgba(200,170,110,0.1)'
    : p.$rank === 2
      ? 'rgba(180,180,200,0.06)'
      : p.$rank === 3
        ? 'rgba(180,120,60,0.07)'
        : 'rgba(200,170,110,0.025)'};
  border: 1px solid ${p => p.$rank === 1
    ? 'rgba(200,170,110,0.4)'
    : p.$rank === 2
      ? 'rgba(180,180,200,0.2)'
      : p.$rank === 3
        ? 'rgba(180,120,60,0.25)'
        : 'rgba(200,170,110,0.1)'};
  clip-path: polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px);
  position: relative;
  z-index: 1;
  transition: border-color 0.25s ease;
`;

const LeaderboardRank = styled.div`
  font-family: 'Cinzel', serif;
  font-size: ${p => p.$rank <= 3 ? '1.1rem' : '0.65rem'};
  font-weight: 700;
  min-width: 28px;
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
  width: clamp(24px, 5vw, 34px);
  height: clamp(24px, 5vw, 34px);
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(200,170,110,0.25);
  flex-shrink: 0;
`;

const LeaderboardTeamName = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.5rem, 1.2vw, 0.62rem);
  font-weight: 600;
  letter-spacing: 0.08em;
  color: ${p => p.$rank === 1 ? '#f0e6d2' : 'rgba(200,170,110,0.75)'};
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-shadow: ${p => p.$rank === 1 ? '0 0 12px rgba(200,170,110,0.4)' : 'none'};
`;

const MatchHistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: clamp(280px, 52vh, 72vh);
  overflow-y: auto;
  padding-right: 4px;
  position: relative;
  z-index: 1;

  scrollbar-width: thin;
  scrollbar-color: rgba(200,170,110,0.2) transparent;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(200,170,110,0.2); border-radius: 2px; }
`;

const MatchHistoryCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(6px, 1.5vw, 10px);
  padding: clamp(8px, 1.8vw, 14px) clamp(8px, 2vw, 16px);
  background: rgba(200,170,110,0.03);
  border: 1px solid rgba(200,170,110,0.13);
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px);
  transition: border-color 0.25s ease, background 0.25s ease;
  position: relative;

  &:hover {
    border-color: rgba(200,170,110,0.28);
    background: rgba(200,170,110,0.055);
  }
`;

const MatchTeamsDisplay = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  width: 100%;
  gap: 0;

  flex-shrink: 0;

  @media (max-width: 500px) {
    width: 100%;
    justify-content: center;
  }
`;

const MatchTeamBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;

  &:last-of-type {
    flex-direction: row-reverse;
    text-align: right;
  }
`;

const MatchTeamBlockName = styled.span`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.46rem, 1.1vw, 0.58rem);
  letter-spacing: 0.07em;
  color: ${p => p.$winner ? '#f0e6d2' : 'rgba(200,170,110,0.45)'};
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-weight: ${p => p.$winner ? '700' : '400'};
  text-shadow: ${p => p.$winner ? '0 0 12px rgba(200,170,110,0.55)' : 'none'};
`;

const MatchTeamThumb = styled.img`
  width: clamp(26px, 5vw, 34px);
  height: clamp(26px, 5vw, 34px);
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${p => p.$winner ? 'rgba(200,170,110,0.7)' : 'rgba(200,170,110,0.18)'};
  flex-shrink: 0;
  opacity: ${p => p.$winner === false ? 0.38 : 1};
  filter: ${p => p.$winner === false ? 'grayscale(0.6)' : 'none'};
  box-shadow: ${p => p.$winner ? '0 0 10px rgba(200,170,110,0.35)' : 'none'};
`;  

const MatchVsSeparator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  width: clamp(36px, 7vw, 52px);
  padding: 0 4px;
`;

const MatchVsText = styled.div`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.35rem, 0.8vw, 0.42rem);
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(200,170,110,0.5);
  text-transform: uppercase;
`;

const MatchVsLine = styled.div`
  width: 1px;
  height: 10px;
  background: rgba(200,170,110,0.2);
`;

const MatchVideoInput = styled.input`
  flex: 1;
  min-width: clamp(80px, 14vw, 120px);
  background: rgba(200,170,110,0.04);
  border: 1px solid rgba(200,170,110,0.15);
  color: #f0e6d2;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.44rem, 1vw, 0.52rem);
  letter-spacing: 0.08em;
  padding: clamp(5px, 1.2vw, 8px) clamp(8px, 1.8vw, 12px);
  outline: none;
  clip-path: polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px);
  transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
  box-sizing: border-box;

  &::placeholder { color: rgba(200,170,110,0.22); font-style: italic; }
  &:focus {
    border-color: rgba(200,170,110,0.45);
    background: rgba(200,170,110,0.08);
    box-shadow: 0 0 12px rgba(200,170,110,0.08);
  }

  @media (max-width: 500px) {
    width: 100%;
    flex: unset;
  }
`;

const MatchRoundBadge = styled.div`
  width: 100%;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.58rem, 1.3vw, 0.78rem);
  font-weight: 700;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.92);
  text-shadow: 0 0 14px rgba(200,170,110,0.65), 0 0 30px rgba(200,170,110,0.28);
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(200,170,110,0.18);
  flex-shrink: 0;
`;

const EmptyResultsHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  font-family: 'Cinzel', serif;
  font-size: clamp(0.42rem, 1vw, 0.5rem);
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.25);
  text-align: center;
  line-height: 2;
`;

const FinalizeBtn = styled.button`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.48rem, 1.3vw, 0.62rem);
  font-weight: 700;
  letter-spacing: clamp(0.15em, 0.5vw, 0.35em);
  text-transform: uppercase;
  padding: clamp(10px, 2.5vw, 14px) clamp(22px, 6vw, 48px);
  margin-top: clamp(20px, 5vw, 40px);
  clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
  cursor: pointer;
  border: 1px solid rgba(200,170,110,0.5);
  background: rgba(200,170,110,0.08);
  color: rgba(200,170,110,0.9);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  align-self: center;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.08), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }

  &:hover {
    border-color: rgba(200,170,110,0.9);
    color: #f0e6d2;
    background: rgba(200,170,110,0.14);
    box-shadow: 0 0 28px rgba(200,170,110,0.18), inset 0 0 16px rgba(200,170,110,0.06);
    &::before { transform: translateX(100%); }
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
    pointer-events: none;
  }

  &:active { transform: scale(0.97); }
`;

const FinalizeStatus = styled.p`
  font-family: 'Cinzel', serif;
  font-size: clamp(0.4rem, 1vw, 0.48rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: ${p => p.$error ? "rgba(220,100,80,0.85)" : "rgba(100,200,120,0.85)"};
  text-align: center;
  margin-top: 10px;
`;

// ─── Edit Team Modal ──────────────────────────────────────────────────────────

const EditModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(2,3,6,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(6px);
  animation: ${modalBackdropIn} 0.25s ease forwards;
  padding: 16px;
  box-sizing: border-box;
`;

const EditModalBox = styled.div`
  position: relative;
  width: clamp(280px, 92vw, 460px);
  padding: clamp(20px, 5vw, 36px) clamp(14px, 4vw, 30px) clamp(16px, 4vw, 28px);
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(14,15,24,0.97) 100%);
  border: 1px solid rgba(200,170,110,0.3);
  clip-path: polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0% calc(100% - 18px), 0% 18px);
  display: flex;
  flex-direction: column;
  gap: 0;
  z-index: 1001;
  box-shadow: 0 0 60px rgba(200,170,110,0.12), 0 20px 60px rgba(0,0,0,0.7);
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

const EditInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  position: relative;
  z-index: 1;
  margin-bottom: 14px;
`;

const EditButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  position: relative;
  z-index: 1;
  justify-content: flex-end;
  margin-top: 22px;
  flex-wrap: wrap;
`;

const RUNE_CHARS = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ"];

function RandomRevealOverlay({ member, imgSrc, onDismiss, onConfirm }) {
  const rootRef         = useRef(null);
  const darkBgRef       = useRef(null);
  const canvasRef       = useRef(null);
  const ringOuterRef    = useRef(null);
  const ringMidRef      = useRef(null);
  const ringInnerRef    = useRef(null);
  const cardSceneRef    = useRef(null); // RevealCardScene — opacity/position
  const cardRef         = useRef(null); // RevealCardInner — rotation
  const cardImgRef      = useRef(null);
  const cardLabelRef    = useRef(null);
  const cardNameRef     = useRef(null);
  const cardDividerRef  = useRef(null);
  const dismissBtnRef   = useRef(null);
  const addBtnRef       = useRef(null);
  const shimmerFlashRef = useRef(null);
  const rafRef          = useRef(null);
  const isRevealedRef   = useRef(false);
  const isDismissingRef = useRef(false);
  const hasConfirmedRef = useRef(false);
  const onConfirmRef    = useRef(onConfirm);
  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0;
    let globalAlpha = 0;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    const gold  = a => `rgba(200,170,110,${a})`;
    const cream = a => `rgba(240,230,210,${a})`;

    const orbiters = Array.from({ length: 32 }, (_, i) => ({
      angle: (i / 32) * Math.PI * 2, radius: 150 + Math.sin(i * 1.4) * 60,
      speed: (0.003 + Math.random() * 0.005) * (i % 2 === 0 ? 1 : -1),
      size: 0.7 + Math.random() * 2.4, alphaTarget: 0.45 + Math.random() * 0.5,
      alpha: 0, layer: i % 3,
    }));
    const sparks = Array.from({ length: 20 }, (_, i) => ({
      angle: (i / 20) * Math.PI * 2, radius: 110 + Math.random() * 100,
      speed: -(0.005 + Math.random() * 0.009), size: 0.3 + Math.random() * 1.4,
      alpha: 0, life: Math.random(),
    }));
    const runeParticles = Array.from({ length: 10 }, (_, i) => ({
      angle: (i / 10) * Math.PI * 2, radius: 80 + Math.random() * 40,
      speed: 0.002 + Math.random() * 0.003, alpha: 0,
      char: RUNE_CHARS[i % RUNE_CHARS.length], size: 8 + Math.random() * 6,
      floatR: 0, floatDir: Math.random() > 0.5 ? 1 : -1,
    }));

    canvas._setGlobalAlpha = v => { globalAlpha = v; };

    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (globalAlpha <= 0) { rafRef.current = requestAnimationFrame(draw); return; }
      const cx = W / 2, cy = H / 2;
      const burst = ctx.createRadialGradient(cx, cy, 0, cx, cy, 220);
      burst.addColorStop(0, gold(0.05 * globalAlpha));
      burst.addColorStop(0.4, gold(0.02 * globalAlpha));
      burst.addColorStop(1, "transparent");
      ctx.fillStyle = burst; ctx.fillRect(0, 0, W, H);

      orbiters.forEach(p => {
        p.angle += p.speed;
        p.alpha = Math.min(p.alpha + 0.015, p.alphaTarget * globalAlpha);
        const rMul = p.layer === 0 ? 1 : p.layer === 1 ? 0.7 : 0.45;
        const px = cx + Math.cos(p.angle) * p.radius * rMul;
        const py = cy + Math.sin(p.angle) * p.radius * 0.38 * rMul;
        const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 3);
        grd.addColorStop(0, cream(p.alpha)); grd.addColorStop(0.5, gold(p.alpha * 0.55)); grd.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(px, py, p.size * 3, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
      });

      sparks.forEach(p => {
        p.angle += p.speed; p.life = (p.life + 0.007) % 1;
        const la = p.life < 0.2 ? p.life / 0.2 : p.life > 0.75 ? (1 - p.life) / 0.25 : 1;
        p.alpha = la * 0.55 * globalAlpha;
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius * 0.34;
        for (let t = 5; t >= 0; t--) {
          const ta = p.angle - p.speed * t * 4;
          const tx = cx + Math.cos(ta) * p.radius, ty = cy + Math.sin(ta) * p.radius * 0.34;
          ctx.beginPath(); ctx.arc(tx, ty, p.size * Math.max(0.1, 1 - t * 0.16), 0, Math.PI * 2);
          ctx.fillStyle = gold(p.alpha * (1 - t * 0.17)); ctx.fill();
        }
      });

      runeParticles.forEach(p => {
        p.angle += p.speed; p.floatR += 0.018 * p.floatDir;
        p.alpha = Math.min(p.alpha + 0.01, 0.35 * globalAlpha);
        const r = p.radius + Math.sin(p.floatR) * 18;
        const px = cx + Math.cos(p.angle) * r, py = cy + Math.sin(p.angle) * r * 0.38;
        ctx.save(); ctx.translate(px, py); ctx.font = `${p.size}px serif`;
        ctx.fillStyle = gold(p.alpha); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(p.char, 0, 0); ctx.restore();
      });

      rafRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tl = gsap.timeline();

    // Front face is at rotateY(180deg), back at 0deg.
    // Spin: start from 0 (back visible), end at 720*N + 180 to land on front.
    // 7 full spins + 180 = 2700. Use 2700 so it lands cleanly on front face.
    const SPIN_END = 2700; // 14 full rotations + 180deg = lands on front

    tl.to(darkBgRef.current, { opacity: 1, duration: 0.55, ease: "power2.out" }, 0);
    tl.fromTo(ringOuterRef.current, { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1, duration: 0.85, ease: "back.out(1.7)" }, 0.3);
    tl.fromTo(ringMidRef.current,   { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 0.75, ease: "back.out(1.9)" }, 0.44);
    tl.fromTo(ringInnerRef.current, { opacity: 0, scale: 0.1 }, { opacity: 1, scale: 1, duration: 0.65, ease: "back.out(2.2)" }, 0.58);
    // Scene flies in, inner rotates from back face
    tl.fromTo(cardSceneRef.current, { opacity: 0, y: 200, scale: 0.6 }, { opacity: 1, y: 0, scale: 1, duration: 1.05, ease: "power4.out" }, 0.55);
    tl.fromTo(cardRef.current, { rotateY: -90 }, { rotateY: 0, duration: 1.05, ease: "power4.out" }, 0.55);
    tl.set(cardImgRef.current?.closest?.('[data-face="front"]') || cardRef.current.children[1], { visibility: 'hidden' }, 0);
    tl.set(cardImgRef.current?.closest?.('[data-face="front"]') || cardRef.current.children[1], { visibility: 'visible' }, 8.25);
    tl.to({}, { duration: 0.9, onUpdate: function() { if (canvas?._setGlobalAlpha) canvas._setGlobalAlpha(this.progress()); }, onComplete: () => { if (canvas?._setGlobalAlpha) canvas._setGlobalAlpha(1); } }, 0.6);
    tl.to(canvas, { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.6);
    // The big spin — lands on front (180deg face)
    tl.to(cardRef.current, { rotateY: SPIN_END, duration: 7.0, ease: "power2.in" }, 1.3);
    // Settle wobble
    tl.to(cardRef.current, { rotateY: SPIN_END - 15, duration: 0.09, ease: "power3.out" }, 8.3);
    tl.to(cardRef.current, { rotateY: SPIN_END + 8,  duration: 0.08, ease: "power2.inOut" }, 8.39);
    tl.to(cardRef.current, { rotateY: SPIN_END - 4,  duration: 0.07, ease: "power2.inOut" }, 8.47);
    tl.to(cardRef.current, { rotateY: SPIN_END,      duration: 0.18, ease: "elastic.out(1.8,0.4)" }, 8.54);
    // Front face content reveals
    gsap.set(cardRef.current?.children[1], { visibility: 'visible', delay: 8.2 });
    tl.to(cardImgRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" }, 8.3);
    tl.fromTo(cardLabelRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, ease: "power3.out" }, 8.6);
    tl.fromTo(cardDividerRef.current, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.5, ease: "power2.out" }, 8.75);
    tl.fromTo(cardNameRef.current, { opacity: 0, letterSpacing: "0.9em", filter: "blur(14px)", y: 8 }, { opacity: 1, letterSpacing: "0.25em", filter: "blur(0px)", y: 0, duration: 1.0, ease: "power3.out" }, 8.8);
    tl.fromTo(dismissBtnRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 9.55);
    tl.fromTo(addBtnRef.current, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 9.7);
    tl.call(() => { isRevealedRef.current = true; }, [], 9.7);

    gsap.to(cardSceneRef.current, { y: -12, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 10.2 });
    [ringOuterRef, ringMidRef, ringInnerRef].forEach((r, i) => {
      gsap.to(r.current, { opacity: 0.55 + i * 0.12, duration: 2.2 + i * 0.5, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.5 + i * 0.4 });
    });

    return () => { tl.kill(); };
  }, []);

  const triggerDismiss = () => {
    if (!isRevealedRef.current || isDismissingRef.current) return;
    isDismissingRef.current = true;
    const canvas = canvasRef.current;
    const tl = gsap.timeline({ onComplete: onDismiss });
    tl.to([addBtnRef.current, dismissBtnRef.current], { opacity: 0, y: -16, duration: 0.25, ease: "power2.in", stagger: 0.05 }, 0);
    tl.to(cardSceneRef.current, { opacity: 0, y: -50, scale: 0.88, duration: 0.45, ease: "power2.in" }, 0.08);
    tl.to([ringInnerRef.current, ringMidRef.current, ringOuterRef.current], { opacity: 0, scale: 0.35, duration: 0.38, ease: "power2.in", stagger: 0.06 }, 0.12);
    tl.to(canvas, { opacity: 0, duration: 0.3 }, 0);
    tl.to(darkBgRef.current, { opacity: 0, duration: 0.38 }, 0.18);
  };

  const triggerConfirm = () => {
    if (!isRevealedRef.current || isDismissingRef.current) return;
    isDismissingRef.current = true;
    const canvas = canvasRef.current;
    onConfirmRef.current?.();
    const tl = gsap.timeline({ onComplete: onDismiss });
    tl.fromTo(shimmerFlashRef.current, { x: "-120%", opacity: 1 }, { x: "140%", opacity: 1, duration: 0.65, ease: "power2.inOut" }, 0);
    tl.to(shimmerFlashRef.current, { opacity: 0, duration: 0.15 }, 0.6);
    tl.to([addBtnRef.current, dismissBtnRef.current], { opacity: 0, duration: 0.18 }, 0);
    tl.to(cardSceneRef.current, { scale: 1.08, filter: "brightness(2.2)", duration: 0.14, ease: "power2.out" }, 0.18);
    tl.to(cardSceneRef.current, { scale: 0, opacity: 0, y: -90, filter: "brightness(1)", duration: 0.52, ease: "back.in(2.8)" }, 0.32);
    tl.to([ringInnerRef.current, ringMidRef.current, ringOuterRef.current], { opacity: 0, scale: 1.7, duration: 0.42, ease: "power2.in", stagger: 0.05 }, 0.14);
    tl.to(canvas, { opacity: 0, duration: 0.32 }, 0.12);
    tl.to(darkBgRef.current, { opacity: 0, duration: 0.42 }, 0.28);
  };

  const outerRunes = RUNE_CHARS.slice(0, 12).map((ch, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { ch, x: 50 + 48 * Math.cos(angle), y: 50 + 48 * Math.sin(angle) };
  });

  // Hextech hex grid path helper
  const hexPath = (cx, cy, r) => {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    });
    return `M${pts.join("L")}Z`;
  };
  const hexGridCells = [];
  const hr = 18, hgap = 2;
  const hcol = hr * Math.sqrt(3) + hgap;
  const hrow = hr * 1.5 + hgap * 0.5;
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 8; col++) {
      const x = col * hcol + (row % 2 === 1 ? hcol / 2 : 0);
      const y = row * hrow;
      hexGridCells.push({ x, y, key: `${row}-${col}` });
    }
  }

  return (
    <>
      <RevealShimmerFlash ref={shimmerFlashRef} />
      <RevealRoot ref={rootRef} onClick={() => { if (isRevealedRef.current) triggerConfirm(); else triggerDismiss(); }}>
        <RevealDarkBg ref={darkBgRef} />
        <RevealParticleCanvas ref={canvasRef} />
        <RevealRingOuter ref={ringOuterRef}>
          {outerRunes.map((r, i) => (
            <RevealRuneOnRing key={i} style={{ left: `${r.x}%`, top: `${r.y}%`, transform: "translate(-50%,-50%)" }}>{r.ch}</RevealRuneOnRing>
          ))}
        </RevealRingOuter>
        <RevealRingMid ref={ringMidRef} />
        <RevealRingInner ref={ringInnerRef} />

        <RevealCardScene ref={cardSceneRef}>
          <RevealCardInner ref={cardRef}>

            {/* ── BACK FACE — hextech mystery ── */}
            <RevealCardBack>
              {/* Hex grid SVG */}
              <BackHexGrid viewBox="0 0 260 370" preserveAspectRatio="xMidYMid slice">
                {hexGridCells.map(({ x, y, key }) => (
                  <path key={key} d={hexPath(x, y, hr)} fill="none" stroke="rgba(200,170,110,1)" strokeWidth="0.8" />
                ))}
              </BackHexGrid>

              {/* Circuit line SVG */}
              <BackCircuitSvg viewBox="0 0 260 370" preserveAspectRatio="xMidYMid slice">
                <g fill="none" strokeLinecap="round">
                  <AnimatedPathPulse3s d="M130,40 L130,80 L160,110 L160,150" stroke="rgba(200,170,110,0.6)" strokeWidth="1.2"
                    strokeDasharray="200" />
                  <AnimatedPathPulse3s06 d="M130,330 L130,290 L100,260 L100,220" stroke="rgba(200,170,110,0.6)" strokeWidth="1.2"
                    strokeDasharray="200" />
                  <AnimatedPathPulse34s03 d="M30,185 L70,185 L95,160 L130,160" stroke="rgba(200,170,110,0.5)" strokeWidth="1"
                    strokeDasharray="200" />
                  <AnimatedPathPulse34s11 d="M230,185 L190,185 L165,210 L130,210" stroke="rgba(200,170,110,0.5)" strokeWidth="1"
                    strokeDasharray="200" />
                  {/* Corner accent lines */}
                  <AnimatedPathPulse4s02 d="M18,50 L50,50 L50,80" stroke="rgba(200,170,110,0.35)" strokeWidth="0.8" strokeDasharray="60" />
                  <AnimatedPathPulse4s08 d="M242,50 L210,50 L210,80" stroke="rgba(200,170,110,0.35)" strokeWidth="0.8" strokeDasharray="60" />
                  <AnimatedPathPulse4s14 d="M18,320 L50,320 L50,290" stroke="rgba(200,170,110,0.35)" strokeWidth="0.8" strokeDasharray="60" />
                  <AnimatedPathPulse4s20 d="M242,320 L210,320 L210,290" stroke="rgba(200,170,110,0.35)" strokeWidth="0.8" strokeDasharray="60" />
                  {/* Node dots */}
                  <AnimatedCircleOrb cx="160" cy="150" r="3.5" fill="rgba(200,170,110,0.7)" />
                  <AnimatedCircleOrb05 cx="100" cy="220" r="3.5" fill="rgba(200,170,110,0.7)" />
                  <circle cx="95"  cy="160" r="2.5" fill="rgba(200,170,110,0.55)" />
                  <circle cx="165" cy="210" r="2.5" fill="rgba(200,170,110,0.55)" />
                </g>
              </BackCircuitSvg>

              {/* Center glow orb */}
              <BackCenterOrb />

              {/* The big ? */}
              <BackQuestion>?</BackQuestion>

              {/* Top/bottom labels */}
              <BackTopLabel>Tournament</BackTopLabel>
              <RevealLabel>Click to Reveal</RevealLabel>

              {/* Horizontal glow lines */}
              <BackGlowLine style={{ top: "68px" }} />
              <BackGlowLine style={{ bottom: "68px" }} />

              {/* Corner gems */}
              <BackCornerGem style={{ top: "26px",  left: "26px"  }} />
              <BackCornerGem style={{ top: "26px",  right: "26px" }} />
              <BackCornerGem style={{ bottom: "26px", left: "26px"  }} />
              <BackCornerGem style={{ bottom: "26px", right: "26px" }} />

              {/* Card corner brackets */}
              <CardCorner style={{ top: 0, left: 0 }} />
              <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
              <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
              <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
            </RevealCardBack>

            {/* ── FRONT FACE — member reveal ── */}
            <RevealCardFront data-front="true" style={{ visibility: 'hidden' }}>
              <RevealCardTopLine />
              <CardCorner style={{ top: 0, left: 0 }} />
              <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
              <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
              <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
              <RevealCardImageWrap>
                <RevealCardImage ref={cardImgRef} src={imgSrc || "/question.jpg"} alt={member} onError={e => { e.target.src = "/question.jpg"; }} />
              </RevealCardImageWrap>
              <RevealCardContent>
                <RevealCardLabel ref={cardLabelRef}>Selected Member</RevealCardLabel>
                <RevealCardDivider ref={cardDividerRef} />
                <RevealCardName ref={cardNameRef}>{member}</RevealCardName>
              </RevealCardContent>
            </RevealCardFront>

          </RevealCardInner>

          {/* Buttons sit outside the 3D inner so they don't flip */}
          <RevealDismissBtn ref={dismissBtnRef} onClick={e => { e.stopPropagation(); triggerDismiss(); }}>Dismiss</RevealDismissBtn>
          <RevealAddBtn ref={addBtnRef} onClick={e => { e.stopPropagation(); triggerConfirm(); }}>Add to Team</RevealAddBtn>
        </RevealCardScene>

      </RevealRoot>
    </>
  );
}



function CardCorner({ style }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ position: "absolute", pointerEvents: "none", zIndex: 4, ...style }}>
      <path d="M1 9 L1 1 L9 1" stroke="rgba(200,170,110,0.55)" strokeWidth="1"/>
      <circle cx="1" cy="1" r="1" fill="rgba(200,170,110,0.5)"/>
    </svg>
  );
}

function EditTeamModalComponent({ team, onClose, onSave }) {
  const [teamName, setTeamName] = useState(team?.name || "");
  const [imgLink, setImgLink]   = useState(team?.imgLink || "");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (team) { setTeamName(team.name); setImgLink(team.imgLink || ""); }
  }, [team]);

  const handleSave = () => { if (teamName.trim()) onSave(team.id, teamName, imgLink, setNameError); };
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSave(); else if (e.key === "Escape") onClose(); };
  return (
    <EditModalOverlay onClick={onClose}>
      <EditModalBox onClick={e => e.stopPropagation()}>
        <ModalScanLine />
        <CardCorner style={{ top: 0, left: 0 }} />
        <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
        <ModalTitle>Edit Team</ModalTitle>
        <ModalDivider />
        <EditInputGroup>
          <ModalLabel>Team Name</ModalLabel>
          <ModalInput type="text" placeholder="Enter team name..." value={teamName} onChange={e => { setTeamName(e.target.value); setNameError(""); }} onKeyDown={handleKeyDown} autoFocus />
          {nameError && <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.42rem", letterSpacing: "0.2em", color: "rgba(220,80,80,0.9)", marginTop: "5px", textTransform: "uppercase" }}>{nameError}</div>}
        </EditInputGroup>
        <EditInputGroup>
          <ModalLabel>Team Image URL</ModalLabel>
          <ModalInput type="text" placeholder="https://..." value={imgLink} onChange={e => setImgLink(e.target.value)} onKeyDown={handleKeyDown} />
        </EditInputGroup>
        <EditButtonGroup>
          <ModalBtn onClick={onClose}>Cancel</ModalBtn>
          <ModalBtn $primary onClick={handleSave}>Save</ModalBtn>
        </EditButtonGroup>
      </EditModalBox>
    </EditModalOverlay>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const RUNES = ["ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];

// ─── Canvas system ────────────────────────────────────────────────────────────

function useCanvasSystem(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, rafId;
    const particles = [], runes = [], scanlines = [], pulseRings = [];

    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener("resize", resize);

    const gold  = a => `rgba(200,170,110,${a})`;
    const cream = a => `rgba(240,230,210,${a})`;

    for (let i = 0; i < 40; i++) {
      const p = { ox: Math.random() * 100, oy: 0.15 * 100 + Math.random() * 0.7 * 100, dx: (Math.random() - 0.5) * 80, dy: -(25 + Math.random() * 80), size: 0.5 + Math.random() * 1.8, progress: 0 };
      particles.push(p);
      const dur = 6 + Math.random() * 7;
      gsap.to(p, { progress: 1, duration: dur, ease: "power1.out", delay: Math.random() * dur, repeat: -1, repeatDelay: Math.random() * 3, onRepeat() { p.ox = Math.random() * 100; p.oy = 15 + Math.random() * 70; p.dx = (Math.random() - 0.5) * 80; p.dy = -(25 + Math.random() * 80); } });
    }
    for (let i = 0; i < 22; i++) {
      const r = { x: Math.random() * 1440, y: Math.random() * 900, char: RUNES[i % RUNES.length], size: 9 + Math.random() * 8, alpha: 0, rotation: (Math.random() - 0.5) * 0.3, floatY: 0 };
      runes.push(r);
      const maxA = 0.04 + Math.random() * 0.05; const dur = 8 + Math.random() * 8;
      gsap.timeline({ repeat: -1, delay: Math.random() * 6 }).to(r, { alpha: maxA, floatY: -10, duration: dur * 0.4, ease: "sine.inOut" }).to(r, { alpha: 0, floatY: 0, duration: dur * 0.4, ease: "sine.inOut" }).to(r, { duration: dur * 0.2, onComplete() { r.x = Math.random() * 1440; r.y = Math.random() * 900; } });
    }
    for (let i = 0; i < 2; i++) {
      const sl = { y: -10, alpha: 0 }; scanlines.push(sl);
      gsap.timeline({ repeat: -1, delay: i * 11 }).set(sl, { y: -10, alpha: 0 }).to(sl, { y: 910, alpha: 0.09, duration: 22, ease: "none" }).to(sl, { alpha: 0, duration: 2 }, "-=2");
    }
    for (let i = 0; i < 3; i++) {
      const ring = { r: 0, alpha: 0 }; pulseRings.push(ring);
      gsap.timeline({ repeat: -1, delay: i * 4.5, repeatDelay: 8 + Math.random() * 6 }).set(ring, { r: 60, alpha: 0 }).to(ring, { r: 520, alpha: 0.08, duration: 0.6, ease: "power2.out" }, 0).to(ring, { alpha: 0, duration: 3.5, ease: "power1.in" }, 0.6);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      for (const ring of pulseRings) { if (ring.alpha <= 0) continue; ctx.beginPath(); ctx.arc(cx, cy, ring.r, 0, Math.PI * 2); ctx.strokeStyle = gold(ring.alpha); ctx.lineWidth = 1; ctx.stroke(); }
      for (const sl of scanlines) { if (sl.alpha <= 0) continue; const g = ctx.createLinearGradient(0, sl.y - 2, 0, sl.y + 2); g.addColorStop(0, "transparent"); g.addColorStop(0.5, cream(sl.alpha)); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.fillRect(0, sl.y - 2, W, 4); }
      for (const p of particles) { const t = p.progress; if (t <= 0 || t >= 1) continue; let a = t < 0.10 ? t / 0.10 : t < 0.85 ? 1 : (1 - t) / 0.15; a *= 0.75; const px = (p.ox / 100) * W + p.dx * t, py = (p.oy / 100) * H + p.dy * t; const grd = ctx.createRadialGradient(px, py, 0, px, py, p.size * 2.5); grd.addColorStop(0, cream(a)); grd.addColorStop(0.5, gold(a * 0.7)); grd.addColorStop(1, "transparent"); ctx.beginPath(); ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill(); }
      for (const r of runes) { if (r.alpha <= 0) continue; const rx = (r.x / 1440) * W, ry = (r.y / 900) * H; ctx.save(); ctx.translate(rx, ry + r.floatY); ctx.rotate(r.rotation); ctx.font = `${r.size}px serif`; ctx.fillStyle = gold(r.alpha); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(r.char, 0, 0); ctx.restore(); }
      rafId = requestAnimationFrame(draw);
    }
    draw();

    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(rafId); };
  }, []);
}

function useEntranceAnims(refs) {
  useEffect(() => {
    const { corners, hRules, vRules, rings, centerDiamond, backBtn } = refs;
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.to(corners.current.filter(Boolean), { opacity: 1, stagger: { each: 0.15, from: "edges" }, duration: 0.8, ease: "back.out(1.4)" }, 0);
    tl.to(hRules.current.filter(Boolean), { scaleX: 1, opacity: 1, stagger: 0.14, duration: 1.3, ease: "power2.inOut" }, 0.3);
    tl.to(vRules.current.filter(Boolean), { scaleY: 1, opacity: 1, stagger: 0.10, duration: 1.5, ease: "power2.inOut" }, 0.5);
    rings.current.forEach((el, i) => {
      if (!el) return;
      gsap.fromTo(el, { attr: { r: 0 }, opacity: 0 }, { attr: { r: el.dataset.r }, opacity: 1, duration: 1.8 + i * 0.4, delay: 0.6 + i * 0.3, ease: "power2.out" });
      gsap.to(el, { attr: { "stroke-opacity": 0.18 }, duration: 3 + i * 0.8, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2 + i * 0.5 });
    });
    if (centerDiamond.current) {
      gsap.to(centerDiamond.current, { scale: 1.14, opacity: 0.55, duration: 2.8, ease: "sine.inOut", repeat: -1, yoyo: true, transformOrigin: "720px 450px" });
    }
      if (backBtn.current) {
      gsap.set(backBtn.current, { opacity: 0, y: -18, clipPath: "polygon(50% 0%, 50% 0%, 50% 50%, 50% 100%, 50% 100%, 50% 50%)" });
      gsap.to(backBtn.current, { opacity: 1, y: 0, clipPath: "polygon(22px 0%, calc(100% - 22px) 0%, 100% 50%, calc(100% - 22px) 100%, 22px 100%, 0% 50%)", duration: 0.9, ease: "power3.out", delay: 0.6 });      gsap.to(backBtn.current, { boxShadow: "0 0 18px rgba(200,170,110,0.12), 0 0 40px rgba(200,170,110,0.06)", duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.8 });
    }
    corners.current.filter(Boolean).forEach((el, i) => { gsap.to(el, { opacity: 0.55, duration: 2.5 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1 + i * 0.6 }); });
    hRules.current.filter(Boolean).forEach((el, i) => { gsap.to(el, { opacity: 0.55, duration: 3 + i * 0.5, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 1.5 + i * 0.3 }); });
    vRules.current.filter(Boolean).forEach((el, i) => { gsap.to(el, { opacity: 0.45, duration: 4 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 2 + i * 0.4 }); });
  }, []);
}

function BgDecoSVG({ ringRefs }) {
  const RINGS = [{ r: 140 }, { r: 230 }, { r: 340 }, { r: 460 }];
  return (
    <DecoSVG viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#c8aa6e" stopOpacity="0"/><stop offset="25%" stopColor="#c8aa6e" stopOpacity="0.12"/><stop offset="50%" stopColor="#f0e6d2" stopOpacity="0.20"/><stop offset="75%" stopColor="#c8aa6e" stopOpacity="0.12"/><stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/></linearGradient>
        <linearGradient id="vg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#c8aa6e" stopOpacity="0"/><stop offset="40%" stopColor="#c8aa6e" stopOpacity="0.09"/><stop offset="60%" stopColor="#c8aa6e" stopOpacity="0.09"/><stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/></linearGradient>
        <radialGradient id="cg" cx="50%" cy="50%" r="28%"><stop offset="0%" stopColor="#c8aa6e" stopOpacity="0.07"/><stop offset="100%" stopColor="#c8aa6e" stopOpacity="0"/></radialGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <ellipse cx="720" cy="450" rx="460" ry="300" fill="url(#cg)" opacity="0.8"/>
      {[160, 300, 450, 600, 740].map(y => (<line key={y} x1="0" y1={y} x2="1440" y2={y} stroke="url(#hg)" strokeWidth={y===450?"0.9":"0.5"} opacity="0.7"/>))}
      {[200, 400, 600, 720, 840, 1040, 1240].map(x => (<line key={x} x1={x} y1="0" x2={x} y2="900" stroke="url(#vg)" strokeWidth="0.5" opacity="0.7"/>))}
      {RINGS.map((ring, i) => (<circle key={i} ref={el => { if (ringRefs.current) ringRefs.current[i] = el; }} data-r={ring.r} cx="720" cy="450" r="0" fill="none" stroke="rgba(200,170,110,0.09)" strokeWidth={i===0?"1":"0.6"} filter={i===0?"url(#glow)":undefined} opacity="0"/>))}
      <path d="M 0 900 Q 360 450 720 180 Q 1080 450 1440 900" fill="none" stroke="rgba(200,170,110,0.045)" strokeWidth="0.9"/>
      <path d="M 0 0 Q 360 450 720 720 Q 1080 450 1440 0"     fill="none" stroke="rgba(200,170,110,0.035)" strokeWidth="0.7"/>
      <path d="M 0 80   Q 210 450 0 820"    fill="none" stroke="rgba(200,170,110,0.07)" strokeWidth="0.8"/>
      <path d="M 70 120 Q 260 450 70 780"   fill="none" stroke="rgba(200,170,110,0.04)" strokeWidth="0.5"/>
      <path d="M 1440 80   Q 1230 450 1440 820"  fill="none" stroke="rgba(200,170,110,0.07)" strokeWidth="0.8"/>
      <path d="M 1370 120  Q 1180 450 1370 780"  fill="none" stroke="rgba(200,170,110,0.04)" strokeWidth="0.5"/>
      {[130,240,360,490,650,790,950,1080,1200,1310].map(x => (<g key={x} opacity={0.2}><line x1={x} y1="439" x2={x+9} y2="450" stroke="#c8aa6e" strokeWidth="0.7"/><line x1={x+9} y1="450" x2={x} y2="461" stroke="#c8aa6e" strokeWidth="0.7"/></g>))}
      {Array.from({length:32},(_,i) => { const x=45*i+22; return <g key={i}><line x1={x} y1="0" x2={x} y2={i%4===0?12:7} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/><line x1={x} y1="900" x2={x} y2={900-(i%4===0?12:7)} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/></g>; })}
      {Array.from({length:22},(_,i) => { const y=41*i+20; return <g key={i}><line x1="0" y1={y} x2={i%4===0?12:7} y2={y} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/><line x1="1440" y1={y} x2={1440-(i%4===0?12:7)} y2={y} stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/></g>; })}
      {[[180,180],[440,700],[650,140],[800,760],[1000,180],[1220,660],[310,480],[720,280],[1080,520],[560,620]].map(([x,y],i) => (<g key={i} opacity={0.13}><line x1={x-6} y1={y} x2={x+6} y2={y} stroke="#c8aa6e" strokeWidth="0.6"/><line x1={x} y1={y-6} x2={x} y2={y+6} stroke="#c8aa6e" strokeWidth="0.6"/></g>))}
      {[[60,450],[1380,450]].map(([x,y],i) => (<g key={i} opacity={0.3}><path d={`M${x},${y-14} L${x+14},${y} L${x},${y+14} L${x-14},${y} Z`} fill="rgba(200,170,110,0.04)" stroke="#c8aa6e" strokeWidth="0.8"/><path d={`M${x},${y-7}  L${x+7}, ${y} L${x},${y+7}  L${x-7}, ${y} Z`} fill="rgba(200,170,110,0.07)" stroke="#c8aa6e" strokeWidth="0.5"/><circle cx={x} cy={y} r="1.8" fill="#f0e6d2" opacity="0.6"/></g>))}
    </DecoSVG>
  );
}

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
      <rect x="6" y="28" width="16" height="3" rx="1" fill="url(#tgBase)" filter="url(#tgGlow)"/>
      <rect x="8" y="26.5" width="12" height="2" rx="0.8" fill="url(#tgBase)"/>
      <rect x="11.5" y="21" width="5" height="6" rx="0.5" fill="url(#tgBody)"/>
      <rect x="12" y="21" width="1.5" height="6" fill="rgba(255,240,140,0.3)" rx="0.3"/>
      <path d="M5 4 Q5 20 14 21 Q23 20 23 4 Z" fill="url(#tgCup)" filter="url(#tgGlow)"/>
      <path d="M8 5 Q8 14 11 17" stroke="rgba(255,255,200,0.5)" strokeWidth="1.2" strokeLinecap="round"/>
      <ellipse cx="11" cy="7" rx="2" ry="3" fill="url(#tgShine)" opacity="0.7"/>
      <path d="M5 4 Q14 7 23 4" stroke="rgba(255,220,60,0.9)" strokeWidth="1.2" fill="none"/>
      <path d="M5 6 Q1 8 2 12 Q3 16 6 15" stroke="url(#tgBody)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M23 6 Q27 8 26 12 Q25 16 22 15" stroke="url(#tgBody)" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      <path d="M14 8 L14.9 10.7 L17.8 10.7 L15.5 12.3 L16.4 15 L14 13.4 L11.6 15 L12.5 12.3 L10.2 10.7 L13.1 10.7 Z" fill="rgba(255,245,180,0.95)" filter="url(#tgGlow)"/>
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
// ─── ResultsView Component ────────────────────────────────────────────────────


function ResultsView({ teams, tournamentName, format, participants, router }) { 
  const matchDocMapRef = useRef({});
  const [matches, setMatches] = useState([]);
  const [standings, setStandings] = useState([]);
  const [videoLinks, setVideoLinks] = useState({});
  const [finalizing, setFinalizing] = useState(false);
  const [finalizeMsg, setFinalizeMsg] = useState("");
  const [finalizeErr, setFinalizeErr] = useState("");
  const [alreadyFinished, setAlreadyFinished] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { getDocs, collection, getDoc, doc } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");

        // check tournament status
        console.log("📖 READ: fetching tournament doc for status check");
        const tDoc = await getDoc(doc(database, "tournaments", tournamentName));
        if (tDoc.exists() && tDoc.data().status === "finished") {
          setAlreadyFinished(true);
        }

        console.log("📖 READ: fetching all matches for results view");
        const snap = await getDocs(collection(database, "tournaments", tournamentName, "matches"));
        console.log(`📖 READ: received ${snap.docs.length} match docs`);
        const docMap = {};
        const all = snap.docs.map(d => {
          const data = d.data();
          if (data.id) docMap[data.id] = d.ref;
          return { ...d.id, ...data };
        });
        matchDocMapRef.current = docMap;
        setMatches(all);

        // seed video links from existing match data
        const links = {};
        all.forEach(m => { if (m.videoLink) links[m.id] = m.videoLink; });
        setVideoLinks(links);

// derive standings
        const rankMap = {};

        const getLoser = (m) => {
          if (!m.winner) return null;
          return m.team1Id === m.winner ? m.team2Id : m.team1Id;
        };

        const wbAll = all.filter(m => m.type === "winner" && m.status === "complete" && !m.isBye && !m.isGhost);
        const lbAll = all.filter(m => m.type === "loser"  && m.status === "complete" && !m.isGhost);

         const isSingleElim = format === "Single-Elimination";

        if (isSingleElim) {
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
          // Double Elimination

          // 1st & 2nd: Grand Final
          const gf = all.find(m => m.type === "grand_final" && m.status === "complete");
          if (gf?.winner) {
            rankMap[gf.winner] = 1;
            const loser = getLoser(gf);
            if (loser) rankMap[loser] = 2;
          }

          // 3rd & 4th: placement match
          const thirdMatch = all.find(m => m.type === "placement" && m.status === "complete");
          if (thirdMatch?.winner) {
            const plWinner = thirdMatch.winner;
            const plLoser  = getLoser(thirdMatch);
            if (!rankMap[plWinner]) rankMap[plWinner] = 3;
            if (plLoser && !rankMap[plLoser]) {
              rankMap[plLoser] = rankMap[plWinner] < 3 ? 3 : 4;
            }
          }

          // LB losers ranked by round exited
          const lbRoundsSorted = [...new Set(lbAll.map(m => m.round))].sort((a, b) => b - a);
          let nextRank = Object.values(rankMap).length > 0 ? Math.max(...Object.values(rankMap)) + 1 : 5;
          lbRoundsSorted.forEach(r => {
            const losersThisRound = lbAll
              .filter(m => m.round === r)
              .map(m => getLoser(m))
              .filter(id => id && !rankMap[id]);
            losersThisRound.forEach(id => { rankMap[id] = nextRank; });
            nextRank += losersThisRound.length;
          });

          // WB-only losers (edge cases)
          const teamsInLB = new Set();
          lbAll.forEach(m => {
            if (m.team1Id) teamsInLB.add(m.team1Id);
            if (m.team2Id) teamsInLB.add(m.team2Id);
          });
          const wbRoundsSorted = [...new Set(wbAll.map(m => m.round))].sort((a, b) => b - a);
          wbRoundsSorted.forEach(r => {
            wbAll.filter(m => m.round === r).forEach(m => {
              const loser = getLoser(m);
              if (loser && !rankMap[loser] && !teamsInLB.has(loser)) {
                rankMap[loser] = nextRank++;
              }
            });
          });
        }

        // Fallback for anyone still unranked
        let fallbackRank = Object.values(rankMap).length > 0 ? Math.max(...Object.values(rankMap)) + 1 : 1;
        teams.filter(t => !rankMap[t.id]).forEach(t => {
          rankMap[t.id] = fallbackRank++;
        });

        const ranked = teams
          .map(t => ({ ...t, rank: rankMap[t.id] ?? 999 }))
          .sort((a, b) => a.rank - b.rank);
        setStandings(ranked);
      } catch (e) {
        console.error("ResultsView load error:", e);
      }
    }
    load();
  }, [tournamentName, teams]);

const handleVideoBlur = async (matchId, value) => {
    if (!value.trim()) return;
    try {
      const { updateDoc } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      const ref = matchDocMapRef.current?.[matchId];
      if (!ref) { console.error("No cached ref for match:", matchId); return; }
      console.log(`✏️ WRITE: saving video link for match "${matchId}"`);
      await updateDoc(ref, { videoLink: value.trim() });
    } catch (e) {
      console.error("Failed to save video link:", e);
    }
  };

  const handleFinalize = async () => {
    setFinalizing(true);
    setFinalizeMsg("");
    setFinalizeErr("");
    
    try {
      const {
        doc, updateDoc, getDoc, getDocs, collection, writeBatch
      } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");

      // 1. Save all pending video links using cached refs (no extra read needed)
      const batch1 = writeBatch(database);
      let hasVideoLinks = false;
      Object.entries(videoLinks).forEach(([matchId, link]) => {
        if (link?.trim()) {
          const ref = matchDocMapRef.current?.[matchId];
          if (ref) {
            console.log(`✏️ WRITE (batch): saving video link for match "${matchId}"`);
            batch1.set(ref, { videoLink: link.trim() }, { merge: true });
            hasVideoLinks = true;
          }
        }
      });
      if (hasVideoLinks) {
        console.log("✏️ WRITE: committing video links batch");
        await batch1.commit();
      }

      // 2. Mark tournament as finished
      const tRef = doc(database, "tournaments", tournamentName);
      console.log("📖 READ: fetching tournament doc for finalize");
      const tSnap = await getDoc(tRef);
      const tData = tSnap.data();

      // 3. Get participants list — use prop passed from parent (already loaded)
      const participantList = participants?.length ? participants : (tData?.participants ?? []);

      // 4. Get all teams and their members to find rank-1, rank-2, rank-3 team members
const teamDocs = teams;

const isSingleElim = format === "Single-Elimination";

const rank1Team = standings.find(t => t.rank === 1);
const rank2Team = standings.find(t => t.rank === 2);
const rank3Team = !isSingleElim ? standings.find(t => t.rank === 3) : null;

const rank1Members = teamDocs.find(t => t.id === rank1Team?.id)?.members ?? [];
const rank2Members = teamDocs.find(t => t.id === rank2Team?.id)?.members ?? [];
const rank3Members = !isSingleElim ? (teamDocs.find(t => t.id === rank3Team?.id)?.members ?? []) : [];

console.log("🏆 Podium resolved:", {
  rank1: rank1Team?.name, rank1Members,
  rank2: rank2Team?.name, rank2Members,
  rank3: rank3Team?.name, rank3Members,
});

console.log("✏️ WRITE: marking tournament as finished with podium teams");
await updateDoc(tRef, {
  status: "finished",
  firstTeam: rank1Team?.name ?? "",
  secondTeam: rank2Team?.name ?? "",
  thirdTeam: !isSingleElim ? (rank3Team?.name ?? "") : "",
});
      router.push("/");
      // 5. Load all member docs for participants
      console.log("📖 READ: fetching all members to update stats");
      const membersSnap = await getDocs(collection(database, "members"));
      console.log(`📖 READ: received ${membersSnap.docs.length} member docs for stat updates`);
      const batch2 = writeBatch(database);

      membersSnap.docs.forEach(mDoc => {
        const name = mDoc.id;
        const data = mDoc.data();
        const isParticipant = participantList.includes(name);
        if (!isParticipant) return;

        const updates = {
          participations: (data.participations ?? 0) + 1,
        };
        if (rank1Members.includes(name)) updates.first  = (data.first  ?? 0) + 1;
        if (rank2Members.includes(name)) updates.second = (data.second ?? 0) + 1;
        if (rank3Members.includes(name)) updates.third  = (data.third  ?? 0) + 1;

        console.log(`✏️ WRITE (batch): updating stats for member "${name}"`);
        batch2.update(doc(database, "members", name), updates);
      });

      console.log("✏️ WRITE: committing member stats batch");
      await batch2.commit();
      setAlreadyFinished(true);
      setFinalizeMsg("Tournament finalized! Stats updated for all participants.");
    } catch (e) {
      console.error("Finalize error:", e);
      setFinalizeErr("Something went wrong. Check console.");
    } finally {
      setFinalizing(false);
    }
  };

  const completedMatches = matches.filter(
    m => m.status === "complete" && m.team1Id && m.team2Id &&
         m.team1Id !== "bye" && m.team2Id !== "bye"
  );

  const getRoundLabel = (m) => {
    if (m.type === "placement") return m.label ?? "Placement";
    const maxRound = Math.max(...matches.filter(x => x.type === "winner").map(x => x.round));
    if (m.round === maxRound) return "Final";
    if (m.round === maxRound - 1) return "Semi";
    return `R${m.round}`;
  };

  const rankIcon = (rank) => {
    if (rank === 1) return <TrophyGold />;
    if (rank === 2) return <TrophySilver />;
    if (rank === 3) return <TrophyBronze />;
    return <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.65rem", color: "rgba(200,170,110,0.35)" }}>#{rank}</span>;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "1100px" }}>
      <ResultsGrid>
        {/* Leaderboard */}
        <ResultsPanel>
          <ResultsPanelTitle>Final Standings</ResultsPanelTitle>
          {standings.filter(team => format === "Single-Elimination" ? team.rank <= 2 : true).map(team => (
            <LeaderboardRow key={team.id} $rank={team.rank}>
              <LeaderboardRank $rank={team.rank} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                {rankIcon(team.rank)}
              </LeaderboardRank>
              {(team.imgLink || team.imgUrl) && <LeaderboardTeamImg src={team.imgLink || team.imgUrl} alt={team.name} onError={e => { e.target.src = '/question.jpg'; }} />}
              <LeaderboardTeamName>{team.name}</LeaderboardTeamName>
            </LeaderboardRow>
          ))}
        </ResultsPanel>

        {/* Match History */}
        <ResultsPanel>
          <ResultsPanelTitle>Match History</ResultsPanelTitle>
          <MatchHistoryList>
            {completedMatches.length === 0
              ? <EmptyResultsHint>No completed matches yet</EmptyResultsHint>
              : completedMatches.map(m => (
                <MatchHistoryCard key={m.id}>
                  <MatchRoundBadge>{getRoundLabel(m)}</MatchRoundBadge>
                  <MatchTeamsDisplay>
                    <MatchTeamBlock $winner={m.winner === m.team1Id}>
                      <MatchTeamThumb src={m.team1Img || "/question.jpg"} $winner={m.winner === m.team1Id} onError={e => { e.target.src = "/question.jpg"; }} />
                      <MatchTeamBlockName $winner={m.winner === m.team1Id}>{m.team1Name}</MatchTeamBlockName>
                    </MatchTeamBlock>
                    <MatchVsSeparator>
                      <MatchVsLine />
                      <MatchVsText>VS</MatchVsText>
                      <MatchVsLine />
                    </MatchVsSeparator>
                    <MatchTeamBlock $winner={m.winner === m.team2Id} style={{ flexDirection: "row-reverse" }}>
                      <MatchTeamThumb src={m.team2Img || "/question.jpg"} $winner={m.winner === m.team2Id} onError={e => { e.target.src = "/question.jpg"; }} />
                      <MatchTeamBlockName $winner={m.winner === m.team2Id} style={{ textAlign: "right" }}>{m.team2Name}</MatchTeamBlockName>
                    </MatchTeamBlock>
                  </MatchTeamsDisplay>
                  <MatchVideoInput
                    placeholder="Paste clip link..."
                    defaultValue={m.videoLink ?? ""}
                    onChange={e => setVideoLinks(prev => ({ ...prev, [m.id]: e.target.value }))}
                    onBlur={e => handleVideoBlur(m.id, e.target.value)}
                  />
                  </MatchHistoryCard>
              ))
            }
          </MatchHistoryList>
        </ResultsPanel>
      </ResultsGrid>

      {/* Finalize */}
      {!alreadyFinished ? (
        <>
          <FinalizeBtn onClick={handleFinalize} disabled={finalizing}>
            {finalizing ? "Finalizing..." : "⚔ Finalize Tournament"}
          </FinalizeBtn>
          {finalizeMsg && <FinalizeStatus>{finalizeMsg}</FinalizeStatus>}
          {finalizeErr && <FinalizeStatus $error>{finalizeErr}</FinalizeStatus>}
        </>
      ) : (
        <FinalizeStatus style={{ marginTop: "40px" }}>✦ Tournament Finalized ✦</FinalizeStatus>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Hero() {
  const router = useRouter();
  const { tournamentName, admin: isAdmin } = useStateContext();
  const [phase, setPhase] = useState(1);

  const [tournament, setTournament]           = useState(null);
  const [tournamentFormat, setTournamentFormat] = useState("Double-Elimination");
  const [teams, setTeams]                     = useState([]);
  const [participants, setParticipants]       = useState([]);
  const [showAddTeamsModal, setShowAddTeamsModal]   = useState(false);
  const [teamCountInput, setTeamCountInput]   = useState("");
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedTeamId, setSelectedTeamId]   = useState(null);
  const [selectedMembers, setSelectedMembers] = useState(new Set());
  const [editingTeamId, setEditingTeamId]     = useState(null);
  const [deletingTeamId, setDeletingTeamId]   = useState(null);
  const [memberImages, setMemberImages]        = useState({});
  const [allMembers, setAllMembers]            = useState([]);
  const [participantSearch, setParticipantSearch] = useState("");
  const [memberSearch, setMemberSearch]           = useState("");
  const [randomReveal, setRandomReveal] = useState(null);
  const [bracketComplete, setBracketComplete] = useState(false);
  const randomRevealRef = useRef(null);

  const canvasRef         = useRef(null);
  const cornersRef        = useRef([]);
  const hRulesRef         = useRef([]);
  const vRulesRef         = useRef([]);
  const ringRefs          = useRef([]);
  const centerDiamondRef  = useRef(null);
  const backBtnRef        = useRef(null);
  const phaseContainerRef = useRef(null);
  const cardRefs          = useRef([]);

  useCanvasSystem(canvasRef);

  useEffect(() => { centerDiamondRef.current = document.getElementById("centerDiamond"); }, []);

  useEntranceAnims({ corners: cornersRef, hRules: hRulesRef, vRules: vRulesRef, rings: ringRefs, centerDiamond: centerDiamondRef, backBtn: backBtnRef });

  useEffect(() => {
    if (phaseContainerRef.current) {
      gsap.set(phaseContainerRef.current, { opacity: 0, y: -20 });
      gsap.to(phaseContainerRef.current, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.5 });
    }
  }, []);

  useEffect(() => {
    if (!tournamentName) return;
    async function loadPhase() {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");
        console.log("📖 READ: fetching tournament doc for phase/format load");
        const docSnap = await getDoc(doc(database, "tournaments", tournamentName));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPhase(data.phase || 1);
          setTournament(data);
          setTournamentFormat(data.format || "Double-Elimination");
          setParticipants(data.participants || []);
        }   
      } catch (e) { console.error("Failed to load tournament phase:", e); }
    }
    loadPhase();
  }, [tournamentName]);

  

  useEffect(() => {
    async function loadAllMembers() {
      try {
        const { getDocs, collection } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");
        console.log("📖 READ: fetching all members for image map");
        const snap = await getDocs(collection(database, "members"));
        console.log(`📖 READ: received ${snap.docs.length} members for image map`);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllMembers(list);
        const imgs = {};
        list.forEach(m => { imgs[m.id] = m.imglink || m.imgLink || ""; });
        setMemberImages(prev => ({ ...prev, ...imgs }));
      } catch (e) { console.error("Failed to load all members:", e); }
    }
    loadAllMembers();
  }, []);

  useEffect(() => {
    if (!tournamentName) return;
    let unsub;
    (async () => {
      const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      const teamsQuery = query(
        collection(database, "tournaments", tournamentName, "teams"),
        orderBy("createdAt", "asc")
      );
      unsub = onSnapshot(teamsQuery, snap => {
        console.log(`📖 READ (snapshot): received ${snap.docs.length} team docs`);
        setTeams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, e => console.error("Teams listener error:", e));
    })();
    return () => { if (unsub) unsub(); };
  }, [tournamentName]);

  useEffect(() => {
    if (phase !== 1 || !teams.length) return;
    const listeners = [];
    cardRefs.current.filter(Boolean).forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 32, rotateX: 8, scale: 0.93 }, { opacity: 1, y: 0, rotateX: 0, scale: 1, duration: 0.75, ease: "power3.out", delay: 0.1 * i, onComplete: () => { card.style.transform = "none"; } });
      const onEnter = () => gsap.to(card, { rotateY: 3, rotateX: -2, scale: 1.02, duration: 0.35, ease: "power2.out" });
      const onLeave = () => gsap.to(card, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.45, ease: "power2.inOut" });
      card.addEventListener("mouseenter", onEnter);
      card.addEventListener("mouseleave", onLeave);
      listeners.push({ card, onEnter, onLeave });
    });
    return () => listeners.forEach(({ card, onEnter, onLeave }) => { card.removeEventListener("mouseenter", onEnter); card.removeEventListener("mouseleave", onLeave); });
  }, [teams, phase]);

  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);

  const handlePrevPhase = async () => {
    if (phase <= 1) return;
    // If on results phase and tournament is finished, prompt confirmation
    if (phase === 3) {
      try {
        const { getDoc, doc } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");
        const tSnap = await getDoc(doc(database, "tournaments", tournamentName));
        if (tSnap.exists() && tSnap.data().status === "finished") {
          setShowReactivateConfirm(true);
          return;
        }
      } catch (e) { console.error("Failed to check tournament status:", e); }
    }
    await doPrevPhase();
  };

  const doPrevPhase = async () => {
    const newPhase = phase - 1;
    setPhase(newPhase);
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      await updateDoc(doc(database, "tournaments", tournamentName), { phase: newPhase });
    } catch (e) { console.error("Failed to update phase:", e); setPhase(phase); }
  };
const handleConfirmReactivate = async () => {
    setShowReactivateConfirm(false);
    try {
      const { updateDoc, doc, getDoc, getDocs, collection, writeBatch } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");

      console.log("📖 READ: fetching tournament doc for reactivation");
      const tRef = doc(database, "tournaments", tournamentName);
      const tSnap = await getDoc(tRef);
      const tData = tSnap.data();

      const participantList = tData?.participants ?? [];
      const firstTeamName  = tData?.firstTeam  ?? "";
      const secondTeamName = tData?.secondTeam ?? "";
      const thirdTeamName  = tData?.thirdTeam  ?? "";

      console.log("📖 READ: fetching teams to resolve podium members for stat reversal");
      const teamsSnap = await getDocs(collection(database, "tournaments", tournamentName, "teams"));
      const teamsData = teamsSnap.docs.map(d => d.data());
      const firstTeam  = teamsData.find(t => t.name === firstTeamName)?.members  ?? [];
      const secondTeam = teamsData.find(t => t.name === secondTeamName)?.members ?? [];
      const thirdTeam  = teamsData.find(t => t.name === thirdTeamName)?.members  ?? [];

      console.log("📖 READ: fetching all members to reverse finalize stats");
      const membersSnap = await getDocs(collection(database, "members"));
      console.log(`📖 READ: received ${membersSnap.docs.length} member docs for stat reversal`);
      const batch = writeBatch(database);

      membersSnap.docs.forEach(mDoc => {
        const name = mDoc.id;
        const data = mDoc.data();
        if (!participantList.includes(name)) return;

        const updates = {
          participations: Math.max(0, (data.participations ?? 0) - 1),
        };
        if (firstTeam.includes(name))  updates.first  = Math.max(0, (data.first  ?? 0) - 1);
        if (secondTeam.includes(name)) updates.second = Math.max(0, (data.second ?? 0) - 1);
        if (thirdTeam.includes(name))  updates.third  = Math.max(0, (data.third  ?? 0) - 1);

        console.log(`✏️ WRITE (batch): reversing stats for member "${name}"`);
        batch.update(doc(database, "members", name), updates);
      });

      console.log("✏️ WRITE: committing stat reversal batch");
      await batch.commit();

      console.log("✏️ WRITE: marking tournament as ongoing again");
      await updateDoc(tRef, {
        status: "ongoing",
        phase: 2,
        firstTeam: [],
        secondTeam: [],
        thirdTeam: [],
      });
    } catch (e) { console.error("Failed to reactivate tournament:", e); }
    await doPrevPhase();
  };

  const handleNextPhase = async () => {
    if (phase >= 3) return;
    const newPhase = phase + 1;
    setPhase(newPhase);
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      await updateDoc(doc(database, "tournaments", tournamentName), { phase: newPhase });
    } catch (e) { console.error("Failed to update phase:", e); setPhase(phase); }
  };

  const handleAddTeams = async () => {
    const count = parseInt(teamCountInput, 10);
    if (isNaN(count) || count <= 0) return;
    try {
      const { collection, serverTimestamp, getDocs, doc, writeBatch } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");

      console.log("📖 READ: fetching existing teams to delete before reset");
      const existingSnap = await getDocs(collection(database, "tournaments", tournamentName, "teams"));
      const deleteBatch = writeBatch(database);
      existingSnap.docs.forEach(d => deleteBatch.delete(doc(database, "tournaments", tournamentName, "teams", d.id)));
      console.log(`✏️ WRITE: deleting ${existingSnap.docs.length} existing team docs (batch)`);
      await deleteBatch.commit();

      const newTeams = [];
      const createBatch = writeBatch(database);
      const teamRefs = [];
      for (let i = 0; i < count; i++) {
        const uniqueName = `Undecided${i + 1}`;
        const teamRef = doc(collection(database, "tournaments", tournamentName, "teams"));
        createBatch.set(teamRef, { name: uniqueName, imgLink: "", members: [], createdAt: serverTimestamp() });
        teamRefs.push({ ref: teamRef, name: uniqueName });
        console.log(`✏️ WRITE (batch): queuing team "${uniqueName}"`);
      }
      console.log("✏️ WRITE: creating all teams + updating totalTeams (batch)");
      const tournamentRef = doc(database, "tournaments", tournamentName);
      createBatch.update(tournamentRef, { totalTeams: count });
      await createBatch.commit();

      teamRefs.forEach(({ ref, name }) => {
        newTeams.push({ id: ref.id, name, imgLink: "", members: [] });
      });

      setTeams(newTeams);
      setShowAddTeamsModal(false);
      setTeamCountInput("");
    } catch (e) { console.error("Failed to set teams:", e); }
  };

  const getAvailableParticipants = () => {
    const memberSet = new Set();
    teams.forEach(team => (team.members || []).forEach(m => memberSet.add(m)));
    return (participants || []).filter(p => !memberSet.has(p));
  };

  const handleAddMembersToTeam = async () => {
    if (!selectedTeamId || selectedMembers.size === 0) return;
    try {
      const { updateDoc, doc, arrayUnion } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      const newMembers = Array.from(selectedMembers);
      console.log(`✏️ WRITE: adding ${newMembers.length} member(s) to team "${selectedTeamId}"`);
      await updateDoc(doc(database, "tournaments", tournamentName, "teams", selectedTeamId), { members: arrayUnion(...newMembers) });
      setTeams(teams.map(t => t.id === selectedTeamId ? { ...t, members: [...(t.members || []), ...newMembers] } : t));
      setShowAddMembersModal(false);
      setSelectedMembers(new Set());
    } catch (e) { console.error("Failed to add members:", e); }
  };

  const handleRemoveMember = async (teamId, member) => {
    if (!teamId || !member) return;
    try {
      const { updateDoc, doc, arrayRemove } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`✏️ WRITE: removing member "${member}" from team "${teamId}"`);
      await updateDoc(doc(database, "tournaments", tournamentName, "teams", teamId), { members: arrayRemove(member) });
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, members: (t.members || []).filter(m => m !== member) } : t));
    } catch (e) { console.error("Failed to remove member:", e); }
  };

  const handleAddRandomMember = async (teamId) => {
    const tid = teamId || selectedTeamId;
    if (!tid) return;
    const available = (() => {
      const memberSet = new Set();
      teams.forEach(t => (t.members || []).forEach(m => memberSet.add(m)));
      return (participants || []).filter(p => !memberSet.has(p));
    })();
    if (available.length === 0) return;
    const randomParticipant = available[Math.floor(Math.random() * available.length)];
    let imgSrc = "/question.jpg";
    try {
      const { getDoc, doc } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`📖 READ: fetching image for random member "${randomParticipant}"`);
      const snap = await getDoc(doc(database, "members", randomParticipant));
      if (snap.exists()) { const data = snap.data(); imgSrc = data.imglink || data.imgLink || "/question.jpg"; }
    } catch (e) { console.error("[Random] Failed to fetch member image:", e); }
    const revealData = { member: randomParticipant, imgSrc, teamId: tid, tournamentName };
    randomRevealRef.current = revealData;
    setRandomReveal(revealData);
  };

  const handleConfirmRandomMember = async () => {
    const current = randomRevealRef.current;
    if (!current) return;
    const { member, teamId, tournamentName: tName } = current;
    if (!member || !teamId || !tName) return;
    try {
      const { updateDoc, doc, arrayUnion } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`✏️ WRITE: confirming random member "${member}" to team "${teamId}"`);
      await updateDoc(doc(database, "tournaments", tName, "teams", teamId), { members: arrayUnion(member) });
      randomRevealRef.current = null;
    } catch (e) { console.error('[Confirm] ERROR:', e.message); alert("Error: " + e.message); }
  };

  const handleAddParticipant = async (memberName) => {
    if (participants.includes(memberName)) return;
    try {
      const { updateDoc, doc, arrayUnion } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`✏️ WRITE: adding participant "${memberName}" to tournament`);
      await updateDoc(doc(database, "tournaments", tournamentName), { participants: arrayUnion(memberName) });
      setParticipants(prev => [...prev, memberName]);
    } catch (e) { console.error("Failed to add participant:", e); }
  };

  const handleRemoveParticipant = async (memberName) => {
    try {
      const { updateDoc, doc, arrayRemove } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`✏️ WRITE: removing participant "${memberName}" from tournament`);
      await updateDoc(doc(database, "tournaments", tournamentName), { participants: arrayRemove(memberName) });
      setParticipants(prev => prev.filter(p => p !== memberName));
    } catch (e) { console.error("Failed to remove participant:", e); }
  };

  const handleSaveEditTeam = async (teamId, newName, newImgLink, setNameError) => {
    const trimmed = newName.trim();
    const isDuplicate = teams.some(t => t.id !== teamId && t.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setNameError(`"${trimmed}" is already taken`);
      return;
    }
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`✏️ WRITE: saving edited team "${teamId}" with name "${trimmed}"`);
      await updateDoc(doc(database, "tournaments", tournamentName, "teams", teamId), { name: trimmed, imgLink: newImgLink.trim() });
      setTeams(teams.map(t => t.id === teamId ? { ...t, name: trimmed, imgLink: newImgLink.trim() } : t));
      setEditingTeamId(null);
    } catch (e) { console.error("Failed to save team:", e); }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      console.log(`✏️ WRITE: deleting team doc "${teamId}"`);
      await deleteDoc(doc(database, "tournaments", tournamentName, "teams", teamId));
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setDeletingTeamId(null);
    } catch (e) { console.error("Failed to delete team:", e); }
  };

  const handleBack = () => {
    if (!backBtnRef.current) { router.push("/"); return; }
    gsap.timeline()
      .to(backBtnRef.current, { scale: 0.92, boxShadow: "0 0 32px rgba(200,170,110,0.5), 0 0 80px rgba(200,170,110,0.2)", duration: 0.18, ease: "power2.in" })
      .to(backBtnRef.current, { opacity: 0, y: -14, scale: 1.04, duration: 0.32, ease: "power2.out", onComplete: () => router.push("/") });
  };

  if (!isAdmin) return (
    <HeroRoot>
      <BgBase />
      <HexGrid />
      <Vignette />
      <div style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        gap: "18px",
      }}>
        <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
          <path d="M21 4 L38 36 L4 36 Z" stroke="rgba(200,170,110,0.4)" strokeWidth="1.2" fill="rgba(200,170,110,0.04)" strokeLinejoin="round"/>
          <line x1="21" y1="16" x2="21" y2="26" stroke="rgba(200,170,110,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="21" cy="31" r="1.4" fill="rgba(200,170,110,0.7)"/>
        </svg>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.6rem",
          letterSpacing: "0.55em",
          textTransform: "uppercase",
          color: "rgba(200,170,110,0.5)",
          textAlign: "center",
        }}>
          Admin Permissions Required
        </div>
        <div style={{
          width: "120px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(200,170,110,0.3), transparent)",
        }}/>
      </div>
      <BackBar>
        <BackBtn style={{ opacity: 1 }} onClick={() => router.push("/")}>
          <BackLabel>Back</BackLabel>
          <BackUnderline />
        </BackBtn>
      </BackBar>
    </HeroRoot>
  );

  return (
    <HeroRoot>
      <BgBase />
      <HexGrid />
      <Vignette />
      <AnimCanvas ref={canvasRef} />
      <BgDecoSVG ringRefs={ringRefs} />

      {[{ $tl: true }, { $tr: true }, { $bl: true }, { $br: true }].map((props, i) => (
        <CornerSVG key={i} viewBox="0 0 90 90" fill="none" ref={el => { cornersRef.current[i] = el; }} {...props}>
          <path d="M5 50 L5 5 L50 5"    stroke="#c8aa6e" strokeWidth="0.9" strokeOpacity="0.55"/>
          <path d="M5 5 L22 5"          stroke="#c8aa6e" strokeWidth="1.6" strokeOpacity="0.85"/>
          <path d="M5 5 L5 22"          stroke="#c8aa6e" strokeWidth="1.6" strokeOpacity="0.85"/>
          <path d="M14 5 L14 14 L5 14"  stroke="rgba(200,170,110,0.22)" strokeWidth="0.5"/>
          <circle cx="5" cy="5" r="2.5" fill="rgba(200,170,110,0.35)" stroke="#c8aa6e" strokeWidth="0.7"/>
          <circle cx="5" cy="5" r="0.9" fill="#f0e6d2" opacity="0.8"/>
        </CornerSVG>
      ))}

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

      <PhaseContainer ref={phaseContainerRef}>
        <PhaseNavBtn disabled={phase === 1} onClick={handlePrevPhase}><span>Prev Phase</span></PhaseNavBtn>
        <PhaseTabsContainer>
          {[1, 2, 3].map((p) => (
            <PhaseTab key={p}>
              <PhaseTabCircle $active={phase === p}><span>{p}</span></PhaseTabCircle>
              <PhaseTabLabel $active={phase === p}>{p === 1 ? "Teams" : p === 2 ? "Matches" : "Results"}</PhaseTabLabel>
            </PhaseTab>
          ))}
        </PhaseTabsContainer>
        <PhaseNavBtn disabled={phase === 3 || (phase === 2 && !bracketComplete)} onClick={handleNextPhase}><span>Next Phase</span></PhaseNavBtn>
      </PhaseContainer>

      {phase === 1 && (
        <PhaseContentContainer>
          <TopActionRow>
            <AddTeamsBtn onClick={() => setShowAddTeamsModal(true)}><span>Set Teams</span></AddTeamsBtn>
            <ParticipantsBtn onClick={() => setShowParticipantsModal(true)}>
              <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="9" cy="7" r="3.5" stroke="rgba(200,170,110,0.9)" strokeWidth="1.4"/>
                  <path d="M2 20c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="rgba(200,170,110,0.9)" strokeWidth="1.4" strokeLinecap="round"/>
                  <circle cx="18" cy="7" r="2.5" stroke="rgba(200,170,110,0.6)" strokeWidth="1.2"/>
                  <path d="M22 20c0-2.761-1.79-5-4-5.5" stroke="rgba(200,170,110,0.6)" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Participants
              </span>
            </ParticipantsBtn>
          </TopActionRow>

          <TeamsGrid>
            {teams.map((team, i) => (
              <TeamCard key={team.id} ref={el => { cardRefs.current[i] = el; }}>
                <TeamCardScan />
                <CardCorner style={{ top: 0, left: 0 }} />
                <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
                <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
                <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
                <TeamCardImageWrapper>
                  <TeamCardImage src={team.imgLink || "/question.jpg"} alt={team.name} onError={e => { e.target.src = "/question.jpg"; }} style={{ filter: team.imgLink ? "none" : "grayscale(0.3) opacity(0.5)" }} />
                  <TeamCardEditBtn onClick={() => setEditingTeamId(team.id)}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </TeamCardEditBtn>
                  <TeamCardDeleteBtn onClick={() => setDeletingTeamId(team.id)}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </TeamCardDeleteBtn>
                </TeamCardImageWrapper>
                <TeamCardContent>
                  <TeamCardName>{team.name}</TeamCardName>
                  <TeamCardMembers>
                    {team.members && team.members.length > 0
                      ? team.members.map((member, idx) => (
                          <MemberItem key={idx}>
                            <MemberAvatar src={memberImages[member] || "/question.jpg"} alt={member} onError={e => { e.target.src = "/question.jpg"; }} />
                            {member}
                            <RemoveBtn onClick={() => handleRemoveMember(team.id, member)}>-</RemoveBtn>
                          </MemberItem>
                        ))
                      : <MemberItem style={{ color: "rgba(200,170,110,0.4)" }}>No members yet</MemberItem>
                    }
                  </TeamCardMembers>
                  <TeamCardButtonGroup>
                    <TeamCardBtn onClick={() => { setSelectedTeamId(team.id); setShowAddMembersModal(true); }}>Add Member</TeamCardBtn>
                    <TeamCardBtn onClick={() => handleAddRandomMember(team.id)}>Random</TeamCardBtn>
                  </TeamCardButtonGroup>
                </TeamCardContent>
              </TeamCard>
            ))}
          </TeamsGrid>
        </PhaseContentContainer>
      )}

      {phase === 2 && (
        <PhaseContentContainer>
          <BracketView teams={teams} tournamentName={tournamentName} onCompletionChange={setBracketComplete} format={tournamentFormat} />
        </PhaseContentContainer>
      )}  

      {phase === 3 && (
        <PhaseContentContainer>
          <ResultsView teams={teams} tournamentName={tournamentName} format={tournamentFormat} participants={participants} router={router} />
        </PhaseContentContainer>
      )}

      {showAddTeamsModal && (
        <ModalBackdrop onClick={() => setShowAddTeamsModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalScanLine />
            <CardCorner style={{ top: 0, left: 0 }} />
            <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
            <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
            <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
            <ModalTitle>Set Number of Teams</ModalTitle>
            <ModalDivider />
            <ModalField>
              <ModalLabel>Number of Teams</ModalLabel>
              <ModalInput type="number" min="1" placeholder="Enter a number..." value={teamCountInput} onChange={e => setTeamCountInput(e.target.value)} />
            </ModalField>
            <ModalFooter>
              <ModalBtn onClick={() => setShowAddTeamsModal(false)}>Cancel</ModalBtn>
              <ModalBtn $primary onClick={handleAddTeams}>Create</ModalBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {showAddMembersModal && (
        <ModalBackdrop onClick={() => setShowAddMembersModal(false)}>
          <ModalBox onClick={e => e.stopPropagation()}>
            <ModalScanLine />
            <CardCorner style={{ top: 0, left: 0 }} />
            <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
            <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
            <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
            <ModalTitle>Add Members to Team</ModalTitle>
            <ModalDivider />
            <MemberCheckboxContainer>
              {getAvailableParticipants().map((participant) => (
                <MemberCheckboxRow key={participant} onClick={() => {
                  const newSet = new Set(selectedMembers);
                  if (newSet.has(participant)) newSet.delete(participant); else newSet.add(participant);
                  setSelectedMembers(newSet);
                }}>
                  <MemberCheckbox $checked={selectedMembers.has(participant)}>
                    {selectedMembers.has(participant) && (
                      <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                        <path d="M1 6 L4 9 L11 2" stroke="rgba(200,170,110,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </MemberCheckbox>
                  <MemberName $checked={selectedMembers.has(participant)}>{participant}</MemberName>
                </MemberCheckboxRow>
              ))}
            </MemberCheckboxContainer>
            <SelectedCount>{selectedMembers.size} selected</SelectedCount>
            <ModalFooter>
              <ModalBtn onClick={() => { setShowAddMembersModal(false); setSelectedMembers(new Set()); }}>Cancel</ModalBtn>
              <ModalBtn $primary onClick={handleAddMembersToTeam}>Add Selected</ModalBtn>
            </ModalFooter>
          </ModalBox>
        </ModalBackdrop>
      )}

      {editingTeamId && (
        <EditTeamModalComponent
          team={teams.find(t => t.id === editingTeamId)}
          onClose={() => setEditingTeamId(null)}
          onSave={handleSaveEditTeam}
        />
      )}

      {deletingTeamId && (
        <DeleteConfirmBackdrop onClick={() => setDeletingTeamId(null)}>
          <DeleteConfirmBox onClick={e => e.stopPropagation()}>
            <CardCorner style={{ top: 0, left: 0 }} />
            <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
            <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
            <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
            <DeleteConfirmTitle>Delete Team</DeleteConfirmTitle>
            <DeleteConfirmText>
              Are you sure you want to delete<br/>
              <span style={{ color: '#f0e6d2', letterSpacing: '0.1em' }}>
                {teams.find(t => t.id === deletingTeamId)?.name || 'this team'}
              </span>?<br/>
              This cannot be undone.
            </DeleteConfirmText>
            <DeleteConfirmButtons>
              <ModalBtn onClick={() => setDeletingTeamId(null)}>Cancel</ModalBtn>
              <ModalBtn
                style={{ borderColor: 'rgba(200,80,80,0.6)', color: '#ff9999', background: 'rgba(200,80,80,0.1)' }}
                onClick={() => handleDeleteTeam(deletingTeamId)}
              >
                Delete
              </ModalBtn>
            </DeleteConfirmButtons>
          </DeleteConfirmBox>
        </DeleteConfirmBackdrop>
      )}

      {showParticipantsModal && (
        <ModalBackdrop onClick={() => { setShowParticipantsModal(false); setParticipantSearch(""); setMemberSearch(""); }}>
          <SplitModalBox onClick={e => e.stopPropagation()}>
            <ModalScanLine />
            <CardCorner style={{ top: 0, left: 0 }} />
            <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
            <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
            <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
            <ModalTitle style={{ marginBottom: 20 }}>Manage Participants</ModalTitle>
            <ModalDivider />
            <SplitBody>
              <SplitPanel>
                <SplitPanelTitle>Participants ({participants.length})</SplitPanelTitle>
                <SplitSearchInput placeholder="Search participants..." value={participantSearch} onChange={e => setParticipantSearch(e.target.value)} />
                <SplitList>
                  {participants.filter(p => p.toLowerCase().includes(participantSearch.toLowerCase())).map(p => (
                    <SplitRow key={p}>
                      <SplitAvatar src={memberImages[p] || "/question.jpg"} alt={p} onError={e => { e.target.src = "/question.jpg"; }} />
                      <SplitName>{p}</SplitName>
                      <SplitActionBtn $remove onClick={() => handleRemoveParticipant(p)}>−</SplitActionBtn>
                    </SplitRow>
                  ))}
                  {participants.filter(p => p.toLowerCase().includes(participantSearch.toLowerCase())).length === 0 && (
                    <SplitRow><SplitName style={{ color: "rgba(200,170,110,0.3)", fontStyle: "italic" }}>No results</SplitName></SplitRow>
                  )}
                </SplitList>
                <SplitCount>{participants.length} total</SplitCount>
              </SplitPanel>
              <SplitDivider />
              <SplitPanel>
                <SplitPanelTitle>All Members ({allMembers.length})</SplitPanelTitle>
                <SplitSearchInput placeholder="Search members..." value={memberSearch} onChange={e => setMemberSearch(e.target.value)} />
                <SplitList>
                  {allMembers.filter(m => m.id.toLowerCase().includes(memberSearch.toLowerCase())).map(m => {
                    const isParticipant = participants.includes(m.id);
                    return (
                      <SplitRow key={m.id} style={{ opacity: isParticipant ? 0.4 : 1 }}>
                        <SplitAvatar src={memberImages[m.id] || "/question.jpg"} alt={m.id} onError={e => { e.target.src = "/question.jpg"; }} />
                        <SplitName>{m.id}</SplitName>
                        {!isParticipant && (<SplitActionBtn onClick={() => handleAddParticipant(m.id)}>+</SplitActionBtn>)}
                      </SplitRow>
                    );
                  })}
                  {allMembers.filter(m => m.id.toLowerCase().includes(memberSearch.toLowerCase())).length === 0 && (
                    <SplitRow><SplitName style={{ color: "rgba(200,170,110,0.3)", fontStyle: "italic" }}>No results</SplitName></SplitRow>
                  )}
                </SplitList>
                <SplitCount>{allMembers.length} total</SplitCount>
              </SplitPanel>
            </SplitBody>
            <ModalFooter>
              <ModalBtn onClick={() => { setShowParticipantsModal(false); setParticipantSearch(""); setMemberSearch(""); }}>Close</ModalBtn>
            </ModalFooter>
          </SplitModalBox>
        </ModalBackdrop>
      )}

      {showReactivateConfirm && (
        <DeleteConfirmBackdrop onClick={() => setShowReactivateConfirm(false)}>
          <DeleteConfirmBox onClick={e => e.stopPropagation()}>
            <CardCorner style={{ top: 0, left: 0 }} />
            <CardCorner style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
            <CardCorner style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
            <CardCorner style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />
            <DeleteConfirmTitle style={{ color: 'rgba(200,170,110,0.9)' }}>Reopen Tournament?</DeleteConfirmTitle>
            <DeleteConfirmText>
              This tournament is <span style={{ color: '#f0e6d2' }}>finalized</span>.<br/>
              Going back will mark it as<br/>
              <span style={{ color: 'rgba(100,200,140,0.9)', letterSpacing: '0.1em' }}>ongoing</span> again.
            </DeleteConfirmText>
            <DeleteConfirmButtons>
              <ModalBtn onClick={() => setShowReactivateConfirm(false)}>Cancel</ModalBtn>
              <ModalBtn
                $primary
                onClick={handleConfirmReactivate}
              >
                Confirm
              </ModalBtn>
            </DeleteConfirmButtons>
          </DeleteConfirmBox>
        </DeleteConfirmBackdrop>
      )}

      {randomReveal && (
        <RandomRevealOverlay
          member={randomReveal.member}
          imgSrc={randomReveal.imgSrc}
          onDismiss={() => setRandomReveal(null)}
          onConfirm={handleConfirmRandomMember}
        />
      )}

      <BackBar>
        <BackBtn ref={backBtnRef} onClick={handleBack}>
          <BackLabel>Back</BackLabel>
          <BackUnderline />
        </BackBtn>
      </BackBar>
    </HeroRoot>
  );
}