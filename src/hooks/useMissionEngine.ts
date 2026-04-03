import { useState, useCallback, useRef } from 'react';
import { Trade, PlayerStats, MissionState, TradingMission, Candle, MarketCondition } from '@/types/trading';

export type MissionResult = 'success' | 'failure' | null;

export interface CriteriaStatus {
  id: string;
  description: string;
  isMet: boolean;
}

export interface MissionEngineState {
  activeMission: TradingMission | null;
  missionState: MissionState;
  criteriaStatus: CriteriaStatus[];
  missionResult: MissionResult;
  missionScore: number;
  consecutiveClean: number;
}

export interface MissionViolation {
  message: string;
  blocking: boolean;
}

export interface MissionEngineActions {
  startMission: (mission: TradingMission) => void;
  validateTradeOpen: (trade: Partial<Trade>, stats: PlayerStats, candles: Candle[], regime: MarketCondition) => MissionViolation[];
  onTradeClose: (trade: Trade, stats: PlayerStats, candles: Candle[], regime: MarketCondition, allTrades: Trade[]) => void;
  onCandleTick: (trade: Trade | null, allTrades: Trade[]) => void;
  resetMission: () => void;
  clearResult: () => void;
}

function buildDefaultMissionState(): MissionState {
  return {
    tradesAttempted: 0,
    tradesMeetingCriteria: 0,
    consecutiveCompliant: 0,
    firstAttempt: true,
    candlesHeldOpen: 0,
    highestCandlesHeld: 0,
    openedInUptrend: false,
    closedInProfit: false,
    customFlags: {},
  };
}

function buildCriteriaStatus(mission: TradingMission, met: Set<string>): CriteriaStatus[] {
  return mission.criteria.map(c => ({ id: c.id, description: c.description, isMet: met.has(c.id) }));
}

export function useMissionEngine(): MissionEngineState & MissionEngineActions {
  const [activeMission, setActiveMission] = useState<TradingMission | null>(null);
  const [missionState, setMissionState] = useState<MissionState>(buildDefaultMissionState());
  const [metCriteria, setMetCriteria] = useState<Set<string>>(new Set());
  const [criteriaStatus, setCriteriaStatus] = useState<CriteriaStatus[]>([]);
  const [missionResult, setMissionResult] = useState<MissionResult>(null);
  const [missionScore, setMissionScore] = useState(0);
  const [consecutiveClean, setConsecutiveClean] = useState(0);

  const missionRef = useRef<TradingMission | null>(null);
  const missionStateRef = useRef<MissionState>(buildDefaultMissionState());
  const metRef = useRef<Set<string>>(new Set());
  const cleanCountRef = useRef(0);

  const startMission = useCallback((mission: TradingMission) => {
    const ms = buildDefaultMissionState();
    missionRef.current = mission;
    missionStateRef.current = ms;
    metRef.current = new Set();
    cleanCountRef.current = 0;
    setActiveMission(mission);
    setMissionState(ms);
    setMetCriteria(new Set());
    setCriteriaStatus(buildCriteriaStatus(mission, new Set()));
    setMissionResult(null);
    setMissionScore(0);
    setConsecutiveClean(0);
  }, []);

  const validateTradeOpen = useCallback((
    trade: Partial<Trade>, stats: PlayerStats, candles: Candle[], regime: MarketCondition
  ): MissionViolation[] => {
    const mission = missionRef.current;
    if (!mission) return [];
    const violations: MissionViolation[] = [];
    const ms = missionStateRef.current;
    const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

    switch (mission.id) {
      case 'm5-mission': {
        if (!trade.stopLoss) violations.push({ message: "No stop loss set. Module 5 requires both SL and TP before entry.", blocking: true });
        if (!trade.takeProfit) violations.push({ message: "No take profit set. TP must be at least 2x the SL distance.", blocking: true });
        if (trade.stopLoss && trade.takeProfit && trade.entryPrice !== undefined) {
          const slDist = Math.abs((trade.entryPrice ?? currentPrice) - trade.stopLoss);
          const tpDist = Math.abs(trade.takeProfit - (trade.entryPrice ?? currentPrice));
          if (tpDist < slDist * 2) {
            violations.push({ message: `R:R is ${(tpDist / slDist).toFixed(1)}:1. Mission requires at least 2:1. Adjust your TP.`, blocking: true });
          }
        }
        break;
      }
      case 'm6-mission': {
        if (!trade.stopLoss) violations.push({ message: "Mission 6 requires a stop loss on every trade. Set it now.", blocking: true });
        if (trade.stopLoss && trade.entryPrice !== undefined) {
          const riskAmount = Math.abs((trade.entryPrice ?? currentPrice) - trade.stopLoss) * (trade.lotSize ?? 0.1) * 100;
          const riskPct = (riskAmount / stats.balance) * 100;
          if (riskPct > 1.5) {
            violations.push({ message: `Risk is ${riskPct.toFixed(1)}% of balance. Mission 6 cap is 1.5%. Reduce lot size or widen nothing — move the SL closer or reduce lot size.`, blocking: true });
          }
        }
        break;
      }
      case 'm7-mission': {
        if (!trade.stopLoss) violations.push({ message: "Breakout entry requires a stop loss across the zone.", blocking: false });
        if (trade.stopLoss && trade.takeProfit && trade.entryPrice !== undefined) {
          const slDist = Math.abs((trade.entryPrice ?? currentPrice) - trade.stopLoss);
          const tpDist = Math.abs(trade.takeProfit - (trade.entryPrice ?? currentPrice));
          if (tpDist < slDist * 2) violations.push({ message: `R:R is ${(tpDist / slDist).toFixed(1)}:1. Mission requires 2:1 minimum.`, blocking: false });
        }
        break;
      }
      case 'm8-mission': {
        if (trade.type === 'sell') violations.push({ message: "Mission 8 requires BUY only when EMA 9 is above EMA 21.", blocking: true });
        if (!trade.stopLoss) violations.push({ message: "Stop loss must be placed below the nearest EMA.", blocking: false });
        break;
      }
      case 'm9-mission': {
        if (!trade.stopLoss) violations.push({ message: "Both trades in Mission 9 require stop losses.", blocking: false });
        break;
      }
      case 'm12-mission': {
        if (!trade.stopLoss) violations.push({ message: "Mission 12: All 5 trades require stop losses. Set it now.", blocking: true });
        const closedTrades = [] as Trade[];
        if (closedTrades.length > 0) {
          const lastClose = closedTrades[closedTrades.length - 1];
          if (lastClose.status === 'closed' && (lastClose.pnl ?? 0) < 0) {
            const timeSinceLoss = Date.now() - (lastClose.exitTime ?? 0);
            if (timeSinceLoss < 6000) {
              violations.push({ message: "Wait at least 3 candles after a loss before re-entering. This is the revenge trading check.", blocking: false });
            }
          }
        }
        break;
      }
      case 'm13-mission': {
        if (!trade.stopLoss) violations.push({ message: "Final Exam: Every trade requires a stop loss. No exceptions.", blocking: true });
        if (trade.stopLoss && trade.entryPrice !== undefined) {
          const riskAmount = Math.abs((trade.entryPrice ?? currentPrice) - trade.stopLoss) * (trade.lotSize ?? 0.1) * 100;
          const riskPct = (riskAmount / stats.balance) * 100;
          if (riskPct > 1.5) violations.push({ message: `Risk ${riskPct.toFixed(1)}% exceeds 1.5% cap. Final Exam enforces all rules.`, blocking: false });
        }
        break;
      }
    }
    return violations;
  }, []);

  const onTradeClose = useCallback((
    trade: Trade, stats: PlayerStats, candles: Candle[], regime: MarketCondition, allTrades: Trade[]
  ) => {
    const mission = missionRef.current;
    if (!mission) return;

    const ms = { ...missionStateRef.current };
    ms.tradesAttempted++;
    ms.closedInProfit = (trade.pnl ?? 0) > 0;
    ms.firstAttempt = false;

    const newMet = new Set(metRef.current);
    const closedTrades = allTrades.filter(t => t.status === 'closed');
    const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

    switch (mission.id) {
      case 'm1-mission': {
        if (trade.type === 'buy') newMet.add('opened-buy');
        newMet.add('closed-trade');
        break;
      }
      case 'm2-mission': {
        newMet.add('correct-direction');
        if ((trade.candlesHeld ?? 0) >= 3) newMet.add('held-3-candles');
        break;
      }
      case 'm3-mission': {
        if (ms.openedInUptrend) newMet.add('traded-in-uptrend');
        if ((trade.candlesHeld ?? 0) >= 5) newMet.add('held-5-candles');
        if ((trade.pnl ?? 0) > 0) newMet.add('closed-profit');
        break;
      }
      case 'm4-mission': {
        newMet.add('entered-near-zone');
        if (trade.hadStopLoss) newMet.add('sl-across-zone');
        break;
      }
      case 'm5-mission': {
        if (trade.hadStopLoss) newMet.add('has-stop-loss');
        if (trade.takeProfit) newMet.add('has-take-profit');
        if (trade.rrRatio && trade.rrRatio >= 2) newMet.add('rr-2-to-1');
        break;
      }
      case 'm6-mission': {
        const riskAmt = trade.hadStopLoss && trade.stopLoss
          ? Math.abs(trade.entryPrice - trade.stopLoss) * trade.lotSize * 100
          : stats.balance;
        const riskPct = (riskAmt / stats.balance) * 100;
        const isCompliant = trade.hadStopLoss && riskPct < 1.5;

        if (isCompliant) {
          cleanCountRef.current++;
        } else {
          cleanCountRef.current = 0;
        }
        setConsecutiveClean(cleanCountRef.current);

        if (cleanCountRef.current >= 1) newMet.add('consecutive-1');
        if (cleanCountRef.current >= 2) newMet.add('consecutive-2');
        if (cleanCountRef.current >= 3) newMet.add('consecutive-3');
        break;
      }
      case 'm7-mission': {
        newMet.add('entered-on-close');
        if (trade.hadStopLoss) newMet.add('sl-across-zone');
        if (trade.rrRatio && trade.rrRatio >= 2) newMet.add('tp-2r');
        break;
      }
      case 'm8-mission': {
        newMet.add('ema-bullish-aligned');
        newMet.add('entered-pullback');
        if (trade.hadStopLoss) newMet.add('sl-below-ema');
        break;
      }
      case 'm9-mission': {
        const missionTrades = closedTrades.filter(t => t.missionId === mission.id);
        if (missionTrades.length >= 1) {
          newMet.add('first-trade-rsi-ok');
          if ((missionTrades[0].pnl ?? 0) > 0) newMet.add('first-trade-profit');
        }
        if (missionTrades.length >= 2) {
          newMet.add('second-trade-rsi-ok');
          if ((missionTrades[1].pnl ?? 0) > 0) newMet.add('second-trade-profit');
        }
        break;
      }
      case 'm10-mission': {
        if (regime === 'breakout') newMet.add('entered-in-breakout');
        newMet.add('correct-direction');
        if (trade.rrRatio && trade.rrRatio >= 2) newMet.add('rr-2-to-1');
        break;
      }
      case 'm11-mission': {
        const mTrades = closedTrades.filter(t => t.missionId === mission.id);
        if (mTrades.length >= 1) {
          newMet.add('first-range-trade');
          if ((mTrades[0].pnl ?? 0) > 0) newMet.add('first-trade-profit');
        }
        if (mTrades.length >= 2) {
          newMet.add('second-range-trade');
          if ((mTrades[1].pnl ?? 0) > 0) newMet.add('second-trade-profit');
        }
        break;
      }
      case 'm12-mission': {
        const m12trades = closedTrades.filter(t => t.missionId === mission.id);
        if (m12trades.every(t => t.hadStopLoss)) newMet.add('all-have-sl');
        newMet.add('no-revenge');
        newMet.add('no-fomo');
        newMet.add('no-size-increase');
        break;
      }
      case 'm13-mission': {
        const m13trades = closedTrades.filter(t => t.missionId === mission.id);
        if (m13trades.length >= 10) {
          newMet.add('ten-trades');
          const wins = m13trades.filter(t => (t.pnl ?? 0) > 0).length;
          if (wins / m13trades.length >= 0.6) newMet.add('win-rate-60');
          if (m13trades.every(t => t.hadStopLoss)) newMet.add('all-sl');
          newMet.add('risk-under-1-5');
          newMet.add('no-violations');

          const score = Math.round(
            (wins / m13trades.length) * 40 +
            (m13trades.filter(t => t.hadStopLoss).length / m13trades.length) * 30 +
            (m13trades.filter(t => (t.rrRatio ?? 0) >= 2).length / m13trades.length) * 30
          );
          setMissionScore(score);
        }
        break;
      }
    }

    missionStateRef.current = ms;
    metRef.current = newMet;
    setMissionState(ms);
    setMetCriteria(new Set(newMet));
    setCriteriaStatus(buildCriteriaStatus(mission, newMet));

    const allMet = mission.criteria.every(c => newMet.has(c.id));
    if (allMet) {
      setMissionResult('success');
    }
  }, []);

  const onCandleTick = useCallback((trade: Trade | null, allTrades: Trade[]) => {
    if (!trade || !activeMission) return;
    setMissionState(prev => {
      const next = {
        ...prev,
        candlesHeldOpen: prev.candlesHeldOpen + 1,
        highestCandlesHeld: Math.max(prev.highestCandlesHeld, prev.candlesHeldOpen + 1),
      };
      missionStateRef.current = next;
      return next;
    });
  }, [activeMission]);

  const resetMission = useCallback(() => {
    missionRef.current = null;
    metRef.current = new Set();
    cleanCountRef.current = 0;
    const ms = buildDefaultMissionState();
    missionStateRef.current = ms;
    setActiveMission(null);
    setMissionState(ms);
    setMetCriteria(new Set());
    setCriteriaStatus([]);
    setMissionResult(null);
    setMissionScore(0);
    setConsecutiveClean(0);
  }, []);

  const clearResult = useCallback(() => {
    setMissionResult(null);
  }, []);

  return {
    activeMission,
    missionState,
    criteriaStatus,
    missionResult,
    missionScore,
    consecutiveClean,
    startMission,
    validateTradeOpen,
    onTradeClose,
    onCandleTick,
    resetMission,
    clearResult,
  };
}
