# TradeSchool — Trading Academy Platform

## Overview

TradeSchool is a full Trading Academy — a browser-based trading education platform with 3 tiers, 13 modules, 52 animated canvas lessons, 13 missions with real-time validation, 6-mode ARIA coaching, 20 achievements, and 4-screen onboarding.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: wouter (client-side)
- **Animations**: framer-motion throughout
- **State**: React hooks (all client-side, no backend DB)
- **Audio**: Web Audio API via custom soundEngine
- **Charting**: Custom canvas-based candlestick renderer with 8 annotation types

## Key Files

| File | Purpose |
|---|---|
| `src/pages/Index.tsx` | Main layout — integrates all engines, handles lesson/mission flow, onboarding, settings |
| `src/types/trading.ts` | All TypeScript types: Trade, ARIALesson, TradingMission, AcademyModule, PlayerStats, AriaMode, LessonProgress |
| `src/hooks/useTradingEngine.ts` | Core engine: candles, trades, XP, achievements, ARIA mode, persistence |
| `src/hooks/useLessonEngine.ts` | Lesson state machine: typewriter animation, annotation progress, rAF loop |
| `src/hooks/useMissionEngine.ts` | Mission validation: per-mission criteria checking for all 13 missions |
| `src/lib/academy.ts` | 13 modules × 4 lessons + 1 mission each = 52 lessons, 13 missions, full narrations |
| `src/lib/ariaEngine.ts` | ARIA message generation for all 6 modes, replaces old coachEngine.ts |
| `src/lib/persistence.ts` | SavedState v2 (STORAGE_KEY: tradeschool_v2), validators, buildDefaultLessonProgress |
| `src/lib/chartEngine.ts` | OHLCV generation, EMA, SR zones, market regime transitions |
| `src/lib/soundEngine.ts` | Web Audio synthesis: candle tick, trade win/loss, level-up, achievement |
| `src/components/CandlestickChart.tsx` | Canvas chart with pan/zoom/crosshair/EMA/SR/SL-TP + 8 annotation types |
| `src/components/CoachPanel.tsx` | ARIA avatar with 6 mode states, mission HUD with criteria checklist |
| `src/components/LessonOverlay.tsx` | Lesson typewriter UI with Next/Skip controls |
| `src/components/ModuleOverviewStrip.tsx` | Lesson dots, mission star, module progress, replay UI |
| `src/components/MissionDebrief.tsx` | Mission success/failure overlay with criteria checklist + Final Exam score |
| `src/components/Onboarding.tsx` | 4-screen onboarding: ARIA glitch intro → name/archetype → UI tour → start |
| `src/components/SettingsModal.tsx` | Profile, display (lesson speed, candle speed, sound), reset with RESET confirmation |
| `src/components/StatsBar.tsx` | XP bar, tier/module display, balance, P&L, win streak, achievements |
| `src/components/TradingControls.tsx` | Lot size, SL/TP inputs, R:R bar, cooldown UI |
| `src/components/TradeHistory.tsx` | Scrollable trade log |

## Academy Structure

### 3 Tiers
- **Tier 1: RECRUIT** (Modules 1–4) — Foundation: The Market, Candles, Trend, S&R
- **Tier 2: TRADER** (Modules 5–9) — First Setup, Position Sizing, Entry Timing, EMAs, RSI
- **Tier 3: PROFESSIONAL** (Modules 10–13) — Breakouts, Range Trading, Psychology, Final Exam

### 6 ARIA Modes
`teaching` | `guiding` | `watching` | `caution` | `danger` | `celebrating`

### XP System
- Lesson: +20 XP
- Mission: `Math.round(100 + (900/12) × (moduleId-1))`
- Module bonus: `moduleId × 150`
- Achievement: +25 XP
- Level threshold: 150 XP for L2, ×1.4 per level

### Persistence
- STORAGE_KEY: `tradeschool_v2` (incompatible with old v1 saves — intentional)
- All progress auto-saved with 500ms debounce

## Features

### Lesson Engine
- Per-lesson typewriter narration at normal/fast/instant speed
- 8 annotation types rendered on canvas: arrow, label, circle, bracket, highlight, line, band, crossout
- Animations: draw, fade, pop — keyed to `startAtMs` + `durationMs` per annotation
- rAF loop with `canAdvance` gating

### Mission Engine
- Per-mission validation for all 13 missions
- Real-time criteria checking on trade open and close
- Mission HUD in CoachPanel shows live criterion status
- MissionDebrief overlay on success/failure

### ARIA Coach
- Message types: learn, action, review, warn, danger
- Revenge trading detection: 3 rapid losses → 45s cooldown
- Commentary on open trades every 7 ticks (~14s at 2s candles)
- Market condition messages every 12 ticks when not in lesson/mission

### Chart Engine
- 6 market regimes: uptrend, downtrend, range, breakout, volatile, transition
- EMA 9 (yellow) and EMA 21 (purple)
- Dynamic S/R zones with semi-transparent bands
- Pan (drag), zoom (scroll wheel), crosshair on hover

### Onboarding
- Screen 1: ARIA glitch intro with typewriter welcome
- Screen 2: Name input + archetype selection (Scalper / Swing / Risk Manager)
- Screen 3: 5-stop UI tour carousel
- Screen 4: Profile summary + "Start the Academy"

## Dev Tools
- `Ctrl+Shift+D`: unlock all modules + fill XP (activates dev panel in Settings)
- Settings → Display: Dev panel with Skip Lesson and Unlock All buttons
- Pause button: stops price simulation
- Mute button: toggles all sound synthesis

## Workflow
- **Dev**: `npm run dev` — Express + Vite on port 5000
- **Build**: `npm run build` → `dist/`

## Dependencies (key)
- react, react-dom 19
- vite, typescript
- tailwindcss, shadcn/ui
- framer-motion
- wouter
- lucide-react
- @tanstack/react-query (setup, client-side only)
