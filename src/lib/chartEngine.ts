import { Candle, MarketCondition } from '@/types/trading';

const STARTING_PRICE = 100;

export function generateInitialCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = STARTING_PRICE;
  let time = Date.now() - count * 2000;

  for (let i = 0; i < count; i++) {
    const candle = generateNextCandle(price, time, getConditionForIndex(i, count));
    candles.push(candle);
    price = candle.close;
    time += 2000;
  }

  return candles;
}

function getConditionForIndex(index: number, total: number): MarketCondition {
  const progress = index / total;
  if (progress < 0.3) return 'uptrend';
  if (progress < 0.5) return 'range';
  if (progress < 0.6) return 'breakout';
  if (progress < 0.8) return 'downtrend';
  return 'uptrend';
}

export function generateNextCandle(
  prevClose: number,
  time: number,
  condition: MarketCondition = 'range'
): Candle {
  const volatility = prevClose * 0.008;
  let bias = 0;

  switch (condition) {
    case 'uptrend': bias = volatility * 0.4; break;
    case 'downtrend': bias = -volatility * 0.4; break;
    case 'breakout': bias = volatility * 0.8; break;
    case 'volatile': bias = (Math.random() > 0.5 ? 1 : -1) * volatility * 0.6; break;
    case 'range': bias = 0; break;
  }

  const open = prevClose;
  const change = (Math.random() - 0.5) * volatility * 2 + bias;
  const close = open + change;

  const wickUp = Math.random() * volatility * 0.8;
  const wickDown = Math.random() * volatility * 0.8;

  const high = Math.max(open, close) + wickUp;
  const low = Math.min(open, close) - wickDown;

  const baseVolume = 1000 + Math.random() * 2000;
  const volume = condition === 'breakout' ? baseVolume * 2.5 : 
                 condition === 'volatile' ? baseVolume * 1.8 : baseVolume;

  return {
    time,
    open: Math.round(open * 100) / 100,
    high: Math.round(high * 100) / 100,
    low: Math.round(low * 100) / 100,
    close: Math.round(close * 100) / 100,
    volume: Math.round(volume),
  };
}

export function detectMarketCondition(candles: Candle[]): MarketCondition {
  if (candles.length < 10) return 'range';

  const recent = candles.slice(-10);
  const closes = recent.map(c => c.close);

  let higherHighs = 0;
  let lowerLows = 0;

  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) higherHighs++;
    else lowerLows++;
  }

  const avgVolume = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const lastVolume = recent[recent.length - 1].volume;

  if (lastVolume > avgVolume * 2) return 'breakout';
  if (higherHighs >= 7) return 'uptrend';
  if (lowerLows >= 7) return 'downtrend';

  const range = Math.max(...closes) - Math.min(...closes);
  const avgPrice = closes.reduce((s, c) => s + c, 0) / closes.length;
  if (range / avgPrice < 0.015) return 'range';

  return 'range';
}

export function findSupportResistance(candles: Candle[]): { support: number; resistance: number } {
  if (candles.length < 5) return { support: 95, resistance: 105 };
  
  const recent = candles.slice(-30);
  const lows = recent.map(c => c.low);
  const highs = recent.map(c => c.high);

  return {
    support: Math.round(Math.min(...lows) * 100) / 100,
    resistance: Math.round(Math.max(...highs) * 100) / 100,
  };
}
