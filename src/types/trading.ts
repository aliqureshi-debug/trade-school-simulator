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
  candlesHeld?: number;
  missionId?: string;
}

export type AriaMode =
  | 'teaching'
  | 'guiding'
  | 'watching'
  | 'caution'
  | 'danger'
  | 'celebrating';

export type AriaState = AriaMode;

export type UserArchetype = 'scalper' | 'swing' | 'risk-manager';

export interface UserProfile {
  name: string;
  archetype: UserArchetype;
  created: number;
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

export type NewsEventState = 'idle' | 'preWarning' | 'spike' | 'retracement';

export interface NewsEvent {
  state: NewsEventState;
  direction: 'up' | 'down';
  candlesRemaining: number;
  spikeAmount: number;
}

export type MarketCondition = 'uptrend' | 'downtrend' | 'range' | 'breakout' | 'volatile' | 'transition';

export interface MarketRegime {
  condition: MarketCondition;
  candlesRemaining: number;
}

export type LessonAnnotationType =
  | 'arrow'
  | 'label'
  | 'circle'
  | 'bracket'
  | 'highlight'
  | 'line'
  | 'band'
  | 'crossout';

export interface LessonAnnotation {
  type: LessonAnnotationType;
  startAtMs: number;
  durationMs: number;
  candleRef?: 'last' | 'last-1' | 'last-2' | 'last-3' | 'last-4' | 'last-5';
  priceRef?: number;
  priceDelta?: number;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  text?: string;
  color?: string;
  animateIn?: 'draw' | 'fade' | 'pop';
}

export interface ARIALesson {
  id: string;
  moduleId: number;
  lessonNumber: number;
  title: string;
  narration: string;
  caption: string;
  annotationSequence: LessonAnnotation[];
  duration: number;
  replayable: boolean;
}

export interface MissionState {
  tradesAttempted: number;
  tradesMeetingCriteria: number;
  consecutiveCompliant: number;
  firstAttempt: boolean;
  candlesHeldOpen: number;
  highestCandlesHeld: number;
  openedInUptrend: boolean;
  closedInProfit: boolean;
  customFlags: Record<string, unknown>;
}

export interface MissionCriterion {
  id: string;
  description: string;
}

export interface TradingMission {
  id: string;
  moduleId: number;
  title: string;
  briefing: string;
  criteria: MissionCriterion[];
  progressDisplay: 'counter' | 'checklist' | 'percentage';
  xpReward: number;
  successMessage: string;
  failureMessage: string;
  ariaGuidanceMessages: string[];
}

export interface AcademyModule {
  id: number;
  title: string;
  tier: 1 | 2 | 3;
  tierName: 'RECRUIT' | 'TRADER' | 'PROFESSIONAL';
  ariaIntroLine: string;
  lessons: ARIALesson[];
  mission: TradingMission;
}

export interface LessonProgress {
  completedLessonIds: string[];
  completedMissionIds: string[];
  currentModuleId: number;
  currentLessonIndex: number;
  missionActive: boolean;
  missionState: MissionState | null;
  hasCompletedOnboarding: boolean;
  userProfile: UserProfile | null;
  lessonSpeed: 'normal' | 'fast' | 'instant';
  candleSpeedMs: number;
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
  stopLossCount: number;
  winStreak: number;
  maxWinStreak: number;
}

export interface SessionResult {
  totalTrades: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  xpEarned: number;
}

export interface SwingPoint {
  index: number;
  price: number;
  type: 'high' | 'low';
  strength: number;
}

export interface ChallengeCriterion {
  id: string;
  description: string;
  check: (trade: Trade, context: {
    allTrades: Trade[];
    balance: number;
    regime: MarketCondition;
    consecutiveCount: number;
  }) => boolean;
}

export interface DisciplineScore {
  stopLossAdherence: number;
  rrCompliance: number;
  revengeTradingPenalty: number;
  patientEntry: number;
  overallScore: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  criteria: ChallengeCriterion[];
  xpReward: number;
  expiresAt: number;
  completed: boolean;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  dailyChallenges: DailyChallenge[];
  xpReward: number;
  expiresAt: number;
  completed: boolean;
  daysCompleted: number;
}
