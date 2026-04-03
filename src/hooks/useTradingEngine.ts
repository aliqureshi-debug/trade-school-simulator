import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Candle, Trade, CoachMessage, PlayerStats, Achievement, AriaMode, SRZone, NewsEvent, LessonProgress } from '@/types/trading';
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
  getAriaMode,
  getTradeOpenMessage,
  getTradeCloseMessage,
  getOpenTradeCommentary,
  getRevengeTradingMessage,
  getCooldownEndMessage,
  getLevelUpMessage,
  getMarketConditionMessage,
} from '@/lib/ariaEngine';
import { sound } from '@/lib/soundEngine';
import { saveState, loadState, clearState, buildDefaultLessonProgress, buildStatsFromSave } from '@/lib/persistence';
import { ACADEMY_MODULES } from '@/lib/academy';

const STARTING_BALANCE = 10000;

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-trade', title: 'First Steps', description: 'Place your first trade', icon: '🎯', unlocked: false },
  { id: 'first-profit', title: 'In the Green', description: 'Close a profitable trade', icon: '💰', unlocked: false },
  { id: 'five-trades', title: 'Getting Started', description: 'Complete 5 trades', icon: '📊', unlocked: false },
  { id: 'ten-trades', title: 'Consistent', description: 'Complete 10 trades', icon: '🔢', unlocked: false },
  { id: 'win-streak-3', title: 'Hot Streak', description: '3 profitable trades in a row', icon: '🔥', unlocked: false },
  { id: 'win-streak-5', title: 'On Fire', description: '5 profitable trades in a row', icon: '🔥🔥', unlocked: false },
  { id: 'risk-manager', title: 'Risk Manager', description: 'Use stop loss on 5 trades', icon: '🛡️', unlocked: false },
  { id: 'risk-master', title: 'Risk Master', description: 'Use stop loss on 20 trades', icon: '⚔️', unlocked: false },
  { id: 'module-1', title: 'The Market', description: 'Complete Module 1', icon: '📈', unlocked: false },
  { id: 'module-4', title: 'Tier 1 Graduate', description: 'Complete Module 4', icon: '🥉', unlocked: false },
  { id: 'module-9', title: 'Tier 2 Graduate', description: 'Complete Module 9', icon: '🥈', unlocked: false },
  { id: 'module-13', title: 'Professional Trader', description: 'Complete the Academy', icon: '🏆', unlocked: false },
  { id: 'rr-2to1', title: 'R:R Disciplined', description: 'Complete a trade at 2:1 R:R', icon: '⚖️', unlocked: false },
  { id: 'balance-11k', title: 'Growing Account', description: 'Reach $11,000 balance', icon: '💵', unlocked: false },
  { id: 'balance-12k', title: 'Strong Account', description: 'Reach $12,000 balance', icon: '💵💵', unlocked: false },
  { id: 'level-5', title: 'Apprentice', description: 'Reach Level 5', icon: '⭐', unlocked: false },
  { id: 'level-10', title: 'Professional', description: 'Reach Level 10', icon: '🌟', unlocked: false },
  { id: 'patient', title: 'Patient Trader', description: 'Hold a trade for 10+ candles', icon: '⏳', unlocked: false },
  { id: 'no-revenge', title: 'Iron Discipline', description: 'No cooldown triggered in a session', icon: '🧘', unlocked: false },
  { id: 'graduation', title: 'Academy Graduate', description: 'Complete all 13 modules', icon: '🎓', unlocked: false },
];

function buildDefaultStats(): PlayerStats {
  return {
    level: 1,
    xp: 0,
    xpToNext: 150,
    xpTotal: 0,
    totalTrades: 0,
    winRate: 0,
    balance: STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    achievements: [...DEFAULT_ACHIEVEMENTS],
    stopLossCount: 0,
    winStreak: 0,
    maxWinStreak: 0,
  };
}

function mergeAchievements(saved: Achievement[]): Achievement[] {
  return DEFAULT_ACHIEVEMENTS.map(def => {
    const found = saved.find(a => a.id === def.id);
    return found ? { ...def, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : def;
  });
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
  ariaMode: AriaMode;
  cooldownSeconds: number;
  xpGain: number | null;
  tradeResult: 'win' | 'loss' | null;
  ema9: number[];
  ema21: number[];
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  newsEvent: NewsEvent;
  muted: boolean;
  lessonProgress: LessonProgress;
  devMode: boolean;
  candleTickCount: number;
}

export interface TradingEngineActions {
  setIsPaused: (v: boolean) => void;
  openTrade: (type: 'buy' | 'sell', sl?: number, tp?: number, missionId?: string) => void;
  closeTrade: (atPrice?: number) => void;
  setLotSize: (size: number) => void;
  setStopLoss: (price: number | null) => void;
  setTakeProfit: (price: number | null) => void;
  devUnlockAll: () => void;
  resetProgress: () => void;
  toggleMute: () => void;
  addCoachMessage: (msg: CoachMessage) => void;
  addXp: (amount: number) => void;
  unlockAchievement: (id: string) => void;
  setLessonProgress: (lp: LessonProgress | ((prev: LessonProgress) => LessonProgress)) => void;
  setAriaMode: (mode: AriaMode) => void;
  setMuted: (muted: boolean) => void;
}

export function useTradingEngine(): TradingEngineState & TradingEngineActions {
  const savedRef = useRef(loadState());
  const saved = savedRef.current;

  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(60));
  const [trades, setTrades] = useState<Trade[]>(() => saved?.trades ?? []);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(() => getWelcomeMessages());
  const [stats, setStats] = useState<PlayerStats>(() =>
    saved ? { ...buildStatsFromSave(saved), achievements: mergeAchievements(saved.achievements) } : buildDefaultStats()
  );
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [ariaMode, setAriaMode] = useState<AriaMode>('teaching');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
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
  const [lessonProgress, setLessonProgress] = useState<LessonProgress>(() =>
    saved?.lessonProgress ?? buildDefaultLessonProgress()
  );
  const [devMode, setDevMode] = useState(false);
  const [candleTickCount, setCandleTickCount] = useState(0);

  const tickRef = useRef(0);
  const coachTickRef = useRef(0);
  const cooldownRef = useRef(0);
  const achievementQueueRef = useRef<Achievement[]>([]);
  const showingAchievementRef = useRef(false);
  const activeTradeRef = useRef<Trade | null>(null);
  const candleSpeedMsRef = useRef(2000);
  const tradeCooldownTriggered = useRef(false);

  const currentPrice = useMemo(
    () => (candles.length > 0 ? candles[candles.length - 1].close : STARTING_BALANCE),
    [candles]
  );

  useEffect(() => {
    activeTradeRef.current = activeTrade;
  }, [activeTrade]);

  useEffect(() => {
    candleSpeedMsRef.current = lessonProgress.candleSpeedMs ?? 2000;
  }, [lessonProgress.candleSpeedMs]);

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

  // Persistence
  useEffect(() => {
    saveState({
      xp: stats.xp,
      xpTotal: stats.xpTotal,
      xpToNext: stats.xpToNext,
      level: stats.level,
      balance: stats.balance,
      trades,
      achievements: stats.achievements,
      stopLossCount: stats.stopLossCount,
      winStreak: stats.winStreak,
      maxWinStreak: stats.maxWinStreak,
      totalTrades: stats.totalTrades,
      winRate: stats.winRate,
      muted,
      lessonProgress,
      savedAt: Date.now(),
    });
  }, [stats, trades, muted, lessonProgress]);

  const addCoachMessage = useCallback((message: CoachMessage | null) => {
    if (!message) return;
    setCoachMessages(prev => [...prev.slice(-40), message]);
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
    }, 4200);
  }, []);

  const addXp = useCallback((amount: number) => {
    if (amount <= 0) return;
    showXpGain(amount);
    setStats(prev => {
      let newXp = prev.xp + amount;
      let newXpTotal = prev.xpTotal + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.round(newXpToNext * 1.4);
      }

      if (newLevel > prev.level) {
        sound.levelUp();
        setTimeout(() => addCoachMessage(getLevelUpMessage(newLevel, lessonProgress.currentModuleId)), 500);
      }

      return { ...prev, xp: newXp, xpTotal: newXpTotal, level: newLevel, xpToNext: newXpToNext };
    });
  }, [addCoachMessage, showXpGain, lessonProgress.currentModuleId]);

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
    setTimeout(() => addXp(25), 200);
  }, [addXp, showAchievementFromQueue]);

  const triggerCooldown = useCallback((seconds: number) => {
    tradeCooldownTriggered.current = true;
    cooldownRef.current = seconds;
    setCooldownSeconds(seconds);
    addCoachMessage(getRevengeTradingMessage());
    sound.ariaWarn();
    setAriaMode('danger');
  }, [addCoachMessage]);

  const openTrade = useCallback((type: 'buy' | 'sell', sl?: number, tp?: number, missionId?: string) => {
    if (activeTradeRef.current || cooldownRef.current > 0) return;

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
      missionId,
      candlesHeld: 0,
    };

    setActiveTrade(trade);
    activeTradeRef.current = trade;
    addCoachMessage(getTradeOpenMessage(trade, lessonProgress.currentModuleId));
    sound.tradeOpen();
    addXp(5);

    setStats(prev => {
      if (prev.totalTrades === 0) {
        setTimeout(() => unlockAchievement('first-trade'), 500);
      }
      return prev;
    });
  }, [currentPrice, lotSize, stopLoss, takeProfit, lessonProgress.currentModuleId, addCoachMessage, addXp, unlockAchievement]);

  const closeTrade = useCallback((atPrice?: number) => {
    const trade = activeTradeRef.current;
    if (!trade) return;

    const exitPrice = atPrice ?? currentPrice;
    const pnl = trade.type === 'buy'
      ? (exitPrice - trade.entryPrice) * trade.lotSize * 100
      : (trade.entryPrice - exitPrice) * trade.lotSize * 100;

    const closedTrade: Trade = {
      ...trade,
      exitPrice,
      exitTime: Date.now(),
      pnl: Math.round(pnl * 100) / 100,
      status: 'closed',
    };

    setActiveTrade(null);
    activeTradeRef.current = null;

    setTrades(prev => {
      const allClosed = [...prev, closedTrade];
      const wins = allClosed.filter(t => (t.pnl ?? 0) > 0).length;
      const total = allClosed.length;

      setStats(prevStats => {
        const isWin = pnl > 0;
        const newWinStreak = isWin ? prevStats.winStreak + 1 : 0;
        const newMaxWinStreak = Math.max(prevStats.maxWinStreak, newWinStreak);
        const newStopLossCount = closedTrade.hadStopLoss ? prevStats.stopLossCount + 1 : prevStats.stopLossCount;

        // Achievement checks
        if (total === 1) setTimeout(() => unlockAchievement('first-trade'), 300);
        if (isWin) setTimeout(() => unlockAchievement('first-profit'), 300);
        if (total >= 5) setTimeout(() => unlockAchievement('five-trades'), 300);
        if (total >= 10) setTimeout(() => unlockAchievement('ten-trades'), 300);
        if (newWinStreak >= 3) setTimeout(() => unlockAchievement('win-streak-3'), 300);
        if (newWinStreak >= 5) setTimeout(() => unlockAchievement('win-streak-5'), 300);
        if (newStopLossCount >= 5) setTimeout(() => unlockAchievement('risk-manager'), 300);
        if (newStopLossCount >= 20) setTimeout(() => unlockAchievement('risk-master'), 300);
        if (closedTrade.rrRatio && closedTrade.rrRatio >= 2) setTimeout(() => unlockAchievement('rr-2to1'), 300);
        if ((closedTrade.candlesHeld ?? 0) >= 10) setTimeout(() => unlockAchievement('patient'), 300);

        const newBalance = prevStats.balance + (closedTrade.pnl ?? 0);
        if (newBalance >= 11000) setTimeout(() => unlockAchievement('balance-11k'), 300);
        if (newBalance >= 12000) setTimeout(() => unlockAchievement('balance-12k'), 300);

        return {
          ...prevStats,
          balance: newBalance,
          totalTrades: total,
          winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
          stopLossCount: newStopLossCount,
          winStreak: newWinStreak,
          maxWinStreak: newMaxWinStreak,
        };
      });

      // Revenge trading detection
      const recent5 = allClosed.slice(-5);
      if (recent5.length >= 3) {
        const losses = recent5.filter(t => (t.pnl ?? 0) < 0);
        if (losses.length >= 3) {
          const times = losses.map(t => t.exitTime ?? 0).sort((a, b) => a - b);
          const allFast = times.every((t, i) => i === 0 || t - times[i - 1] < 4 * 60 * 1000);
          if (allFast && cooldownRef.current <= 0) {
            setTimeout(() => triggerCooldown(45), 300);
          }
        }
      }

      return allClosed;
    });

    addCoachMessage(getTradeCloseMessage(closedTrade, lessonProgress.currentModuleId));

    const isWin = pnl > 0;
    setTradeResult(isWin ? 'win' : 'loss');
    setTimeout(() => setTradeResult(null), 1200);

    if (isWin) {
      sound.tradeWin();
      addXp(15);
    } else {
      sound.tradeLoss();
      addXp(3);
    }

    setStopLoss(null);
    setTakeProfit(null);
  }, [currentPrice, lessonProgress.currentModuleId, addCoachMessage, addXp, unlockAchievement, triggerCooldown]);

  // Price tick
  useEffect(() => {
    if (isPaused) return;
    const speedMs = lessonProgress.candleSpeedMs ?? 2000;
    const interval = setInterval(() => {
      tickRef.current++;
      setCandleTickCount(t => t + 1);

      setCandles(prev => {
        const lastCandle = prev[prev.length - 1];
        const newCandle = generateNextCandle(lastCandle.close, Date.now());
        sound.candleClose();
        setNewsEvent(getNewsEvent());

        // Auto-close on SL/TP hit
        const trade = activeTradeRef.current;
        if (trade) {
          const price = newCandle.close;
          const { stopLoss: sl, takeProfit: tp, type } = trade;

          if (sl !== undefined) {
            const slHit = type === 'buy' ? price <= sl : price >= sl;
            if (slHit) {
              setTimeout(() => closeTrade(sl), 30);
              return [...prev.slice(-120), newCandle];
            }
          }
          if (tp !== undefined) {
            const tpHit = type === 'buy' ? price >= tp : price <= tp;
            if (tpHit) {
              setTimeout(() => closeTrade(tp), 30);
              return [...prev.slice(-120), newCandle];
            }
          }

          // Increment candles held
          setActiveTrade(t => t ? { ...t, candlesHeld: (t.candlesHeld ?? 0) + 1 } : null);
          activeTradeRef.current = activeTradeRef.current
            ? { ...activeTradeRef.current, candlesHeld: (activeTradeRef.current.candlesHeld ?? 0) + 1 }
            : null;
        }

        return [...prev.slice(-120), newCandle];
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [isPaused, closeTrade, lessonProgress.candleSpeedMs]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        const next = prev - 1;
        if (next <= 0) {
          cooldownRef.current = 0;
          setAriaMode('watching');
          sound.cooldownEnd();
          setTimeout(() => addCoachMessage(getCooldownEndMessage()), 200);
        } else {
          cooldownRef.current = next;
        }
        return Math.max(0, next);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds, addCoachMessage]);

  // Commentary loop
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      coachTickRef.current++;
      const trade = activeTradeRef.current;

      // Aria mode update
      const isLesson = lessonProgress.currentLessonIndex < ACADEMY_MODULES.find(m => m.id === lessonProgress.currentModuleId)?.lessons.length!;
      const isMission = lessonProgress.missionActive ?? false;
      const newMode = getAriaMode(
        trade, trades, currentPrice,
        cooldownRef.current > 0, isLesson, isMission, false
      );
      if (cooldownRef.current <= 0) setAriaMode(newMode);

      // Open trade commentary
      if (trade && coachTickRef.current % 7 === 0) {
        const commentary = getOpenTradeCommentary(trade, currentPrice, lessonProgress.currentModuleId);
        if (commentary) addCoachMessage(commentary);
      }

      // Market condition coaching
      if (coachTickRef.current % 12 === 0 && !isMission && !isLesson) {
        const condition = detectMarketCondition(candles);
        const condMsg = getMarketConditionMessage(condition, lessonProgress.currentModuleId);
        if (condMsg) addCoachMessage(condMsg);
      }

      // Level achievement checks
      setStats(prev => {
        if (prev.level >= 5 && !prev.achievements.find(a => a.id === 'level-5')?.unlocked) {
          setTimeout(() => unlockAchievement('level-5'), 100);
        }
        if (prev.level >= 10 && !prev.achievements.find(a => a.id === 'level-10')?.unlocked) {
          setTimeout(() => unlockAchievement('level-10'), 100);
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isPaused, trades, currentPrice, candles, lessonProgress, addCoachMessage, unlockAchievement]);

  // Dev mode: Ctrl+Shift+D
  const devUnlockAll = useCallback(() => {
    setDevMode(true);
    const allModuleIds = ACADEMY_MODULES.map(m => m.id);
    const allLessonIds = ACADEMY_MODULES.flatMap(m => m.lessons.map(l => l.id));
    const allMissionIds = ACADEMY_MODULES.map(m => m.mission.id);
    setLessonProgress(prev => ({
      ...prev,
      completedLessonIds: allLessonIds,
      completedMissionIds: allMissionIds,
      currentModuleId: 13,
      currentLessonIndex: 4,
    }));
    setStats(prev => ({
      ...prev,
      xp: 499,
      xpTotal: 99999,
      level: 10,
      xpToNext: 500,
    }));
    addCoachMessage({
      id: `dev-${Date.now()}`,
      text: '[DEV] All modules, lessons and missions unlocked.',
      type: 'learn',
      timestamp: Date.now(),
    });
  }, [addCoachMessage]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDevMode(true);
        devUnlockAll();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [devUnlockAll]);

  const resetProgress = useCallback(() => {
    clearState();
    const freshCandles = generateInitialCandles(60);
    setCandles(freshCandles);
    setStats(buildDefaultStats());
    setTrades([]);
    setActiveTrade(null);
    activeTradeRef.current = null;
    setCooldownSeconds(0);
    cooldownRef.current = 0;
    setAriaMode('teaching');
    setXpGain(null);
    setTradeResult(null);
    setStopLoss(null);
    setTakeProfit(null);
    setLessonProgress(buildDefaultLessonProgress());
    tradeCooldownTriggered.current = false;
    setCoachMessages(getWelcomeMessages());
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      sound.setMuted(next);
      return next;
    });
  }, []);

  const setMutedWithSound = useCallback((m: boolean) => {
    sound.setMuted(m);
    setMuted(m);
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
    ariaMode,
    cooldownSeconds,
    xpGain,
    tradeResult,
    ema9,
    ema21,
    lotSize,
    stopLoss,
    takeProfit,
    newsEvent,
    muted,
    lessonProgress,
    devMode,
    candleTickCount,
    setIsPaused,
    openTrade,
    closeTrade,
    setLotSize,
    setStopLoss,
    setTakeProfit,
    devUnlockAll,
    resetProgress,
    toggleMute,
    addCoachMessage,
    addXp,
    unlockAchievement,
    setLessonProgress,
    setAriaMode,
    setMuted: setMutedWithSound,
  };
}
