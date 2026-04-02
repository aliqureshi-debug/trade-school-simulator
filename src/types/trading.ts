export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SRZone {
  price: number;
  type: 'support' | 'resistance';
  strength: number;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  size: number;
  lotSize: number;
  stopLoss?: number;
  takeProfit?: number;
  entryTime: number;
  exitTime?: number;
  pnl?: number;
  status: 'open' | 'closed';
  hadStopLoss: boolean;
  rrRatio?: number;
}

export type AriaState = 'teal' | 'amber' | 'red';

export type UserArchetype = 'scalper' | 'swing' | 'risk-manager';

export interface UserProfile {
  name: string;
  archetype: UserArchetype;
  created: number;
}

export interface DisciplineScore {
  total: number;
  stopLossAdherence: number;
  rrDiscipline: number;
  noRevengeTrade: number;
  consistencyBonus: number;
}

export interface CoachMessage {
  id: string;
  text: string;
  type: 'learn' | 'action' | 'review' | 'warn' | 'danger';
  timestamp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface ChallengeCriteria {
  requireStopLoss?: boolean;
  requireTakeProfit?: boolean;
  tradeType?: 'buy' | 'sell';
  minRR?: number;
  maxRiskPercent?: number;
  mustBeProfit?: boolean;
  count?: number;
}

export interface ChallengeCriterion {
  id: string;
  description: string;
  check: (trade: Trade, stats: PlayerStats) => boolean;
}

export interface Challenge {
  title: string;
  description: string;
  instruction: string;
  criteria: ChallengeCriteria;
  xpReward: number;
  failureMessage: string;
  successMessage: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  target: number;
  completed: boolean;
  resetAt: number;
}

export interface WeeklyChallenge extends DailyChallenge {
  weeklyResetAt: number;
}

export type NewsEventState = 'idle' | 'preWarning' | 'spike' | 'retracement';

export interface NewsEvent {
  state: NewsEventState;
  direction: 'up' | 'down';
  candlesRemaining: number;
  spikeAmount: number;
}

export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
}

export interface Phase {
  id: number;
  title: string;
  subtitle: string;
  desc: string;
  ariaIntroMessage: string;
  conceptToTeach: string;
  chartAnnotations: string[];
  challenge: Challenge;
  unlocksFeatures: string[];
  requiredXP: number;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNext: number;
  xpTotal: number;
  totalTrades: number;
  winRate: number;
  balance: number;
  startingBalance: number;
  achievements: Achievement[];
  phase: number;
  conceptsSeen: string[];
  challengeProgress: number;
  stopLossCount: number;
}

export type MarketCondition = 'uptrend' | 'downtrend' | 'range' | 'breakout' | 'volatile' | 'transition';

export interface MarketRegime {
  condition: MarketCondition;
  candlesRemaining: number;
}

export interface SessionResult {
  totalTrades: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  disciplineScore: number;
  ariaVerdict: string;
  xpEarned: number;
}
