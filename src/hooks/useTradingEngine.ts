import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Candle, Trade, CoachMessage, PlayerStats, Achievement, AriaState, SRZone, NewsEvent } from '@/types/trading';
import {
  generateInitialCandles,
  generateNextCandle,
  detectMarketCondition,
  findSRZones,
  findSupportResistance,
  calculateEMA,
  getNewsEvent,
} from '@/lib/chartEngine';
import {
  getWelcomeMessages,
  getMarketConditionMessage,
  getTradeOpenMessage,
  getTradeCloseMessage,
  detectAriaState,
  getOpenTradeCommentary,
  getRevengeTradingMessage,
  getLevelUpMessage,
  getChallengeCompleteMessage,
  getChallengeFeedback,
  getPhaseIntroMessages,
} from '@/lib/coachEngine';
import { getPhase, getNextPhase, PHASES } from '@/lib/phases';
import { sound } from '@/lib/soundEngine';
import { saveState, loadState, clearState, SavedState } from '@/lib/persistence';

const STARTING_BALANCE = 10000;

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-trade', title: 'First Steps', description: 'Place your first trade', icon: '🎯', unlocked: false },
  { id: 'first-profit', title: 'In the Green', description: 'Close a profitable trade', icon: '💰', unlocked: false },
  { id: 'five-trades', title: 'Getting Started', description: 'Complete 5 trades', icon: '📊', unlocked: false },
  { id: 'win-streak', title: 'Hot Streak', description: '3 profitable trades in a row', icon: '🔥', unlocked: false },
  { id: 'risk-manager', title: 'Risk Manager', description: 'Use a stop loss on 5 trades', icon: '🛡️', unlocked: false },
  { id: 'level-5', title: 'Apprentice', description: 'Reach Level 5', icon: '⭐', unlocked: false },
  { id: 'phase-3', title: 'Trend Spotter', description: 'Complete Phase 3', icon: '📈', unlocked: false },
  { id: 'phase-6', title: 'Risk Guardian', description: 'Complete Phase 6', icon: '🛡️', unlocked: false },
];

function buildDefaultStats(): PlayerStats {
  return {
    level: 1,
    xp: 0,
    xpToNext: 100,
    xpTotal: 0,
    totalTrades: 0,
    winRate: 0,
    balance: STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    achievements: [...DEFAULT_ACHIEVEMENTS],
    phase: 1,
    conceptsSeen: [],
    challengeProgress: 0,
    stopLossCount: 0,
  };
}

function mergeAchievements(saved: Achievement[]): Achievement[] {
  return DEFAULT_ACHIEVEMENTS.map(def => {
    const found = saved.find(a => a.id === def.id);
    return found ? { ...def, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : def;
  });
}

function buildStatsFromSave(saved: SavedState): PlayerStats {
  return {
    level: saved.level ?? 1,
    xp: saved.xp ?? 0,
    xpToNext: saved.xpToNext ?? 100,
    xpTotal: saved.xpTotal ?? 0,
    totalTrades: saved.totalTrades ?? 0,
    winRate: saved.winRate ?? 0,
    balance: saved.balance ?? STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    achievements: mergeAchievements(saved.achievements ?? []),
    phase: saved.phase ?? 1,
    conceptsSeen: saved.conceptsSeen ?? [],
    challengeProgress: saved.challengeProgress ?? 0,
    stopLossCount: saved.stopLossCount ?? 0,
  };
}

export interface TradingEngineState {
  candles: Candle[];
  trades: Trade[];
  activeTrade: Trade | null;
  coachMessages: CoachMessage[];
  stats: PlayerStats;
  currentPrice: number;
  unrealizedPnl: number;
  srZones: SRZone[];
  supportResistance: { support: number; resistance: number };
  newAchievement: Achievement | null;
  isPaused: boolean;
  ariaState: AriaState;
  cooldownSeconds: number;
  phaseUnlocking: boolean;
  xpGain: number | null;
  tradeResult: 'win' | 'loss' | null;
  ema9: number[];
  ema21: number[];
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  newsEvent: NewsEvent;
  muted: boolean;
}

export interface TradingEngineActions {
  setIsPaused: (v: boolean) => void;
  openTrade: (type: 'buy' | 'sell', sl?: number, tp?: number) => void;
  closeTrade: () => void;
  setLotSize: (size: number) => void;
  setStopLoss: (price: number | null) => void;
  setTakeProfit: (price: number | null) => void;
  devUnlockAll: () => void;
  resetProgress: () => void;
  toggleMute: () => void;
}

export function useTradingEngine(): TradingEngineState & TradingEngineActions {
  // Lazy-init from localStorage
  const savedRef = useRef<SavedState | null>(loadState());
  const saved = savedRef.current;

  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(60));
  const [trades, setTrades] = useState<Trade[]>(() => saved?.trades ?? []);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(getWelcomeMessages);
  const [stats, setStats] = useState<PlayerStats>(() =>
    saved ? buildStatsFromSave(saved) : buildDefaultStats()
  );
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ariaState, setAriaState] = useState<AriaState>('teal');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [phaseUnlocking, setPhaseUnlocking] = useState(false);
  const [xpGain, setXpGain] = useState<number | null>(null);
  const [tradeResult, setTradeResult] = useState<'win' | 'loss' | null>(null);
  const [lotSize, setLotSize] = useState(0.1);
  const [stopLoss, setStopLoss] = useState<number | null>(null);
  const [takeProfit, setTakeProfit] = useState<number | null>(null);
  const [newsEvent, setNewsEvent] = useState<NewsEvent>({ state: 'idle', direction: 'up', candlesRemaining: 60, spikeAmount: 0 });
  const [muted, setMuted] = useState<boolean>(() => {
    const m = saved?.muted ?? false;
    sound.setMuted(m);
    return m;
  });

  const tickRef = useRef(0);
  const coachTickRef = useRef(0);
  const cooldownRef = useRef(0);
  const achievementQueueRef = useRef<Achievement[]>([]);
  const showingAchievementRef = useRef(false);

  const currentPrice = useMemo(
    () => (candles.length > 0 ? candles[candles.length - 1].close : STARTING_BALANCE),
    [candles]
  );

  const ema9 = useMemo(() => calculateEMA(candles, 9), [candles]);
  const ema21 = useMemo(() => calculateEMA(candles, 21), [candles]);

  const srZones = useMemo(() => findSRZones(candles), [candles]);
  const supportResistance = useMemo(() => findSupportResistance(candles), [candles]);

  const unrealizedPnl = useMemo(() => {
    if (!activeTrade) return 0;
    const raw = activeTrade.type === 'buy'
      ? (currentPrice - activeTrade.entryPrice) * activeTrade.lotSize * 100
      : (activeTrade.entryPrice - currentPrice) * activeTrade.lotSize * 100;
    return Math.round(raw * 100) / 100;
  }, [activeTrade, currentPrice]);

  // Persistence: save whenever stats, trades, or muted change
  useEffect(() => {
    saveState({
      phase: stats.phase,
      xp: stats.xp,
      xpTotal: stats.xpTotal,
      xpToNext: stats.xpToNext,
      level: stats.level,
      balance: stats.balance,
      trades,
      achievements: stats.achievements,
      challengeProgress: stats.challengeProgress,
      stopLossCount: stats.stopLossCount,
      conceptsSeen: stats.conceptsSeen,
      totalTrades: stats.totalTrades,
      winRate: stats.winRate,
      muted,
      savedAt: Date.now(),
    });
  }, [stats, trades, muted]);

  const addCoachMessage = useCallback((message: CoachMessage | null) => {
    if (!message) return;
    setCoachMessages(prev => [...prev.slice(-30), message]);
  }, []);

  const showXpGain = useCallback((amount: number) => {
    setXpGain(amount);
    setTimeout(() => setXpGain(null), 2000);
  }, []);

  const showAchievementFromQueue = useCallback(() => {
    if (achievementQueueRef.current.length === 0 || showingAchievementRef.current) return;
    showingAchievementRef.current = true;
    const next = achievementQueueRef.current.shift()!;
    setNewAchievement(next);
    sound.achievement();
    setTimeout(() => {
      setNewAchievement(null);
      showingAchievementRef.current = false;
      setTimeout(showAchievementFromQueue, 300);
    }, 4000);
  }, []);

  const addXp = useCallback((amount: number, reason?: string) => {
    showXpGain(amount);
    setStats(prev => {
      let newXp = prev.xp + amount;
      let newXpTotal = prev.xpTotal + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.round(newXpToNext * 1.3);
      }

      if (newLevel > prev.level) {
        sound.levelUp();
        setTimeout(() => addCoachMessage(getLevelUpMessage(newLevel)), 500);
      }

      return { ...prev, xp: newXp, xpTotal: newXpTotal, level: newLevel, xpToNext: newXpToNext };
    });
  }, [addCoachMessage, showXpGain]);

  const unlockAchievement = useCallback((id: string) => {
    setStats(prev => {
      const achievement = prev.achievements.find(a => a.id === id);
      if (!achievement || achievement.unlocked) return prev;
      const updated = prev.achievements.map(a =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
      );
      const unlocked = updated.find(a => a.id === id)!;
      achievementQueueRef.current.push(unlocked);
      setTimeout(showAchievementFromQueue, 100);
      return { ...prev, achievements: updated };
    });
    addXp(25);
  }, [addXp, showAchievementFromQueue]);

  const triggerCooldown = useCallback((seconds: number) => {
    cooldownRef.current = seconds;
    setCooldownSeconds(seconds);
    addCoachMessage(getRevengeTradingMessage());
    sound.ariaWarn();
    setAriaState('red');
  }, [addCoachMessage]);

  const openTrade = useCallback((type: 'buy' | 'sell', sl?: number, tp?: number) => {
    if (activeTrade || cooldownRef.current > 0) return;

    const finalSL = sl ?? stopLoss ?? undefined;
    const finalTP = tp ?? takeProfit ?? undefined;

    let rrRatio: number | undefined;
    if (finalSL !== undefined && finalTP !== undefined) {
      const risk = Math.abs(currentPrice - finalSL);
      const reward = Math.abs(finalTP - currentPrice);
      rrRatio = risk > 0 ? Math.round((reward / risk) * 10) / 10 : undefined;
    }

    const trade: Trade = {
      id: `trade-${Date.now()}`,
      type,
      entryPrice: currentPrice,
      size: Math.round(lotSize * 100),
      lotSize,
      stopLoss: finalSL,
      takeProfit: finalTP,
      entryTime: Date.now(),
      status: 'open',
      hadStopLoss: finalSL !== undefined,
      rrRatio,
    };

    setActiveTrade(trade);
    addCoachMessage(getTradeOpenMessage(trade, stats));
    sound.tradeOpen();
    addXp(5);

    if (stats.totalTrades === 0) {
      setTimeout(() => unlockAchievement('first-trade'), 500);
    }
  }, [activeTrade, currentPrice, lotSize, stopLoss, takeProfit, stats, addCoachMessage, addXp, unlockAchievement]);

  const closeTrade = useCallback(() => {
    if (!activeTrade) return;

    const pnl = activeTrade.type === 'buy'
      ? (currentPrice - activeTrade.entryPrice) * activeTrade.lotSize * 100
      : (activeTrade.entryPrice - currentPrice) * activeTrade.lotSize * 100;

    const closedTrade: Trade = {
      ...activeTrade,
      exitPrice: currentPrice,
      exitTime: Date.now(),
      pnl: Math.round(pnl * 100) / 100,
      status: 'closed',
    };

    setTrades(prev => {
      const allClosed = [...prev, closedTrade];

      setStats(prevStats => {
        const phase = getPhase(prevStats.phase);
        const criteria = phase.challenge.criteria;

        let meetsThisOne = true;
        if (criteria.tradeType && closedTrade.type !== criteria.tradeType) meetsThisOne = false;
        if (criteria.requireStopLoss && !closedTrade.hadStopLoss) meetsThisOne = false;
        if (criteria.requireTakeProfit && !closedTrade.takeProfit) meetsThisOne = false;
        if (criteria.mustBeProfit && (closedTrade.pnl ?? 0) <= 0) meetsThisOne = false;
        if (criteria.minRR && (closedTrade.rrRatio ?? 0) < criteria.minRR) meetsThisOne = false;
        if (criteria.maxRiskPercent) {
          const riskPct = closedTrade.hadStopLoss && closedTrade.stopLoss
            ? (Math.abs(closedTrade.entryPrice - closedTrade.stopLoss) * closedTrade.lotSize * 100) / prevStats.balance * 100
            : 100;
          if (riskPct > criteria.maxRiskPercent) meetsThisOne = false;
        }

        const newProgress = meetsThisOne ? prevStats.challengeProgress + 1 : prevStats.challengeProgress;
        const required = criteria.count ?? 1;
        const challengeComplete = newProgress >= required;

        const wins = allClosed.filter(t => (t.pnl ?? 0) > 0).length;
        const total = allClosed.length;
        const newStopLossCount = closedTrade.hadStopLoss ? prevStats.stopLossCount + 1 : prevStats.stopLossCount;

        const nextPhase = getNextPhase(prevStats.phase);

        if (challengeComplete && nextPhase) {
          setTimeout(() => {
            addCoachMessage(getChallengeCompleteMessage(phase.challenge.successMessage, phase.challenge.xpReward));
            addXp(phase.challenge.xpReward);
            sound.phaseUnlock();
            setPhaseUnlocking(true);
            setTimeout(() => {
              setPhaseUnlocking(false);
              setStats(s => {
                const newPhase = s.phase + 1;
                const nextPhaseData = getPhase(newPhase);
                setTimeout(() => {
                  const introMsgs = getPhaseIntroMessages(nextPhaseData.ariaIntroMessage);
                  introMsgs.forEach((m, i) => {
                    setTimeout(() => addCoachMessage(m), i * 800);
                  });
                }, 500);
                return { ...s, phase: newPhase, challengeProgress: 0 };
              });
            }, 5500);
          }, 300);

          if (prevStats.phase === 3) setTimeout(() => unlockAchievement('phase-3'), 1000);
          if (prevStats.phase === 6) setTimeout(() => unlockAchievement('phase-6'), 1000);
        } else if (!challengeComplete && !meetsThisOne && prevStats.challengeProgress === newProgress) {
          if (total % 2 === 0) {
            setTimeout(() => addCoachMessage(getChallengeFeedback(phase.challenge.failureMessage)), 500);
          }
        }

        return {
          ...prevStats,
          balance: prevStats.balance + (closedTrade.pnl ?? 0),
          totalTrades: total,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
          challengeProgress: challengeComplete ? 0 : newProgress,
          stopLossCount: newStopLossCount,
        };
      });

      return allClosed;
    });

    setActiveTrade(null);
    addCoachMessage(getTradeCloseMessage(closedTrade, currentPrice, candles));

    const isWin = pnl > 0;
    setTradeResult(isWin ? 'win' : 'loss');
    setTimeout(() => setTradeResult(null), 1000);

    if (isWin) {
      sound.tradeWin();
      addXp(15);
    } else {
      sound.tradeLoss();
      addXp(3);
    }

    if (isWin) setTimeout(() => unlockAchievement('first-profit'), 300);

    setTrades(prev => {
      const closed = prev.filter(t => t.status === 'closed');
      if (closed.length + 1 >= 5) setTimeout(() => unlockAchievement('five-trades'), 300);

      const recentThree = closed.slice(-2);
      if (recentThree.length >= 2 && recentThree.every(t => (t.pnl ?? 0) > 0) && isWin) {
        setTimeout(() => unlockAchievement('win-streak'), 300);
      }
      if ((stats.stopLossCount + (closedTrade.hadStopLoss ? 1 : 0)) >= 5) {
        setTimeout(() => unlockAchievement('risk-manager'), 300);
      }
      return prev;
    });

    // Revenge trading detection
    setTrades(prev => {
      const closed = [...prev.filter(t => t.status === 'closed'), closedTrade];
      const recent5 = closed.slice(-5);
      if (recent5.length >= 3) {
        const losses = recent5.filter(t => (t.pnl ?? 0) < 0);
        if (losses.length >= 3) {
          const times = losses.map(t => t.exitTime ?? 0).sort((a, b) => a - b);
          const allFast = times.every((t, i) => i === 0 || t - times[i - 1] < 4 * 60 * 1000);
          if (allFast) {
            triggerCooldown(45);
          }
        }
      }
      return prev;
    });

    setStopLoss(null);
    setTakeProfit(null);
  }, [activeTrade, currentPrice, candles, stats, addCoachMessage, addXp, unlockAchievement, triggerCooldown]);

  // Price tick — new candle every 2s
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      tickRef.current++;
      setCandles(prev => {
        const lastCandle = prev[prev.length - 1];
        const newCandle = generateNextCandle(lastCandle.close, Date.now());
        sound.candleClose();

        // Update news event state
        setNewsEvent(getNewsEvent());

        // Fire sound on news spike start
        const currentNews = getNewsEvent();
        if (currentNews.state === 'spike' && currentNews.candlesRemaining > 0) {
          sound.newsSpike();
        }

        // Auto-close on SL/TP
        if (activeTrade) {
          const price = newCandle.close;
          const { stopLoss: sl, takeProfit: tp, type } = activeTrade;

          if (sl !== undefined) {
            const slHit = type === 'buy' ? price <= sl : price >= sl;
            if (slHit) {
              setTimeout(() => closeTrade(), 50);
            }
          }
          if (tp !== undefined) {
            const tpHit = type === 'buy' ? price >= tp : price <= tp;
            if (tpHit) {
              setTimeout(() => closeTrade(), 50);
            }
          }
        }

        return [...prev.slice(-120), newCandle];
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused, activeTrade, closeTrade]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        const next = prev - 1;
        if (next <= 0) {
          cooldownRef.current = 0;
          setAriaState('teal');
          sound.cooldownEnd();
        } else {
          cooldownRef.current = next;
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Coach commentary loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      coachTickRef.current++;

      // Update aria state
      const newAriaState = detectAriaState(activeTrade, trades, currentPrice);
      setAriaState(prev => prev === 'red' && cooldownRef.current > 0 ? 'red' : newAriaState);

      // Open trade commentary every 10-15 seconds
      if (activeTrade && coachTickRef.current % 6 === 0) {
        const commentary = getOpenTradeCommentary(activeTrade, currentPrice, candles, ariaState);
        if (commentary) addCoachMessage(commentary);
      }

      // Market condition coaching every ~20 seconds
      if (coachTickRef.current % 10 === 0) {
        const condition = detectMarketCondition(candles);
        const condMsg = getMarketConditionMessage(condition, stats.conceptsSeen, candles, currentPrice);
        if (condMsg) {
          addCoachMessage(condMsg);
          if (!stats.conceptsSeen.includes(condition)) {
            setStats(prev => ({
              ...prev,
              conceptsSeen: [...prev.conceptsSeen, condition],
            }));
          }
        }
      }

      // Level 5 achievement check
      if (stats.level >= 5) {
        unlockAchievement('level-5');
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused, activeTrade, trades, currentPrice, candles, stats, ariaState, addCoachMessage, unlockAchievement]);

  // Dev mode: Ctrl+Shift+D
  const devUnlockAll = useCallback(() => {
    setStats(prev => ({
      ...prev,
      phase: PHASES.length,
      xp: 999,
      xpTotal: 99999,
      level: 10,
      challengeProgress: 0,
    }));
    addCoachMessage({
      id: `dev-${Date.now()}`,
      text: '[DEV] All phases unlocked, XP maxed.',
      type: 'learn',
      timestamp: Date.now(),
    });
  }, [addCoachMessage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        devUnlockAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [devUnlockAll]);

  const resetProgress = useCallback(() => {
    clearState();
    setStats(buildDefaultStats());
    setTrades([]);
    setActiveTrade(null);
    setCooldownSeconds(0);
    cooldownRef.current = 0;
    setAriaState('teal');
    setPhaseUnlocking(false);
    setXpGain(null);
    setTradeResult(null);
    setStopLoss(null);
    setTakeProfit(null);
    addCoachMessage({
      id: `reset-${Date.now()}`,
      text: 'Journey reset. Every master started at zero. Let\'s begin again.',
      type: 'learn',
      timestamp: Date.now(),
    });
  }, [addCoachMessage]);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      sound.setMuted(next);
      return next;
    });
  }, []);

  return {
    candles,
    trades,
    activeTrade,
    coachMessages,
    stats,
    currentPrice,
    unrealizedPnl,
    srZones,
    supportResistance,
    newAchievement,
    isPaused,
    ariaState,
    cooldownSeconds,
    phaseUnlocking,
    xpGain,
    tradeResult,
    ema9,
    ema21,
    lotSize,
    stopLoss,
    takeProfit,
    newsEvent,
    muted,
    setIsPaused,
    openTrade,
    closeTrade,
    setLotSize,
    setStopLoss,
    setTakeProfit,
    devUnlockAll,
    resetProgress,
    toggleMute,
  };
}
