import { Candle, MarketCondition, MarketRegime, NewsEvent, NewsEventState, SRZone } from '@/types/trading';

// XAU/USD starting price ($2300–$2400)
const GOLD_BASE = 2300 + Math.floor(Math.random() * 100);
let STARTING_PRICE = GOLD_BASE;

// Base volatility — produces M1 range ~30-80 cents at gold prices
const BASE_VOL_MULT = 0.00012;

// Session model (compressed): cycle of M1 candles per session
const SESSION_LENGTHS = { asian: 540, london: 480, newyork: 480 };
const SESSION_CYCLE = SESSION_LENGTHS.asian + SESSION_LENGTHS.london + SESSION_LENGTHS.newyork; // 1500
const SESSION_VOL: Record<string, number> = { asian: 0.35, london: 1.0, newyork: 1.5 };
let sessionCandleIndex = 0;

export type TradingSession = 'asian' | 'london' | 'newyork';

export function getCurrentSession(): TradingSession {
  const pos = sessionCandleIndex % SESSION_CYCLE;
  if (pos < SESSION_LENGTHS.asian) return 'asian';
  if (pos < SESSION_LENGTHS.asian + SESSION_LENGTHS.london) return 'london';
  return 'newyork';
}

// Market regime manager
let currentRegime: MarketRegime = { condition: 'uptrend', candlesRemaining: 40 };
let swingHighs: number[] = [];
let swingLows: number[] = [];
let lastSwingHigh = STARTING_PRICE + 5;
let lastSwingLow = STARTING_PRICE - 5;
let volatilityCluster = 1.0;
let volatilityClusterDir = 1;
let volatilityClusterTick = 0;

// News event state
let nextNewsCountdown = 50 + Math.floor(Math.random() * 31);
let newsPhase: NewsEventState = 'idle';
let newsPhaseCountdown = 0;
let newsDirection: 'up' | 'down' = 'up';
let newsSpikeAmount = 0;
let newsSpikePerCandle = 0;
let newsRetracementPerCandle = 0;

// Simulated time: start from 24 hours ago so history covers a full day
let simTime = Date.now() - 2000 * 60 * 1000; // 2000 minutes ago

function resetNewsState(): void {
  nextNewsCountdown = 50 + Math.floor(Math.random() * 31);
  newsPhase = 'idle';
  newsPhaseCountdown = 0;
  newsDirection = 'up';
  newsSpikeAmount = 0;
  newsSpikePerCandle = 0;
  newsRetracementPerCandle = 0;
}

function advanceNewsEvent(): number {
  if (newsPhase === 'idle') {
    nextNewsCountdown--;
    if (nextNewsCountdown <= 3 && nextNewsCountdown > 0) {
      newsDirection = Math.random() > 0.5 ? 'up' : 'down';
      newsSpikeAmount = 0.5 + Math.random() * 1.5; // $0.50 - $2.00 spike
      newsPhase = 'preWarning';
      newsPhaseCountdown = nextNewsCountdown;
    } else if (nextNewsCountdown <= 0) {
      newsDirection = Math.random() > 0.5 ? 'up' : 'down';
      newsSpikeAmount = 0.5 + Math.random() * 1.5;
      const spikeCandlesTotal = 2 + Math.floor(Math.random() * 2);
      newsSpikePerCandle = newsSpikeAmount / spikeCandlesTotal;
      newsPhase = 'spike';
      newsPhaseCountdown = spikeCandlesTotal;
    }
    return 0;
  }

  if (newsPhase === 'preWarning') {
    newsPhaseCountdown--;
    if (newsPhaseCountdown <= 0) {
      const spikeCandlesTotal = 2 + Math.floor(Math.random() * 2);
      newsSpikePerCandle = newsSpikeAmount / spikeCandlesTotal;
      newsPhase = 'spike';
      newsPhaseCountdown = spikeCandlesTotal;
    }
    return 0;
  }

  if (newsPhase === 'spike') {
    newsPhaseCountdown--;
    const bias = newsDirection === 'up' ? newsSpikePerCandle : -newsSpikePerCandle;
    if (newsPhaseCountdown <= 0) {
      const retracementTotal = 4 + Math.floor(Math.random() * 3);
      newsRetracementPerCandle = (newsSpikeAmount * 0.5) / retracementTotal;
      newsPhase = 'retracement';
      newsPhaseCountdown = retracementTotal;
    }
    return bias;
  }

  if (newsPhase === 'retracement') {
    newsPhaseCountdown--;
    const bias = newsDirection === 'up' ? -newsRetracementPerCandle : newsRetracementPerCandle;
    if (newsPhaseCountdown <= 0) {
      newsPhase = 'idle';
      nextNewsCountdown = 50 + Math.floor(Math.random() * 31);
    }
    return bias;
  }

  return 0;
}

export function getNewsEvent(): NewsEvent {
  return {
    state: newsPhase,
    direction: newsDirection,
    candlesRemaining: newsPhase === 'idle' ? nextNewsCountdown : newsPhaseCountdown,
    spikeAmount: Math.round(newsSpikeAmount * 100) / 100,
  };
}

function advanceRegime(): void {
  currentRegime.candlesRemaining--;
  if (currentRegime.candlesRemaining <= 0) {
    const transitions: Record<MarketCondition, MarketCondition[]> = {
      uptrend: ['range', 'transition', 'uptrend'],
      downtrend: ['range', 'transition', 'downtrend'],
      range: ['uptrend', 'downtrend', 'breakout'],
      breakout: ['uptrend', 'transition'],
      volatile: ['range', 'downtrend'],
      transition: ['range', 'uptrend', 'downtrend'],
    };
    const options = transitions[currentRegime.condition];
    const next = options[Math.floor(Math.random() * options.length)];
    const durations: Record<MarketCondition, [number, number]> = {
      uptrend: [25, 50],
      downtrend: [20, 40],
      range: [20, 40],
      breakout: [5, 12],
      volatile: [8, 15],
      transition: [10, 20],
    };
    const [min, max] = durations[next];
    currentRegime = { condition: next, candlesRemaining: min + Math.floor(Math.random() * (max - min)) };
  }
}

// Round number magnetism for Gold ($50 levels: 2300, 2350, 2400, etc.)
function getRoundNumberForce(price: number): number {
  const nearestFifty = Math.round(price / 50) * 50;
  const dist = price - nearestFifty;
  const absDistNorm = Math.abs(dist) / 2; // normalized: within 2 units of round number
  if (absDistNorm < 1) {
    // Mean reversion force toward round number
    return -dist * 0.03;
  }
  return 0;
}

function generateNextCandleInternal(prevClose: number, timestamp: number): Candle {
  advanceRegime();
  sessionCandleIndex++;

  // Volatility clustering
  volatilityClusterTick++;
  if (volatilityClusterTick % 3 === 0) {
    volatilityCluster += volatilityClusterDir * 0.08;
    if (volatilityCluster >= 2.0) volatilityClusterDir = -1;
    if (volatilityCluster <= 0.5) volatilityClusterDir = 1;
  }

  const session = getCurrentSession();
  const sessionVol = SESSION_VOL[session];
  const baseVol = prevClose * BASE_VOL_MULT * sessionVol * volatilityCluster;

  let bias = 0;
  let volumeMultiplier = 1;
  const c = currentRegime.condition;
  const progress = 1 - currentRegime.candlesRemaining / 40;

  switch (c) {
    case 'uptrend':
      bias = baseVol * (0.3 + 0.15 * Math.sin(progress * Math.PI));
      break;
    case 'downtrend':
      bias = -baseVol * (0.3 + 0.15 * Math.sin(progress * Math.PI));
      break;
    case 'breakout':
      bias = baseVol * 1.2;
      volumeMultiplier = 2.5;
      break;
    case 'volatile':
      bias = (Math.random() > 0.5 ? 1 : -1) * baseVol * 0.8;
      volumeMultiplier = 1.8;
      break;
    case 'transition':
      bias = (Math.random() - 0.5) * baseVol * 0.3;
      volumeMultiplier = 1.2;
      break;
    case 'range': {
      const midpoint = (lastSwingHigh + lastSwingLow) / 2;
      const distFromMid = prevClose - midpoint;
      bias = -distFromMid * 0.05;
      break;
    }
  }

  // Round number magnetism
  bias += getRoundNumberForce(prevClose);

  const newsBias = advanceNewsEvent();
  const open = prevClose;
  const change = (Math.random() - 0.5) * baseVol * 2 + bias + newsBias;
  const close = Math.max(open + change, 100);

  const isNewsActive = newsPhase === 'spike' || newsPhase === 'retracement';
  const wickMult = isNewsActive ? 2.0 : c === 'volatile' ? 1.5 : c === 'breakout' ? 0.5 : 1.0;
  const wickUp = Math.random() * baseVol * 0.9 * wickMult;
  const wickDown = Math.random() * baseVol * 0.9 * wickMult;

  const high = Math.max(open, close) + wickUp;
  const low = Math.min(open, close) - wickDown;

  if (high > lastSwingHigh) { lastSwingHigh = high; swingHighs.push(high); if (swingHighs.length > 20) swingHighs.shift(); }
  if (low < lastSwingLow) { lastSwingLow = low; swingLows.push(low); if (swingLows.length > 20) swingLows.shift(); }

  const baseVolume = 800 + Math.random() * 1500;
  const volMult = sessionVol * volumeMultiplier * (isNewsActive ? 2.5 : 1);

  return {
    time: timestamp,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume: Math.round(baseVolume * volMult),
  };
}

export function generateInitialCandles(count: number = 2000): Candle[] {
  const candles: Candle[] = [];
  STARTING_PRICE = 2300 + Math.floor(Math.random() * 100);
  let price = STARTING_PRICE;

  // Reset all state
  currentRegime = { condition: 'uptrend', candlesRemaining: 20 };
  swingHighs = [];
  swingLows = [];
  lastSwingHigh = price + 5;
  lastSwingLow = price - 5;
  volatilityCluster = 1.0;
  volatilityClusterDir = 1;
  volatilityClusterTick = 0;
  sessionCandleIndex = 0;
  simTime = Date.now() - count * 60 * 1000; // each M1 candle = 1 real minute simulated
  resetNewsState();

  for (let i = 0; i < count; i++) {
    const candle = generateNextCandleInternal(price, simTime);
    candles.push(candle);
    price = candle.close;
    simTime += 60 * 1000; // 1 minute per M1 candle
  }

  return candles;
}

export function generateNextCandle(prevClose: number, _time: number): Candle {
  const candle = generateNextCandleInternal(prevClose, simTime);
  simTime += 60 * 1000;
  return candle;
}

// Aggregate M1 candles into higher timeframe candles
export function aggregateCandles(m1Candles: Candle[], intervalSize: number): Candle[] {
  if (intervalSize <= 1) return m1Candles;
  const result: Candle[] = [];
  for (let i = 0; i < m1Candles.length; i += intervalSize) {
    const group = m1Candles.slice(i, i + intervalSize);
    if (group.length === 0) continue;
    result.push({
      time: group[0].time,
      open: group[0].open,
      high: Math.max(...group.map(c => c.high)),
      low: Math.min(...group.map(c => c.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((s, c) => s + c.volume, 0),
    });
  }
  return result;
}

export function detectMarketCondition(candles: Candle[]): MarketCondition {
  return currentRegime.condition;
}

export function getCurrentRegime(): MarketRegime {
  return currentRegime;
}

// Improved S/R zones using pivot clustering
export function findSRZones(candles: Candle[]): SRZone[] {
  if (candles.length < 10) {
    const price = candles[candles.length - 1]?.close || STARTING_PRICE;
    return [
      { price: price - 3, type: 'support', strength: 1 },
      { price: price + 3, type: 'resistance', strength: 1 },
    ];
  }

  const pivotWindow = 3; // strictly 3 candles each side
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];
  const lookback = candles.slice(-120);

  for (let i = pivotWindow; i < lookback.length - pivotWindow; i++) {
    const high = lookback[i].high;
    const low = lookback[i].low;
    let isHighest = true;
    let isLowest = true;
    for (let j = i - pivotWindow; j <= i + pivotWindow; j++) {
      if (j === i) continue;
      if (lookback[j].high >= high) isHighest = false;
      if (lookback[j].low <= low) isLowest = false;
    }
    if (isHighest) pivotHighs.push(high);
    if (isLowest) pivotLows.push(low);
  }

  // Cluster within 12 pips ($0.12)
  const CLUSTER_RANGE = 0.12;

  function clusterLevels(levels: number[]): { price: number; strength: number }[] {
    const groups: { price: number; strength: number; min: number; max: number }[] = [];
    const sorted = [...levels].sort((a, b) => a - b);
    for (const level of sorted) {
      const existing = groups.find(g => Math.abs(g.price - level) < CLUSTER_RANGE);
      if (existing) {
        existing.price = (existing.price * existing.strength + level) / (existing.strength + 1);
        existing.strength++;
        existing.min = Math.min(existing.min, level);
        existing.max = Math.max(existing.max, level);
      } else {
        groups.push({ price: level, strength: 1, min: level, max: level });
      }
    }
    return groups.sort((a, b) => b.strength - a.strength).slice(0, 5);
  }

  const currentPrice = candles[candles.length - 1].close;
  const resistanceGroups = clusterLevels(pivotHighs)
    .filter(g => g.price > currentPrice)
    .map(g => ({ price: g.price, type: 'resistance' as const, strength: g.strength }));

  const supportGroups = clusterLevels(pivotLows)
    .filter(g => g.price < currentPrice)
    .map(g => ({ price: g.price, type: 'support' as const, strength: g.strength }));

  if (resistanceGroups.length === 0) resistanceGroups.push({ price: currentPrice + 2, type: 'resistance', strength: 1 });
  if (supportGroups.length === 0) supportGroups.push({ price: currentPrice - 2, type: 'support', strength: 1 });

  return [...resistanceGroups, ...supportGroups];
}

export function findSupportResistance(candles: Candle[]): { support: number; resistance: number } {
  const zones = findSRZones(candles);
  const currentPrice = candles[candles.length - 1]?.close || STARTING_PRICE;
  const supports = zones.filter(z => z.type === 'support').sort((a, b) => b.price - a.price);
  const resistances = zones.filter(z => z.type === 'resistance').sort((a, b) => a.price - b.price);
  return {
    support: supports[0]?.price ?? currentPrice - 3,
    resistance: resistances[0]?.price ?? currentPrice + 3,
  };
}

export function calculateEMA(candles: Candle[], period: number): number[] {
  if (candles.length === 0) return [];
  if (candles.length < period) return candles.map(c => c.close);
  const k = 2 / (period + 1);
  const ema: number[] = [];
  let prev = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  ema.push(...Array(period).fill(prev));
  for (let i = period; i < candles.length; i++) {
    prev = candles[i].close * k + prev * (1 - k);
    ema.push(Math.round(prev * 100) / 100);
  }
  return ema;
}

export function calculateRSI(candles: Candle[], period: number = 14): number[] {
  if (candles.length < 2) return candles.map(() => 50);

  const rsi: number[] = [];
  const warmup = Math.min(period, candles.length - 1);
  for (let i = 0; i <= warmup; i++) rsi.push(50);
  if (candles.length <= period + 1) return rsi;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const computeRSI = (g: number, l: number) => l === 0 ? 100 : Math.round((100 - 100 / (1 + g / l)) * 100) / 100;
  rsi[period] = computeRSI(avgGain, avgLoss);

  for (let i = period + 1; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rsi.push(computeRSI(avgGain, avgLoss));
  }
  return rsi;
}

export function getSwingPoints(candles: Candle[]): { highs: number[]; lows: number[] } {
  const lookback = candles.slice(-60);
  const highs: number[] = [];
  const lows: number[] = [];
  const w = 3;
  for (let i = w; i < lookback.length - w; i++) {
    const h = lookback[i].high;
    const l = lookback[i].low;
    if (lookback.slice(i - w, i + w + 1).every((c, j) => j === w || c.high <= h)) highs.push(i);
    if (lookback.slice(i - w, i + w + 1).every((c, j) => j === w || c.low >= l)) lows.push(i);
  }
  return { highs, lows };
}
