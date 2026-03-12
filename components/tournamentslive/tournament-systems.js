"use client";
import { useEffect, useRef, useState } from "react";
import styled, { keyframes, css } from "styled-components";

// ─── Shared keyframes (used internally) ──────────────────────────────────────

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

// ─── Bracket Styled Components ────────────────────────────────────────────────

export const BracketContainer = styled.div`
  width: 100%;
  height: clamp(340px, 72vh, 900px);
  overflow: hidden;
  position: relative;
  cursor: grab;
  touch-action: none;
  overscroll-behavior: none;
  background:
    repeating-linear-gradient(
      60deg, rgba(200,170,110,0.012) 0, transparent 1px, transparent 22px
    ),
    linear-gradient(180deg, rgba(2,3,6,0.82) 0%, rgba(4,5,10,0.78) 100%);
  border: 1px solid rgba(200,170,110,0.12);
  clip-path: polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px);
  &:active { cursor: grabbing; }
`;

export const BracketInner = styled.div`
  position: absolute;
  transform-origin: 0 0;
  user-select: none;
`;

export const BracketSectionLabel = styled.div`
  position: absolute;
  font-family: 'Cinzel', serif;
  font-size: 0.55rem;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.45);
  white-space: nowrap;
`;

export const BracketRoundLabel = styled.div`
  position: absolute;
  font-family: 'Cinzel', serif;
  font-size: 0.44rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.25);
  white-space: nowrap;
  transform: translateX(-50%);
`;

export const MatchCard = styled.div`
  position: absolute;
  width: 240px;
  background: ${p => p.$placement
    ? 'linear-gradient(135deg, rgba(10,11,18,0.97), rgba(16,14,22,0.97))'
    : 'linear-gradient(135deg, rgba(10,11,18,0.97), rgba(14,12,20,0.97))'};
  border: 1px solid ${p => p.$complete
    ? 'rgba(200,170,110,0.5)'
    : p.$placement
      ? 'rgba(180,140,100,0.2)'
      : 'rgba(200,170,110,0.28)'};
  clip-path: polygon(7px 0%, calc(100% - 7px) 0%, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0% calc(100% - 7px), 0% 7px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  cursor: ${p => (p.$pending || p.$watchable) ? 'pointer' : 'default'};

  ${p => p.$pending && css`
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(200,170,110,0.06) 0%, transparent 60%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      z-index: 1;
    }
    &::after {
      content: '';
      position: absolute;
      top: 0; left: -50%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(200,170,110,0.09), transparent);
      transform: skewX(-18deg);
      transition: none;
      pointer-events: none;
      z-index: 2;
    }
    &:hover {
      border-color: rgba(200,170,110,0.85);
      box-shadow:
        0 0 12px rgba(200,170,110,0.2),
        0 0 28px rgba(200,170,110,0.12),
        0 0 2px rgba(200,170,110,0.5) inset;
    }
    &:hover::before {
      opacity: 1;
    }
    &:hover::after {
      animation: ${cardShimmer} 0.65s ease forwards;
    }
  `}
`;

export const MatchTeamSlot = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  flex: 1;
  min-height: 46px;
  background: ${p => p.$winner
    ? 'rgba(200,170,110,0.14)'
    : p.$pending
      ? 'rgba(200,170,110,0.015)'
      : 'transparent'};
  opacity: ${p => p.$bye ? 0.3 : 1};
  transition: background 0.2s ease;
  cursor: ${p => p.$clickable ? 'pointer' : 'inherit'};
  position: relative;

  ${p => p.$clickable && css`
    &:hover { background: rgba(200,170,110,0.12); }
    &:active { background: rgba(200,170,110,0.2); }
  `}

  ${p => p.$loser && css`
    opacity: 0.35;
    filter: grayscale(0.4);
  `}
`;

export const MatchTeamImg = styled.img`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid rgba(200,170,110,0.2);
`;

export const MatchTeamName = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: rgba(200,170,110,0.9);
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
`;

export const MatchPendingSlot = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 0.55rem;
  letter-spacing: 0.25em;
  color: rgba(200,170,110,0.2);
  text-transform: uppercase;
  padding: 2px 0;
`;

export const MatchLightningRow = styled.div`
  display: flex;
  align-items: center;
  padding: 0 12px;
  height: 18px;
  gap: 6px;
`;

export const PlacementBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Cinzel', serif;
  font-size: 0.4rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.6);
  background: rgba(10,11,18,0.95);
  padding: 2px 8px;
  border: 1px solid rgba(200,170,110,0.2);
  white-space: nowrap;
`;

export const BracketZoomHint = styled.div`
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-family: 'Cinzel', serif;
  font-size: 0.32rem;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.2);
  pointer-events: none;
`;

export const WinnerCrown = styled.div`
  font-size: 0.7rem;
  line-height: 1;
  margin-right: 2px;
  flex-shrink: 0;
`;

// ─── Pick Winner Modal Styled Components ──────────────────────────────────────

export const PickWinnerBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(2,3,6,0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${modalBackdropIn} 0.2s ease forwards;
`;

export const PickWinnerBox = styled.div`
  position: relative;
  background: linear-gradient(160deg, rgba(10,11,18,0.99) 0%, rgba(14,15,24,0.97) 100%);
  border: 1px solid rgba(200,170,110,0.4);
  clip-path: polygon(18px 0%, calc(100% - 18px) 0%, 100% 18px, 100% calc(100% - 18px), calc(100% - 18px) 100%, 18px 100%, 0% calc(100% - 18px), 0% 18px);
  width: clamp(300px, 90vw, 420px);
  padding: 32px 28px 26px;
  animation: ${modalSlideIn} 0.28s cubic-bezier(0.22,1,0.36,1) forwards;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(60deg, rgba(200,170,110,0.012) 0, transparent 1px, transparent 18px);
    pointer-events: none;
    z-index: 0;
  }
`;

const PickWinnerTitle = styled.h2`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.9);
  margin: 0 0 6px;
  text-align: center;
  text-shadow: 0 0 20px rgba(200,170,110,0.4);
`;

const PickWinnerSub = styled.p`
  position: relative;
  z-index: 1;
  font-family: 'Cinzel', serif;
  font-size: 0.42rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.35);
  text-align: center;
  margin: 0 0 20px;
`;

const PickWinnerDivider = styled.div`
  position: relative;
  z-index: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(200,170,110,0.35) 30%, rgba(200,170,110,0.6) 50%, rgba(200,170,110,0.35) 70%, transparent);
  margin: 0 0 22px;
`;

const PickWinnerOption = styled.button`
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: rgba(200,170,110,0.04);
  border: 1px solid rgba(200,170,110,0.2);
  clip-path: polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px);
  cursor: pointer;
  margin-bottom: 10px;
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  text-align: left;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(200,170,110,0.07), transparent);
    transform: translateX(-100%);
    transition: transform 0.4s ease;
    pointer-events: none;
  }

  &:hover {
    background: rgba(200,170,110,0.12);
    border-color: rgba(200,170,110,0.6);
    box-shadow: 0 0 20px rgba(200,170,110,0.12);
    &::after { transform: translateX(100%); }
  }
  &:active { transform: scale(0.99); }
  &:last-of-type { margin-bottom: 0; }
`;

const PickWinnerOptionImg = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid rgba(200,170,110,0.3);
  flex-shrink: 0;
`;

const PickWinnerOptionName = styled.span`
  font-family: 'Cinzel', serif;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #f0e6d2;
  text-transform: uppercase;
  flex: 1;
`;

const PickWinnerCancel = styled.button`
  position: relative;
  z-index: 1;
  display: block;
  margin: 18px auto 0;
  font-family: 'Cinzel', serif;
  font-size: 0.48rem;
  font-weight: 600;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(200,170,110,0.35);
  background: transparent;
  border: 1px solid rgba(200,170,110,0.12);
  padding: 8px 24px;
  clip-path: polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;

  &:hover { color: rgba(200,170,110,0.75); border-color: rgba(200,170,110,0.35); }
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

// ─── Card Corner (shared small utility) ──────────────────────────────────────

export function CardCornerBracket({ style }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
      style={{ position: "absolute", pointerEvents: "none", zIndex: 4, ...style }}>
      <path d="M1 9 L1 1 L9 1" stroke="rgba(200,170,110,0.55)" strokeWidth="1"/>
      <circle cx="1" cy="1" r="1" fill="rgba(200,170,110,0.5)"/>
    </svg>
  );
}

// ─── Pick Winner Modal Component ──────────────────────────────────────────────

export function PickWinnerModal({ match, teamMap, onClose, onPickWinner, onUndecided }) {
  const resolveTeam = (id, name, img) => {
    if (!id || id === 'bye') return null;
    const t = teamMap[id];
    return { id, name: t?.name || name || '?', img: t?.imgLink || img || null };
  };

  const t1 = resolveTeam(match.team1Id, match.team1Name, match.team1Img);
  const t2 = resolveTeam(match.team2Id, match.team2Name, match.team2Img);
  const options = [t1, t2].filter(Boolean);

  return (
    <PickWinnerBackdrop onClick={onClose}>
      <PickWinnerBox onClick={e => e.stopPropagation()}>
        <ModalScanLine />
        <CardCornerBracket style={{ top: 0, left: 0 }} />
        <CardCornerBracket style={{ top: 0, right: 0, transform: "scaleX(-1)" }} />
        <CardCornerBracket style={{ bottom: 0, left: 0, transform: "scaleY(-1)" }} />
        <CardCornerBracket style={{ bottom: 0, right: 0, transform: "scale(-1)" }} />

        <PickWinnerTitle>Select Winner</PickWinnerTitle>
        <PickWinnerSub>
          {match.status === 'complete'
            ? 'Pick a new winner or mark as undecided'
            : 'Click the winning team to advance them'}
        </PickWinnerSub>
        <PickWinnerDivider />

        {options.map(team => (
          <PickWinnerOption key={team.id} onClick={() => onPickWinner(match, team.id)}>
            <PickWinnerOptionImg
              src={team.img || '/question.jpg'}
              alt={team.name}
              onError={e => { e.target.src = '/question.jpg'; }}
            />
            <PickWinnerOptionName>{team.name}</PickWinnerOptionName>
            <span style={{ color: 'rgba(200,170,110,0.4)', fontSize: '1rem' }}>›</span>
          </PickWinnerOption>
        ))}

        {match.status === 'complete' && (
          <PickWinnerOption
            onClick={() => onUndecided(match)}
            style={{ borderColor: 'rgba(200,80,80,0.3)', marginTop: 10 }}
          >
            <span style={{ fontSize: '1.1rem', marginRight: 2, color: 'rgba(220,100,100,0.85)' }}>↩</span>
            <PickWinnerOptionName style={{ color: 'rgba(220,120,100,0.9)' }}>
              Mark as Undecided
            </PickWinnerOptionName>
          </PickWinnerOption>
        )}

        <PickWinnerCancel onClick={onClose}>Cancel</PickWinnerCancel>
      </PickWinnerBox>
    </PickWinnerBackdrop>
  );
}

// ─── Bracket Generation: Single Elimination ───────────────────────────────────

export function generateSingleElimBracket(teams) {
  if (!teams || teams.length < 2) return [];
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const totalSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(shuffled.length, 2))));
  let mid = 0;
  const nid = () => `m${++mid}`;
  const allMatches = [];

  const mkMatch = (overrides) => ({
    id: nid(), round: 0, position: 0, type: 'winner',
    team1Id: null, team1Name: null, team1Img: null,
    team2Id: null, team2Name: null, team2Img: null,
    winner: null, status: 'pending', isBye: false, isGhost: false,
    fromMatch1: null, fromMatch2: null,
    nextWinnerMatch: null, nextLoserMatch: null,
    ...overrides,
  });

  const seeded = new Array(totalSlots).fill(null);
  for (let i = 0; i < shuffled.length; i++) seeded[i] = shuffled[i];

  let prev = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const t1 = seeded[i], t2 = seeded[i + 1];
    const isGhost = !t1 && !t2;
    if (isGhost) continue;
    const isBye = !t1 || !t2;
    const m = mkMatch({
      round: 1, position: prev.length, type: 'winner',
      team1Id: t1?.id ?? null, team1Name: t1?.name ?? null, team1Img: t1?.imgLink ?? null,
      team2Id: t2?.id ?? null, team2Name: t2?.name ?? null, team2Img: t2?.imgLink ?? null,
      winner: isBye ? (t1?.id ?? t2?.id ?? null) : null,
      status: isBye ? 'complete' : 'pending',
      isBye,
    });
    prev.push(m);
    allMatches.push(m);
  }

  let round = 2;
  while (prev.length > 1) {
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      const m1 = prev[i], m2 = prev[i + 1];
      if (!m2) { next.push(m1); continue; }
      const m = mkMatch({ round, position: next.length, type: 'winner', fromMatch1: m1.id, fromMatch2: m2.id });
      m1.nextWinnerMatch = m.id;
      m2.nextWinnerMatch = m.id;
      next.push(m);
      allMatches.push(m);
    }
    prev = next;
    round++;
  }

let changed = true;
while (changed) {
  changed = false;
  // Only propagate bye winners — never pre-fill real match results
  for (const m of allMatches.filter(x => x.isBye && x.winner && x.nextWinnerMatch)) {
    const next = allMatches.find(x => x.id === m.nextWinnerMatch);
    if (!next) continue;
    const t = teams.find(t => t.id === m.winner);
    const f1 = next.fromMatch1 === m.id;
    if (f1 && !next.team1Id) {
      next.team1Id = m.winner; next.team1Name = t?.name ?? null; next.team1Img = t?.imgLink ?? null;
      changed = true;
    } else if (!f1 && !next.team2Id) {
      next.team2Id = m.winner; next.team2Name = t?.name ?? null; next.team2Img = t?.imgLink ?? null;
      changed = true;
    }
  }
  for (const m of allMatches.filter(x => x.type === 'winner' && x.status !== 'complete' && x.fromMatch1 && x.fromMatch2)) {
    const s1 = allMatches.find(x => x.id === m.fromMatch1);
    const s2 = allMatches.find(x => x.id === m.fromMatch2);
    if (!s1 || !s2 || s1.status !== 'complete' || s2.status !== 'complete') continue;
    if (s1.winner && !s2.winner) { m.isBye = true; m.winner = s1.winner; m.status = 'complete'; changed = true; }
    else if (!s1.winner && s2.winner) { m.isBye = true; m.winner = s2.winner; m.status = 'complete'; changed = true; }
  }
}
  return allMatches;
}



// ─── Bracket Generation: Double Elimination ──────────────────────────────────

export function generateDoubleElimBracket(teams) {
  if (!teams || teams.length < 2) return [];
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const totalSlots = Math.pow(2, Math.ceil(Math.log2(Math.max(shuffled.length, 2))));

  let mid = 0;
  const nid = () => `m${++mid}`;
  const allMatches = [];

  const mkMatch = (overrides) => ({
    id: nid(),
    round: 0, position: 0, type: 'winner',
    team1Id: null, team1Name: null, team1Img: null,
    team2Id: null, team2Name: null, team2Img: null,
    winner: null, status: 'pending',
    isBye: false, isGhost: false,
    fromMatch1: null, fromMatch2: null,
    nextWinnerMatch: null, nextLoserMatch: null,
    ...overrides,
  });

  const seeded = new Array(totalSlots).fill(null);
  for (let i = 0; i < shuffled.length; i++) seeded[i] = shuffled[i];

  let wbPrev = [];
  for (let i = 0; i < seeded.length; i += 2) {
    const t1 = seeded[i], t2 = seeded[i + 1];
    const isGhost = !t1 && !t2;
    const isBye   = !isGhost && (!t1 || !t2);
    if (isGhost) continue;
    const m = mkMatch({
      round: 1, position: wbPrev.length, type: 'winner',
      team1Id: t1?.id ?? null, team1Name: t1?.name ?? null, team1Img: t1?.imgLink ?? null,
      team2Id: t2?.id ?? null, team2Name: t2?.name ?? null, team2Img: t2?.imgLink ?? null,
      winner: isBye ? (t1?.id ?? t2?.id ?? null) : null,
      status: (isBye || isGhost) ? 'complete' : 'pending',
      isBye, isGhost: false,
    });
    wbPrev.push(m);
    allMatches.push(m);
  }

  let wbRound = 2;
  const wbRoundsList = [wbPrev];
  while (wbPrev.length > 1) {
    const thisRound = [];
    for (let i = 0; i < wbPrev.length; i += 2) {
      const m1 = wbPrev[i], m2 = wbPrev[i + 1];
      if (!m2) { thisRound.push(m1); continue; }
      const m = mkMatch({ round: wbRound, position: i / 2, type: 'winner', fromMatch1: m1.id, fromMatch2: m2.id });
      m1.nextWinnerMatch = m.id;
      m2.nextWinnerMatch = m.id;
      thisRound.push(m);
      allMatches.push(m);
    }
    wbRoundsList.push(thisRound);
    wbPrev = thisRound;
    wbRound++;
  }
  const wbFinal = wbPrev[0];
  const maxWR = wbRound - 1;

let changed = true;
while (changed) {
  changed = false;
  // Only propagate bye winners — never pre-fill real match results
  for (const m of allMatches.filter(x => x.isBye && x.winner && x.nextWinnerMatch && x.type === 'winner')) {
    const next = allMatches.find(x => x.id === m.nextWinnerMatch);
    if (!next) continue;
    const wt = shuffled.find(t => t?.id === m.winner);
    const f1 = next.fromMatch1 === m.id;
    if (f1 && !next.team1Id) {
      next.team1Id = m.winner; next.team1Name = wt?.name ?? null; next.team1Img = wt?.imgLink ?? null;
      changed = true;
    } else if (!f1 && !next.team2Id) {
      next.team2Id = m.winner; next.team2Name = wt?.name ?? null; next.team2Img = wt?.imgLink ?? null;
      changed = true;
    }
  }
    for (const m of allMatches.filter(x => x.type === 'winner')) {
      if (m.status === 'complete') continue;
      if (!m.fromMatch1 || !m.fromMatch2) continue;
      const s1 = allMatches.find(x => x.id === m.fromMatch1);
      const s2 = allMatches.find(x => x.id === m.fromMatch2);
      if (!s1 || !s2 || s1.status !== 'complete' || s2.status !== 'complete') continue;
      if (s1.winner && !s2.winner) { m.isBye = true; m.winner = s1.winner; m.status = 'complete'; changed = true; }
      else if (!s1.winner && s2.winner) { m.isBye = true; m.winner = s2.winner; m.status = 'complete'; changed = true; }
      else if (!s1.winner && !s2.winner) { m.isGhost = true; m.status = 'complete'; changed = true; }
    }
    for (const m of allMatches.filter(x => x.type === 'winner')) {
      if (m.status === 'complete') continue;
      const s1 = m.fromMatch1 ? allMatches.find(x => x.id === m.fromMatch1) : null;
      const s2 = m.fromMatch2 ? allMatches.find(x => x.id === m.fromMatch2) : null;
      if (s1 && !s2 && s1.status === 'complete' && s1.winner) { m.isBye = true; m.winner = s1.winner; m.status = 'complete'; changed = true; }
      else if (s2 && !s1 && s2.status === 'complete' && s2.winner) { m.isBye = true; m.winner = s2.winner; m.status = 'complete'; changed = true; }
    }
  }

  const LB_ROUND_BASE = 100;
  let lbRoundNum = 1;
  let lbSlots = [];

  const addLBMatch = (pos, slot1, slot2) => {
    const m = mkMatch({ round: LB_ROUND_BASE + lbRoundNum, position: pos, type: 'loser' });
    const wire = (slot, isFirst) => {
      if (slot.type === 'match') {
        const src = allMatches.find(x => x.id === slot.matchId);
        if (!src) return;
        if (isFirst) m.fromMatch1 = src.id; else m.fromMatch2 = src.id;
        if (slot.srcSlot === 'loser') src.nextLoserMatch = m.id;
        else src.nextWinnerMatch = m.id;
      } else {
        const src = allMatches.find(x => x.id === slot.srcMatchId);
        if (!src) return;
        if (isFirst) m.fromMatch1 = src.id; else m.fromMatch2 = src.id;
        if (slot.srcSlot === 'loser') src.nextLoserMatch = m.id;
        else src.nextWinnerMatch = m.id;
      }
    };
    wire(slot1, true);
    wire(slot2, false);
    allMatches.push(m);
    return m;
  };

  const wbRealByRound = (r) =>
    allMatches.filter(m => m.type === 'winner' && m.round === r && !m.isGhost);

  const wbR1real = wbRealByRound(1).filter(m => !m.isGhost && !m.isBye);
  if (wbR1real.length >= 2) {
    const newSlots = [];
    for (let i = 0; i + 1 < wbR1real.length; i += 2) {
      const lbm = addLBMatch(newSlots.length,
        { type: 'match', matchId: wbR1real[i].id,     srcSlot: 'loser' },
        { type: 'match', matchId: wbR1real[i + 1].id, srcSlot: 'loser' },
      );
      newSlots.push({ type: 'match', matchId: lbm.id, srcSlot: 'winner' });
    }
    if (wbR1real.length % 2 === 1) {
      const last = wbR1real[wbR1real.length - 1];
      newSlots.push({ type: 'bye', srcMatchId: last.id, srcSlot: 'loser' });
    }
    lbSlots = newSlots;
    lbRoundNum++;
  } else if (wbR1real.length === 1) {
    lbSlots = [{ type: 'bye', srcMatchId: wbR1real[0].id, srcSlot: 'loser' }];
  }

  for (let wbR = 2; wbR <= maxWR; wbR++) {
    const dropIns = wbRealByRound(wbR).filter(m => !m.isGhost && !m.isBye);
    if (dropIns.length > 0) {
      const newSlots = [];
      const realSlots = lbSlots.filter(s => s.type === 'match');
      const byeSlots  = lbSlots.filter(s => s.type === 'bye');
      const pairCount = Math.min(realSlots.length, dropIns.length);
      for (let i = 0; i < pairCount; i++) {
        const lbm = addLBMatch(newSlots.length, realSlots[i], { type: 'match', matchId: dropIns[i].id, srcSlot: 'loser' });
        newSlots.push({ type: 'match', matchId: lbm.id, srcSlot: 'winner' });
      }
      for (let i = pairCount; i < realSlots.length; i++) newSlots.push({ type: 'bye', srcMatchId: realSlots[i].matchId, srcSlot: 'winner' });
      for (let i = pairCount; i < dropIns.length; i++) newSlots.push({ type: 'bye', srcMatchId: dropIns[i].id, srcSlot: 'loser' });
      newSlots.push(...byeSlots);
      lbSlots = newSlots;
      lbRoundNum++;
    }

    const realSlots = lbSlots.filter(s => s.type === 'match');
    const byeSlots  = lbSlots.filter(s => s.type === 'bye');
    if (realSlots.length >= 2) {
      const newSlots = [];
      for (let i = 0; i + 1 < realSlots.length; i += 2) {
        const lbm = addLBMatch(newSlots.length, realSlots[i], realSlots[i + 1]);
        newSlots.push({ type: 'match', matchId: lbm.id, srcSlot: 'winner' });
      }
      if (realSlots.length % 2 === 1) newSlots.push({ type: 'bye', srcMatchId: realSlots[realSlots.length - 1].matchId, srcSlot: 'winner' });
      newSlots.push(...byeSlots);
      lbSlots = newSlots;
      lbRoundNum++;
    }
  }

  while (true) {
    const realSlots = lbSlots.filter(s => s.type === 'match');
    const byeSlots  = lbSlots.filter(s => s.type === 'bye');
    if (realSlots.length <= 1) break;
    const newSlots = [];
    for (let i = 0; i + 1 < realSlots.length; i += 2) {
      const lbm = addLBMatch(newSlots.length, realSlots[i], realSlots[i + 1]);
      newSlots.push({ type: 'match', matchId: lbm.id, srcSlot: 'winner' });
    }
    if (realSlots.length % 2 === 1) newSlots.push({ type: 'bye', srcMatchId: realSlots[realSlots.length - 1].matchId, srcSlot: 'winner' });
    newSlots.push(...byeSlots);
    lbSlots = newSlots;
    lbRoundNum++;
  }

  const lbFinalistSlot = lbSlots[0] ?? null;
  let lbFinalMatchId = null;
  if (lbFinalistSlot?.type === 'match') lbFinalMatchId = lbFinalistSlot.matchId;
  else if (lbFinalistSlot?.type === 'bye') lbFinalMatchId = lbFinalistSlot.srcMatchId;

  if (lbFinalMatchId) {
    const lbFinalMatch = allMatches.find(x => x.id === lbFinalMatchId);
    const gf = mkMatch({
      round: LB_ROUND_BASE + lbRoundNum, position: 0,
      type: 'grand_final', label: 'Grand Final',
      fromMatch1: wbFinal.id, fromMatch2: lbFinalMatchId,
    });
    wbFinal.nextWinnerMatch = gf.id;
    if (lbFinalMatch) {
      if (lbFinalistSlot?.type === 'bye' && lbFinalistSlot.srcSlot === 'loser') lbFinalMatch.nextLoserMatch = gf.id;
      else lbFinalMatch.nextWinnerMatch = gf.id;
    }
    allMatches.push(gf);

    const thirdPlace = mkMatch({
      round: LB_ROUND_BASE + lbRoundNum + 1, position: 0,
      type: 'placement', label: '3rd Place',
      fromMatch1: lbFinalMatchId, fromMatch2: gf.id,
    });
    if (lbFinalMatch && lbFinalMatch.nextLoserMatch == null) lbFinalMatch.nextLoserMatch = thirdPlace.id;
    gf.nextLoserMatch = thirdPlace.id;
    allMatches.push(thirdPlace);
  }

  return allMatches;
}

// ─── BracketView Component ────────────────────────────────────────────────────

export function BracketView({ teams, tournamentName, onCompletionChange, format = "Double-Elimination", readOnly = false }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teamMap, setTeamMap] = useState({});
const getInitialScale = () => {
  if (typeof window === 'undefined') return 0.7;
  if (window.innerWidth < 480) return 0.35;
  if (window.innerWidth < 768) return 0.5;
  return 0.7;
};
const [scale, setScale] = useState(getInitialScale);
const [pan, setPan] = useState({ x: 40, y: 80 });
  const [pickingMatch, setPickingMatch] = useState(null);

  useEffect(() => {
    if (!onCompletionChange) return;
    const playable = matches.filter(m =>
      !m.isBye && !m.isGhost &&
      (m.type === 'winner' || m.type === 'loser' || m.type === 'grand_final' || m.type === 'placement')
    );
    const allDone = playable.length > 0 && playable.every(m => m.status === 'complete');
    onCompletionChange(allDone);
  }, [matches, onCompletionChange]);

  const containerRef = useRef(null);
  const wheelListenerRef = useRef(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const didPan = useRef(false);
  const scaleRef = useRef(scale);
  const panRef = useRef(pan);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  useEffect(() => {
    const map = {};
    teams.forEach(t => { map[t.id] = t; });
    setTeamMap(map);
  }, [teams]);

  const teamIds = teams.map(t => t.id).sort().join(',');
  const isInitializedRef = useRef(false);
  const unsubscribeMatchesRef = useRef(null);

  useEffect(() => {
    if (!tournamentName || teams.length < 2) { setLoading(false); return; }
    isInitializedRef.current = false;

    (async () => {
      setLoading(true);
      try {
        const { getDocs, collection, writeBatch, doc, onSnapshot } = await import("firebase/firestore");
        const { database } = await import("@/backend/Firebase");
        const snap = await getDocs(collection(database, "tournaments", tournamentName, "matches"));
        const currentTeamIds = new Set(teams.map(t => t.id));

        const bracketsAreStale = snap.empty || (() => {
          const bracketTeamIds = new Set();
          snap.docs.forEach(d => {
            const m = d.data();
            if (m.team1Id && !m.isGhost && !m.isBye) bracketTeamIds.add(m.team1Id);
            if (m.team2Id && !m.isGhost && !m.isBye) bracketTeamIds.add(m.team2Id);
          });
          for (const id of bracketTeamIds) { if (!currentTeamIds.has(id)) return true; }
          for (const id of currentTeamIds) { if (!bracketTeamIds.has(id)) return true; }
          return false;
        })();

        if (bracketsAreStale) {
          const deleteBatch = writeBatch(database);
          snap.docs.forEach(d => deleteBatch.delete(d.ref));
          await deleteBatch.commit();
          const generated =
            format === "Single-Elimination" ? generateSingleElimBracket(teams) :
                                             generateDoubleElimBracket(teams);
          const createBatch = writeBatch(database);
          generated.forEach(m => {
            const ref = doc(collection(database, "tournaments", tournamentName, "matches"));
            createBatch.set(ref, m);
          });
          await createBatch.commit();
        }

        // Unsubscribe any previous listener
        if (unsubscribeMatchesRef.current) unsubscribeMatchesRef.current();

        // Real-time listener — both admins see changes instantly
        unsubscribeMatchesRef.current = onSnapshot(
          collection(database, "tournaments", tournamentName, "matches"),
          (snapshot) => {
            const loaded = snapshot.docs.map(d => ({ ...d.data(), firestoreId: d.id }));
            setMatches(loaded);
            if (!isInitializedRef.current) {
              isInitializedRef.current = true;
              setLoading(false);
            }
          },
          (err) => { console.error("Match listener error:", err); setLoading(false); }
        );
      } catch (e) { console.error("Bracket error:", e); setLoading(false); }
    })();

    return () => {
      if (unsubscribeMatchesRef.current) {
        unsubscribeMatchesRef.current();
        unsubscribeMatchesRef.current = null;
      }
    };
  }, [tournamentName, teamIds]);

  // ── Pick winner ────────────────────────────────────────────────────────────
  const handlePickWinner = async (match, winnerId) => {
    setPickingMatch(null);
    const loserId = match.team1Id === winnerId ? match.team2Id : match.team1Id;

    const propagate = (list, sourceMatchId, teamId, slot) => {
      const src = list.find(m => m.id === sourceMatchId);
      if (!src || !teamId || teamId === 'bye') return list;
      const targetId = slot === 'winner' ? src.nextWinnerMatch : src.nextLoserMatch;
      if (!targetId) return list;
      const target = list.find(m => m.id === targetId);
      if (!target) return list;
      const feedsSlot1 = target.fromMatch1 === sourceMatchId;
      const team = teamMap[teamId] || teams.find(t => t.id === teamId);
      return list.map(m => {
        if (m.id !== targetId) return m;
        return feedsSlot1
          ? { ...m, team1Id: teamId, team1Name: team?.name || null, team1Img: team?.imgLink || null }
          : { ...m, team2Id: teamId, team2Name: team?.name || null, team2Img: team?.imgLink || null };
      });
    };

    let updated = matches.map(m => m.id !== match.id ? m : { ...m, winner: winnerId, status: 'complete' });
    updated = propagate(updated, match.id, winnerId, 'winner');
    updated = propagate(updated, match.id, loserId, 'loser');
    // Don't call setMatches here — the onSnapshot listener will update state

    try {
      const { collection: col, getDocs, writeBatch } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      const snap = await getDocs(col(database, "tournaments", tournamentName, "matches"));
      const changedIds = new Set(
        updated.filter((u, i) => {
          const orig = matches[i];
          return !orig || u.winner !== orig.winner || u.status !== orig.status ||
                 u.team1Id !== orig.team1Id || u.team2Id !== orig.team2Id;
        }).map(u => u.id)
      );
      const batch = writeBatch(database);
      snap.docs.forEach(d => {
        const u = updated.find(m => m.id === d.data().id);
        if (u && changedIds.has(u.id)) { const { firestoreId, ...data } = u; batch.update(d.ref, data); }
      });
      await batch.commit();
    } catch (e) { console.error("Failed to save winner:", e); }
  };

  const handleUndecideMatch = async (match) => {
    setPickingMatch(null);
    const collectAffected = (matchId, list, visited = new Set()) => {
      if (visited.has(matchId)) return list;
      visited.add(matchId);
      const m = list.find(x => x.id === matchId);
      if (!m) return list;
      list = list.map(x => x.id !== matchId ? x : { ...x, winner: null, status: 'pending' });
      for (const [nextId] of [[m.nextWinnerMatch], [m.nextLoserMatch]]) {
        if (!nextId) continue;
        const next = list.find(x => x.id === nextId);
        if (!next) continue;
        const f1 = next.fromMatch1 === matchId;
        list = list.map(x => {
          if (x.id !== nextId) return x;
          return f1
            ? { ...x, team1Id: null, team1Name: null, team1Img: null }
            : { ...x, team2Id: null, team2Name: null, team2Img: null };
        });
        if (next.winner) list = collectAffected(nextId, list, visited);
      }
      return list;
    };
    const updated = collectAffected(match.id, [...matches]);
    // Don't call setMatches here — the onSnapshot listener will update state

    try {
      const { collection: col, getDocs, writeBatch } = await import("firebase/firestore");
      const { database } = await import("@/backend/Firebase");
      const snap = await getDocs(col(database, "tournaments", tournamentName, "matches"));
      const changedIds = new Set(
        updated.filter((u) => {
          const orig = matches.find(m => m.id === u.id);
          return !orig || u.winner !== orig.winner || u.status !== orig.status ||
                 u.team1Id !== orig.team1Id || u.team2Id !== orig.team2Id;
        }).map(u => u.id)
      );
      const batch = writeBatch(database);
      snap.docs.forEach(d => {
        const u = updated.find(m => m.id === d.data().id);
        if (u && changedIds.has(u.id)) { const { firestoreId, ...data } = u; batch.update(d.ref, data); }
      });
      await batch.commit();
    } catch (e) { console.error("Failed to save undecide:", e); }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    

    const onWheel = e => {
            console.log('🖱️ Wheel fired, deltaY:', e.deltaY);

      e.preventDefault();
      e.stopPropagation();
      const rect = el.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const currentScale = scaleRef.current;
      const currentPan = panRef.current;
      const delta = e.deltaY * 0.001;
      const newScale = Math.max(0.2, Math.min(2.5, currentScale - delta));
      const bracketX = (mouseX - currentPan.x) / currentScale;
      const bracketY = (mouseY - currentPan.y) / currentScale;
      setScale(newScale);
      setPan({ x: mouseX - bracketX * newScale, y: mouseY - bracketY * newScale });
    };

    // pinch-to-zoom
    let lastDist = null;
    const onTouchMove = e => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (lastDist === null) { lastDist = dist; return; }
      const rect = el.getBoundingClientRect();
      const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
      const midY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
      const currentScale = scaleRef.current;
      const currentPan = panRef.current;
      const newScale = Math.max(0.2, Math.min(2.5, currentScale * (dist / lastDist)));
      const bracketX = (midX - currentPan.x) / currentScale;
      const bracketY = (midY - currentPan.y) / currentScale;
      setScale(newScale);
      setPan({ x: midX - bracketX * newScale, y: midY - bracketY * newScale });
      lastDist = dist;
    };
    const onTouchEnd = () => { lastDist = null; };

    wheelListenerRef.current = onWheel;
    el.addEventListener('wheel', onWheel, { passive: false });
    document.addEventListener('wheel', (e) => {
      if (el.contains(e.target)) {
        e.preventDefault();
      }
    }, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    console.log('🎯 Wheel listener attached to:', el);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleMouseDown = e => { isPanning.current = true; didPan.current = false; panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; };
  const handleMouseMove = e => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x, dy = e.clientY - panStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didPan.current = true;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  };
  const handleMouseUp = () => {
    isPanning.current = false;
    setTimeout(() => { didPan.current = false; }, 0);
  };

  const handleTouchStart = e => {
    if (e.touches.length !== 1) return;
    isPanning.current = true;
    didPan.current = false;
    panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: panRef.current.x, py: panRef.current.y };
  };
  const handleTouchPan = e => {
    if (e.touches.length !== 1 || !isPanning.current) return;
    const dx = e.touches[0].clientX - panStart.current.x;
    const dy = e.touches[0].clientY - panStart.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) didPan.current = true;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  };
  const handleTouchEnd = () => {
    isPanning.current = false;
    setTimeout(() => { didPan.current = false; }, 0);
  };

  const CW = 240, CH = 110, RG = 140, BS = 140;
  const LB_ROUND_BASE = 100;

  const wbMs = matches.filter(m => m.type === 'winner');
  const lbMs = matches.filter(m => m.type === 'loser' && !m.isGhost);
  const gfMs = matches.filter(m => m.type === 'grand_final');
  const plMs = matches.filter(m => m.type === 'placement');

  const maxWR = wbMs.length ? Math.max(...wbMs.map(m => m.round)) : 1;

  const wbPos = (round, pos) => {
    const spacing = BS * Math.pow(2, round - 1);
    return { x: (round - 1) * (CW + RG), y: pos * spacing + spacing / 2 - CH / 2 };
  };

  const wbR1Matches = wbMs.filter(m => m.round === 1);
  const wbHeight = Math.max(400, wbR1Matches.length * BS + BS);

  const LB_GAP = 120;
  const LB_OFFSET_Y = wbHeight + LB_GAP;

  const lbRounds = lbMs.length ? [...new Set(lbMs.map(m => m.round))].sort((a, b) => a - b) : [];
  const lbRoundIndex = Object.fromEntries(lbRounds.map((r, i) => [r, i]));

  const lbMatchesPerRound = {};
  lbMs.forEach(m => { lbMatchesPerRound[m.round] = (lbMatchesPerRound[m.round] || 0) + 1; });

  const lbRoundHeights = {};
  lbRounds.forEach(r => { lbRoundHeights[r] = (lbMatchesPerRound[r] || 1) * (CH + 50); });
  const maxLbHeight = Math.max(...Object.values(lbRoundHeights), CH + 50);

  const lbPos = (round, pos) => {
    const count = lbMatchesPerRound[round] || 1;
    const totalH = count * (CH + 50);
    const startY = LB_OFFSET_Y + (maxLbHeight - totalH) / 2;
    return { x: lbRoundIndex[round] * (CW + RG), y: startY + pos * (CH + 50) };
  };

  const wbWidth = maxWR * (CW + RG);
  const lbWidth = lbRounds.length * (CW + RG);
  const GF_X = Math.max(wbWidth, lbWidth);
  const wbMidY = wbHeight / 2 - CH / 2;
  const lbMidY = LB_OFFSET_Y + maxLbHeight / 2 - CH / 2;
  const GF_Y = lbMs.length > 0 ? (wbMidY + lbMidY) / 2 : wbMidY;

  const gfPos = () => ({ x: GF_X, y: GF_Y });
  const plPos = () => ({ x: GF_X, y: GF_Y + CH + 80 });

  const resolveTeam = (id, name, img) => {
    if (!id) return null;
    if (id === 'bye') return { name: 'BYE', img: null };
    const t = teamMap[id];
    return { name: t?.name || name || '?', img: t?.imgLink || img || null };
  };

  const LightningIcon = () => (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
      <line x1="0" y1="6" x2="7" y2="6" stroke="rgba(200,170,110,0.3)" strokeWidth="1"/>
      <polygon points="9,0 13,6 9,12 17,12 21,6 17,0" fill="rgba(200,170,110,0.55)"/>
      <line x1="19" y1="6" x2="26" y2="6" stroke="rgba(200,170,110,0.3)" strokeWidth="1"/>
    </svg>
  );

  const renderCard = (m, pos, opts = {}) => {
    const { isSpecial = false, accentColor = null } = opts;
    const t1 = resolveTeam(m.team1Id, m.team1Name, m.team1Img);
    const t2 = m.team2Id === 'bye' ? { name: 'BYE', img: null } : resolveTeam(m.team2Id, m.team2Name, m.team2Img);
    const isComplete = m.status === 'complete';
    const hasTeam1 = m.team1Id && m.team1Id !== 'bye';
    const hasTeam2 = m.team2Id && m.team2Id !== 'bye';
    const isClickable = hasTeam1 && hasTeam2;

    const Slot = ({ team, teamId, isWinner, isBye }) => {
      const isLoser = isComplete && !isWinner && teamId && teamId !== 'bye';
      return (
        <MatchTeamSlot $winner={isWinner} $pending={!team} $bye={isBye} $loser={isLoser} $clickable={false}>
          {team ? (
            <>
              {!isBye && <MatchTeamImg src={team.img || '/question.jpg'} onError={e => { e.target.src='/question.jpg'; }} alt={team.name} />}
              {isWinner && <WinnerCrown>⚑</WinnerCrown>}
              <MatchTeamName style={{
                color: isWinner ? 'rgba(240,220,160,1)' : isBye ? 'rgba(200,170,110,0.2)' : isLoser ? 'rgba(200,170,110,0.35)' : undefined
              }}>
                {team.name}
              </MatchTeamName>
            </>
          ) : <MatchPendingSlot>TBD</MatchPendingSlot>}
        </MatchTeamSlot>
      );
    };

    const borderColor = accentColor
      ? accentColor
      : isComplete ? 'rgba(200,170,110,0.5)' : isSpecial ? 'rgba(180,140,100,0.3)' : 'rgba(200,170,110,0.28)';

    return (
      <MatchCard
        key={m.id}
        style={{ left: pos.x, top: pos.y, borderColor }}
        $placement={isSpecial}
        $complete={isComplete}
        $pending={isClickable}
        $watchable={readOnly && !!m.videoLink}
        onClick={() => {
          if (didPan.current) return;
          if (readOnly) {
            console.log("Match clicked:", m.id, "videoLink:", m.videoLink);
            const link = m.videoLink;
            if (link) window.open(link.startsWith('http') ? link : `https://${link}`, "_blank", "noopener,noreferrer");
          } else {
            if (isClickable) setPickingMatch(m);
          }
        }}
        title={readOnly
          ? (m.videoLink ? "▶ Click to watch clip" : "No clip available")
          : isComplete ? "Click to change result" : isClickable ? "Click to select winner" : "Waiting for teams"}
      >
        {m.label && (
          <PlacementBadge style={accentColor ? { borderColor: accentColor, color: accentColor } : {}}>
            {m.label}
          </PlacementBadge>
        )}
        {!readOnly && isClickable && (
          <div style={{
            position: 'absolute', top: 4, right: 8,
            fontFamily: 'Cinzel,serif', fontSize: '0.32rem',
            letterSpacing: '0.2em',
            color: isComplete ? 'rgba(200,170,110,0.28)' : 'rgba(200,170,110,0.4)',
            textTransform: 'uppercase', zIndex: 5, pointerEvents: 'none'
          }}>
            {isComplete ? 'click to edit' : 'click to pick'}
          </div>
        )}
        {readOnly && m.videoLink && (
          <div style={{
            position: 'absolute', top: 4, right: 8,
            fontFamily: 'Cinzel,serif', fontSize: '0.32rem',
            letterSpacing: '0.2em',
            color: 'rgba(200,170,110,0.45)',
            textTransform: 'uppercase', zIndex: 5, pointerEvents: 'none'
          }}>
            ▶ watch clip
          </div>
        )}
        <Slot team={t1} teamId={m.team1Id} isWinner={isComplete && m.winner === m.team1Id} isBye={false} />
        <MatchLightningRow>
          <div style={{ flex: 1, height: 1, background: 'rgba(200,170,110,0.12)' }} />
          <LightningIcon />
          <div style={{ flex: 1, height: 1, background: 'rgba(200,170,110,0.12)' }} />
        </MatchLightningRow>
        <Slot team={t2} teamId={m.team2Id} isWinner={isComplete && m.winner === m.team2Id} isBye={m.team2Id === 'bye'} />
      </MatchCard>
    );
  };

  const renderWBConnectors = () => wbMs.filter(m => !m.isBye && !m.isGhost && m.nextWinnerMatch).flatMap(m => {
    const next = matches.find(x => x.id === m.nextWinnerMatch);
    if (!next) return [];
    const from = wbPos(m.round, m.position);
    const to = next.type === 'grand_final' ? gfPos() : wbPos(next.round, next.position);
    const x1 = from.x + CW, y1 = from.y + CH / 2, x2 = to.x, y2 = to.y + CH / 2;
    const cx = (x1 + x2) / 2;
    return [<path key={`wc_${m.id}`} d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`} stroke="rgba(200,170,110,0.22)" strokeWidth="1.5" fill="none" strokeDasharray="5 4"/>];
  });

  const renderLBConnectors = () => lbMs.filter(m => m.nextWinnerMatch).flatMap(m => {
    const next = matches.find(x => x.id === m.nextWinnerMatch);
    if (!next) return [];
    const from = lbPos(m.round, m.position);
    const to = next.type === 'grand_final' ? gfPos() : lbPos(next.round, next.position);
    const x1 = from.x + CW, y1 = from.y + CH / 2, x2 = to.x, y2 = to.y + CH / 2;
    const cx = (x1 + x2) / 2;
    return [<path key={`lc_${m.id}`} d={`M ${x1} ${y1} C ${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`} stroke="rgba(130,100,200,0.25)" strokeWidth="1.5" fill="none" strokeDasharray="5 4"/>];
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'clamp(200px, 60vh, 900px)', color: 'rgba(200,170,110,0.35)', fontFamily: 'Cinzel,serif', fontSize: '0.55rem', letterSpacing: '0.4em' }}>
      GENERATING BRACKET...
    </div>
  );

  if (teams.length < 2) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'clamp(200px, 60vh, 900px)', color: 'rgba(200,170,110,0.3)', fontFamily: 'Cinzel,serif', fontSize: '0.55rem', letterSpacing: '0.3em', textAlign: 'center' }}>
      ADD AT LEAST 2 TEAMS TO GENERATE BRACKET
    </div>
  );

  return (
    <>
      <BracketContainer
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchPan}
        onTouchEnd={handleTouchEnd}
        onWheel={e => { e.stopPropagation(); }}
      >
        <BracketInner style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
          <svg style={{ position: 'absolute', top: 0, left: 0, width: 9999, height: 9999, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }}>
            {renderWBConnectors()}
            {renderLBConnectors()}
            {lbMs.length > 0 && (
              <line x1={0} y1={LB_OFFSET_Y - 50} x2={GF_X + CW * 2 + RG} y2={LB_OFFSET_Y - 50}
                stroke="rgba(200,170,110,0.08)" strokeWidth="1" strokeDasharray="6 5"/>
            )}
          </svg>

          <BracketSectionLabel style={{ left: 0, top: -46 }}>Winner&apos;s Bracket</BracketSectionLabel>
          {Array.from({ length: maxWR }, (_, i) => (
            <BracketRoundLabel key={`wrl_${i}`} style={{ left: i*(CW+RG)+CW/2, top: -26 }}>
              {i === maxWR-1 ? '— WB Final —' : i === maxWR-2 ? 'WB Semi' : `WB R${i+1}`}
            </BracketRoundLabel>
          ))}
          {wbMs.filter(m => !m.isBye && !m.isGhost).map(m => renderCard(m, wbPos(m.round, m.position)))}

          {lbMs.length > 0 && (
            <>
              <BracketSectionLabel style={{ left: 0, top: LB_OFFSET_Y - 56 }}>Losers&apos; Bracket</BracketSectionLabel>
              {lbRounds.map((r, ri) => (
                <BracketRoundLabel key={`lrl_${r}`} style={{ left: ri*(CW+RG)+CW/2, top: LB_OFFSET_Y - 32 }}>
                  {`LB R${ri+1}`}
                </BracketRoundLabel>
              ))}
              {lbMs.filter(m => !m.isBye && !m.isGhost).map(m =>
                renderCard(m, lbPos(m.round, m.position), { accentColor: 'rgba(130,100,200,0.45)' })
              )}
            </>
          )}

          {(gfMs.length > 0 || plMs.length > 0) && (
            <BracketSectionLabel style={{ left: GF_X, top: GF_Y - 56 }}>Finals</BracketSectionLabel>
          )}
          {gfMs.map(m => renderCard(m, gfPos(), { isSpecial: true, accentColor: 'rgba(240,200,80,0.6)' }))}
          {plMs.map(m => renderCard(m, plPos(), { isSpecial: true }))}
        </BracketInner>
        <BracketZoomHint>scroll to zoom · drag to pan · click match to pick winner</BracketZoomHint>
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        display: 'flex', alignItems: 'center', gap: 6,
        zIndex: 10,
      }}>
        {[{ label: '−', delta: -0.15 }, { label: '+', delta: 0.15 }].map(({ label, delta }) => (
          <button
            key={label}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation();
              const el = containerRef.current;
              if (!el) return;
              const rect = el.getBoundingClientRect();
              const cx = rect.width / 2, cy = rect.height / 2;
              const cur = scaleRef.current, pan = panRef.current;
              const newScale = Math.max(0.2, Math.min(2.5, cur + delta));
              const bx = (cx - pan.x) / cur, by = (cy - pan.y) / cur;
              setScale(newScale);
              setPan({ x: cx - bx * newScale, y: cy - by * newScale });
            }}
            style={{
              width: 28, height: 28,
              background: 'rgba(10,11,18,0.92)',
              border: '1px solid rgba(200,170,110,0.3)',
              color: 'rgba(200,170,110,0.75)',
              fontFamily: 'Cinzel, serif',
              fontSize: '1rem', lineHeight: 1,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,170,110,0.15)'; e.currentTarget.style.borderColor = 'rgba(200,170,110,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,11,18,0.92)'; e.currentTarget.style.borderColor = 'rgba(200,170,110,0.3)'; }}
          >
            {label}
          </button>
        ))}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            setScale(getInitialScale());
            setPan({ x: 40, y: 80 });
          }}
          style={{
            height: 28, padding: '0 10px',
            background: 'rgba(10,11,18,0.92)',
            border: '1px solid rgba(200,170,110,0.2)',
            color: 'rgba(200,170,110,0.4)',
            fontFamily: 'Cinzel, serif',
            fontSize: '0.38rem', letterSpacing: '0.25em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            clipPath: 'polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(200,170,110,0.1)'; e.currentTarget.style.borderColor = 'rgba(200,170,110,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(10,11,18,0.92)'; e.currentTarget.style.borderColor = 'rgba(200,170,110,0.2)'; }}
        >
          Reset
        </button>
      </div>
      </BracketContainer>

      {!readOnly && pickingMatch && (
        <PickWinnerModal
          match={pickingMatch}
          teamMap={teamMap}
          onClose={() => setPickingMatch(null)}
          onPickWinner={handlePickWinner}
          onUndecided={handleUndecideMatch}
        />
      )}
    </>
  );
}