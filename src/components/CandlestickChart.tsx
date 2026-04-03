import { useRef, useEffect, useCallback, useState } from 'react';
import { Candle, SRZone, Trade } from '@/types/trading';
import { ActiveAnnotation } from '@/hooks/useLessonEngine';
import { aggregateCandles, calculateEMA, calculateRSI, getSwingPoints } from '@/lib/chartEngine';

// ─── Constants ────────────────────────────────────────────────────────────────
const AXIS_W = 60;
const TIME_AXIS_H = 28;
const VOL_RATIO = 0.13;
const MIN_ZOOM = 15;
const MAX_ZOOM = 500;

type Timeframe = 'M1' | 'M5' | 'M15' | 'M30' | 'H1' | 'H4' | 'D1' | 'W1';
type SimSpeed = 1 | 2 | 5 | 10;

const TF_ORDER: Timeframe[] = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
const TF_INTERVAL: Record<Timeframe, number> = { M1: 1, M5: 5, M15: 15, M30: 30, H1: 60, H4: 240, D1: 1440, W1: 10080 };
const TF_SHORTCUT: Record<string, Timeframe> = { '1': 'M1', '2': 'M5', '3': 'M15', '4': 'M30', '5': 'H1', '6': 'H4', '7': 'D1', '8': 'W1' };
const DEFAULT_ZOOM: Record<Timeframe, number> = { M1: 80, M5: 80, M15: 60, M30: 50, H1: 50, H4: 40, D1: 30, W1: 20 };

const SESSION_COLORS = { asian: 'rgba(100,100,220,0.04)', london: 'rgba(220,220,100,0.04)', newyork: 'rgba(220,100,100,0.04)' };
const REGIME_COLORS: Record<string, string> = { uptrend: 'rgba(29,158,117,0.025)', downtrend: 'rgba(226,76,74,0.025)', range: 'rgba(220,160,40,0.02)', breakout: 'rgba(55,138,221,0.025)', volatile: 'rgba(220,160,40,0.025)', transition: 'rgba(100,100,180,0.02)' };

function sessionFromTime(t: number): 'asian' | 'london' | 'newyork' {
  const h = new Date(t).getUTCHours();
  if (h < 8) return 'asian';
  if (h < 16) return 'london';
  return 'newyork';
}

function fmtAxisLabel(t: number, tf: Timeframe): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  if (tf === 'D1') return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
  if (tf === 'W1') { const w = Math.ceil(((d.getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 864e5 + 1) / 7); return `W${w}`; }
  if (tf === 'H4') return `${p(d.getDate())} ${p(d.getHours())}h`;
  if (tf === 'H1') return `${p(d.getHours())}:00`;
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D | null {
  const dpr = window.devicePixelRatio || 1;
  const pw = Math.round(w * dpr), ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw; canvas.height = ph;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
    return ctx;
  }
  return canvas.getContext('2d');
}

function drawBezierLine(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length < 2) return;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
}

function drawEMA(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[], color: string) {
  if (pts.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.globalAlpha = 0.12;
  drawBezierLine(ctx, pts); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.globalAlpha = 0.85;
  drawBezierLine(ctx, pts); ctx.stroke();
  ctx.restore();
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CandlestickChartProps {
  candles: Candle[];
  srZones: SRZone[];
  entryPrice?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  annotations?: ActiveAnnotation[];
  dimForLesson?: boolean;
  activeTrade?: Trade | null;
  onSimSpeedChange?: (mult: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function CandlestickChart({
  candles, srZones, entryPrice, stopLoss, takeProfit,
  annotations = [], dimForLesson = false, activeTrade, onSimSpeedChange,
}: CandlestickChartProps) {

  const [timeframe, setTimeframe] = useState<Timeframe>('M1');
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [crosshairCandle, setCrosshairCandle] = useState<Candle | null>(null);
  const [showLiveBtn, setShowLiveBtn] = useState(false);
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [lastDisplayPrice, setLastDisplayPrice] = useState(0);
  const [prevDisplayPrice, setPrevDisplayPrice] = useState(0);

  // ── Canvas refs ──
  const chartAreaRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const candleRef = useRef<HTMLCanvasElement>(null);
  const fgRef = useRef<HTMLCanvasElement>(null);
  const axisRef = useRef<HTMLCanvasElement>(null);
  const rsiRef = useRef<HTMLCanvasElement>(null);

  // ── Prop refs (so draw functions stay stable/avoid stale closures) ──
  const srZonesRef = useRef(srZones);
  const entryPriceRef = useRef(entryPrice);
  const slRef = useRef(stopLoss);
  const tpRef = useRef(takeProfit);
  const annotationsRef = useRef(annotations);
  const dimRef = useRef(dimForLesson);
  const activeTradeRef2 = useRef(activeTrade);

  useEffect(() => {
    srZonesRef.current = srZones;
    entryPriceRef.current = entryPrice;
    slRef.current = stopLoss;
    tpRef.current = takeProfit;
    annotationsRef.current = annotations;
    dimRef.current = dimForLesson;
    activeTradeRef2.current = activeTrade;
    bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
  }, [srZones, entryPrice, stopLoss, takeProfit, annotations, dimForLesson, activeTrade]);

  // ── Data refs ──
  const m1Hist = useRef<Candle[]>([]);
  const prevM1Len = useRef(0);
  const displayCandles = useRef<Candle[]>([]);
  const ema9Data = useRef<number[]>([]);
  const ema21Data = useRef<number[]>([]);
  const rsiData = useRef<number[]>([]);
  const tfRef = useRef<Timeframe>('M1');

  // ── Per-TF state ──
  const zoomByTf = useRef<Record<Timeframe, number>>({ ...DEFAULT_ZOOM });
  const panByTf = useRef<Record<Timeframe, number>>({ M1: 0, M5: 0, M15: 0, M30: 0, H1: 0, H4: 0, D1: 0, W1: 0 });
  const manualScale = useRef<Record<Timeframe, number | null>>({ M1: null, M5: null, M15: null, M30: null, H1: null, H4: null, D1: null, W1: null });

  // ── Interpolation ──
  const prevClose = useRef(0);
  const currClose = useRef(0);
  const lastCandleAt = useRef(Date.now());
  const tickInterval = useRef(2000);

  // ── Pan/zoom ──
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const velHistory = useRef<{ v: number; t: number }[]>([]);
  const inertiaVel = useRef(0);
  const hasInertia = useRef(false);
  const targetZoom = useRef(DEFAULT_ZOOM.M1);
  const lerpZoom = useRef(DEFAULT_ZOOM.M1);

  // ── Axis drag ──
  const axisDragging = useRef(false);
  const axisDragY0 = useRef(0);
  const axisDragRange0 = useRef(0);

  // ── Crosshair ──
  const crosshair = useRef({ x: 0, y: 0, visible: false, idx: -1 });

  // ── Dirty flags ──
  const bgDirty = useRef(true);
  const candleDirty = useRef(true);
  const axisDirty = useRef(true);

  // ── Misc ──
  const rafId = useRef(0);
  const tradeOpenAt = useRef(0);
  const priceFlashTimer = useRef<ReturnType<typeof setTimeout>>();
  const lastKnownPrice = useRef(0);

  // ── Geometry cache (for mouse→coordinate mapping) ──
  const geom = useRef({ mainW: 0, H: 0, candleAreaH: 0, priceAreaH: 0, minP: 0, maxP: 0, startIdx: 0, numVis: 0, cw: 0 });

  // ── Compute display candles for a given TF ──
  function reaggregate(tf: Timeframe) {
    const dc = aggregateCandles(m1Hist.current, TF_INTERVAL[tf]);
    displayCandles.current = dc;
    ema9Data.current = calculateEMA(dc, 9);
    ema21Data.current = calculateEMA(dc, 21);
    rsiData.current = calculateRSI(dc, 14);
  }

  // ── Price range ──
  function priceRange(visible: Candle[], tf: Timeframe): { minP: number; maxP: number } {
    const prices = visible.flatMap(c => [c.high, c.low]);
    srZonesRef.current.forEach(z => prices.push(z.price));
    const ep = entryPriceRef.current, sl = slRef.current, tp = tpRef.current;
    if (ep) prices.push(ep);
    if (sl) prices.push(sl);
    if (tp) prices.push(tp);
    const rawMin = Math.min(...prices), rawMax = Math.max(...prices);
    const ms = manualScale.current[tf];
    if (ms && ms > 0) { const mid = (rawMin + rawMax) / 2; return { minP: mid - ms / 2, maxP: mid + ms / 2 }; }
    const pad = (rawMax - rawMin) * 0.08 || 2;
    return { minP: rawMin - pad, maxP: rawMax + pad };
  }

  // ── Visible slice helper ──
  function getVisible(tf: Timeframe): { visible: Candle[]; startIdx: number; cw: number; mainW: number } {
    const dc = displayCandles.current;
    const zoom = Math.max(MIN_ZOOM, Math.round(lerpZoom.current));
    const pan = Math.round(panByTf.current[tf]);
    const total = dc.length;
    const startIdx = Math.max(0, total - zoom - pan);
    const endIdx = Math.max(1, total - pan);
    const visible = dc.slice(startIdx, endIdx);
    const mainW = (chartAreaRef.current?.clientWidth ?? 0) - AXIS_W;
    const cw = mainW / Math.max(1, visible.length);
    return { visible, startIdx, cw, mainW };
  }

  // ─── DRAW BG: grid, session bands, S/R zones, volume separator ───
  const drawBg = useCallback(() => {
    const canvas = bgRef.current, ca = chartAreaRef.current;
    if (!canvas || !ca) return;
    const W = ca.clientWidth, H = ca.clientHeight, mainW = W - AXIS_W;
    const ctx = setupCanvas(canvas, mainW, H);
    if (!ctx) return;

    const tf = tfRef.current;
    const { visible, cw, mainW: mW } = getVisible(tf);
    if (visible.length === 0) return;

    const priceAreaH = H - TIME_AXIS_H;
    const volumeH = priceAreaH * VOL_RATIO;
    const candleAreaH = priceAreaH - volumeH;
    const { minP, maxP } = priceRange(visible, tf);
    const priceRng = maxP - minP || 1;
    const py = (p: number) => 8 + (1 - (p - minP) / priceRng) * (candleAreaH - 16);

    // Background
    ctx.fillStyle = 'hsl(215,28%,7%)';
    ctx.fillRect(0, 0, mW, H);

    // Regime tint (rightmost 25%)
    const regimeCol = REGIME_COLORS['uptrend'] ?? 'rgba(29,158,117,0.025)';
    ctx.fillStyle = regimeCol;
    ctx.fillRect(mW * 0.75, 0, mW * 0.25, candleAreaH);

    // Session bands (H1+)
    if (['H1', 'H4', 'D1', 'W1'].includes(tf)) {
      let prevSess = '';
      let sessStart = 0;
      for (let i = 0; i < visible.length; i++) {
        const sess = sessionFromTime(visible[i].time);
        const x = i * cw;
        if (sess !== prevSess) {
          if (prevSess) {
            ctx.fillStyle = SESSION_COLORS[prevSess as keyof typeof SESSION_COLORS] || 'transparent';
            ctx.fillRect(sessStart, 0, x - sessStart, candleAreaH);
            ctx.fillStyle = 'rgba(180,180,180,0.22)';
            ctx.font = '8px Inter'; ctx.textAlign = 'left';
            ctx.fillText(prevSess.toUpperCase(), sessStart + 3, 13);
          }
          prevSess = sess; sessStart = x;
        }
      }
      if (prevSess) {
        ctx.fillStyle = SESSION_COLORS[prevSess as keyof typeof SESSION_COLORS] || 'transparent';
        ctx.fillRect(sessStart, 0, mW - sessStart, candleAreaH);
      }
    }

    // Horizontal grid lines
    const gridN = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridN; i++) {
      const y = py(minP + (priceRng / gridN) * i);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mW, y); ctx.stroke();
    }

    // Round number dashed lines ($50 levels for Gold)
    const step = priceRng > 300 ? 100 : priceRng > 100 ? 50 : priceRng > 20 ? 10 : 1;
    const firstRound = Math.ceil(minP / step) * step;
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5; ctx.setLineDash([5, 5]);
    for (let p = firstRound; p <= maxP; p += step) {
      const y = py(p);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mW, y); ctx.stroke();
    }
    ctx.setLineDash([]);

    // S/R zones
    srZonesRef.current.forEach(z => {
      const zy = py(z.price);
      const str = z.strength ?? 1;
      const fo = str >= 3 ? 0.18 : str === 2 ? 0.13 : 0.09;
      const bh = Math.max(5, candleAreaH * 0.005);
      if (z.type === 'resistance') {
        ctx.fillStyle = `rgba(226,76,74,${fo})`; ctx.fillRect(0, zy - bh, mW, bh * 2);
        ctx.strokeStyle = `rgba(226,76,74,0.7)`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(5, zy); ctx.stroke();
        ctx.strokeStyle = `rgba(226,76,74,0.25)`; ctx.lineWidth = 0.8; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(5, zy); ctx.lineTo(mW, zy); ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.fillStyle = `rgba(29,158,117,${fo})`; ctx.fillRect(0, zy - bh, mW, bh * 2);
        ctx.strokeStyle = `rgba(29,158,117,0.7)`; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(0, zy); ctx.lineTo(5, zy); ctx.stroke();
        ctx.strokeStyle = `rgba(29,158,117,0.25)`; ctx.lineWidth = 0.8; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(5, zy); ctx.lineTo(mW, zy); ctx.stroke(); ctx.setLineDash([]);
      }
    });

    // Time axis background + separator
    ctx.fillStyle = 'hsl(215,28%,6%)'; ctx.fillRect(0, H - TIME_AXIS_H, mW, TIME_AXIS_H);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, H - TIME_AXIS_H); ctx.lineTo(mW, H - TIME_AXIS_H); ctx.stroke();

    // Time labels
    const minPx = 75;
    const interval = Math.max(1, Math.ceil(minPx / cw));
    ctx.fillStyle = 'rgba(180,180,200,0.45)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
    for (let i = 0; i < visible.length; i++) {
      if (i % interval === 0) ctx.fillText(fmtAxisLabel(visible[i].time, tf), (i + 0.5) * cw, H - TIME_AXIS_H + 18);
    }

    // Volume/candle separator
    const volSep = priceAreaH - volumeH;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, volSep); ctx.lineTo(mW, volSep); ctx.stroke();

    // Update geom cache
    geom.current = { mainW: mW, H, candleAreaH, priceAreaH, minP, maxP, startIdx: visible.length > 0 ? displayCandles.current.length - visible.length - Math.round(panByTf.current[tf]) : 0, numVis: visible.length, cw };
  }, []);

  // ─── DRAW CANDLES: completed candles, EMAs, volume, swing points ───
  const drawCandles = useCallback(() => {
    const canvas = candleRef.current, ca = chartAreaRef.current;
    if (!canvas || !ca) return;
    const W = ca.clientWidth, H = ca.clientHeight, mainW = W - AXIS_W;
    const ctx = setupCanvas(canvas, mainW, H);
    if (!ctx) return;

    const tf = tfRef.current;
    const { visible, cw } = getVisible(tf);
    if (visible.length === 0) return;

    ctx.clearRect(0, 0, mainW, H);

    const priceAreaH = H - TIME_AXIS_H;
    const volumeH = priceAreaH * VOL_RATIO;
    const candleAreaH = priceAreaH - volumeH;
    const { minP, maxP } = priceRange(visible, tf);
    const priceRng = maxP - minP || 1;
    const py = (p: number) => 8 + (1 - (p - minP) / priceRng) * (candleAreaH - 16);
    const bw = Math.max(Math.min(cw * 0.65, 14), 1.5);
    const maxVol = Math.max(...visible.map(c => c.volume), 1);

    // All completed candles (skip last — drawn in fg)
    const count = Math.max(0, visible.length - 1);
    const dc = displayCandles.current;
    const startIdx = dc.length - visible.length;

    // EMA fill between 9 and 21
    const e9 = ema9Data.current, e21 = ema21Data.current;
    const pts9: { x: number; y: number }[] = [], pts21: { x: number; y: number }[] = [];
    for (let i = 0; i < count; i++) {
      const di = startIdx + i;
      const v9 = e9[di], v21 = e21[di];
      if (v9 > 0 && v21 > 0) { const x = (i + 0.5) * cw; pts9.push({ x, y: py(v9) }); pts21.push({ x, y: py(v21) }); }
    }
    if (pts9.length > 1 && pts21.length > 1) {
      ctx.save(); ctx.beginPath();
      pts9.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      [...pts21].reverse().forEach(p => ctx.lineTo(p.x, p.y)); ctx.closePath();
      const ema9last = pts9[pts9.length - 1].y, ema21last = pts21[pts21.length - 1].y;
      ctx.fillStyle = ema9last <= ema21last ? 'rgba(29,158,117,0.04)' : 'rgba(226,76,74,0.04)'; ctx.fill(); ctx.restore();
      drawEMA(ctx, pts9, '#378ADD'); drawEMA(ctx, pts21, '#1D9E75');
    }

    // Candle bodies + wicks + volume
    for (let i = 0; i < count; i++) {
      const c = visible[i];
      const x = (i + 0.5) * cw;
      const bull = c.close >= c.open;
      const col = bull ? '#26A69A' : '#EF5350';
      const colD = bull ? 'rgba(38,166,154,0.65)' : 'rgba(239,83,80,0.65)';
      const oy = py(c.open), cy2 = py(c.close), hy = py(c.high), ly = py(c.low);
      ctx.strokeStyle = colD; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(x, ly); ctx.stroke();
      const bt = Math.min(oy, cy2), bh = Math.max(Math.abs(oy - cy2), 1);
      ctx.fillStyle = col; ctx.fillRect(x - bw / 2, bt, bw, bh);
      const vh = (c.volume / maxVol) * volumeH;
      ctx.fillStyle = bull ? 'rgba(38,166,154,0.35)' : 'rgba(239,83,80,0.35)';
      ctx.fillRect(x - bw / 2, priceAreaH - vh, bw, vh);
    }

    // Average volume line
    if (visible.length > 1) {
      const avgV = visible.reduce((s, c) => s + c.volume, 0) / visible.length;
      const avgY = priceAreaH - (avgV / maxVol) * volumeH;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 0.5; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, avgY); ctx.lineTo(mainW, avgY); ctx.stroke(); ctx.setLineDash([]);
    }

    // Swing point markers
    const lookback = visible.slice(0, count);
    const { highs, lows } = getSwingPoints(lookback);
    const drawTri = (x: number, y: number, up: boolean) => {
      ctx.fillStyle = '#1D9E75'; ctx.beginPath();
      if (up) { ctx.moveTo(x, y - 5); ctx.lineTo(x - 4, y); ctx.lineTo(x + 4, y); }
      else { ctx.moveTo(x, y + 5); ctx.lineTo(x - 4, y); ctx.lineTo(x + 4, y); }
      ctx.closePath(); ctx.fill();
    };
    highs.slice(-15).forEach(idx => { if (idx < lookback.length) drawTri((idx + 0.5) * cw, py(lookback[idx].high) - 8, false); });
    lows.slice(-15).forEach(idx => { if (idx < lookback.length) drawTri((idx + 0.5) * cw, py(lookback[idx].low) + 8, true); });
  }, []);

  // ─── DRAW FG: live candle, trade lines, crosshair, annotations ───
  const drawFg = useCallback((interp: number) => {
    const canvas = fgRef.current, ca = chartAreaRef.current;
    if (!canvas || !ca) return;
    const W = ca.clientWidth, H = ca.clientHeight, mainW = W - AXIS_W;
    const ctx = setupCanvas(canvas, mainW, H);
    if (!ctx) return;

    const tf = tfRef.current;
    const { visible, cw } = getVisible(tf);
    if (visible.length === 0) return;

    ctx.clearRect(0, 0, mainW, H);

    const priceAreaH = H - TIME_AXIS_H;
    const volumeH = priceAreaH * VOL_RATIO;
    const candleAreaH = priceAreaH - volumeH;
    const { minP, maxP } = priceRange(visible, tf);
    const priceRng = maxP - minP || 1;
    const py = (p: number) => 8 + (1 - (p - minP) / priceRng) * (candleAreaH - 16);
    const bw = Math.max(Math.min(cw * 0.65, 14), 1.5);
    const maxVol = Math.max(...visible.map(c => c.volume), 1);
    const liveClose = Math.max(minP, Math.min(maxP, interp));

    // Live candle
    const last = visible[visible.length - 1];
    const lx = (visible.length - 1 + 0.5) * cw;
    const bull = liveClose >= last.open;
    const lcol = bull ? '#26A69A' : '#EF5350';
    const lhy = py(Math.max(last.high, liveClose)), lly = py(Math.min(last.low, liveClose));
    ctx.strokeStyle = bull ? 'rgba(38,166,154,0.7)' : 'rgba(239,83,80,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(lx, lhy); ctx.lineTo(lx, lly); ctx.stroke();
    const lbt = Math.min(py(last.open), py(liveClose)), lbh = Math.max(Math.abs(py(last.open) - py(liveClose)), 1);
    ctx.fillStyle = lcol; ctx.fillRect(lx - bw / 2, lbt, bw, lbh);
    const lvh = (last.volume / maxVol) * volumeH;
    ctx.fillStyle = bull ? 'rgba(38,166,154,0.35)' : 'rgba(239,83,80,0.35)';
    ctx.fillRect(lx - bw / 2, priceAreaH - lvh, bw, lvh);

    // Current price dashed line
    const liveY = py(liveClose);
    ctx.strokeStyle = bull ? 'rgba(38,166,154,0.45)' : 'rgba(239,83,80,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(0, liveY); ctx.lineTo(mainW, liveY); ctx.stroke(); ctx.setLineDash([]);

    // ── Trade lines ──
    const ep = entryPriceRef.current, sl = slRef.current, tp = tpRef.current;
    const now = Date.now();
    if (ep != null) {
      const ey = py(ep);
      const slide = Math.min(1, (now - tradeOpenAt.current) / 250);

      // Zone fills
      if (sl != null) { ctx.fillStyle = 'rgba(226,76,74,0.06)'; ctx.fillRect(0, Math.min(ey, py(sl)), mainW, Math.abs(ey - py(sl))); }
      if (tp != null) { ctx.fillStyle = 'rgba(29,158,117,0.06)'; ctx.fillRect(0, Math.min(ey, py(tp)), mainW, Math.abs(ey - py(tp))); }

      // Live P&L line
      const at = activeTradeRef2.current;
      if (at) {
        const pnlSign = at.type === 'buy' ? liveClose - ep : ep - liveClose;
        const pnlColor = pnlSign >= 0 ? 'rgba(29,158,117,0.6)' : 'rgba(226,76,74,0.6)';
        ctx.strokeStyle = pnlColor; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(mainW * (1 - slide), liveY); ctx.lineTo(mainW, liveY); ctx.stroke(); ctx.setLineDash([]);
      }

      // Entry line
      ctx.strokeStyle = `rgba(255,255,255,${0.65 * slide})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mainW * (1 - slide), ey); ctx.lineTo(mainW, ey); ctx.stroke();
      if (slide > 0.5) {
        ctx.fillStyle = `rgba(255,255,255,0.75)`;
        ctx.beginPath(); ctx.moveTo(3, ey - 5); ctx.lineTo(10, ey); ctx.lineTo(3, ey + 5); ctx.closePath(); ctx.fill();
      }

      // SL line
      if (sl != null) {
        const sly = py(sl);
        const isPulse = Math.abs(liveClose - sl) < 0.5;
        const alpha = isPulse ? 0.5 + 0.5 * Math.sin(now / 200) : 0.8;
        ctx.strokeStyle = `rgba(226,76,74,${alpha})`; ctx.lineWidth = 1.5; ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(0, sly); ctx.lineTo(mainW, sly); ctx.stroke(); ctx.setLineDash([]);
      }

      // TP line
      if (tp != null) {
        const tpy2 = py(tp);
        ctx.strokeStyle = 'rgba(29,158,117,0.8)'; ctx.lineWidth = 1.5; ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(0, tpy2); ctx.lineTo(mainW, tpy2); ctx.stroke(); ctx.setLineDash([]);
      }
    }

    // ── Lesson annotations ──
    const anns = annotationsRef.current;
    if (anns.length > 0) {
      const rm: Record<string, number> = { last: 0, 'last-1': 1, 'last-2': 2, 'last-3': 3, 'last-4': 4, 'last-5': 5 };
      const gcx = (ref: string) => { const off = rm[ref] ?? 0; return (Math.max(0, visible.length - 1 - off) + 0.5) * cw; };
      const gcy = (ref: string) => { const off = rm[ref] ?? 0; const idx = visible.length - 1 - off; return idx >= 0 ? py((visible[idx].high + visible[idx].low) / 2) : candleAreaH / 2; };
      const ghi = (ref: string) => { const off = rm[ref] ?? 0; const idx = visible.length - 1 - off; return idx >= 0 ? py(visible[idx].high) : candleAreaH / 2; };
      const glo = (ref: string) => { const off = rm[ref] ?? 0; const idx = visible.length - 1 - off; return idx >= 0 ? py(visible[idx].low) : candleAreaH / 2; };
      const curP = visible[visible.length - 1]?.close ?? 0;

      for (const ann of anns) {
        const alpha = ann.animateIn === 'fade' ? Math.min(1, ann.progress * 2) : 1;
        const color = ann.color ?? '#00d4aa';
        ctx.globalAlpha = alpha;
        const cx = ann.candleRef ? gcx(ann.candleRef) : (ann.x ?? mainW * 0.7);
        const cy3 = ann.priceRef ? py(ann.priceRef) : ann.priceDelta !== undefined ? py(curP + ann.priceDelta) : ann.candleRef ? gcy(ann.candleRef) : (ann.y ?? candleAreaH / 2);

        switch (ann.type) {
          case 'arrow': {
            const prog = Math.min(1, ann.progress * 1.5);
            const x1 = cx - 20, y1 = cy3 + 20, x2 = cx, y2 = cy3 - 20;
            const ex = x1 + (x2 - x1) * prog, ey2 = y1 + (y2 - y1) * prog;
            const ang = Math.atan2(ey2 - y1, ex - x1);
            ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ex, ey2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ex, ey2); ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey2 - 8 * Math.sin(ang - 0.4)); ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey2 - 8 * Math.sin(ang + 0.4)); ctx.closePath(); ctx.fill();
            if (prog > 0.8 && ann.text) { ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center'; ctx.fillText(ann.text, (x1 + x2) / 2, (y1 + y2) / 2 - 6); }
            break;
          }
          case 'label': ctx.font = 'bold 11px Inter'; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.fillText(ann.text ?? '', cx, (ann.candleRef ? ghi(ann.candleRef) : cy3) - 12); break;
          case 'circle': { const r = (16 + (1 - ann.progress) * 8) * ann.progress; ctx.strokeStyle = color; ctx.lineWidth = 2 * (0.8 + Math.sin(now / 300) * 0.2); ctx.beginPath(); ctx.arc(cx, cy3, r, 0, Math.PI * 2); ctx.stroke(); break; }
          case 'line': { const p2 = Math.min(1, ann.progress * 2); const ly2 = ann.priceRef ? py(ann.priceRef) : ann.priceDelta !== undefined ? py(curP + ann.priceDelta) : cy3; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(0, ly2); ctx.lineTo(mainW * p2, ly2); ctx.stroke(); ctx.setLineDash([]); if (ann.text && p2 > 0.7) { ctx.font = 'bold 10px Inter'; ctx.fillStyle = color; ctx.textAlign = 'right'; ctx.fillText(ann.text, mainW - 4, ly2 - 4); } break; }
          case 'band': { const bp = ann.priceDelta !== undefined ? curP + ann.priceDelta : (ann.priceRef ?? curP); const by = py(bp); const bh2 = Math.max(20, Math.abs(py(bp - 1) - py(bp))); ctx.fillStyle = ann.color ?? 'rgba(0,212,170,0.12)'; ctx.fillRect(0, by - bh2 / 2, mainW, bh2); if (ann.text) { ctx.font = 'bold 10px Inter'; ctx.fillStyle = color; ctx.textAlign = 'right'; ctx.fillText(ann.text, mainW - 4, by + 4); } break; }
          case 'highlight': { const ht2 = ann.candleRef ? ghi(ann.candleRef) - 2 : cy3 - 20; const hb2 = ann.candleRef ? glo(ann.candleRef) + 2 : cy3 + 20; ctx.fillStyle = ann.color ? ann.color + '33' : 'rgba(0,212,170,0.2)'; ctx.fillRect(cx - cw / 2, ht2, cw, hb2 - ht2); break; }
          case 'bracket': { const bt2 = ann.candleRef ? ghi(ann.candleRef) : cy3 - 20; const bb = ann.candleRef ? glo(ann.candleRef) : cy3 + 20; const bx2 = cx + 12; const p3 = Math.min(1, ann.progress * 2); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx2, bt2); ctx.lineTo(bx2, bt2 + (bb - bt2) * p3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx2 - 4, bt2); ctx.lineTo(bx2 + 4, bt2); ctx.stroke(); if (p3 > 0.95 && ann.text) { ctx.beginPath(); ctx.moveTo(bx2 - 4, bb); ctx.lineTo(bx2 + 4, bb); ctx.stroke(); ctx.font = 'bold 10px Inter'; ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(ann.text, bx2 + 6, (bt2 + bb) / 2 + 4); } break; }
          case 'crossout': { const ct = ann.candleRef ? ghi(ann.candleRef) : cy3 - 15; const cb = ann.candleRef ? glo(ann.candleRef) : cy3 + 15; const sl3 = cx - cw * 0.4, sr = cx + cw * 0.4; const p4 = Math.min(1, ann.progress * 2); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sl3, ct); ctx.lineTo(sl3 + (sr - sl3) * p4, ct + (cb - ct) * p4); ctx.stroke(); if (p4 > 0.5) { ctx.beginPath(); ctx.moveTo(sr, ct); ctx.lineTo(sr - (sr - sl3) * (p4 - 0.5) * 2, ct + (cb - ct) * (p4 - 0.5) * 2); ctx.stroke(); } break; }
        }
        ctx.globalAlpha = 1; ctx.textAlign = 'left';
      }
    }

    // Dim overlay for lessons
    if (dimRef.current) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, mainW, candleAreaH); }

    // ── Crosshair ──
    const ch = crosshair.current;
    if (ch.visible) {
      const snapX = ch.idx >= 0 ? (ch.idx + 0.5) * cw : ch.x;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(snapX, 0); ctx.lineTo(snapX, priceAreaH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, ch.y); ctx.lineTo(mainW, ch.y); ctx.stroke(); ctx.setLineDash([]);

      // Bottom time label
      if (ch.idx >= 0 && ch.idx < visible.length) {
        const lx2 = Math.max(32, Math.min(mainW - 32, snapX));
        ctx.fillStyle = 'rgba(15,20,30,0.95)'; ctx.fillRect(lx2 - 28, H - TIME_AXIS_H + 3, 56, 16);
        ctx.fillStyle = 'rgba(200,200,220,0.9)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
        ctx.fillText(fmtAxisLabel(visible[ch.idx].time, tf), lx2, H - TIME_AXIS_H + 14);
      }
    }
  }, []);

  // ─── DRAW AXIS: right price axis ───
  const drawAxis = useCallback(() => {
    const canvas = axisRef.current, ca = chartAreaRef.current;
    if (!canvas || !ca) return;
    const H = ca.clientHeight;
    const ctx = setupCanvas(canvas, AXIS_W, H);
    if (!ctx) return;

    ctx.fillStyle = 'hsl(215,28%,6%)'; ctx.fillRect(0, 0, AXIS_W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, H); ctx.stroke();

    const g = geom.current;
    if (g.mainW === 0) return;
    const { minP, maxP, candleAreaH } = g;
    const priceRng = maxP - minP || 1;
    const py = (p: number) => 8 + (1 - (p - minP) / priceRng) * (candleAreaH - 16);

    // Price grid labels
    const gridN = 6;
    ctx.fillStyle = 'rgba(160,160,190,0.55)'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
    for (let i = 0; i <= gridN; i++) {
      const p = minP + (priceRng / gridN) * i;
      ctx.fillText(p.toFixed(2), AXIS_W / 2, py(p) + 3);
    }

    // Crosshair price label
    const ch = crosshair.current;
    if (ch.visible) {
      const price = minP + (1 - (ch.y - 8) / (candleAreaH - 16)) * priceRng;
      ctx.fillStyle = 'rgba(15,20,30,0.96)'; ctx.fillRect(1, ch.y - 9, AXIS_W - 2, 18);
      ctx.strokeStyle = 'rgba(200,200,220,0.35)'; ctx.lineWidth = 0.5; ctx.strokeRect(1, ch.y - 9, AXIS_W - 2, 18);
      ctx.fillStyle = 'rgba(220,220,240,0.95)'; ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(price.toFixed(2), AXIS_W / 2, ch.y + 3);
    }

    // Live price label (colored)
    const dc = displayCandles.current;
    if (dc.length > 0) {
      const lp = dc[dc.length - 1].close;
      const isUp = dc.length < 2 || lp >= dc[dc.length - 2].close;
      const ly = py(lp);
      if (ly >= 0 && ly <= H) {
        ctx.fillStyle = isUp ? '#26A69A' : '#EF5350'; ctx.fillRect(1, ly - 9, AXIS_W - 2, 18);
        ctx.fillStyle = '#0d1218'; ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'center';
        ctx.fillText(lp.toFixed(2), AXIS_W / 2, ly + 3);
      }
    }

    // Entry/SL/TP labels
    const ep = entryPriceRef.current, sl = slRef.current, tp = tpRef.current;
    const drawAxisLabel = (price: number, bg: string, border: string, fg: string) => {
      const y = py(price); if (y < 0 || y > H) return;
      ctx.fillStyle = bg; ctx.fillRect(1, y - 8, AXIS_W - 2, 16);
      ctx.strokeStyle = border; ctx.lineWidth = 0.5; ctx.strokeRect(1, y - 8, AXIS_W - 2, 16);
      ctx.fillStyle = fg; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(price.toFixed(2), AXIS_W / 2, y + 3);
    };
    if (ep != null) drawAxisLabel(ep, 'rgba(20,25,35,0.95)', 'rgba(255,255,255,0.4)', '#fff');
    if (sl != null) drawAxisLabel(sl, 'rgba(30,8,8,0.95)', '#E24B4A88', '#E24B4A');
    if (tp != null) drawAxisLabel(tp, 'rgba(6,22,15,0.95)', '#1D9E7588', '#1D9E75');

    // S/R zone labels
    srZonesRef.current.forEach(z => {
      const y = py(z.price); if (y < 0 || y > H) return;
      ctx.fillStyle = z.type === 'resistance' ? 'rgba(226,76,74,0.65)' : 'rgba(29,158,117,0.65)';
      ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
      ctx.fillText(z.type === 'resistance' ? 'R' : 'S', AXIS_W / 2, y + 3);
    });
  }, []);

  // ─── DRAW RSI ───
  const drawRSIPanel = useCallback(() => {
    const canvas = rsiRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const W = parent.clientWidth, H = parent.clientHeight, mainW = W - AXIS_W;
    const ctx = setupCanvas(canvas, mainW, H);
    if (!ctx) return;

    ctx.fillStyle = 'hsl(215,28%,6%)'; ctx.fillRect(0, 0, mainW, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(mainW, 0); ctx.stroke();

    const tf = tfRef.current;
    const dc = displayCandles.current, rsi = rsiData.current;
    if (dc.length === 0 || rsi.length === 0) return;

    const zoom = Math.max(MIN_ZOOM, Math.round(lerpZoom.current));
    const pan = Math.round(panByTf.current[tf]);
    const total = dc.length;
    const startIdx = Math.max(0, total - zoom - pan);
    const endIdx = Math.max(1, total - pan);
    const visRSI = rsi.slice(startIdx, endIdx);
    if (visRSI.length === 0) return;

    const cw = mainW / Math.max(1, visRSI.length);
    const ry = (v: number) => 2 + (H - 4) * (1 - v / 100);

    // Zone fills
    ctx.fillStyle = 'rgba(226,76,74,0.05)'; ctx.fillRect(0, ry(70), mainW, ry(100) - ry(70));
    ctx.fillStyle = 'rgba(29,158,117,0.05)'; ctx.fillRect(0, 2, mainW, ry(30) - 2);

    // Reference lines
    [70, 50, 30].forEach(v => {
      ctx.strokeStyle = v === 50 ? 'rgba(255,255,255,0.1)' : v === 70 ? 'rgba(226,76,74,0.5)' : 'rgba(29,158,117,0.5)';
      ctx.lineWidth = 0.8; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, ry(v)); ctx.lineTo(mainW, ry(v)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(160,160,180,0.4)'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'left';
      ctx.fillText(String(v), 2, ry(v) - 1);
    });

    // RSI bezier line
    const pts = visRSI.map((v, i) => ({ x: (i + 0.5) * cw, y: ry(v) }));
    if (pts.length > 1) {
      ctx.strokeStyle = 'rgba(220,220,240,0.75)'; ctx.lineWidth = 1.5;
      drawBezierLine(ctx, pts); ctx.stroke();
    }

    // Synchronized crosshair
    const ch = crosshair.current;
    if (ch.visible && ch.idx >= 0 && ch.idx < visRSI.length) {
      const sx = (ch.idx + 0.5) * cw;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, H); ctx.stroke(); ctx.setLineDash([]);
    }

    // Current RSI
    const last = visRSI[visRSI.length - 1];
    ctx.fillStyle = last > 70 ? '#E24B4A' : last < 30 ? '#1D9E75' : 'rgba(220,220,240,0.7)';
    ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'right';
    ctx.fillText(`RSI ${last?.toFixed(1) ?? '--'}`, mainW - 3, 11);
  }, []);

  // ─── rAF Loop ───
  const rafLoop = useCallback(() => {
    // Smooth zoom lerp
    const targetZ = targetZoom.current, curZ = lerpZoom.current;
    if (Math.abs(curZ - targetZ) > 0.08) {
      lerpZoom.current = curZ + (targetZ - curZ) * 0.2;
      bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
    }

    // Inertia
    if (hasInertia.current && Math.abs(inertiaVel.current) > 0.08) {
      const tf = tfRef.current, dc = displayCandles.current;
      const zoom = Math.round(lerpZoom.current);
      const maxPan = Math.max(0, dc.length - zoom);
      panByTf.current[tf] = Math.max(0, Math.min(maxPan, panByTf.current[tf] + inertiaVel.current));
      inertiaVel.current *= 0.88;
      bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
      if (Math.abs(inertiaVel.current) <= 0.08) hasInertia.current = false;
    }

    // Tick interpolation
    const elapsed = Date.now() - lastCandleAt.current;
    const prog = Math.min(1, elapsed / Math.max(100, tickInterval.current));
    const interp = prevClose.current + (currClose.current - prevClose.current) * prog;

    if (bgDirty.current) { drawBg(); bgDirty.current = false; }
    if (candleDirty.current) { drawCandles(); candleDirty.current = false; }
    drawFg(interp);
    if (axisDirty.current) { drawAxis(); axisDirty.current = false; }
    drawRSIPanel();

    rafId.current = requestAnimationFrame(rafLoop);
  }, [drawBg, drawCandles, drawFg, drawAxis, drawRSIPanel]);

  // ─── Sync candles prop → M1 history ───
  useEffect(() => {
    if (candles.length === 0) return;
    const prevLen = prevM1Len.current;

    if (prevLen === 0 || candles.length < prevLen) {
      m1Hist.current = [...candles];
      prevClose.current = candles.length >= 2 ? candles[candles.length - 2].close : candles[0].close;
      currClose.current = candles[candles.length - 1].close;
      lastCandleAt.current = Date.now();
      tickInterval.current = 2000;
    } else if (candles.length > prevLen) {
      const now = Date.now();
      const dt = now - lastCandleAt.current;
      if (dt > 50 && dt < 30000) tickInterval.current = dt;
      lastCandleAt.current = now;
      prevClose.current = currClose.current;
      currClose.current = candles[candles.length - 1].close;
      m1Hist.current = [...candles];

      // Price flash
      const np = candles[candles.length - 1].close;
      const op = lastKnownPrice.current;
      if (op > 0 && np !== op) {
        setPriceFlash(np > op ? 'up' : 'down');
        clearTimeout(priceFlashTimer.current);
        priceFlashTimer.current = setTimeout(() => setPriceFlash(null), 200);
      }
      lastKnownPrice.current = np;
    }
    prevM1Len.current = candles.length;

    const tf = tfRef.current;
    reaggregate(tf);

    // Update header price state
    const dc = displayCandles.current;
    if (dc.length > 0) {
      setLastDisplayPrice(dc[dc.length - 1].close);
      setPrevDisplayPrice(dc.length >= 2 ? dc[dc.length - 2].close : dc[dc.length - 1].close);
    }

    // Keep at right edge unless user panned
    if (panByTf.current[tf] < 0) panByTf.current[tf] = 0;

    bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
  }, [candles]);

  // ─── TF change ───
  const changeTF = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
    tfRef.current = tf;
    reaggregate(tf);
    targetZoom.current = zoomByTf.current[tf];
    lerpZoom.current = zoomByTf.current[tf];
    bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
  }, []);

  // ─── Speed change ───
  const changeSpeed = useCallback((s: SimSpeed) => {
    setSimSpeed(s); onSimSpeedChange?.(s);
  }, [onSimSpeedChange]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const tf = TF_SHORTCUT[e.key]; if (tf) changeTF(tf);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [changeTF]);

  // ─── Start rAF ───
  useEffect(() => {
    rafId.current = requestAnimationFrame(rafLoop);
    return () => cancelAnimationFrame(rafId.current);
  }, [rafLoop]);

  // ─── ResizeObserver ───
  useEffect(() => {
    const el = chartAreaRef.current; if (!el) return;
    const obs = new ResizeObserver(() => { bgDirty.current = true; candleDirty.current = true; axisDirty.current = true; });
    obs.observe(el); return () => obs.disconnect();
  }, []);

  // ─── Trade open → slide-in animation ───
  useEffect(() => { if (entryPrice != null) { tradeOpenAt.current = Date.now(); } }, [entryPrice]);

  // ─── Live button ───
  useEffect(() => {
    const id = setInterval(() => { setShowLiveBtn(panByTf.current[tfRef.current] > 2); }, 400);
    return () => clearInterval(id);
  }, []);

  // ─── Mouse handlers ───
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const ca = chartAreaRef.current; if (!ca) return;
    const rect = ca.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const mainW = rect.width - AXIS_W;

    if (dragging.current) {
      const dx = e.clientX - dragStartX.current; dragStartX.current = e.clientX;
      const tf = tfRef.current, dc = displayCandles.current;
      const zoom = Math.round(lerpZoom.current);
      const pxPerC = mainW / Math.max(1, zoom);
      const dC = -dx / pxPerC;
      const maxPan = Math.max(0, dc.length - zoom);
      panByTf.current[tf] = Math.max(0, Math.min(maxPan, panByTf.current[tf] + dC));
      velHistory.current.push({ v: dC, t: Date.now() });
      if (velHistory.current.length > 5) velHistory.current.shift();
      bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
      return;
    }

    const zoom = Math.round(lerpZoom.current);
    const cw = mainW / Math.max(1, zoom);
    const idx = Math.max(0, Math.min(zoom - 1, Math.floor(x / cw)));
    crosshair.current = { x, y, visible: true, idx };
    axisDirty.current = true;

    const tf = tfRef.current, dc = displayCandles.current;
    const pan = Math.round(panByTf.current[tf]);
    const start = Math.max(0, dc.length - zoom - pan);
    setCrosshairCandle(dc.slice(start)[idx] ?? null);
  }, []);

  const onMouseLeave = useCallback(() => {
    crosshair.current = { x: 0, y: 0, visible: false, idx: -1 };
    axisDirty.current = true; setCrosshairCandle(null);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    dragging.current = true; dragStartX.current = e.clientX;
    velHistory.current = []; hasInertia.current = false; inertiaVel.current = 0;
  }, []);

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return; dragging.current = false;
    const hist = velHistory.current;
    if (hist.length >= 2) {
      const recent = hist.slice(-3);
      const avgV = recent.reduce((s, h) => s + h.v, 0) / recent.length;
      if (Math.abs(avgV) > 0.3) { inertiaVel.current = avgV; hasInertia.current = true; }
    }
    velHistory.current = [];
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ca = chartAreaRef.current; if (!ca) return;
    const rect = ca.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const mainW = rect.width - AXIS_W;
    const tf = tfRef.current, dc = displayCandles.current;
    const zoom = Math.round(lerpZoom.current);
    const pxPerC = mainW / Math.max(1, zoom);
    const cfr = (mainW - mx) / pxPerC;
    const delta = e.deltaY > 0 ? 8 : -8;
    const newTarget = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoom.current + delta));
    const panAdj = (newTarget - targetZoom.current) * (1 - cfr / zoom);
    const maxPan = Math.max(0, dc.length - newTarget);
    panByTf.current[tf] = Math.max(0, Math.min(maxPan, panByTf.current[tf] + panAdj));
    targetZoom.current = newTarget; zoomByTf.current[tf] = newTarget;
    bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
  }, []);

  const onAxisDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    axisDragging.current = true; axisDragY0.current = e.clientY;
    const g = geom.current; axisDragRange0.current = g.maxP - g.minP;
    manualScale.current[tfRef.current] = axisDragRange0.current;
  }, []);

  const onAxisMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!axisDragging.current) return;
    const dy = e.clientY - axisDragY0.current;
    manualScale.current[tfRef.current] = Math.max(0.5, axisDragRange0.current * (1 + dy * 0.005));
    bgDirty.current = true; candleDirty.current = true; axisDirty.current = true;
  }, []);

  const onAxisUp = useCallback(() => { axisDragging.current = false; }, []);
  const onAxisDbl = useCallback(() => { manualScale.current[tfRef.current] = null; bgDirty.current = true; candleDirty.current = true; axisDirty.current = true; }, []);

  const goLive = useCallback(() => { panByTf.current[tfRef.current] = 0; bgDirty.current = true; candleDirty.current = true; axisDirty.current = true; setShowLiveBtn(false); }, []);

  const priceUp = lastDisplayPrice >= prevDisplayPrice;
  const priceDiff = lastDisplayPrice - prevDisplayPrice;
  const pricePct = prevDisplayPrice > 0 ? (priceDiff / prevDisplayPrice * 100).toFixed(2) : '0.00';
  const ch = crosshairCandle;

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* ── Chart Header ── */}
      <div className="flex items-center gap-2 px-2 py-1 flex-shrink-0 flex-wrap" style={{ background: 'hsl(215,28%,8%)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ color: '#1D9E75', fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 12 }}>XAU/USD</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: 14, color: priceFlash === 'up' ? '#26A69A' : priceFlash === 'down' ? '#EF5350' : '#e2e8f0', transition: 'color 0.15s' }}>
          {lastDisplayPrice.toFixed(2)}
        </span>
        <span style={{ color: priceUp ? '#1D9E75' : '#E24B4A', fontSize: 10, fontFamily: 'JetBrains Mono' }}>
          {priceUp ? '+' : ''}{priceDiff.toFixed(2)} ({priceUp ? '+' : ''}{pricePct}%)
        </span>
        {ch && (
          <span style={{ color: 'rgba(160,160,190,0.6)', fontFamily: 'JetBrains Mono', fontSize: 9 }}>
            O:{ch.open.toFixed(2)} H:{ch.high.toFixed(2)} L:{ch.low.toFixed(2)} C:{ch.close.toFixed(2)}
          </span>
        )}
        <span style={{ color: 'rgba(160,160,190,0.35)', fontSize: 9 }}>Spread:20</span>

        <div className="ml-auto flex items-center gap-1 flex-wrap">
          {TF_ORDER.map(tf => (
            <button key={tf} onClick={() => changeTF(tf)} style={{ padding: '1px 6px', borderRadius: 3, fontSize: 9, fontFamily: 'JetBrains Mono', fontWeight: 600, cursor: 'pointer', border: 'none', background: timeframe === tf ? '#1D9E75' : 'rgba(255,255,255,0.06)', color: timeframe === tf ? '#fff' : 'rgba(160,160,200,0.7)', transition: 'all 0.1s' }} data-testid={`tf-${tf}`}>{tf}</button>
          ))}
          <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
          {([1, 2, 5, 10] as SimSpeed[]).map(s => (
            <button key={s} onClick={() => changeSpeed(s)} style={{ padding: '1px 5px', borderRadius: 3, fontSize: 9, fontFamily: 'JetBrains Mono', cursor: 'pointer', border: 'none', background: simSpeed === s ? 'rgba(55,138,221,0.25)' : 'rgba(255,255,255,0.05)', color: simSpeed === s ? '#378ADD' : 'rgba(160,160,200,0.6)', transition: 'all 0.1s' }} data-testid={`speed-${s}x`}>{s}×</button>
          ))}
        </div>
      </div>

      {/* ── Chart Area ── */}
      <div ref={chartAreaRef} className="flex-1 relative min-h-0" style={{ overflow: 'hidden' }}>
        <canvas ref={bgRef} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
        <canvas ref={candleRef} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} />
        <canvas ref={fgRef} style={{ position: 'absolute', left: 0, top: 0, cursor: dragging.current ? 'grabbing' : 'crosshair' }} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onMouseDown={onMouseDown} onMouseUp={onMouseUp} onWheel={onWheel} data-testid="candlestick-chart" />
        <canvas ref={axisRef} style={{ position: 'absolute', right: 0, top: 0, cursor: 'ns-resize' }} onMouseDown={onAxisDown} onMouseMove={onAxisMove} onMouseUp={onAxisUp} onMouseLeave={onAxisUp} onDoubleClick={onAxisDbl} />

        {/* OHLCV Tooltip */}
        {ch && (
          <div className="absolute top-2 left-2 pointer-events-none z-20" style={{ background: 'rgba(10,14,22,0.93)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, padding: '5px 9px', backdropFilter: 'blur(6px)' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#1D9E75', fontWeight: 700, marginBottom: 2 }}>XAU/USD {timeframe}</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: 'rgba(160,160,190,0.6)', marginBottom: 3 }}>{new Date(ch.time).toLocaleString()}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '14px 1fr', gap: '0 8px', fontFamily: 'JetBrains Mono', fontSize: 10 }}>
              <span style={{ color: 'rgba(160,160,190,0.5)' }}>O</span><span style={{ color: '#e2e8f0' }}>{ch.open.toFixed(2)}</span>
              <span style={{ color: 'rgba(160,160,190,0.5)' }}>H</span><span style={{ color: '#26A69A' }}>{ch.high.toFixed(2)}</span>
              <span style={{ color: 'rgba(160,160,190,0.5)' }}>L</span><span style={{ color: '#EF5350' }}>{ch.low.toFixed(2)}</span>
              <span style={{ color: 'rgba(160,160,190,0.5)' }}>C</span><span style={{ color: '#e2e8f0', fontWeight: 700 }}>{ch.close.toFixed(2)}</span>
            </div>
            {(() => {
              const dc = displayCandles.current;
              const chIdx = dc.findIndex(c => c.time === ch.time);
              const e9v = chIdx >= 0 && chIdx < ema9Data.current.length ? ema9Data.current[chIdx] : null;
              const e21v = chIdx >= 0 && chIdx < ema21Data.current.length ? ema21Data.current[chIdx] : null;
              return e9v && e21v ? (
                <div style={{ marginTop: 3, fontFamily: 'JetBrains Mono', fontSize: 9 }}>
                  <span style={{ color: '#378ADD' }}>E9:{e9v.toFixed(2)}</span>
                  <span style={{ color: 'rgba(160,160,190,0.4)', margin: '0 3px' }}>|</span>
                  <span style={{ color: '#1D9E75' }}>E21:{e21v.toFixed(2)}</span>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Live button */}
        {showLiveBtn && (
          <button onClick={goLive} className="absolute z-10" style={{ bottom: 36, right: 68, background: 'rgba(29,158,117,0.18)', border: '1px solid rgba(29,158,117,0.5)', borderRadius: 4, padding: '2px 8px', fontSize: 10, color: '#1D9E75', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
            ↓ Live
          </button>
        )}
      </div>

      {/* ── RSI Panel ── */}
      <div style={{ height: 68, flexShrink: 0, position: 'relative', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <canvas ref={rsiRef} style={{ position: 'absolute', left: 0, top: 0 }} />
      </div>
    </div>
  );
}
