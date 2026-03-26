export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  size: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: number;
  exitTime?: number;
  pnl?: number;
  status: 'open' | 'closed';
}

export interface CoachMessage {
  id: string;
  text: string;
  mode: 'explain' | 'guide' | 'debrief';
  timestamp: number;
  icon?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  totalTrades: number;
  winRate: number;
  balance: number;
  startingBalance: number;
  achievements: Achievement[];
  phase: number;
  conceptsSeen: string[];
}

export type MarketCondition = 'uptrend' | 'downtrend' | 'range' | 'breakout' | 'volatile';
