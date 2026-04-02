import { CoachMessage, AriaState, Trade, PlayerStats, Candle, MarketCondition } from '@/types/trading';

let messageId = 0;

function msg(text: string, type: CoachMessage['type']): CoachMessage {
  return {
    id: `coach-${++messageId}`,
    text,
    type,
    timestamp: Date.now(),
  };
}

export function getWelcomeMessages(): CoachMessage[] {
  return [
    msg("Welcome to TradeSchool. I'm ARIA — your AI trading coach. I'll teach you everything from scratch.", 'learn'),
    msg("You have $10,000 in fake money. Let's learn by doing. Watch the chart — each bar is called a 'candle'. Green = price went up. Red = price went down.", 'learn'),
    msg("Ready? Try placing your first BUY trade using the button below. Buy when you think price will go up!", 'action'),
  ];
}

export function getPhaseIntroMessages(ariaIntro: string): CoachMessage[] {
  return [msg(ariaIntro, 'learn')];
}

export function getMarketConditionMessage(
  condition: MarketCondition,
  seen: string[],
  candles: Candle[],
  currentPrice: number
): CoachMessage | null {
  if (condition === 'transition') return null;

  const isNew = !seen.includes(condition);
  const recent = candles.slice(-5);
  const direction = recent.length >= 2
    ? recent[recent.length - 1].close > recent[0].close ? 'up' : 'down'
    : 'flat';

  switch (condition) {
    case 'uptrend':
      return isNew
        ? msg(`Price is making higher highs and higher lows — that's an UPTREND. Each dip is being bought. Look for BUY opportunities on pullbacks, not at the highs.`, 'learn')
        : msg(`Uptrend continues, price pressing ${direction === 'up' ? 'higher' : 'into resistance'}. ${direction === 'up' ? "Momentum is strong — but don't chase." : "Pullback forming. Potential entry if it holds structure."}`, 'action');

    case 'downtrend':
      return isNew
        ? msg(`Lower highs and lower lows — DOWNTREND in force. Every bounce is being sold. Avoid buying into this. Wait for the trend to break.`, 'learn')
        : msg(`Downtrend continuing. Price at $${currentPrice.toFixed(2)} and ${direction === 'down' ? 'pressing lower' : 'attempting a bounce'}. ${direction === 'down' ? "Shorts have control." : "Watch for rejection at the next swing high."}`, 'warn');

    case 'range':
      return isNew
        ? msg(`Price is ranging — moving sideways between support and resistance. Buy near the bottom, sell near the top. Do NOT breakout trade ranges without volume confirmation.`, 'learn')
        : null;

    case 'breakout':
      return msg(`Breakout move detected at $${currentPrice.toFixed(2)}! High volume confirms conviction. Watch if price holds above the broken level — retests are your entry, not the initial spike.`, 'action');

    case 'volatile':
      return msg(`High volatility — large candles, erratic movement. Reduce your lot size. Wicks will be aggressive. Tight stops will get hit. Breathe and wait for clarity.`, 'warn');
  }

  return null;
}

export function getTradeOpenMessage(trade: Trade, stats: PlayerStats): CoachMessage {
  const hasRisk = trade.stopLoss !== undefined;
  const hasTP = trade.takeProfit !== undefined;

  if (stats.totalTrades === 0) {
    return msg(
      `First trade: ${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)}. Now watch — if price goes ${trade.type === 'buy' ? 'up' : 'down'}, you're in profit. If it goes the other way, you're in loss. This is how every trade works.`,
      'learn'
    );
  }

  if (!hasRisk) {
    return msg(
      `Trade #${stats.totalTrades + 1} opened: ${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)}. No stop loss set. If this goes wrong, you're fully exposed. Consider adding one.`,
      'warn'
    );
  }

  if (hasRisk && hasTP) {
    const rrRatio = trade.rrRatio?.toFixed(1) ?? '?';
    return msg(
      `${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)} — SL set, TP set, R:R is ${rrRatio}:1. Trade plan looks solid. Execute it.`,
      'action'
    );
  }

  return msg(
    `${trade.type.toUpperCase()} entered at $${trade.entryPrice.toFixed(2)} with stop loss at $${trade.stopLoss?.toFixed(2)}. Max risk is protected. Watch for the move.`,
    'action'
  );
}

export function getTradeCloseMessage(trade: Trade, currentPrice: number, candles: Candle[]): CoachMessage {
  const pnl = trade.pnl ?? 0;
  const isProfit = pnl > 0;
  const hadSL = trade.hadStopLoss;
  const pips = Math.abs(currentPrice - trade.entryPrice).toFixed(2);
  const recent = candles.slice(-3);
  const trend = recent[recent.length - 1]?.close > recent[0]?.close ? 'up' : 'down';

  if (isProfit) {
    if (pnl > 200) return msg(`Excellent. +$${pnl.toFixed(2)} — that was a high-conviction trade executed cleanly. ${hadSL ? "Stop loss protected you and you let it run. That's elite discipline." : "Consider using a stop loss next time to lock in the habit."}`, 'review');
    if (pnl > 50) return msg(`Solid. +$${pnl.toFixed(2)} profit, ${pips} pip move captured. ${trend === 'up' ? "Trend was on your side." : "You caught the counter-move."} ${hadSL ? "Protected and profitable." : "Add a stop loss next time for full control."}`, 'review');
    return msg(`+$${pnl.toFixed(2)}. Small win — but consistent small wins compound into big accounts. ${hadSL ? "Good structure." : "Use a stop loss to make this setup repeatable."}`, 'review');
  } else {
    if (Math.abs(pnl) > 300) return msg(`-$${Math.abs(pnl).toFixed(2)}. That's a large loss. ${!hadSL ? "No stop loss was the problem — that damage was preventable." : "Stop loss hit. Review entry timing — was this with the trend?"} Take a moment before the next trade.`, 'warn');
    if (Math.abs(pnl) > 100) return msg(`-$${Math.abs(pnl).toFixed(2)} loss. ${!hadSL ? "Without a stop loss, one bad trade can undo many good ones. Set stops." : "Loss taken — that's part of trading. Was the entry valid? Was the trend in your favor?"}`, 'warn');
    return msg(`-$${Math.abs(pnl).toFixed(2)}. Small loss — if you had a stop loss, this was a controlled outcome. Review: was the entry timed correctly? Did you have a clear reason to enter?`, 'review');
  }
}

export function detectAriaState(
  trade: Trade | null,
  trades: Trade[],
  currentPrice: number
): AriaState {
  // Danger: revenge trading (3+ losses in last 5 trades under 4 min apart)
  const recent = trades.filter(t => t.status === 'closed').slice(-5);
  if (recent.length >= 3) {
    const losses = recent.filter(t => (t.pnl ?? 0) < 0);
    if (losses.length >= 3) {
      const times = losses.map(t => t.exitTime ?? 0).sort();
      const allFast = times.every((t, i) => i === 0 || t - times[i - 1] < 4 * 60 * 1000);
      if (allFast) return 'red';
    }
  }

  // Amber: no stop loss, bad R:R, over-leveraged
  if (trade) {
    if (!trade.stopLoss) return 'amber';
    const unrealized = trade.type === 'buy'
      ? (currentPrice - trade.entryPrice) * trade.lotSize
      : (trade.entryPrice - currentPrice) * trade.lotSize;
    if (unrealized < -200) return 'amber';
  }

  // Amber: consecutive losses
  const closedRecent = trades.filter(t => t.status === 'closed').slice(-3);
  const recentLosses = closedRecent.filter(t => (t.pnl ?? 0) < 0);
  if (recentLosses.length >= 2) return 'amber';

  return 'teal';
}

export function getOpenTradeCommentary(
  trade: Trade,
  currentPrice: number,
  candles: Candle[],
  ariaState: AriaState
): CoachMessage | null {
  const unrealized = trade.type === 'buy'
    ? (currentPrice - trade.entryPrice) * trade.lotSize
    : (trade.entryPrice - currentPrice) * trade.lotSize;

  const holdMs = Date.now() - trade.entryTime;
  const recent = candles.slice(-5);
  const trendUp = recent[recent.length - 1]?.close > recent[0]?.close;
  const nearSR = Math.abs(currentPrice - (candles.slice(-30).reduce((m, c) => Math.max(m, c.high), 0))) < 1;

  if (ariaState === 'red') {
    return msg(`Stop entering trades. You're in revenge trading territory — three losses in rapid succession. This is how accounts blow up. No trades for 45 seconds. Use this time to breathe and reset.`, 'danger');
  }

  if (ariaState === 'amber') {
    if (!trade.stopLoss) {
      return msg(`You have no stop loss. If this move accelerates against you, you have no exit plan. Add a stop now or prepare to close manually if it turns bad.`, 'warn');
    }
    if (unrealized < -150) {
      return msg(`-$${Math.abs(unrealized).toFixed(0)} and deteriorating. Your stop is there for a reason. Don't move it further away — that's a trap traders fall into. Let the stop do its job.`, 'warn');
    }
  }

  // Normal commentary based on chart state
  if (unrealized > 100 && holdMs > 15000) {
    return msg(`+$${unrealized.toFixed(0)} in profit. ${trendUp === (trade.type === 'buy') ? "Trend is with you. Consider moving stop to breakeven to protect gains." : "Momentum is slowing. Consider taking partial or full profit here."}`, 'action');
  }

  if (nearSR && unrealized > 20) {
    return msg(`Price approaching a key level at $${currentPrice.toFixed(2)}. Resistance overhead could slow momentum. Watch for rejection before adding confidence.`, 'action');
  }

  if (holdMs > 20000 && Math.abs(unrealized) < 10) {
    return msg(`Trade is chopping sideways at entry. If it doesn't move soon, this might not be the setup. A tight, time-based stop is valid — stale trades tie up capital.`, 'learn');
  }

  return null;
}

export function getRevengeTradingMessage(): CoachMessage {
  return msg(`ARIA Alert: Revenge trading pattern detected. Three losses in rapid succession. The BUY and SELL buttons are disabled for 45 seconds. Use this time to review what's going wrong, not to plan the next entry.`, 'danger');
}

export function getLevelUpMessage(level: number): CoachMessage {
  return msg(`Level ${level} reached. Consistent activity is building your trading awareness. Keep going — the concepts deepen from here.`, 'learn');
}

export function getChallengeCompleteMessage(successMessage: string, xpReward: number): CoachMessage {
  return msg(`Challenge complete: +${xpReward} XP. ${successMessage}`, 'review');
}

export function getChallengeFeedback(failureMessage: string): CoachMessage {
  return msg(`Challenge criteria not met: ${failureMessage}`, 'warn');
}
