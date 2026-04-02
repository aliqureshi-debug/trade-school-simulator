# TradeSchool — AI Trading Education Platform

## Overview

TradeSchool is an interactive trading simulator and education platform. Users progress through a 12-phase curriculum guided by ARIA, an AI coach, learning market structure, risk management, and trading psychology through hands-on practice with simulated price action.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Routing**: wouter (lightweight client-side routing)
- **Animations**: framer-motion throughout
- **State**: React hooks (no Redux, no backend DB needed)
- **Audio**: Web Audio API via custom soundEngine
- **Charting**: Custom canvas-based candlestick renderer

## Key Files

| File | Purpose |
|---|---|
| `src/pages/Index.tsx` | Main application layout (header, stats, chart, coach, controls) |
| `src/hooks/useTradingEngine.ts` | Core state machine: phase progression, trades, XP, cooldown, ARIA |
| `src/types/trading.ts` | All TypeScript types: Trade, Phase, Challenge, SRZone, PlayerStats, AriaState |
| `src/lib/phases.ts` | 12-phase curriculum with challenges, XP rewards, unlock criteria |
| `src/lib/chartEngine.ts` | Price generation, EMA, SR zones, regime transitions, swing points |
| `src/lib/coachEngine.ts` | ARIA message generation, state transitions (teal/amber/red), revenge detection |
| `src/lib/soundEngine.ts` | Web Audio synthesis: candle tick, trade win/loss, phase unlock, level-up |
| `src/components/CandlestickChart.tsx` | Canvas chart with pan/zoom/crosshair/EMA/SR bands/SL-TP lines |
| `src/components/CoachPanel.tsx` | ARIA avatar (breathing animation), typewriter messages, state badge |
| `src/components/TradingControls.tsx` | Lot size slider, SL/TP inputs with auto-suggest, R:R bar, cooldown UI |
| `src/components/StatsBar.tsx` | XP shimmer bar, level badge, trade stats, AchievementToast |
| `src/components/ChallengeCard.tsx` | Active phase challenge card with progress and XP reward |
| `src/components/PhaseUnlockOverlay.tsx` | Full-screen celebration overlay on phase advancement |
| `src/components/PhaseBadge.tsx` | Phase pill in header with full curriculum tooltip |
| `src/components/TradeHistory.tsx` | Scrollable trade log |

## Features

### 12-Phase Curriculum
Phases 1–12 cover: Market Orientation → Candles → Support/Resistance → Trends → Entries → Risk Management → Trade Management → Psychology → Confluences → Advanced Patterns → Consistency → Mastery.

### ARIA AI Coach
Three states: **teal** (teaching/calm), **amber** (warning), **red** (danger — revenge trading detected).
- Typewriter-style messages with contextual coaching
- Revenge trading detection: 3+ losses in 5 minutes triggers cooldown
- 90-second cooldown with animated countdown

### Chart Engine
- Synthetic OHLCV generation with 4 market regimes (trend-up, trend-down, range, volatile)
- EMA 9 (yellow) and EMA 21 (purple) overlays
- Dynamic support/resistance zones with semi-transparent bands
- Pan (drag), zoom (scroll wheel), crosshair on hover

### Risk Management
- Lot size slider (0.01–5.0) with balance-relative risk %
- Auto-suggested SL/TP based on ATR and nearest S/R levels
- R:R visualization bar
- P&L = priceDiff × lotSize × 100

### Sound Design
Web Audio API synthesis (no audio files needed):
- Candle tick: quiet click
- Trade win: ascending tones
- Trade loss: descending buzz
- Phase unlock: triumphant chord
- Level up: sparkle arp

### Animations
- framer-motion: page entrance (slide in from edges), achievement toasts, phase unlock particles, vignette flash on trade close

## Dev Tools
- `Ctrl+Shift+D` in-browser: instant phase unlock + XP fill (dev shortcut)
- Pause button in header pauses price simulation
- Mute button toggles all sound synthesis

## Workflow
- **Dev**: `npm run dev` — Express + Vite on port 5000
- **Build**: `npm run build` → `dist/`

## Dependencies (key)
- react, react-dom 19
- vite, typescript
- tailwindcss, shadcn/ui components
- framer-motion
- wouter (routing)
- lucide-react (icons)
- @tanstack/react-query (setup but not used for API — all state is client-side)
