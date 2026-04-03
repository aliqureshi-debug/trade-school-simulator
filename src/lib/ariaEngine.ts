import { CoachMessage, AriaMode, Trade, PlayerStats, MarketCondition } from '@/types/trading';

let messageId = 0;
function msg(text: string, type: CoachMessage['type']): CoachMessage {
  return { id: `aria-${++messageId}`, text, type, timestamp: Date.now() };
}

export function getWelcomeMessages(): CoachMessage[] {
  return [
    msg("Welcome to TradeSchool. I am ARIA — your Adaptive Risk Intelligence Agent.", 'learn'),
    msg("We begin with Module 1. Everything starts here. Let us build your foundation from zero.", 'learn'),
  ];
}

export function getLessonStartMessage(lessonTitle: string, moduleId: number): CoachMessage {
  if (moduleId <= 2) {
    return msg(`Lesson: ${lessonTitle}. Watch the chart and read the narration below. I will guide you through everything.`, 'learn');
  }
  if (moduleId <= 5) {
    return msg(`Lesson: ${lessonTitle}. Observe the annotations on the chart as I explain this concept.`, 'learn');
  }
  return msg(`${lessonTitle}. Watch carefully — the details here compound into your edge.`, 'learn');
}

export function getLessonCompleteMessage(lessonTitle: string, moduleId: number): CoachMessage {
  const encouragements = moduleId <= 3
    ? ["Good. One more concept closer to your first real trade.", "Understood. That is the foundation of how markets work.", "Clear. Let that settle. We go deeper."]
    : moduleId <= 7
    ? ["Sharp. That concept separates disciplined traders from the rest.", "You are building the framework that professionals use.", "Correct. That understanding protects your capital."]
    : ["That is institutional-grade knowledge. Apply it exactly as shown.", "Most retail traders never learn that. You now have the edge.", "Internalize that. It will save your account more than once."];
  const text = encouragements[Math.floor(Math.random() * encouragements.length)];
  return msg(`${lessonTitle} complete. +20 XP. ${text}`, 'review');
}

export function getMissionStartMessage(missionTitle: string, briefing: string): CoachMessage {
  return msg(`MISSION: ${missionTitle}. ${briefing}`, 'action');
}

export function getMissionGuidanceMessage(moduleId: number, guidanceMessages: string[]): CoachMessage {
  const text = guidanceMessages[Math.floor(Math.random() * guidanceMessages.length)];
  return msg(text, 'action');
}

export function getMissionCompleteMessage(successMessage: string, xpReward: number, moduleId: number): CoachMessage {
  const prefix = moduleId <= 4
    ? "Mission complete."
    : moduleId <= 9
    ? "Execution confirmed."
    : "Professional standard achieved.";
  return msg(`${prefix} +${xpReward} XP. ${successMessage}`, 'review');
}

export function getMissionFailureMessage(failureMessage: string): CoachMessage {
  return msg(`Mission not complete. ${failureMessage}`, 'warn');
}

export function getModuleCompleteMessage(moduleId: number, moduleName: string, xpBonus: number): CoachMessage {
  const messages: Record<number, string> = {
    1: `Module 1 complete: The Market. You understand price, candles, and pips. +${xpBonus} XP. Module 2 begins.`,
    2: `Module 2 complete: Reading Candles. You can read what every candle is saying. +${xpBonus} XP. Module 3 begins.`,
    3: `Module 3 complete: Trend. You identify and trade with the dominant force. +${xpBonus} XP. Tier 1 foundation is solid.`,
    4: `Module 4 complete: Support and Resistance. Your edge now has a structure to anchor it. +${xpBonus} XP. Tier 1 complete — Welcome to Tier 2: TRADER.`,
    5: `Module 5 complete: Your First Real Setup. Stop loss, take profit, 2:1 R:R — you execute all three. +${xpBonus} XP.`,
    6: `Module 6 complete: Position Sizing. You never over-risk again. The 1% rule is now a habit. +${xpBonus} XP.`,
    7: `Module 7 complete: Entry Timing. Confirmation over anticipation. Patient over impulsive. +${xpBonus} XP.`,
    8: `Module 8 complete: Moving Averages. EMA is your trend filter — not your signal. +${xpBonus} XP.`,
    9: `Module 9 complete: RSI. Momentum confirmation is now part of every entry decision. +${xpBonus} XP. Tier 2 complete — Welcome to Tier 3: PROFESSIONAL.`,
    10: `Module 10 complete: Breakouts. You identify the real ones from the traps. +${xpBonus} XP.`,
    11: `Module 11 complete: Range Trading. You adapt your strategy to the regime. +${xpBonus} XP.`,
    12: `Module 12 complete: Trade Psychology. You trade the process, not the emotion. +${xpBonus} XP.`,
    13: `ACADEMY COMPLETE. ${moduleName}. All 13 modules. All 52 lessons. All 13 missions. +${xpBonus} XP. You are a Professional Trader.`,
  };
  return msg(messages[moduleId] ?? `Module ${moduleId} complete: ${moduleName}. +${xpBonus} XP.`, 'review');
}

export function getTradeOpenMessage(trade: Trade, moduleId: number): CoachMessage {
  const hasRisk = trade.stopLoss !== undefined;
  const hasTP = trade.takeProfit !== undefined;

  if (moduleId <= 2) {
    return msg(
      `${trade.type.toUpperCase()} trade open at $${trade.entryPrice.toFixed(2)}. ${hasRisk ? 'Stop loss set — good.' : 'No stop loss. We will cover that in Module 5.'} Watch the P&L number change as price moves.`,
      'learn'
    );
  }

  if (moduleId <= 5) {
    if (!hasRisk) {
      return msg(`${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)}. No stop loss. After Module 5 that is not allowed. For now, watch carefully and close manually if it moves against you.`, 'warn');
    }
    if (hasRisk && hasTP) {
      return msg(`${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)} — SL and TP set. R:R is ${trade.rrRatio?.toFixed(1) ?? '?'}:1. Plan is complete. Let it execute.`, 'action');
    }
    return msg(`${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)} — stop loss set. Consider adding a take profit at 2:1.`, 'action');
  }

  if (moduleId <= 9) {
    if (!hasRisk) return msg(`${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)} with no stop loss. This is a critical risk management failure at Tier 2. You know better.`, 'warn');
    const rr = trade.rrRatio?.toFixed(1) ?? '?';
    return msg(`${trade.type.toUpperCase()} submitted: $${trade.entryPrice.toFixed(2)}, SL: $${trade.stopLoss?.toFixed(2)}, R:R: ${rr}:1. ${parseFloat(rr) >= 2 ? 'Acceptable R:R.' : 'R:R below 2:1 — suboptimal but proceeding.'}`, 'action');
  }

  if (!hasRisk) return msg(`${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)} — no stop loss. A Professional does not trade without stops. This violates your own framework.`, 'warn');
  const rr = trade.rrRatio?.toFixed(1) ?? '?';
  return msg(`${trade.type.toUpperCase()} ${trade.entryPrice.toFixed(2)} | SL ${trade.stopLoss?.toFixed(2)} | TP ${trade.takeProfit?.toFixed(2)} | R:R ${rr}:1 | Risk ${(Math.abs(trade.entryPrice - (trade.stopLoss ?? trade.entryPrice)) * trade.lotSize * 100).toFixed(0)}$. Trade plan complete.`, 'action');
}

export function getTradeCloseMessage(trade: Trade, moduleId: number): CoachMessage {
  const pnl = trade.pnl ?? 0;
  const isProfit = pnl > 0;

  if (moduleId <= 3) {
    return isProfit
      ? msg(`Trade closed: +$${pnl.toFixed(2)}. Price moved in your direction. That is how profit is made — identifying direction and trading with it.`, 'review')
      : msg(`Trade closed: -$${Math.abs(pnl).toFixed(2)}. The market went the other way. This is normal. With a stop loss, this loss would have been capped. You will learn that in Module 5.`, 'review');
  }

  if (moduleId <= 6) {
    if (isProfit) {
      const msg2 = trade.hadStopLoss
        ? (pnl > 50 ? `+$${pnl.toFixed(2)} captured with full risk control. R:R working as designed.` : `+$${pnl.toFixed(2)}. Small win with discipline is better than a large win with recklessness.`)
        : `+$${pnl.toFixed(2)}. But no stop loss — luck is not a strategy. Add stops every time.`;
      return msg(msg2, 'review');
    }
    const msg2 = !trade.hadStopLoss
      ? `-$${Math.abs(pnl).toFixed(2)}. No stop loss made this damage worse than it needed to be. A defined exit limits every loss.`
      : `-$${Math.abs(pnl).toFixed(2)}. Stop loss did its job — damage was controlled. Review the entry quality, not the outcome.`;
    return msg(msg2, 'review');
  }

  if (isProfit) {
    const candlesNote = (trade.candlesHeld ?? 0) >= 5 ? ` Held for ${trade.candlesHeld} candles — patience rewarded.` : '';
    return msg(`+$${pnl.toFixed(2)}.${candlesNote} ${trade.rrRatio && trade.rrRatio >= 2 ? `R:R of ${trade.rrRatio.toFixed(1)}:1 — edge maintained.` : 'Continue building R:R discipline.'}`, 'review');
  }
  const msg2 = `-$${Math.abs(pnl).toFixed(2)}. ${trade.hadStopLoss ? 'Controlled loss. Was the entry thesis valid? Did all checklist items pass before entry?' : 'No stop loss. At this stage, that is not acceptable. Every trade needs a defined exit.'}`;
  return msg(msg2, 'review');
}

export function getAriaMode(
  trade: Trade | null, trades: Trade[], currentPrice: number,
  cooldownActive: boolean, isLesson: boolean, isMission: boolean,
  isCelebrating: boolean
): AriaMode {
  if (isCelebrating) return 'celebrating';
  if (isLesson) return 'teaching';
  if (cooldownActive) return 'danger';

  const recent5 = trades.filter(t => t.status === 'closed').slice(-5);
  if (recent5.length >= 3) {
    const losses = recent5.filter(t => (t.pnl ?? 0) < 0);
    if (losses.length >= 3) {
      const times = losses.map(t => t.exitTime ?? 0).sort((a, b) => a - b);
      if (times.every((t, i) => i === 0 || t - times[i - 1] < 4 * 60 * 1000)) {
        return 'danger';
      }
    }
  }

  if (trade) {
    if (!trade.stopLoss) return 'caution';
    const unrealized = trade.type === 'buy'
      ? (currentPrice - trade.entryPrice) * trade.lotSize * 100
      : (trade.entryPrice - currentPrice) * trade.lotSize * 100;
    if (unrealized < -150) return 'caution';
    return 'watching';
  }

  const closed3 = trades.filter(t => t.status === 'closed').slice(-3);
  if (closed3.length >= 2 && closed3.filter(t => (t.pnl ?? 0) < 0).length >= 2) return 'caution';

  if (isMission) return 'guiding';
  return 'watching';
}

export function getOpenTradeCommentary(
  trade: Trade, currentPrice: number, moduleId: number
): CoachMessage | null {
  const unrealized = trade.type === 'buy'
    ? (currentPrice - trade.entryPrice) * trade.lotSize * 100
    : (trade.entryPrice - currentPrice) * trade.lotSize * 100;

  const holdMs = Date.now() - trade.entryTime;

  if (!trade.stopLoss && moduleId >= 5) {
    return msg("No stop loss on this trade. If it moves further against you, you have no exit plan. Consider closing and re-entering with a stop.", 'warn');
  }

  if (unrealized > 100 && holdMs > 15000 && moduleId >= 5) {
    return msg(`+$${unrealized.toFixed(0)} in profit. If you have a take profit set, let it execute. If not, consider moving your stop to breakeven to protect the gain.`, 'action');
  }

  if (unrealized < -150 && trade.stopLoss) {
    return msg(`-$${Math.abs(unrealized).toFixed(0)}. Your stop is set at $${trade.stopLoss.toFixed(2)}. Do not move it further away — that removes the protection you planned for.`, 'warn');
  }

  if (holdMs > 25000 && Math.abs(unrealized) < 5) {
    return msg("This trade has been flat for a while. If the reason you entered no longer holds, it is valid to close and wait for a cleaner setup.", 'action');
  }

  return null;
}

export function getRevengeTradingMessage(): CoachMessage {
  return msg("Three losses in rapid succession. I am pausing new trades for 45 seconds. This is not a punishment — it is protection. Use this time to breathe, not to plan revenge.", 'danger');
}

export function getCooldownEndMessage(): CoachMessage {
  return msg("Cooldown complete. Before you re-enter: what went wrong in those three trades? Identify the pattern. Then, and only then, look for the next setup.", 'action');
}

export function getLevelUpMessage(level: number, moduleId: number): CoachMessage {
  const msgs = {
    2: "Level 2. You have begun. Keep going.",
    3: "Level 3. Progress is building.",
    4: "Level 4. You are beyond the beginning.",
    5: "Level 5. Halfway through Tier 1. The concepts are forming a system.",
    6: "Level 6. You are developing real trading awareness.",
    7: "Level 7. Most retail traders do not reach this level of understanding.",
    8: "Level 8. Professional framework taking shape.",
    9: "Level 9. Approaching the top of the Academy.",
    10: "Level 10. Professional Trader. You completed the journey.",
  } as Record<number, string>;
  return msg(msgs[level] ?? `Level ${level} achieved.`, 'review');
}

export function getMarketConditionMessage(condition: MarketCondition, moduleId: number): CoachMessage | null {
  if (moduleId < 3 || condition === 'transition') return null;

  const messages: Record<MarketCondition, string[]> = {
    uptrend: [
      "UPTREND active. Higher highs and higher lows confirm bullish structure. Look for BUY setups on pullbacks.",
      "Uptrend continues. Every dip to the EMA is a potential entry — provided the structure holds.",
      "Strong uptrend. Do not fight it. Trend alignment is your primary filter.",
    ],
    downtrend: [
      "DOWNTREND active. Lower highs and lower lows confirm bearish structure. Only SELL setups aligned with the trend.",
      "Downtrend in force. Bounces are selling opportunities, not reversal signals.",
      "Market in downtrend. Patience and trend alignment — no counter-trend trades.",
    ],
    range: [
      "RANGE regime. Price is oscillating between S/R boundaries. Fade the extremes — buy low, sell high within the range.",
      "Ranging market. Reduce your take profit targets — the boundaries of the range are your limit.",
      "Range conditions. EMA lines will be flat. S/R boundaries are your primary reference points.",
    ],
    breakout: [
      "BREAKOUT detected. Prepare for a high-momentum directional move. Enter on confirmation, not the spike.",
      "Breakout regime. High volume required to confirm. Watch for the retest after the initial move.",
      "Market breaking out. Direction and volume — both must confirm before committing capital.",
    ],
    volatile: [
      "HIGH VOLATILITY. Wicks will be aggressive and stops are more likely to be hit. Reduce lot size if already in or planning a trade.",
      "Volatile conditions. Do not enter on gut feeling. Wait for structure to clarify.",
    ],
    transition: [],
  };

  const options = messages[condition] ?? [];
  if (options.length === 0) return null;
  const text = options[Math.floor(Math.random() * options.length)];
  const type = condition === 'volatile' ? 'warn' : condition === 'breakout' ? 'action' : 'learn';
  return msg(text, type);
}
