import { CoachMessage, MarketCondition, Trade, PlayerStats, Candle } from '@/types/trading';

let messageId = 0;

function msg(text: string, mode: CoachMessage['mode']): CoachMessage {
  return {
    id: `coach-${++messageId}`,
    text,
    mode,
    timestamp: Date.now(),
  };
}

export function getWelcomeMessages(): CoachMessage[] {
  return [
    msg("Welcome to TradeSchool! 🎓 I'm your trading coach. I'll teach you everything from scratch.", 'explain'),
    msg("You have $10,000 in fake money. Let's learn by doing. Watch the chart — each bar is called a 'candle'. Green = price went up. Red = price went down.", 'explain'),
    msg("Ready? Try placing your first BUY trade using the button below. Buy when you think price will go up!", 'guide'),
  ];
}

export function getMarketConditionMessage(condition: MarketCondition, seen: string[]): CoachMessage | null {
  const isNew = !seen.includes(condition);

  switch (condition) {
    case 'uptrend':
      return isNew
        ? msg("📈 Notice the chart? Price is making higher highs and higher lows. That's an UPTREND. In an uptrend, we look for BUY opportunities.", 'explain')
        : msg("📈 Uptrend continues. Look for pullbacks to buy — don't chase price at the top.", 'guide');

    case 'downtrend':
      return isNew
        ? msg("📉 Price is falling — lower highs and lower lows. This is a DOWNTREND. Beginners should avoid buying in downtrends.", 'explain')
        : msg("📉 Still trending down. Be patient — wait for the trend to reverse before buying.", 'guide');

    case 'range':
      return isNew
        ? msg("↔️ Price is moving sideways in a RANGE. It's bouncing between support (bottom) and resistance (top). Buy near the bottom, sell near the top.", 'explain')
        : null;

    case 'breakout':
      return isNew
        ? msg("💥 BREAKOUT! Price just moved sharply with high volume. Breakouts can signal the start of a new trend. Watch if it holds!", 'explain')
        : msg("💥 Another breakout move — check if volume confirms it. No volume = likely fake breakout.", 'guide');

    case 'volatile':
      return msg("⚠️ High volatility right now. Be careful — big moves in both directions. Consider smaller position sizes.", 'guide');
  }
}

export function getTradeOpenMessage(trade: Trade, stats: PlayerStats): CoachMessage {
  if (stats.totalTrades === 0) {
    return msg(`🎉 Your first trade! You ${trade.type === 'buy' ? 'bought' : 'sold'} at $${trade.entryPrice.toFixed(2)}. Now watch the chart — if price goes ${trade.type === 'buy' ? 'up' : 'down'}, you make money!`, 'explain');
  }

  return msg(`Trade opened: ${trade.type.toUpperCase()} at $${trade.entryPrice.toFixed(2)}. Let's see how it plays out.`, 'guide');
}

export function getTradeCloseMessage(trade: Trade): CoachMessage {
  const pnl = trade.pnl || 0;
  const isProfit = pnl > 0;

  if (isProfit) {
    return msg(`✅ Nice! You closed for +$${pnl.toFixed(2)} profit. ${pnl > 50 ? "Great read on the market!" : "Small wins add up. Good discipline."}`, 'debrief');
  } else {
    return msg(`❌ Closed for -$${Math.abs(pnl).toFixed(2)} loss. ${Math.abs(pnl) > 100 ? "That was a big loss. Consider using a stop loss next time to limit damage." : "Small loss — that's fine. Losses are part of trading. The key is keeping them small."}`, 'debrief');
  }
}

export function detectBehavior(
  trade: Trade | null,
  trades: Trade[],
  currentPrice: number,
  _candles: Candle[]
): CoachMessage | null {
  if (!trade || trade.status !== 'open') return null;

  const unrealizedPnl = trade.type === 'buy'
    ? (currentPrice - trade.entryPrice) * trade.size
    : (trade.entryPrice - currentPrice) * trade.size;

  // Holding a losing trade too long
  const holdTime = Date.now() - trade.entryTime;
  if (unrealizedPnl < -100 && holdTime > 30000) {
    return msg("⚠️ You're holding a losing trade for a while. Set a stop loss or consider cutting your losses. Don't let a small loss become a big one.", 'guide');
  }

  // Profitable trade warning
  if (unrealizedPnl > 50 && holdTime > 20000) {
    return msg("💰 You're in profit! Consider taking some off the table or moving your stop to breakeven to protect gains.", 'guide');
  }

  // Revenge trading detection
  const recentTrades = trades.filter(t => t.status === 'closed').slice(-3);
  const recentLosses = recentTrades.filter(t => (t.pnl || 0) < 0);
  if (recentLosses.length >= 2) {
    return msg("🧘 You've had consecutive losses. Take a breath. Revenge trading — jumping back in to recover losses — is the #1 account killer.", 'guide');
  }

  return null;
}

export function getLevelUpMessage(level: number): CoachMessage {
  return msg(`🎖️ LEVEL UP! You're now Level ${level}. Keep practicing — every trade teaches you something.`, 'explain');
}

export function getXpMessage(xp: number, reason: string): CoachMessage {
  return msg(`+${xp} XP — ${reason}`, 'guide');
}
