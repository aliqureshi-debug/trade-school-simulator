import { useState, useCallback, useRef, useEffect } from 'react';
import { Candle, Trade, CoachMessage, PlayerStats, Achievement } from '@/types/trading';
import { generateInitialCandles, generateNextCandle, detectMarketCondition, findSupportResistance } from '@/lib/chartEngine';
import { getWelcomeMessages, getMarketConditionMessage, getTradeOpenMessage, getTradeCloseMessage, detectBehavior, getLevelUpMessage } from '@/lib/coachEngine';

const STARTING_BALANCE = 10000;
const TRADE_SIZE = 100; // units

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-trade', title: 'First Steps', description: 'Place your first trade', icon: '🎯', unlocked: false },
  { id: 'first-profit', title: 'In the Green', description: 'Close a profitable trade', icon: '💰', unlocked: false },
  { id: 'five-trades', title: 'Getting Started', description: 'Complete 5 trades', icon: '📊', unlocked: false },
  { id: 'win-streak', title: 'Hot Streak', description: '3 profitable trades in a row', icon: '🔥', unlocked: false },
  { id: 'risk-manager', title: 'Risk Manager', description: 'Use a stop loss on 5 trades', icon: '🛡️', unlocked: false },
  { id: 'level-5', title: 'Apprentice', description: 'Reach Level 5', icon: '⭐', unlocked: false },
];

export function useTradingEngine() {
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(50));
  const [trades, setTrades] = useState<Trade[]>([]);
  const [activeTrade, setActiveTrade] = useState<Trade | null>(null);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>(getWelcomeMessages);
  const [stats, setStats] = useState<PlayerStats>({
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalTrades: 0,
    winRate: 0,
    balance: STARTING_BALANCE,
    startingBalance: STARTING_BALANCE,
    achievements: [...DEFAULT_ACHIEVEMENTS],
    phase: 1,
    conceptsSeen: [],
  });
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const conditionRef = useRef('range');
  const tickRef = useRef(0);

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : STARTING_BALANCE;

  const addCoachMessage = useCallback((message: CoachMessage | null) => {
    if (!message) return;
    setCoachMessages(prev => [...prev.slice(-20), message]);
  }, []);

  const addXp = useCallback((amount: number) => {
    setStats(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNext;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.round(newXpToNext * 1.3);
      }

      if (newLevel > prev.level) {
        setTimeout(() => addCoachMessage(getLevelUpMessage(newLevel)), 500);
      }

      return { ...prev, xp: newXp, level: newLevel, xpToNext: newXpToNext };
    });
  }, [addCoachMessage]);

  const unlockAchievement = useCallback((id: string) => {
    setStats(prev => {
      const achievement = prev.achievements.find(a => a.id === id);
      if (!achievement || achievement.unlocked) return prev;

      const updated = prev.achievements.map(a =>
        a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
      );

      const unlockedOne = updated.find(a => a.id === id)!;
      setNewAchievement(unlockedOne);
      setTimeout(() => setNewAchievement(null), 3000);

      return { ...prev, achievements: updated };
    });
    addXp(25);
  }, [addXp]);

  const openTrade = useCallback((type: 'buy' | 'sell') => {
    if (activeTrade) return;

    const trade: Trade = {
      id: `trade-${Date.now()}`,
      type,
      entryPrice: currentPrice,
      size: TRADE_SIZE,
      entryTime: Date.now(),
      status: 'open',
    };

    setActiveTrade(trade);
    addCoachMessage(getTradeOpenMessage(trade, stats));
    addXp(10);

    if (stats.totalTrades === 0) {
      unlockAchievement('first-trade');
    }
  }, [activeTrade, currentPrice, stats, addCoachMessage, addXp, unlockAchievement]);

  const closeTrade = useCallback(() => {
    if (!activeTrade) return;

    const pnl = activeTrade.type === 'buy'
      ? (currentPrice - activeTrade.entryPrice) * activeTrade.size
      : (activeTrade.entryPrice - currentPrice) * activeTrade.size;

    const closedTrade: Trade = {
      ...activeTrade,
      exitPrice: currentPrice,
      exitTime: Date.now(),
      pnl: Math.round(pnl * 100) / 100,
      status: 'closed',
    };

    setTrades(prev => [...prev, closedTrade]);
    setActiveTrade(null);

    addCoachMessage(getTradeCloseMessage(closedTrade));

    setStats(prev => {
      const allTrades = [...trades, closedTrade].filter(t => t.status === 'closed');
      const wins = allTrades.filter(t => (t.pnl || 0) > 0).length;
      const totalTrades = allTrades.length;

      return {
        ...prev,
        balance: prev.balance + (closedTrade.pnl || 0),
        totalTrades,
        winRate: totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0,
      };
    });

    addXp(pnl > 0 ? 20 : 5);

    if (pnl > 0) unlockAchievement('first-profit');
    if (trades.filter(t => t.status === 'closed').length + 1 >= 5) unlockAchievement('five-trades');

    // Check win streak
    const recentClosed = [...trades.filter(t => t.status === 'closed'), closedTrade].slice(-3);
    if (recentClosed.length >= 3 && recentClosed.every(t => (t.pnl || 0) > 0)) {
      unlockAchievement('win-streak');
    }
  }, [activeTrade, currentPrice, trades, addCoachMessage, addXp, unlockAchievement]);

  // Price tick
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      tickRef.current++;

      setCandles(prev => {
        const condition = detectMarketCondition(prev);
        conditionRef.current = condition;

        // Change condition every ~30 ticks
        const cycleConditions = ['uptrend', 'range', 'downtrend', 'range', 'breakout', 'uptrend'] as const;
        const conditionIndex = Math.floor(tickRef.current / 30) % cycleConditions.length;
        const targetCondition = cycleConditions[conditionIndex];

        const lastCandle = prev[prev.length - 1];
        const newCandle = generateNextCandle(lastCandle.close, Date.now(), targetCondition);

        return [...prev.slice(-100), newCandle];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Coach behavior detection
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const behaviorMsg = detectBehavior(activeTrade, trades, currentPrice, candles);
      if (behaviorMsg) addCoachMessage(behaviorMsg);

      // Market condition coaching (every ~20 seconds)
      if (tickRef.current % 10 === 0) {
        const condition = detectMarketCondition(candles);
        const condMsg = getMarketConditionMessage(condition, stats.conceptsSeen);
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
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTrade, trades, currentPrice, candles, stats.conceptsSeen, isPaused, addCoachMessage]);

  const supportResistance = findSupportResistance(candles);
  const unrealizedPnl = activeTrade
    ? activeTrade.type === 'buy'
      ? (currentPrice - activeTrade.entryPrice) * activeTrade.size
      : (activeTrade.entryPrice - currentPrice) * activeTrade.size
    : 0;

  return {
    candles,
    trades,
    activeTrade,
    coachMessages,
    stats,
    currentPrice,
    unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
    supportResistance,
    newAchievement,
    isPaused,
    setIsPaused,
    openTrade,
    closeTrade,
  };
}
