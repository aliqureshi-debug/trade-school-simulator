import { Candle, MarketCondition, MarketRegime, NewsEvent, NewsEventState, SRZone } from '@/types/trading';

const STARTING_PRICE = 100;

// Regime manager for smooth transitions
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
      // Pre-warning: decide direction and spike size now
      if (newsPhase === 'idle') {
        newsDirection = Math.random() > 0.5 ? 'up' : 'down';
        newsSpikeAmount = (20 + Math.floor(Math.random() * 21)) * 0.01; // 20-40 pips
        newsPhase = 'preWarning';
        newsPhaseCountdown = nextNewsCountdown;
      }
    } else if (nextNewsCountdown <= 0) {
      // Missed pre-warning — go straight to spike
      newsDirection = Math.random() > 0.5 ? 'up' : 'down';
      newsSpikeAmount = (20 + Math.floor(Math.random() * 21)) * 0.01;
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
  const spikeAmountPips = Math.round(newsSpikeAmount / 0.01);
  return {
    state: newsPhase,
    direction: newsDirection,
    candlesRemaining: newsPhase === 'idle' ? nextNewsCountdown : newsPhaseCountdown,
    spikeAmount: spikeAmountPips,
  };
}

export function generateInitialCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = STARTING_PRICE;
  let time = Date.now() - count * 2000;

  // Reset all state
  currentRegime = { condition: 'uptrend', candlesRemaining: 20 };
  swingHighs = [];
  swingLows = [];
  lastSwingHigh = price + 3;
  lastSwingLow = price - 3;
  volatilityCluster = 1.0;
  volatilityClusterDir = 1;
  volatilityClusterTick = 0;
  resetNewsState();

  for (let i = 0; i < count; i++) {
    const candle = generateNextCandleInternal(price, time);
    candles.push(candle);
    price = candle.close;
    time += 2000;
  }

  return candles;
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
    currentRegime = {
      condition: next,
      candlesRemaining: min + Math.floor(Math.random() * (max - min)),
    };
  }
}

function generateNextCandleInternal(prevClose: number, time: number): Candle {
  advanceRegime();

  // Volatility clustering: slow oscillation 0.5x to 2x
  volatilityClusterTick++;
  if (volatilityClusterTick % 3 === 0) {
    volatilityCluster += volatilityClusterDir * 0.08;
    if (volatilityCluster >= 2.0) volatilityClusterDir = -1;
    if (volatilityCluster <= 0.5) volatilityClusterDir = 1;
  }

  const baseVol = prevClose * 0.007 * volatilityCluster;
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

  // News event bias — overrides regular bias during spike/retracement
  const newsBias = advanceNewsEvent();

  const open = prevClose;
  const change = (Math.random() - 0.5) * baseVol * 2 + bias + newsBias;
  const close = Math.max(open + change, 0.01);

  // Increase volume and wicks during news
  const isNewsActive = newsPhase === 'spike' || newsPhase === 'retracement';
  const wickMult = isNewsActive ? 2.0 : c === 'volatile' ? 1.5 : c === 'breakout' ? 0.5 : 1.0;
  const wickUp = Math.random() * baseVol * 0.9 * wickMult;
  const wickDown = Math.random() * baseVol * 0.9 * wickMult;

  const high = Math.max(open, close) + wickUp;
  const low = Math.min(open, close) - wickDown;

  // Track swing structure
  if (high > lastSwingHigh) {
    lastSwingHigh = high;
    swingHighs.push(high);
    if (swingHighs.length > 20) swingHighs.shift();
  }
  if (low < lastSwingLow) {
    lastSwingLow = low;
    swingLows.push(low);
    if (swingLows.length > 20) swingLows.shift();
  }

  const baseVolume = 800 + Math.random() * 1500;

  return {
    time,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume: Math.round(baseVolume * volumeMultiplier * (isNewsActive ? 2.5 : 1)),
  };
}

export function generateNextCandle(prevClose: number, time: number): Candle {
  return generateNextCandleInternal(prevClose, time);
}

export function detectMarketCondition(candles: Candle[]): MarketCondition {
  return currentRegime.condition;
}

export function getCurrentRegime(): MarketRegime {
  return currentRegime;
}

export function findSRZones(candles: Candle[]): SRZone[] {
  if (candles.length < 10) {
    const price = candles[candles.length - 1]?.close || STARTING_PRICE;
    return [
      { price: price - 3, type: 'support', strength: 1 },
      { price: price + 3, type: 'resistance', strength: 1 },
    ];
  }

  const pivotWindow = 5;
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  const lookback = candles.slice(-80);

  for (let i = pivotWindow; i < lookback.length - pivotWindow; i++) {
    const high = lookback[i].high;
    const low = lookback[i].low;

    const isHighest = lookback
      .slice(i - pivotWindow, i + pivotWindow + 1)
      .every((c, idx) => idx === pivotWindow || c.high <= high);
    if (isHighest) pivotHighs.push(high);

    const isLowest = lookback
      .slice(i - pivotWindow, i + pivotWindow + 1)
      .every((c, idx) => idx === pivotWindow || c.low >= low);
    if (isLowest) pivotLows.push(low);
  }

  // Group levels within 0.8 of each other
  const pipGroup = 0.8;

  function groupLevels(levels: number[]): { price: number; strength: number }[] {
    const groups: { price: number; strength: number }[] = [];
    const sorted = [...levels].sort((a, b) => a - b);

    for (const level of sorted) {
      const existing = groups.find(g => Math.abs(g.price - level) < pipGroup);
      if (existing) {
        existing.price = (existing.price * existing.strength + level) / (existing.strength + 1);
        existing.strength++;
      } else {
        groups.push({ price: level, strength: 1 });
      }
    }

    return groups.sort((a, b) => b.strength - a.strength).slice(0, 3);
  }

  const currentPrice = candles[candles.length - 1].close;

  const resistanceGroups = groupLevels(pivotHighs)
    .filter(g => g.price > currentPrice)
    .map(g => ({ ...g, type: 'resistance' as const }));

  const supportGroups = groupLevels(pivotLows)
    .filter(g => g.price < currentPrice)
    .map(g => ({ ...g, type: 'support' as const }));

  // Fallback if none found
  if (resistanceGroups.length === 0) {
    resistanceGroups.push({ price: currentPrice + 2, type: 'resistance', strength: 1 });
  }
  if (supportGroups.length === 0) {
    supportGroups.push({ price: currentPrice - 2, type: 'support', strength: 1 });
  }

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

  // Fill warmup with neutral 50
  const warmup = Math.min(period, candles.length - 1);
  for (let i = 0; i <= warmup; i++) {
    rsi.push(50);
  }

  if (candles.length <= period + 1) return rsi;

  // Initial averages (simple mean over first `period` moves)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  const computeRSI = (gain: number, loss: number): number => {
    if (loss === 0) return 100;
    return Math.round((100 - 100 / (1 + gain / loss)) * 100) / 100;
  };

  // Replace the last warmup value with the real first RSI value
  rsi[period] = computeRSI(avgGain, avgLoss);

  // Wilder smoothing for the rest
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

    if (lookback.slice(i - w, i + w + 1).every((c, j) => j === w || c.high <= h)) {
      highs.push(i);
    }
    if (lookback.slice(i - w, i + w + 1).every((c, j) => j === w || c.low >= l)) {
      lows.push(i);
    }
  }

  return { highs, lows };
}
