import { AcademyModule, ARIALesson, TradingMission, LessonAnnotation } from '@/types/trading';

function moduleXP(moduleId: number): number {
  return Math.round(100 + (900 / 12) * (moduleId - 1));
}

function lesson(
  id: string, moduleId: number, lessonNumber: number, title: string,
  narration: string, caption: string,
  annotationSequence: LessonAnnotation[], duration: number
): ARIALesson {
  return { id, moduleId, lessonNumber, title, narration, caption, annotationSequence, duration, replayable: true };
}

function mission(
  id: string, moduleId: number, title: string, briefing: string,
  criteria: { id: string; description: string }[],
  progressDisplay: 'counter' | 'checklist' | 'percentage',
  successMessage: string, failureMessage: string,
  ariaGuidanceMessages: string[]
): TradingMission {
  return {
    id, moduleId, title, briefing, criteria, progressDisplay,
    xpReward: moduleXP(moduleId),
    successMessage, failureMessage, ariaGuidanceMessages,
  };
}

const MODULE_1_LESSONS: ARIALesson[] = [
  lesson('m1-l1', 1, 1, 'What is Price', 
    "Watch the chart in front of you. Every vertical bar you see is price moving. Price is simply the last amount two people agreed to trade at. A buyer decided this was worth paying. A seller decided this was worth selling. Every single tick you see is a real transaction happening somewhere in the world. The chart is a visual history of every agreement ever made.",
    "Price is simply the last amount someone agreed to pay. Every tick is a transaction.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 3000, candleRef: 'last-4', animateIn: 'draw', color: '#00d4aa', text: 'price here' },
      { type: 'arrow', startAtMs: 5500, durationMs: 3000, candleRef: 'last-2', animateIn: 'draw', color: '#00d4aa', text: 'then here' },
      { type: 'arrow', startAtMs: 9000, durationMs: 4000, candleRef: 'last', animateIn: 'draw', color: '#00d4aa', text: 'now here' },
      { type: 'label', startAtMs: 13000, durationMs: 8000, candleRef: 'last', text: 'LIVE PRICE', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m1-l2', 1, 2, 'What is a Candle',
    "Look at any single bar on the chart. That entire bar is called a candle. The thick part in the middle is called the body — it shows where price started and where it ended during that time period. The thin lines above and below the body are called wicks. They show the highest and lowest prices reached during that time. One candle tells you the full story of one period — the open, the high, the low, and the close.",
    "Each candle is one time period. The body is where price started and ended. The wicks show how far it reached.",
    [
      { type: 'highlight', startAtMs: 2000, durationMs: 5000, candleRef: 'last-2', color: 'rgba(255,200,50,0.3)', animateIn: 'fade' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-2', text: 'OPEN', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 6000, durationMs: 4000, candleRef: 'last-2', text: 'CLOSE', color: '#facc15', animateIn: 'pop' },
      { type: 'bracket', startAtMs: 10000, durationMs: 5000, candleRef: 'last-2', color: '#facc15', animateIn: 'draw', text: 'BODY' },
      { type: 'label', startAtMs: 15000, durationMs: 5000, candleRef: 'last-2', text: 'HIGH WICK', color: '#94a3b8', animateIn: 'fade' },
      { type: 'label', startAtMs: 20000, durationMs: 5000, candleRef: 'last-2', text: 'LOW WICK', color: '#94a3b8', animateIn: 'fade' },
    ],
    32
  ),
  lesson('m1-l3', 1, 3, 'Bull vs Bear Candle',
    "There are two types of candles. A green candle means price went UP during that period — buyers were in control. The candle opened at the bottom of the body and closed at the top. A red candle means price went DOWN — sellers were in control. It opened at the top of the body and closed at the bottom. Green equals buyers won. Red equals sellers won. That is all you need to know to start reading every candle on this chart right now.",
    "Green means buyers won that period. Red means sellers won. Simple as that.",
    [
      { type: 'highlight', startAtMs: 1500, durationMs: 5000, candleRef: 'last-3', color: 'rgba(29,210,120,0.25)', animateIn: 'fade' },
      { type: 'label', startAtMs: 2000, durationMs: 4500, candleRef: 'last-3', text: 'BULL CANDLE', color: '#1dd278', animateIn: 'pop' },
      { type: 'circle', startAtMs: 7000, durationMs: 4000, candleRef: 'last-3', color: '#1dd278', animateIn: 'pop' },
      { type: 'highlight', startAtMs: 11000, durationMs: 5000, candleRef: 'last-1', color: 'rgba(239,68,68,0.25)', animateIn: 'fade' },
      { type: 'label', startAtMs: 11500, durationMs: 4500, candleRef: 'last-1', text: 'BEAR CANDLE', color: '#ef4444', animateIn: 'pop' },
      { type: 'circle', startAtMs: 16000, durationMs: 5000, candleRef: 'last-1', color: '#ef4444', animateIn: 'pop' },
    ],
    28
  ),
  lesson('m1-l4', 1, 4, 'What is a Pip',
    "A pip is the smallest standard price movement. On Gold, one full point of price movement — for example from 100.00 to 101.00 — equals 100 pips. So one pip is 0.01. Watch the chart: as price moves up and down, every 0.01 of movement is one pip. Pips matter because they are how we measure profit, loss, stop losses, and take profits. When you set a stop loss 20 pips away, you know exactly how much you are risking per lot.",
    "A pip is the smallest standard price movement. On Gold, 1.00 price change equals 100 pips.",
    [
      { type: 'bracket', startAtMs: 2000, durationMs: 6000, candleRef: 'last', color: '#00d4aa', animateIn: 'draw', text: '100 pips' },
      { type: 'line', startAtMs: 8000, durationMs: 4000, candleRef: 'last', priceDelta: 1, color: '#facc15', animateIn: 'draw' },
      { type: 'label', startAtMs: 12000, durationMs: 8000, candleRef: 'last', text: '1 pip = 0.01', color: '#facc15', animateIn: 'fade' },
      { type: 'label', startAtMs: 20000, durationMs: 8000, candleRef: 'last', text: 'Risk measured in pips', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_1: AcademyModule = {
  id: 1, title: 'The Market', tier: 1, tierName: 'RECRUIT',
  ariaIntroLine: "You know nothing about markets yet. That is fine. I will build your foundation from zero.",
  lessons: MODULE_1_LESSONS,
  mission: mission('m1-mission', 1, 'First Trade',
    "Time to make your first trade. Open a BUY trade and then close it. The outcome does not matter — this is just about pressing the buttons and feeling how it works. I will guide you through every single click.",
    [
      { id: 'opened-buy', description: 'Open a BUY trade' },
      { id: 'closed-trade', description: 'Close the trade' },
    ],
    'checklist',
    "You did it. Your first trade is complete. You opened a position, watched it live on the chart, and closed it. That is the entire trading cycle. Everything you learn from here builds on exactly what you just did.",
    "No completed trade detected yet. Press the BUY button, watch it open on the chart, then press Close.",
    [
      "See that BUY button in the controls below the chart? Press it now to open your first trade.",
      "Your trade is open. Watch the P&L number change as price moves. This is your unrealized profit or loss.",
      "Ready to close? Press the Close button. The trade will close at the current price and you'll see your result.",
      "The chart shows your entry price as a teal line. Price above that line means profit on a BUY trade.",
      "Take your time. There is no rush. Feel how the market moves while your trade is open.",
      "Whenever you're ready, close the trade. Press the Close button to complete this mission.",
    ]
  ),
};

const MODULE_2_LESSONS: ARIALesson[] = [
  lesson('m2-l1', 2, 1, 'The Doji',
    "Find a candle where the open and close are almost exactly the same price — where the body is tiny or nonexistent. That is a Doji. The wicks above and below may be long, showing that price traveled far in both directions, but it came right back to where it started. A Doji is the market saying it cannot decide. Buyers pushed up. Sellers pushed back down. The score ended in a tie. When you see a Doji after a strong trend, pay attention. The balance of power may be shifting.",
    "A Doji has almost no body. Buyers and sellers ended exactly where they started. This means indecision.",
    [
      { type: 'highlight', startAtMs: 2000, durationMs: 6000, candleRef: 'last-2', color: 'rgba(255,200,50,0.35)', animateIn: 'fade' },
      { type: 'label', startAtMs: 3000, durationMs: 5000, candleRef: 'last-2', text: 'DOJI', color: '#facc15', animateIn: 'pop' },
      { type: 'bracket', startAtMs: 9000, durationMs: 5000, candleRef: 'last-2', color: '#94a3b8', text: 'equal wicks', animateIn: 'draw' },
      { type: 'label', startAtMs: 14000, durationMs: 8000, candleRef: 'last-2', text: 'INDECISION', color: '#facc15', animateIn: 'fade' },
      { type: 'circle', startAtMs: 22000, durationMs: 6000, candleRef: 'last-2', color: '#facc15', animateIn: 'pop' },
    ],
    30
  ),
  lesson('m2-l2', 2, 2, 'The Hammer',
    "A Hammer has a very small body near the top and a very long wick pointing down. Here is what happened: sellers pushed price aggressively lower during the period. But before the candle closed, buyers came in with enough force to push price almost all the way back up. The long lower wick is evidence of that battle — sellers tried, buyers fought back. When a Hammer forms at a level where price has bounced before, it is a signal that the selling pressure may be exhausted.",
    "A Hammer has a long lower wick. Sellers pushed price down hard, but buyers fought back. Rejection of lower prices.",
    [
      { type: 'highlight', startAtMs: 2000, durationMs: 6000, candleRef: 'last-3', color: 'rgba(29,210,120,0.25)', animateIn: 'fade' },
      { type: 'label', startAtMs: 2500, durationMs: 5000, candleRef: 'last-3', text: 'HAMMER', color: '#1dd278', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 8000, durationMs: 4000, candleRef: 'last-3', color: '#ef4444', text: 'sellers pushed here', animateIn: 'draw' },
      { type: 'arrow', startAtMs: 13000, durationMs: 4000, candleRef: 'last-3', color: '#1dd278', text: 'buyers fought back', animateIn: 'draw' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last-3', text: 'BULLISH REJECTION', color: '#1dd278', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m2-l3', 2, 3, 'The Engulfing',
    "An Engulfing pattern requires two candles in sequence. The second candle completely swallows the first — its body extends both above and below the body of the previous candle. A Bullish Engulfing is a large green candle that swallows a red candle. A Bearish Engulfing is a large red candle that swallows a green one. The key is size. The second candle is declaring that the new side overwhelmed the old side in a single period. Momentum has shifted. When this happens at a key level, it is one of the highest-probability signals in price action.",
    "An Engulfing candle completely swallows the previous candle. This is a momentum shift.",
    [
      { type: 'highlight', startAtMs: 2000, durationMs: 5000, candleRef: 'last-2', color: 'rgba(239,68,68,0.2)', animateIn: 'fade' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-2', text: 'CANDLE 1', color: '#94a3b8', animateIn: 'pop' },
      { type: 'highlight', startAtMs: 7000, durationMs: 6000, candleRef: 'last-1', color: 'rgba(29,210,120,0.3)', animateIn: 'fade' },
      { type: 'label', startAtMs: 7500, durationMs: 5000, candleRef: 'last-1', text: 'ENGULFS IT', color: '#1dd278', animateIn: 'pop' },
      { type: 'bracket', startAtMs: 13000, durationMs: 6000, candleRef: 'last-1', color: '#1dd278', text: 'larger body', animateIn: 'draw' },
      { type: 'label', startAtMs: 20000, durationMs: 7000, candleRef: 'last-1', text: 'MOMENTUM SHIFTED', color: '#1dd278', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m2-l4', 2, 4, 'What Wicks Mean',
    "Every wick tells a story. A long upper wick means price tried to go higher, but got rejected — sellers came in hard and pushed it back down. A long lower wick means price tried to go lower but got rejected — buyers absorbed the selling. Short wicks mean there was conviction in the direction of the close. The key question to ask when you see any wick is: where is it pointing, and where is it coming from? A long lower wick coming from below a support level means buyers are defending that zone aggressively.",
    "Long wicks mean the market tried to go somewhere and got rejected. Always ask: where is the wick pointing?",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 3500, candleRef: 'last-4', color: '#ef4444', text: 'rejected here', animateIn: 'draw' },
      { type: 'label', startAtMs: 6000, durationMs: 4000, candleRef: 'last-4', text: 'UPPER WICK = REJECTION', color: '#ef4444', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 11000, durationMs: 3500, candleRef: 'last-2', color: '#1dd278', text: 'buyers here', animateIn: 'draw' },
      { type: 'label', startAtMs: 15000, durationMs: 4000, candleRef: 'last-2', text: 'LOWER WICK = SUPPORT', color: '#1dd278', animateIn: 'fade' },
      { type: 'label', startAtMs: 20000, durationMs: 8000, candleRef: 'last', text: 'WHERE is the wick pointing?', color: '#facc15', animateIn: 'pop' },
    ],
    32
  ),
];

const MODULE_2: AcademyModule = {
  id: 2, title: 'Reading Candles', tier: 1, tierName: 'RECRUIT',
  ariaIntroLine: "You can see price. Now I will teach you to read what every candle is actually saying.",
  lessons: MODULE_2_LESSONS,
  mission: mission('m2-mission', 2, 'Pattern Recognition',
    "I will highlight a candle pattern on the live chart. You must decide if it is bullish or bearish — if it signals buyers are in control or sellers. Then open a trade in that direction and hold it for at least 3 candles before closing.",
    [
      { id: 'correct-direction', description: 'Trade matches the highlighted pattern direction' },
      { id: 'held-3-candles', description: 'Hold the trade for at least 3 candles' },
    ],
    'checklist',
    "You read the pattern correctly and held your conviction. That is the foundation of every candlestick strategy ever created. Pattern recognition plus patience. You have both.",
    "The trade either went the wrong direction or was closed before 3 candles elapsed. Watch for the highlighted candle and trade its signal.",
    [
      "Look for the highlighted candle on the chart — it has a glowing border. Read the wick structure. Is it bullish or bearish?",
      "A long lower wick means buyers won — that is bullish. Open a BUY trade.",
      "A long upper wick means sellers won — that is bearish. Open a SELL trade.",
      "Once your trade is open, hold it. Do not panic if it dips. Let at least 3 candles form.",
      "Three candles is roughly 6 seconds in this simulator. Keep watching the counter in your mission panel.",
      "Trust the pattern. You identified it correctly. Now let the market confirm it.",
    ]
  ),
};

const MODULE_3_LESSONS: ARIALesson[] = [
  lesson('m3-l1', 3, 1, 'What is a Trend',
    "A trend is the market making consistent progress in one direction. An uptrend is a sequence of higher highs and higher lows. Each peak is higher than the last peak. Each pullback stops higher than the previous pullback. The market is stair-stepping upward. A downtrend is the opposite — lower highs and lower lows. Price is stair-stepping downward. The most important skill in trading is identifying which trend is currently in control before you ever consider entering a trade.",
    "An uptrend is a series of higher highs and higher lows. Price is making progress upward. Downtrend is the opposite.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 4000, candleRef: 'last-5', color: '#1dd278', text: 'HH', animateIn: 'draw' },
      { type: 'arrow', startAtMs: 6500, durationMs: 3500, candleRef: 'last-3', color: '#1dd278', text: 'HH', animateIn: 'draw' },
      { type: 'circle', startAtMs: 10500, durationMs: 4000, candleRef: 'last-4', color: '#94a3b8', animateIn: 'pop' },
      { type: 'label', startAtMs: 10500, durationMs: 3500, candleRef: 'last-4', text: 'HL', color: '#94a3b8', animateIn: 'pop' },
      { type: 'label', startAtMs: 15000, durationMs: 7000, candleRef: 'last', text: 'UPTREND: HH + HL', color: '#1dd278', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m3-l2', 3, 2, 'Market Structure',
    "Every market is built on structure. Higher highs and higher lows form an uptrend structure. Lower highs and lower lows form a downtrend structure. The labels HH, HL, LH, LL are the skeleton of every chart you will ever read. Before you enter any trade, you should be able to label at least the last three swing points. If you cannot label structure, you do not know where you are in the market. And if you do not know where you are, you cannot know where to enter.",
    "Structure is the skeleton of the market. Before every trade, identify the structure. It tells you who is in control.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 4000, candleRef: 'last-5', text: 'LH', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 4500, durationMs: 4000, candleRef: 'last-4', text: 'LL', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 7000, durationMs: 4000, candleRef: 'last-2', text: 'LH', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 9500, durationMs: 4000, candleRef: 'last', text: 'LL?', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 8000, candleRef: 'last', text: 'DOWNTREND STRUCTURE', color: '#ef4444', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m3-l3', 3, 3, 'Trend Reversal',
    "A trend reversal does not happen overnight — it happens when structure breaks. In an uptrend, a reversal begins when the market fails to make a higher high, and then breaks below the most recent higher low. That break is your warning. Price is no longer stepping upward. The buyers who have been in control are losing their grip. Watch for the break of a key structural level. That is the first sign the trend has changed.",
    "A trend reversal begins when structure breaks. A higher low that fails to form is your warning sign.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last-3', color: '#1dd278', animateIn: 'draw', text: 'last HL' },
      { type: 'circle', startAtMs: 6000, durationMs: 4000, candleRef: 'last-1', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 6500, durationMs: 4000, candleRef: 'last-1', text: 'STRUCTURE BREAK', color: '#ef4444', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 11000, durationMs: 4000, candleRef: 'last', color: '#ef4444', text: 'new direction?', animateIn: 'draw' },
      { type: 'label', startAtMs: 16000, durationMs: 8000, candleRef: 'last', text: 'WATCH FOR THIS', color: '#facc15', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m3-l4', 3, 4, 'Why Fighting the Trend is Fatal',
    "The trend is not your enemy. Fighting it is. When a strong uptrend is in place, every trade you sell into requires the entire market to be wrong. You are one person betting against the direction of every buyer who is currently in profit. The trend has momentum, and momentum carries. Trades against the trend have lower probability, smaller wins when right, and catastrophic losses when wrong. The professionals do not fight trends. They wait for them to end, then trade the new one.",
    "The trend is the most powerful force in the market. Every trade against it requires the trend to be wrong.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 4000, candleRef: 'last-4', color: '#1dd278', text: 'strong uptrend', animateIn: 'draw' },
      { type: 'crossout', startAtMs: 7000, durationMs: 4000, candleRef: 'last-2', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 7500, durationMs: 4000, candleRef: 'last-2', text: 'SELL = fighting trend', color: '#ef4444', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 12000, durationMs: 4000, candleRef: 'last', color: '#1dd278', text: 'trend continues', animateIn: 'draw' },
      { type: 'label', startAtMs: 17000, durationMs: 8000, candleRef: 'last', text: 'TRADE WITH IT, NOT AGAINST IT', color: '#1dd278', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_3: AcademyModule = {
  id: 3, title: 'Trend', tier: 1, tierName: 'RECRUIT',
  ariaIntroLine: "You can read individual candles. Now let me show you how they connect to form the most powerful force in trading.",
  lessons: MODULE_3_LESSONS,
  mission: mission('m3-mission', 3, 'Trend Alignment',
    "The market regime badge at the top of the chart shows the current condition. Wait until it shows UPTREND, then open a BUY trade. Hold it for a minimum of 5 candles. Close it in profit. I will tell you exactly what to watch for.",
    [
      { id: 'traded-in-uptrend', description: 'Opened BUY during UPTREND regime' },
      { id: 'held-5-candles', description: 'Held for at least 5 candles' },
      { id: 'closed-profit', description: 'Closed in profit' },
    ],
    'checklist',
    "You waited for the trend, traded with it, and held your conviction long enough to profit. That is the professional approach. Patience plus alignment. Every consistently profitable trader does exactly this.",
    "The trade either opened outside an uptrend, was closed too soon, or closed at a loss. Wait for UPTREND to show on the regime badge, then BUY and hold.",
    [
      "Watch the market regime badge. Wait patiently for it to show UPTREND before entering.",
      "When UPTREND appears, open a BUY trade. You are trading WITH the direction of momentum.",
      "After opening, count the candles. Each new candle that forms increments your hold counter.",
      "In an uptrend, price dips are normal. Do not panic and close early. Trust the structure.",
      "Five candles will take about 10 seconds in this simulator. Keep your trade open.",
      "Once you have held 5 candles and are in profit, close the trade. Mission complete.",
    ]
  ),
};

const MODULE_4_LESSONS: ARIALesson[] = [
  lesson('m4-l1', 4, 1, 'What is a Level',
    "A support or resistance level is a price area where the market has reacted multiple times. Watch the chart — see how price keeps coming back to the same zone and bouncing? Each touch at that area is evidence that both buyers and sellers recognize it as significant. The more times price has reacted at a level, the stronger that level is. Two touches makes it a level. Three touches makes it confirmed. Four or more makes it critical — when price reaches it again, pay close attention.",
    "A support or resistance level is a price area where the market has reacted before. More touches equals stronger level.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 5000, candleRef: 'last', priceDelta: -3, color: '#1dd278', animateIn: 'draw', text: 'support zone' },
      { type: 'circle', startAtMs: 7500, durationMs: 3500, candleRef: 'last-4', color: '#1dd278', animateIn: 'pop' },
      { type: 'circle', startAtMs: 11500, durationMs: 3500, candleRef: 'last-2', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 16000, durationMs: 5000, candleRef: 'last', text: 'MULTIPLE TOUCHES = STRONG', color: '#1dd278', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m4-l2', 4, 2, 'Support vs Resistance',
    "Support is a price floor — buyers step in every time price falls to this area. Resistance is a price ceiling — sellers step in every time price rises to this area. But here is the most important thing to understand: when price finally breaks through a level, the roles flip. Old resistance that is broken becomes new support. Old support that is broken becomes new resistance. This flip is called a role change, and it creates some of the highest-probability trading setups in all of price action.",
    "Resistance is a ceiling. Support is a floor. When price breaks through one, it often flips roles.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3500, candleRef: 'last', priceDelta: 3, color: '#ef4444', animateIn: 'draw', text: 'RESISTANCE' },
      { type: 'line', startAtMs: 6000, durationMs: 3500, candleRef: 'last', priceDelta: -3, color: '#1dd278', animateIn: 'draw', text: 'SUPPORT' },
      { type: 'arrow', startAtMs: 10000, durationMs: 4000, candleRef: 'last', color: '#facc15', text: 'break → role change', animateIn: 'draw' },
      { type: 'label', startAtMs: 15000, durationMs: 8000, candleRef: 'last', text: 'OLD RESISTANCE → NEW SUPPORT', color: '#facc15', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m4-l3', 4, 3, 'Zones Not Lines',
    "One of the most common mistakes new traders make is treating support and resistance as exact prices — as if price will always bounce at 1950.00 and never at 1949.95 or 1950.05. Markets do not work that way. Price reacts to zones. A zone is a price area, typically 5 to 20 pips wide depending on the asset, where there has been consistent reaction. When you draw a support line, draw it as a band. Trade the zone. If you wait for the exact price and miss it by 3 pips, you will miss the trade. Zones give you flexibility and accuracy.",
    "Levels are not laser lines. They are zones. Trade the zone, not the line.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last', priceDelta: -2.5, color: '#ef4444', animateIn: 'draw', text: 'too precise' },
      { type: 'crossout', startAtMs: 5500, durationMs: 2500, candleRef: 'last', color: '#ef4444', animateIn: 'draw' },
      { type: 'band', startAtMs: 9000, durationMs: 6000, candleRef: 'last', priceDelta: -3, color: 'rgba(29,210,120,0.2)', animateIn: 'fade', text: 'zone' },
      { type: 'label', startAtMs: 15000, durationMs: 8000, candleRef: 'last', text: 'TRADE THE ZONE', color: '#1dd278', animateIn: 'pop' },
    ],
    28
  ),
  lesson('m4-l4', 4, 4, 'Trading From a Level',
    "The highest probability entries in price action come when three things align: price returns to a level it has respected before, a rejection candle forms at that level, and you enter in the direction of the rejection. You are not guessing. You have a level with proven history, a candle proving that the level is still active, and an entry with defined risk just on the other side of the level. This is structure plus confirmation. This is how professionals enter the market.",
    "The highest probability entries happen when price returns to a proven level and shows rejection. Wait for it. Then enter.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3500, candleRef: 'last', priceDelta: -2, color: '#1dd278', animateIn: 'draw', text: 'support zone' },
      { type: 'circle', startAtMs: 6000, durationMs: 4000, candleRef: 'last-1', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 6500, durationMs: 4000, candleRef: 'last-1', text: 'rejection candle', color: '#facc15', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 11000, durationMs: 4000, candleRef: 'last', color: '#1dd278', text: 'entry here', animateIn: 'draw' },
      { type: 'label', startAtMs: 16000, durationMs: 8000, candleRef: 'last', text: 'LEVEL + REJECTION = ENTRY', color: '#1dd278', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_4: AcademyModule = {
  id: 4, title: 'Support and Resistance', tier: 1, tierName: 'RECRUIT',
  ariaIntroLine: "Structure tells you the trend. Levels tell you where to trade it. This is where your edge begins.",
  lessons: MODULE_4_LESSONS,
  mission: mission('m4-mission', 4, 'Level Entry',
    "The chart shows active support and resistance zones as colored lines. Open a trade within 5 pips of one of those zones. Your stop loss must be placed on the other side of the zone. I will highlight the valid entry zones with pulsing indicators.",
    [
      { id: 'entered-near-zone', description: 'Entered within 5 pips of an S/R zone' },
      { id: 'sl-across-zone', description: 'Stop loss set on the other side of the zone' },
    ],
    'checklist',
    "You entered at a proven level with a stop on the other side. That is not just a trade — that is a trade plan. Level, entry, stop, reasoning. You now have all four pieces of the puzzle.",
    "Entry was too far from the nearest S/R zone, or no stop loss was placed across the zone. Look for the pulsing zone lines and enter within 5 pips with your stop just beyond the zone.",
    [
      "Look at the colored horizontal lines on the chart — those are the active S/R zones. Green is support. Red is resistance.",
      "To buy from support: wait for price to approach the green zone within 5 pips. Then enter BUY with stop loss just below the zone.",
      "To sell from resistance: wait for price near the red zone within 5 pips. Then enter SELL with stop loss just above the zone.",
      "Your stop loss must be on the OPPOSITE side of the zone from your entry. This is what defines the zone as valid or broken.",
      "The zone lines pulse when price is within range. Watch for the pulse to know when to act.",
      "One clean trade from a level with a proper stop. That is all this mission requires.",
    ]
  ),
};

const MODULE_5_LESSONS: ARIALesson[] = [
  lesson('m5-l1', 5, 1, 'What is a Stop Loss',
    "A stop loss is your exit when you are wrong. It is a pre-determined price level where your trade closes automatically, capping your loss before it can grow. Watch this: without a stop loss, a trade that goes against you never has a reason to close. Price can fall 50 pips, 100 pips, 500 pips — and your account falls with it. With a stop loss, you defined your maximum loss before you even entered. You knew your risk. That is not timidity — that is precision. Every single professional trader uses stop losses on every single trade, without exception.",
    "A stop loss is your exit when you are wrong. Every professional uses one on every single trade. No exceptions.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last', priceDelta: -3, color: '#ef4444', animateIn: 'draw', text: 'STOP LOSS' },
      { type: 'arrow', startAtMs: 6000, durationMs: 4000, candleRef: 'last', color: '#ef4444', text: 'auto-closes here', animateIn: 'draw' },
      { type: 'label', startAtMs: 11000, durationMs: 5000, candleRef: 'last', text: 'MAXIMUM LOSS DEFINED', color: '#ef4444', animateIn: 'fade' },
      { type: 'crossout', startAtMs: 17000, durationMs: 4000, candleRef: 'last', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 17500, durationMs: 7000, candleRef: 'last', text: 'No SL = no control', color: '#ef4444', animateIn: 'pop' },
    ],
    30
  ),
  lesson('m5-l2', 5, 2, 'What is a Take Profit',
    "A take profit is your exit when you are right. It is a price level where your trade closes automatically, locking in your gain before the market can take it back. Without a take profit, you are relying on your discipline to close a winning trade. And when you are watching a trade move in your favor, the hardest thing in the world is to press Close at the right moment. Your emotions will say hold on for more. Often, price reverses. A take profit removes that decision entirely. Set it before you enter, and let the plan execute without you.",
    "A take profit locks in your gain automatically. Set it and let the plan execute.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last', priceDelta: 3, color: '#1dd278', animateIn: 'draw', text: 'TAKE PROFIT' },
      { type: 'arrow', startAtMs: 6000, durationMs: 4000, candleRef: 'last', color: '#1dd278', text: 'auto-closes in profit', animateIn: 'draw' },
      { type: 'label', startAtMs: 11000, durationMs: 5000, candleRef: 'last', text: 'GAIN LOCKED', color: '#1dd278', animateIn: 'fade' },
      { type: 'label', startAtMs: 17000, durationMs: 8000, candleRef: 'last', text: 'Plan executes. Emotions irrelevant.', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m5-l3', 5, 3, 'R:R Ratio Explained',
    "R:R stands for Risk to Reward. It measures how much you make when right compared to how much you lose when wrong. At 1:1 R:R, you risk $100 and make $100. You need to be right more than 50% of the time to be profitable. At 2:1 R:R, you risk $100 and make $200. You only need to be right 34% of the time to be profitable. At 3:1, you need to be right only 25% of the time. This is the edge. A trader with a 2:1 R:R and a 50% win rate will always make money over time. Protect this number on every single trade.",
    "R:R is how much you make vs how much you risk. At 2:1, you only need to be right 34% of the time to profit.",
    [
      { type: 'bracket', startAtMs: 2000, durationMs: 4000, candleRef: 'last', color: '#ef4444', text: 'RISK 1R', animateIn: 'draw' },
      { type: 'bracket', startAtMs: 7000, durationMs: 4000, candleRef: 'last', color: '#1dd278', text: 'REWARD 2R', animateIn: 'draw' },
      { type: 'label', startAtMs: 12000, durationMs: 5000, candleRef: 'last', text: '2:1 R:R = 34% win rate needed', color: '#00d4aa', animateIn: 'fade' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last', text: 'PROTECT THIS NUMBER', color: '#facc15', animateIn: 'pop' },
    ],
    28
  ),
  lesson('m5-l4', 5, 4, 'The Math of 2:1 Over 100 Trades',
    "Let us run the numbers. Over 100 trades at exactly 2:1 R:R with a 50% win rate. You win 50 trades at 2 units each — that is 100 units gained. You lose 50 trades at 1 unit each — that is 50 units lost. Net profit: 50 units, before any fees. You were wrong exactly half the time. You made money anyway. This is the power of having an edge defined by R:R. It means your long-term profitability does not depend on being right most of the time. It depends on consistently trading at 2:1 or better.",
    "At 2:1 R:R with a 50% win rate, you are profitable over time. This is the edge. Protect it on every trade.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last', text: '50 wins × 2R = +100R', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last', text: '50 losses × 1R = -50R', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 6000, candleRef: 'last', text: 'Net: +50R profit', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 21000, durationMs: 7000, candleRef: 'last', text: 'Wrong 50% of the time. Still profitable.', color: '#facc15', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_5: AcademyModule = {
  id: 5, title: 'Your First Real Setup', tier: 2, tierName: 'TRADER',
  ariaIntroLine: "You can read the market. Now I will teach you how to trade it without destroying your account.",
  lessons: MODULE_5_LESSONS,
  mission: mission('m5-mission', 5, 'The Complete Trade Plan',
    "Enter a trade with both a stop loss AND a take profit set before submitting. The take profit must be at least 2 times the distance of the stop loss from your entry. I will check the R:R ratio before allowing the trade to proceed.",
    [
      { id: 'has-stop-loss', description: 'Stop loss set before entry' },
      { id: 'has-take-profit', description: 'Take profit set before entry' },
      { id: 'rr-2-to-1', description: 'R:R ratio is at least 2:1' },
    ],
    'checklist',
    "You entered with a full trade plan: entry, stop, and target at 2:1. That is what separates traders who survive from those who do not. You are building the right habits from the start.",
    "The trade was submitted without proper SL, TP, or 2:1 R:R. Set your stop loss first, then set your take profit at twice the distance. Check the R:R display before submitting.",
    [
      "Set your stop loss FIRST. It goes in the Stop Loss field below the chart. Place it where the trade idea is proven wrong.",
      "Now set your take profit. It must be at least 2x further from your entry than the stop loss.",
      "Check the R:R display — it updates live as you type. It must show 2.0 or higher.",
      "The BUY or SELL button will be enabled once all three criteria are met.",
      "The distance matters, not the specific price. If SL is 10 pips away, TP must be at least 20 pips away.",
      "Both lines will appear on the chart as dashed lines once set. Confirm they are where you intended before submitting.",
    ]
  ),
};

const MODULE_6_LESSONS: ARIALesson[] = [
  lesson('m6-l1', 6, 1, 'What is a Lot',
    "A lot is the size of your trade — how many units of the asset you are buying or selling. A standard lot on Gold equals 100 units. A mini lot is 0.1 — ten times smaller. A micro lot is 0.01 — one hundred times smaller. The key number is pip value. At 0.01 lot size in this simulator, each pip of movement equals $0.01 in profit or loss. At 0.1 lots, each pip is $0.10. At 1.0 lot, each pip is $1.00. Your lot size directly determines how much every pip of price movement costs you.",
    "A lot is the size of your trade. Your lot size determines how much every pip of movement is worth.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last', text: '0.01 lot = $0.01 per pip', color: '#94a3b8', animateIn: 'pop' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last', text: '0.10 lot = $0.10 per pip', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 5000, candleRef: 'last', text: '1.00 lot = $1.00 per pip', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 20000, durationMs: 8000, candleRef: 'last', text: 'Size determines risk', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m6-l2', 6, 2, 'The 1% Rule',
    "The 1% rule is this: never risk more than 1% of your account balance on any single trade. On a $10,000 account, that is $100 maximum risk per trade. This is not a suggestion. This is the single most important rule in trading. It means a losing streak of 10 trades — which will happen — only costs you about 10% of your account. You survive to trade again. Without this rule, five bad trades can take half your account. Ten can take it all. The 1% rule is the difference between staying in the game and blowing out.",
    "Never risk more than 1% of your account on a single trade. This is not optional. This is survival.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 5000, candleRef: 'last', color: '#00d4aa', animateIn: 'pop' },
      { type: 'label', startAtMs: 3000, durationMs: 5000, candleRef: 'last', text: '$10,000 balance', color: '#94a3b8', animateIn: 'fade' },
      { type: 'label', startAtMs: 9000, durationMs: 5000, candleRef: 'last', text: '1% = $100 max risk', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 15000, durationMs: 5000, candleRef: 'last', text: '10 losses = -10% account', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 21000, durationMs: 7000, candleRef: 'last', text: 'STAY IN THE GAME', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m6-l3', 6, 3, 'Calculating Lot Size',
    "Here is the formula every professional uses to size every trade. Step one: decide your risk in dollars — use 1% of balance. Step two: measure your stop loss distance in pips. Step three: divide risk by stop loss pips to get lot size. Example: $100 risk, 20 pip stop loss. $100 divided by 20 equals 5. But since each pip at 0.01 lots is $0.01, lot size equals $100 divided by (20 pips times 1 dollar per pip at standard lot) equals 0.10 lots. Your lot size is determined entirely by where your stop loss is — not by how confident you feel.",
    "Your lot size is determined by your stop loss distance, not by how confident you feel.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last', text: 'Step 1: Risk = 1% of balance', color: '#00d4aa', animateIn: 'pop' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last', text: 'Step 2: Count SL pips', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 5000, candleRef: 'last', text: 'Step 3: Risk ÷ SL pips = lot size', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 20000, durationMs: 7000, candleRef: 'last', text: 'FORMULA FIRST. ALWAYS.', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m6-l4', 6, 4, 'Drawdown Compounding',
    "Here is a mathematical reality that destroys undisciplined traders. Losing 10% of $10,000 leaves $9,000. Losing another 10% leaves $8,100. Each percentage loss comes from a smaller base. To recover from a 50% drawdown, you need a 100% gain. Recovery is always harder than the loss. But look at what happens with 1% risk per trade: 10 consecutive losses cost you 9.6% of your account. You have $9,040 left. You are still alive. You can still trade. Drawdown compounding is why survival matters more than wins.",
    "Losing 10 trades in a row happens to every trader. The question is whether your account survives it.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last', text: '10 losses at 5% = -41% account', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last', text: '10 losses at 1% = -9.6% account', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 5000, candleRef: 'last', text: '50% loss = need 100% to recover', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 20000, durationMs: 8000, candleRef: 'last', text: 'SMALL RISK = SURVIVAL', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_6: AcademyModule = {
  id: 6, title: 'Position Sizing', tier: 2, tierName: 'TRADER',
  ariaIntroLine: "The market will give you losers. Position sizing determines whether losers are lessons or catastrophes.",
  lessons: MODULE_6_LESSONS,
  mission: mission('m6-mission', 6, 'Three Disciplined Trades',
    "Complete 3 consecutive trades. Every trade must have a stop loss set. Every trade must risk under 1.5% of your current balance. If any trade breaks either rule, the counter resets to zero and I will explain exactly what went wrong.",
    [
      { id: 'consecutive-1', description: 'Trade 1: Stop loss set, risk under 1.5%' },
      { id: 'consecutive-2', description: 'Trade 2: Stop loss set, risk under 1.5%' },
      { id: 'consecutive-3', description: 'Trade 3: Stop loss set, risk under 1.5%' },
    ],
    'checklist',
    "Three consecutive trades, every one with a stop loss and disciplined risk. That is not luck — that is a habit forming. The most important thing you can build in trading is repeatable discipline. You just demonstrated it three times in a row.",
    "A trade was submitted without a stop loss or with risk exceeding 1.5% of balance. Reset and try again. Three clean trades.",
    [
      "Set your stop loss for every trade. Without it, this mission automatically resets.",
      "Check your lot size before submitting. Keep risk under 1.5% of your current balance.",
      "With a $10,000 balance, max risk is $150. Use small lot sizes with wider stops or micro lots with tighter stops.",
      "Each trade that meets both rules increments your counter. Three in a row completes the mission.",
      "If you break a rule, I will tell you exactly which rule and why. Then you start from zero again.",
      "Consistency is the goal here. Not winning. Three disciplined trades regardless of outcome.",
    ]
  ),
};

const MODULE_7_LESSONS: ARIALesson[] = [
  lesson('m7-l1', 7, 1, 'Anticipation vs Confirmation',
    "Anticipation is entering a trade before the candle that gives you the signal has finished forming. Confirmation is waiting for that candle to fully close before entering. Anticipation feels smart — you get a better price, you are ahead of everyone else. But a candle that looks like a hammer with 5 seconds left can close as a doji. A candle that looks like a breakout can wick back through the level. Confirmation is slower. It costs you a slightly worse price. But it means your signal actually materialized before you acted on it. Confirmation wins long term.",
    "Anticipation feels smart. It is usually wrong. Confirmation is slower. It is usually right.",
    [
      { type: 'crossout', startAtMs: 2000, durationMs: 4000, candleRef: 'last-1', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-1', text: 'ANTICIPATION', color: '#ef4444', animateIn: 'pop' },
      { type: 'circle', startAtMs: 7500, durationMs: 4000, candleRef: 'last', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 8000, durationMs: 4000, candleRef: 'last', text: 'CONFIRMATION', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 13000, durationMs: 8000, candleRef: 'last', text: 'Wait for the candle to CLOSE', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m7-l2', 7, 2, 'The Confirmation Candle',
    "The confirmation candle is the candle that closes on the right side of a level — fully, with a proper body, not just a wick poke. If you want to buy a breakout above resistance, wait for a candle to close above the resistance line with at least 60% of its body above the line. That close is commitment. That close is evidence. A wick through a level is not confirmation — it is a test. Many tests fail. Closes commit. You enter on the close, and you set your stop on the other side of the level.",
    "Wait for the candle to CLOSE, not just touch. A close is a commitment. A touch is a test.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last', priceDelta: 2, color: '#ef4444', animateIn: 'draw', text: 'resistance' },
      { type: 'label', startAtMs: 6000, durationMs: 4000, candleRef: 'last-1', text: 'WICK TOUCH = not confirmed', color: '#ef4444', animateIn: 'fade' },
      { type: 'circle', startAtMs: 11000, durationMs: 4000, candleRef: 'last', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 11500, durationMs: 4000, candleRef: 'last', text: 'CLOSE ABOVE = confirmed', color: '#1dd278', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 16000, durationMs: 4000, candleRef: 'last', color: '#00d4aa', text: 'ENTER HERE', animateIn: 'draw' },
    ],
    28
  ),
  lesson('m7-l3', 7, 3, 'Pullback Entries',
    "The initial breakout spike is not the best entry. It never is. Price breaks a level fast, everyone piles in at once, and then the initial momentum exhausts. Price pulls back to retest the broken level. This retest is your entry. Why? Because your stop loss is tighter — it goes just on the other side of the retested level. Your risk is smaller. Your entry price is better. The market has already proven the breakout is valid. You are entering on a confirmation of a confirmation. This is the professional approach to breakout trading.",
    "The best entry after a breakout is during the retest. Lower risk, higher reward, cleaner entry.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 3500, candleRef: 'last-3', color: '#facc15', text: 'breakout', animateIn: 'draw' },
      { type: 'arrow', startAtMs: 6000, durationMs: 3500, candleRef: 'last-1', color: '#94a3b8', text: 'pullback retest', animateIn: 'draw' },
      { type: 'circle', startAtMs: 10000, durationMs: 4000, candleRef: 'last', color: '#1dd278', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 10500, durationMs: 4000, candleRef: 'last', color: '#1dd278', text: 'ENTER HERE', animateIn: 'draw' },
      { type: 'label', startAtMs: 15000, durationMs: 8000, candleRef: 'last', text: 'WAIT FOR THE RETEST', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m7-l4', 7, 4, 'Patience as a Skill',
    "The best traders in the world make 3 to 5 high-quality trades per week. Not 30. Not 50. Three to five. In between those trades, they watch, they wait, they analyze, and they do nothing. Patience is not passive — it is active discipline. Every time you do NOT take a low-quality trade, you are making a decision that protects your account. The trades you skip are often the ones that would have hurt you most. Patience is the skill that keeps all your other skills intact.",
    "The best traders are defined as much by the trades they do not take as by the ones they do.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last-4', text: 'Skipped — no setup', color: '#94a3b8', animateIn: 'fade' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last-2', text: 'Skipped — no setup', color: '#94a3b8', animateIn: 'fade' },
      { type: 'circle', startAtMs: 14000, durationMs: 4000, candleRef: 'last', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 14500, durationMs: 4000, candleRef: 'last', text: 'TAKEN — clean setup', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 20000, durationMs: 8000, candleRef: 'last', text: 'PATIENCE IS A SKILL', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_7: AcademyModule = {
  id: 7, title: 'Entry Timing', tier: 2, tierName: 'TRADER',
  ariaIntroLine: "Knowing where to trade is half the job. Knowing WHEN is the other half. Most traders only learn one.",
  lessons: MODULE_7_LESSONS,
  mission: mission('m7-mission', 7, 'Breakout with Confirmation',
    "Wait for a candle to fully close above a resistance zone or below a support zone on the chart. Then enter in the breakout direction within 2 candles of that close. Set your stop loss on the other side of the zone. Take profit at 2:1.",
    [
      { id: 'entered-on-close', description: 'Entered within 2 candles of zone breakout close' },
      { id: 'sl-across-zone', description: 'Stop loss on other side of the zone' },
      { id: 'tp-2r', description: 'Take profit at 2:1 minimum' },
    ],
    'checklist',
    "You waited for confirmation, entered at the right moment, and structured the trade properly. Breakout plus confirmation plus structure. That is a complete trade thesis.",
    "No qualifying breakout entry detected. Wait for a candle close above resistance or below support, then enter within 2 candles with proper SL and TP.",
    [
      "Watch the resistance zones (red lines) and support zones (green lines) on the chart.",
      "When a candle CLOSES fully on the other side of a zone, that is your signal. Start the countdown — you have 2 candles to enter.",
      "Enter in the direction of the breakout. Upward break of resistance → BUY. Downward break of support → SELL.",
      "Stop loss goes back inside the zone — just on the other side from your entry.",
      "Take profit must be at least 2 times the stop loss distance. Check the R:R display.",
      "If a breakout happens and price immediately reverses (false breakout), do not chase it. Wait for the next setup.",
    ]
  ),
};

const MODULE_8_LESSONS: ARIALesson[] = [
  lesson('m8-l1', 8, 1, 'What is an EMA',
    "An Exponential Moving Average is a line that follows price, giving more weight to recent candles. On this chart you can see the EMA 9 in yellow and the EMA 21 in purple. They smooth out the noise of individual candles and show you the underlying direction of momentum. When the EMA is sloping upward, momentum is bullish. When it slopes downward, momentum is bearish. The EMA does not predict the future — it describes the present direction of price flow.",
    "An EMA tracks the average price weighted toward recent candles. It tells you the current direction of momentum.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last', text: 'EMA 9 — yellow line', color: '#facc15', animateIn: 'fade' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last', text: 'EMA 21 — purple line', color: '#c084fc', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 14000, durationMs: 4000, candleRef: 'last', color: '#00d4aa', text: 'slope = momentum direction', animateIn: 'draw' },
      { type: 'label', startAtMs: 19000, durationMs: 8000, candleRef: 'last', text: 'EMA = direction of flow', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m8-l2', 8, 2, 'EMA as Dynamic Support',
    "In a strong uptrend, the EMA acts as a moving support line. Price rallies, then pulls back to the EMA, finds buyers there, and continues higher. This happens because the EMA represents the average cost basis of recent traders. When price falls to the EMA, value-seekers step in. Watch the chart — see how often price touches the EMA 21 and bounces in a trending environment. These EMA pullback setups are among the cleanest entries in a trend — you have direction, a defined entry area, and a tight stop just below the EMA.",
    "In a strong trend, the EMA acts as moving support. Price pulls back to it, respects it, and continues.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 3500, candleRef: 'last-4', color: '#c084fc', animateIn: 'pop' },
      { type: 'label', startAtMs: 2500, durationMs: 3000, candleRef: 'last-4', text: 'bounce 1', color: '#c084fc', animateIn: 'fade' },
      { type: 'circle', startAtMs: 6500, durationMs: 3500, candleRef: 'last-2', color: '#c084fc', animateIn: 'pop' },
      { type: 'label', startAtMs: 7000, durationMs: 3000, candleRef: 'last-2', text: 'bounce 2', color: '#c084fc', animateIn: 'fade' },
      { type: 'label', startAtMs: 11000, durationMs: 6000, candleRef: 'last', text: 'PULLBACK TO EMA = ENTRY ZONE', color: '#00d4aa', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 17000, durationMs: 4000, candleRef: 'last', color: '#00d4aa', text: 'stop below EMA', animateIn: 'draw' },
    ],
    28
  ),
  lesson('m8-l3', 8, 3, 'EMA 9 and EMA 21 Crossover',
    "When the EMA 9 crosses above the EMA 21, it means short-term momentum has shifted bullish. This is called a Golden Cross. When the EMA 9 crosses below the EMA 21, short-term momentum has shifted bearish. This is called a Death Cross. These crossovers are momentum signals — they confirm that the recent trend has enough force to be moving faster than the longer average. Watch the two lines on the chart and notice how they behave before and after crossovers.",
    "When the faster EMA crosses the slower one, momentum has shifted. This is your trend filter.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 4000, candleRef: 'last-3', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-3', text: 'GOLDEN CROSS', color: '#facc15', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 7000, durationMs: 4000, candleRef: 'last-3', color: '#1dd278', text: 'bullish momentum', animateIn: 'draw' },
      { type: 'label', startAtMs: 12000, durationMs: 5000, candleRef: 'last', text: 'Death Cross = bearish shift', color: '#ef4444', animateIn: 'fade' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last', text: 'CROSSOVER = MOMENTUM SHIFT', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m8-l4', 8, 4, 'EMA as a Filter, Not a Signal',
    "The biggest mistake traders make with EMAs is treating a crossover as an automatic buy or sell signal. It is not. The crossover tells you the direction of momentum. It does not tell you where to enter. Use EMA direction as a filter: only take BUY trades when EMA 9 is above EMA 21. Only take SELL trades when EMA 9 is below EMA 21. Then wait for price action to give you an entry — a pullback, a pattern, a level. The EMA filters the direction. Price action provides the entry.",
    "Never trade just because EMAs crossed. Use the crossover to confirm trend, then wait for a price action entry.",
    [
      { type: 'crossout', startAtMs: 2000, durationMs: 3500, candleRef: 'last-2', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 2500, durationMs: 3000, candleRef: 'last-2', text: 'crossover alone = not enough', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 7000, durationMs: 5000, candleRef: 'last', text: 'EMA above → only BUY setups', color: '#1dd278', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 13000, durationMs: 4000, candleRef: 'last', color: '#00d4aa', text: 'then wait for price action', animateIn: 'draw' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last', text: 'FILTER + PRICE ACTION = EDGE', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
];

const MODULE_8: AcademyModule = {
  id: 8, title: 'Moving Averages', tier: 2, tierName: 'TRADER',
  ariaIntroLine: "Candles are the story. Moving averages are the theme. They tell you the chapter you are currently in.",
  lessons: MODULE_8_LESSONS,
  mission: mission('m8-mission', 8, 'EMA Alignment Trade',
    "Open a BUY trade only when EMA 9 is above EMA 21 on the live chart. Your entry must be on a pullback toward EMA 21 or EMA 9. Stop loss must be placed below the nearest EMA. I will indicate when the setup is valid with a pulsing annotation on the chart.",
    [
      { id: 'ema-bullish-aligned', description: 'EMA 9 above EMA 21 at entry' },
      { id: 'entered-pullback', description: 'Entered during price pullback to EMA zone' },
      { id: 'sl-below-ema', description: 'Stop loss placed below the nearest EMA' },
    ],
    'checklist',
    "EMA alignment confirmed, pullback entry executed, stop below the EMA. That is the textbook institutional entry. You did not chase. You waited for price to return to value. That is the professional approach to trend trading.",
    "Entry did not meet EMA criteria. EMA 9 must be above EMA 21 when you buy, and you must enter during a pullback toward the EMAs, not at a high.",
    [
      "Watch the two EMA lines on the chart. Yellow is EMA 9. Purple is EMA 21. Wait for yellow to be above purple.",
      "When EMAs are correctly aligned (9 above 21), watch for price to pull back DOWN toward the EMA lines.",
      "That pullback is your entry zone. Enter BUY when price touches or nears the EMA 9 or EMA 21.",
      "Set your stop loss BELOW the EMA 21 line — if price closes below EMA 21, the bullish structure is broken.",
      "Do not enter when price is above both EMAs and still rising. Wait for the pullback first.",
      "The mission panel shows EMA alignment status in real time. Watch it before you enter.",
    ]
  ),
};

const MODULE_9_LESSONS: ARIALesson[] = [
  lesson('m9-l1', 9, 1, 'What is RSI',
    "RSI stands for Relative Strength Index. It is a momentum indicator that measures how fast and how far price has moved. It oscillates between 0 and 100. Above 70 means the asset is overbought — it has moved up too fast and may be due for a pullback. Below 30 means oversold — it has moved down too fast and may bounce. The middle zone around 50 is neutral. RSI does not tell you where price will go — it tells you how much momentum is behind the current move.",
    "RSI measures momentum — how fast and how far price has moved. Above 70 is overbought. Below 30 is oversold.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 5000, candleRef: 'last', text: 'RSI above 70 = overbought', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 8000, durationMs: 5000, candleRef: 'last', text: 'RSI below 30 = oversold', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 5000, candleRef: 'last', text: 'RSI at 50 = neutral', color: '#94a3b8', animateIn: 'fade' },
      { type: 'label', startAtMs: 20000, durationMs: 7000, candleRef: 'last', text: 'MOMENTUM, NOT DIRECTION', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m9-l2', 9, 2, 'Overbought and Oversold',
    "Overbought does not mean sell immediately. Oversold does not mean buy immediately. These are signals that momentum may be exhausting — not that reversal is certain. Price can stay overbought for many candles in a strong trend. The correct use of overbought and oversold readings is as a caution flag. If you want to buy and RSI is at 78, wait. The risk-reward of buying into extreme momentum is poor. If you want to sell and RSI is at 25, wait for price confirmation first — a rejection candle, a structure break — before entering.",
    "Extreme RSI readings mean the move may be exhausted. Wait for price confirmation before acting.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 4000, candleRef: 'last-3', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-3', text: 'RSI 78 — exhausted', color: '#ef4444', animateIn: 'fade' },
      { type: 'arrow', startAtMs: 7000, durationMs: 3500, candleRef: 'last-2', color: '#facc15', text: 'price reversed after', animateIn: 'draw' },
      { type: 'label', startAtMs: 11500, durationMs: 5000, candleRef: 'last', text: 'WAIT FOR CONFIRMATION', color: '#facc15', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m9-l3', 9, 3, 'RSI Divergence',
    "Divergence is when price and RSI disagree. Price makes a new high, but RSI makes a lower high than the previous peak. This means: the price went higher, but it took less momentum to get there. The move is weakening. Bearish divergence at resistance is one of the highest-probability reversal signals you can find. Bullish divergence works the same way in reverse — price makes a lower low while RSI makes a higher low, showing that selling momentum is fading even though price is still falling.",
    "Divergence is when price and RSI disagree. Price goes higher but RSI goes lower — momentum is fading.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 4000, candleRef: 'last-3', color: '#ef4444', text: 'price: new HIGH', animateIn: 'draw' },
      { type: 'label', startAtMs: 7000, durationMs: 4000, candleRef: 'last-3', text: 'RSI: lower HIGH', color: '#facc15', animateIn: 'pop' },
      { type: 'circle', startAtMs: 12000, durationMs: 4000, candleRef: 'last-2', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 12500, durationMs: 4000, candleRef: 'last-2', text: 'DIVERGENCE = warning', color: '#ef4444', animateIn: 'fade' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last', text: 'MOMENTUM FADING', color: '#facc15', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m9-l4', 9, 4, 'RSI as a Filter',
    "The most effective way to use RSI is as a filter that confirms or rejects your entry. You do not need RSI to find entries — price action does that. But before you pull the trigger, check RSI. If you want to BUY and RSI is at 42 and rising, that is confluence — momentum is building in your direction. If you want to BUY and RSI is at 78, wait — momentum is overextended and a pullback is likely. RSI as a filter removes many bad entries before they happen.",
    "Use RSI to confirm or reject entries. If you want to buy and RSI is at 78, wait. If RSI is at 42 and rising, that is confluence.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 4000, candleRef: 'last-2', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-2', text: 'RSI 42 rising — BUY OK', color: '#1dd278', animateIn: 'fade' },
      { type: 'crossout', startAtMs: 8000, durationMs: 3500, candleRef: 'last', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 8500, durationMs: 4000, candleRef: 'last', text: 'RSI 78 — wait, not yet', color: '#ef4444', animateIn: 'fade' },
      { type: 'label', startAtMs: 14000, durationMs: 8000, candleRef: 'last', text: 'RSI = FILTER, NOT SIGNAL', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
];

const MODULE_9: AcademyModule = {
  id: 9, title: 'RSI', tier: 2, tierName: 'TRADER',
  ariaIntroLine: "Price tells you where. RSI tells you how fast. Together, they tell you whether the move is real.",
  lessons: MODULE_9_LESSONS,
  mission: mission('m9-mission', 9, 'RSI-Filtered Entries',
    "Open 2 trades with stop losses that both close in profit. At each entry, RSI must not be in the opposite extreme. No buying when RSI is above 65. No selling when RSI is below 35. Both trades must close in profit.",
    [
      { id: 'first-trade-rsi-ok', description: 'Trade 1: RSI not in opposite extreme at entry' },
      { id: 'first-trade-profit', description: 'Trade 1: closed in profit' },
      { id: 'second-trade-rsi-ok', description: 'Trade 2: RSI not in opposite extreme at entry' },
      { id: 'second-trade-profit', description: 'Trade 2: closed in profit' },
    ],
    'checklist',
    "Two RSI-filtered trades, both profitable, both disciplined. You did not chase overbought entries. You waited for favorable RSI conditions. That is the mark of a trader who understands edge.",
    "Either the RSI condition was violated at entry, or a trade closed at a loss. Check RSI before each entry and only trade when momentum is in your favor.",
    [
      "Check the RSI indicator on the chart before entering any trade.",
      "To BUY: RSI must be below 65. Ideally between 40 and 60 and rising.",
      "To SELL: RSI must be above 35. Ideally between 40 and 60 and falling.",
      "If RSI is too extreme in the wrong direction, wait. Let it cool down before entering.",
      "Both trades need stop losses set before entry.",
      "Quality setups with proper RSI readings and patience. Both trades must profit.",
    ]
  ),
};

const MODULE_10_LESSONS: ARIALesson[] = [
  lesson('m10-l1', 10, 1, 'What is a Breakout',
    "A breakout is when price escapes from a range or level it has been respecting, breaking through with conviction and momentum. Watch the chart: price consolidates, building tension between buyers and sellers, then one side overwhelms the other and price moves fast. Breakouts release compressed energy. The longer the consolidation before the break, the more explosive the move after it. Breakouts are among the most powerful price moves you will ever trade — but they also attract the most traps.",
    "A breakout is when price escapes a level it has been respecting. This releases trapped energy — the move can be fast.",
    [
      { type: 'band', startAtMs: 2000, durationMs: 5000, candleRef: 'last', priceDelta: 2, color: 'rgba(255,200,50,0.15)', animateIn: 'fade', text: 'consolidation' },
      { type: 'arrow', startAtMs: 8000, durationMs: 4000, candleRef: 'last', color: '#facc15', text: 'BREAKOUT', animateIn: 'draw' },
      { type: 'label', startAtMs: 13000, durationMs: 5000, candleRef: 'last', text: 'compressed energy released', color: '#facc15', animateIn: 'fade' },
      { type: 'label', startAtMs: 19000, durationMs: 8000, candleRef: 'last', text: 'LONGER RANGE = BIGGER BREAK', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m10-l2', 10, 2, 'False Breakouts',
    "The false breakout is the most common trap in trading. Price spikes through a key level, triggering stop losses from the losing side and luring breakout traders in, then immediately reverses back below the level. The spike is not a breakout — it is a hunt for liquidity. The tell is always the candle: a wick that pierces the level without a full-body close on the other side is a false breakout signal. This is why candle close confirmation is non-negotiable. A wick is a test. A body close is a breakout.",
    "False breakouts are traps. Price spikes through a level to trigger stops, then reverses. Wait for a candle close.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 3500, candleRef: 'last-2', color: '#ef4444', text: 'spike through level', animateIn: 'draw' },
      { type: 'crossout', startAtMs: 6000, durationMs: 3500, candleRef: 'last-2', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 6500, durationMs: 4000, candleRef: 'last-2', text: 'FALSE BREAKOUT', color: '#ef4444', animateIn: 'pop' },
      { type: 'circle', startAtMs: 11000, durationMs: 4000, candleRef: 'last', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 11500, durationMs: 4000, candleRef: 'last', text: 'wick = test, not confirmation', color: '#facc15', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m10-l3', 10, 3, 'The Retest',
    "After a real breakout, price often returns to the broken level for a retest. This is not weakness — it is the market testing whether the broken level holds as new support or resistance. If it holds, the breakout is confirmed and the move continues. If it fails, the breakout was false. The retest entry is superior to the initial breakout entry for one key reason: your stop is tighter. It goes just on the other side of the retested level. Smaller risk, confirmed breakout, better price. The retest is always the cleaner entry.",
    "After a real breakout, price often retests the broken level. This is your second chance entry.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 3500, candleRef: 'last-4', color: '#facc15', text: 'breakout', animateIn: 'draw' },
      { type: 'line', startAtMs: 6000, durationMs: 3000, candleRef: 'last', priceDelta: -1, color: '#facc15', animateIn: 'draw', text: 'broken level' },
      { type: 'circle', startAtMs: 10000, durationMs: 4000, candleRef: 'last-1', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 10500, durationMs: 4000, candleRef: 'last-1', text: 'RETEST', color: '#1dd278', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 15000, durationMs: 4000, candleRef: 'last', color: '#1dd278', text: 'ENTER HERE', animateIn: 'draw' },
    ],
    28
  ),
  lesson('m10-l4', 10, 4, 'Volume Confirmation',
    "Volume is the fuel of a breakout. When price breaks a level on high volume, it means many participants were involved — the conviction is real. When price breaks a level on low volume, the move has no force behind it and is more likely to fail. Watch the volume bars at the bottom of the chart during breakouts: tall bars during the break mean real participation. Small bars mean be skeptical. Volume does not lie — it is the footprint of money moving through the market.",
    "Real breakouts have volume. Low volume breakouts are more likely to be false.",
    [
      { type: 'highlight', startAtMs: 2000, durationMs: 5000, candleRef: 'last-2', color: 'rgba(29,210,120,0.25)', animateIn: 'fade' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-2', text: 'HIGH VOLUME breakout', color: '#1dd278', animateIn: 'pop' },
      { type: 'highlight', startAtMs: 8000, durationMs: 5000, candleRef: 'last', color: 'rgba(239,68,68,0.2)', animateIn: 'fade' },
      { type: 'label', startAtMs: 8500, durationMs: 4000, candleRef: 'last', text: 'LOW VOLUME — suspicious', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 14000, durationMs: 8000, candleRef: 'last', text: 'VOLUME = CONVICTION', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
];

const MODULE_10: AcademyModule = {
  id: 10, title: 'Breakouts', tier: 3, tierName: 'PROFESSIONAL',
  ariaIntroLine: "You have the foundation and the tools. Now I teach you the hardest part — trading your own psychology.",
  lessons: MODULE_10_LESSONS,
  mission: mission('m10-mission', 10, 'Breakout Execution',
    "During a BREAKOUT regime on the live chart, enter a trade in the breakout direction with a 2:1 R:R minimum. I will announce when a breakout regime begins. You must act quickly and correctly.",
    [
      { id: 'entered-in-breakout', description: 'Entered during BREAKOUT market regime' },
      { id: 'correct-direction', description: 'Traded in the breakout direction' },
      { id: 'rr-2-to-1', description: 'R:R ratio at least 2:1' },
    ],
    'checklist',
    "Breakout regime identified, direction confirmed, 2:1 R:R structured. Breakout trading requires speed and precision. You demonstrated both. This is professional-level execution.",
    "Entry was outside a breakout regime, went the wrong direction, or had insufficient R:R. Watch for the BREAKOUT badge and act immediately with a properly structured trade.",
    [
      "Watch the market regime badge at the top. When it switches to BREAKOUT, prepare immediately.",
      "A breakout regime means price has just escaped a range or level with conviction.",
      "Enter in the direction of the break — if price broke upward, BUY. If downward, SELL.",
      "Set stop loss just inside the broken zone. Set take profit at 2× the stop distance.",
      "Speed matters here. Breakout regimes do not last long in this simulator.",
      "If you miss the breakout, wait for the next one. Never chase a breakout that has already moved significantly.",
    ]
  ),
};

const MODULE_11_LESSONS: ARIALesson[] = [
  lesson('m11-l1', 11, 1, 'What is a Range',
    "A range is when price is trapped between a ceiling and a floor — support and resistance are both active and price bounces between them with no net directional progress. The market is in balance. Neither buyers nor sellers have enough conviction to break out. Ranges happen because the two sides are approximately equal in strength. Ranging markets look like a sideways channel when you zoom out. They can last for minutes or for days. The key skill is identifying when you are in a range versus a trend.",
    "A range is when price is trapped between support and resistance with no clear trend. The market is in balance.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last', priceDelta: 3, color: '#ef4444', animateIn: 'draw', text: 'RESISTANCE' },
      { type: 'line', startAtMs: 5500, durationMs: 3000, candleRef: 'last', priceDelta: -3, color: '#1dd278', animateIn: 'draw', text: 'SUPPORT' },
      { type: 'band', startAtMs: 9000, durationMs: 6000, candleRef: 'last', priceDelta: 0, color: 'rgba(148,163,184,0.1)', animateIn: 'fade', text: 'RANGE ZONE' },
      { type: 'label', startAtMs: 16000, durationMs: 8000, candleRef: 'last', text: 'BOUNCE BETWEEN WALLS', color: '#94a3b8', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m11-l2', 11, 2, 'Fading the Extremes',
    "In a range, the trading strategy is straightforward: buy near the bottom, sell near the top. You are fading the extremes — betting on the range boundary to hold and price to reverse. Each touch of the range boundary is your S/R level. A rejection candle at resistance is your sell entry. A rejection candle at support is your buy entry. Stop loss goes outside the range. Take profit targets the opposite boundary. This is range trading at its most efficient.",
    "In a range, sell near the top, buy near the bottom. The range boundary is your S/R level.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 3500, candleRef: 'last-3', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 2500, durationMs: 3000, candleRef: 'last-3', text: 'BUY at support', color: '#1dd278', animateIn: 'fade' },
      { type: 'circle', startAtMs: 6500, durationMs: 3500, candleRef: 'last-1', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 7000, durationMs: 3000, candleRef: 'last-1', text: 'SELL at resistance', color: '#ef4444', animateIn: 'fade' },
      { type: 'label', startAtMs: 11500, durationMs: 8000, candleRef: 'last', text: 'FADE THE EXTREMES', color: '#00d4aa', animateIn: 'fade' },
    ],
    25
  ),
  lesson('m11-l3', 11, 3, 'Range Breakout Warning',
    "Ranges always end. The question is not if they break — it is when, and in which direction. Every time you trade a range boundary, you are exposed to the risk of a breakout that goes against your trade. This is why your stop loss must always be outside the range. If range resistance is at $105, your stop on a sell trade goes to $105.50 — just beyond the resistance. If the range breaks upward, your stop protects you from the full move. Without a stop, a range breakout can wipe out 10 range trades worth of profit in one move.",
    "Ranges end. When they break, the move is violent. Always use a stop loss outside the range.",
    [
      { type: 'line', startAtMs: 2000, durationMs: 3000, candleRef: 'last', priceDelta: 3, color: '#ef4444', animateIn: 'draw', text: 'range ceiling' },
      { type: 'arrow', startAtMs: 6000, durationMs: 4000, candleRef: 'last', color: '#ef4444', text: 'BREAKOUT RISK', animateIn: 'draw' },
      { type: 'label', startAtMs: 11000, durationMs: 5000, candleRef: 'last', text: 'Stop OUTSIDE the range', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 17000, durationMs: 8000, candleRef: 'last', text: 'STOPS PROTECT AGAINST BREAKS', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
  lesson('m11-l4', 11, 4, 'Identifying a Range Early',
    "The earlier you identify a range, the better your entries within it will be. You need a minimum of two touches on each side to confirm a range — two clear bounces at resistance, two clear bounces at support. Three touches on each side gives you high confidence. Once confirmed, draw your levels and start watching for rejection candles at the boundaries. The key filter: avoid taking range trades when EMA 9 and EMA 21 are steeply sloped — that indicates trend, not range.",
    "Two touches on each side confirms a range. More touches means stronger boundaries and higher probability trades.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 2500, candleRef: 'last-4', color: '#ef4444', animateIn: 'pop' },
      { type: 'circle', startAtMs: 5000, durationMs: 2500, candleRef: 'last-2', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 7500, durationMs: 4000, candleRef: 'last-2', text: '2 touches = confirmed', color: '#ef4444', animateIn: 'fade' },
      { type: 'circle', startAtMs: 12000, durationMs: 2500, candleRef: 'last-3', color: '#1dd278', animateIn: 'pop' },
      { type: 'circle', startAtMs: 14500, durationMs: 2500, candleRef: 'last-1', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last', text: 'RANGE CONFIRMED — START FADING', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
];

const MODULE_11: AcademyModule = {
  id: 11, title: 'Range Trading', tier: 3, tierName: 'PROFESSIONAL',
  ariaIntroLine: "When markets trend, you trade the trend. When they range, you trade the range. You must recognize both.",
  lessons: MODULE_11_LESSONS,
  mission: mission('m11-mission', 11, 'Range Boundary Bounces',
    "During a RANGE regime, open 2 trades from S/R zone bounces within 5 pips of the zone. Both must close in profit. I will show you the active range boundaries.",
    [
      { id: 'first-range-trade', description: 'Trade 1: opened within 5 pips of S/R zone in RANGE regime' },
      { id: 'first-trade-profit', description: 'Trade 1: closed in profit' },
      { id: 'second-range-trade', description: 'Trade 2: opened within 5 pips of S/R zone in RANGE regime' },
      { id: 'second-trade-profit', description: 'Trade 2: closed in profit' },
    ],
    'checklist',
    "Two profitable range trades from proven zone boundaries. That is methodical, disciplined range trading. You did not chase, you did not predict — you waited for the market to return to known levels and traded the reaction. That is professional.",
    "Range trades must be opened near S/R zones during a RANGE regime, and both must profit. Watch for the RANGE badge and only enter near the pulsing zone lines.",
    [
      "Wait for the market regime to show RANGE before entering.",
      "Identify the top and bottom boundaries of the range — the pulsing zone lines.",
      "Near the top: wait for a bearish rejection candle, then SELL within 5 pips of resistance.",
      "Near the bottom: wait for a bullish rejection candle, then BUY within 5 pips of support.",
      "Stop loss goes outside the range — just beyond the boundary you are trading from.",
      "Take profit targets the opposite side of the range. Both trades must close in profit for this mission.",
    ]
  ),
};

const MODULE_12_LESSONS: ARIALesson[] = [
  lesson('m12-l1', 12, 1, 'Revenge Trading',
    "A loss triggers an emotional response. Your brain registers the loss as a threat and wants to recover immediately. So you open another trade immediately — not because there is a setup, but because you want the money back. This is revenge trading. The second trade is entered with worse psychology, no plan, and elevated risk. Often, it loses too. The third trade is worse. This is how accounts blow up: not from one catastrophic trade, but from three or four emotional trades in rapid succession after a loss. The rule is simple: after a loss, pause. Do not trade for at least 3 minutes.",
    "Revenge trading is opening a new trade to recover a loss. It is emotional, not analytical. It kills accounts.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 4000, candleRef: 'last-4', text: 'LOSS — triggered', color: '#ef4444', animateIn: 'pop' },
      { type: 'crossout', startAtMs: 7000, durationMs: 3000, candleRef: 'last-3', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 7500, durationMs: 3000, candleRef: 'last-3', text: 'immediate re-entry', color: '#ef4444', animateIn: 'pop' },
      { type: 'crossout', startAtMs: 11000, durationMs: 3000, candleRef: 'last-1', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 11500, durationMs: 3000, candleRef: 'last-1', text: 'another loss', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 16000, durationMs: 8000, candleRef: 'last', text: 'PAUSE AFTER LOSS. ALWAYS.', color: '#facc15', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m12-l2', 12, 2, 'FOMO',
    "Fear of Missing Out is when you enter a trade because you see price moving fast and fear being left behind. The entry was valid 10 candles ago — when the setup formed. By the time you notice it and feel FOMO, the move has already happened. Your entry now is at the worst possible price. Your risk is maximum because price has already moved far from structure. Your reward potential is minimum because the move is nearly over. FOMO is the enemy of every rational trading system. The solution is simple: if you missed it, you missed it. The next setup is always coming.",
    "FOMO makes you enter after the move has already happened. That entry is always the worst one.",
    [
      { type: 'arrow', startAtMs: 2000, durationMs: 3500, candleRef: 'last-4', color: '#1dd278', text: 'valid entry here', animateIn: 'draw' },
      { type: 'arrow', startAtMs: 6500, durationMs: 4000, candleRef: 'last', color: '#ef4444', text: 'FOMO entry here', animateIn: 'draw' },
      { type: 'crossout', startAtMs: 11500, durationMs: 3500, candleRef: 'last', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 12000, durationMs: 4000, candleRef: 'last', text: 'worst risk:reward', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 17000, durationMs: 8000, candleRef: 'last', text: 'MISSED = WAIT FOR NEXT', color: '#facc15', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m12-l3', 12, 3, 'Overconfidence After a Winning Streak',
    "A winning streak feels like confirmation that you have mastered the market. Your confidence builds. You increase your lot size because you are on a roll. Then one loss at the inflated size wipes out all the previous gains. This pattern repeats throughout trading history because probability does not have memory. Your last 5 wins do not make the next trade more likely to win. Markets do not know your streak. The discipline is this: your lot size and risk percentage stay constant regardless of how many wins or losses you have had.",
    "A winning streak does not mean your edge improved. Probability does not have memory. Size stays constant.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 4000, candleRef: 'last-4', text: '5 wins in a row', color: '#1dd278', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 7000, durationMs: 4000, candleRef: 'last-2', color: '#ef4444', text: 'increased lot size', animateIn: 'draw' },
      { type: 'crossout', startAtMs: 12000, durationMs: 3500, candleRef: 'last-1', color: '#ef4444', animateIn: 'draw' },
      { type: 'label', startAtMs: 12500, durationMs: 3500, candleRef: 'last-1', text: 'one loss wipes all gains', color: '#ef4444', animateIn: 'pop' },
      { type: 'label', startAtMs: 17000, durationMs: 8000, candleRef: 'last', text: 'SIZE STAYS CONSTANT. ALWAYS.', color: '#00d4aa', animateIn: 'fade' },
    ],
    30
  ),
  lesson('m12-l4', 12, 4, 'Process Over Outcome',
    "Here is the mindset shift that separates amateur traders from professionals: a good trade that loses is still a good trade. A bad trade that wins is still a bad trade. The outcome of a single trade is partially random — price can go against a perfect entry for reasons that have nothing to do with your analysis. What you control is the process: did you wait for the setup? Did you set a stop loss? Did you manage risk correctly? If yes, that is a good trade regardless of the result. Judge every trade by your process, not by whether it made money.",
    "A good trade that loses is still a good trade. A bad trade that wins is still a bad trade. Judge the process.",
    [
      { type: 'circle', startAtMs: 2000, durationMs: 4000, candleRef: 'last-3', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 2500, durationMs: 4000, candleRef: 'last-3', text: 'Good process = good trade', color: '#1dd278', animateIn: 'fade' },
      { type: 'label', startAtMs: 7500, durationMs: 4000, candleRef: 'last-3', text: '(even if it loses)', color: '#94a3b8', animateIn: 'fade' },
      { type: 'crossout', startAtMs: 12500, durationMs: 3500, candleRef: 'last-1', color: '#facc15', animateIn: 'draw' },
      { type: 'label', startAtMs: 13000, durationMs: 4000, candleRef: 'last-1', text: 'Bad process = bad trade', color: '#facc15', animateIn: 'fade' },
      { type: 'label', startAtMs: 18000, durationMs: 8000, candleRef: 'last', text: 'PROCESS. ALWAYS PROCESS.', color: '#00d4aa', animateIn: 'fade' },
    ],
    28
  ),
];

const MODULE_12: AcademyModule = {
  id: 12, title: 'Trade Psychology', tier: 3, tierName: 'PROFESSIONAL',
  ariaIntroLine: "The market does not beat most traders. Their own minds do. Let me show you exactly how.",
  lessons: MODULE_12_LESSONS,
  mission: mission('m12-mission', 12, 'Five Clean Trades',
    "Complete 5 consecutive trades. All must have stop losses. No revenge trading. No FOMO entries (no entry within 3 candles of a large spike). No lot size increase after a loss. I monitor all 5 in real time and call out every violation.",
    [
      { id: 'all-have-sl', description: 'All 5 trades had stop losses' },
      { id: 'no-revenge', description: 'No revenge trading detected' },
      { id: 'no-fomo', description: 'No FOMO entries detected' },
      { id: 'no-size-increase', description: 'Lot size not increased after a loss' },
    ],
    'checklist',
    "Five trades. All disciplined. No emotional decisions detected. You demonstrated that you can execute a trading plan without letting emotions override your judgment. That is the rarest skill in trading. You have it.",
    "A psychological violation was detected — either missing stop loss, revenge trading, FOMO entry, or lot size increase after a loss. Any violation resets the counter.",
    [
      "Every trade must have a stop loss. Non-negotiable.",
      "After any loss, wait at least 3 candles before entering again. No exceptions.",
      "If you see a large fast-moving candle, do NOT chase it. Wait for it to consolidate.",
      "Never increase your lot size after a losing trade. Keep size constant across all 5 trades.",
      "I am watching every entry for timing and lot size. Violations reset your counter to zero.",
      "Take your time. Quality over quantity. Five clean trades regardless of how long it takes.",
    ]
  ),
};

const MODULE_13_LESSONS: ARIALesson[] = [
  lesson('m13-l1', 13, 1, 'The Complete Pre-Trade Checklist',
    "Every professional trade starts with a checklist. Not a feeling. Not a gut. A structured list of conditions that must be met before a single dollar is risked. Here is the checklist you will use for the rest of your trading career: one — trend direction identified. Two — entry near an S/R level. Three — confirmation candle closed. Four — EMA confluence confirmed. Five — RSI is not extreme in the wrong direction. Six — stop loss set. Seven — R:R at minimum 2:1. Eight — risk is under 1% of balance. All eight pass? You enter. One fails? You wait.",
    "Every professional trade runs through a checklist. When the checklist passes, you enter. When it fails, you wait.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 3000, candleRef: 'last', text: '1. Trend ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 5500, durationMs: 3000, candleRef: 'last', text: '2. S/R Level ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 9000, durationMs: 3000, candleRef: 'last', text: '3. Confirmation ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 12500, durationMs: 3000, candleRef: 'last', text: '4. EMA Aligned ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 16000, durationMs: 3000, candleRef: 'last', text: '5. RSI OK ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 19500, durationMs: 3000, candleRef: 'last', text: '6. SL Set ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 23000, durationMs: 3000, candleRef: 'last', text: '7. 2:1 R:R ✓', color: '#1dd278', animateIn: 'pop' },
      { type: 'label', startAtMs: 26500, durationMs: 8000, candleRef: 'last', text: '8. Risk < 1% ✓', color: '#1dd278', animateIn: 'pop' },
    ],
    38
  ),
  lesson('m13-l2', 13, 2, 'Putting It All Together',
    "Watch how a professional trade unfolds from start to finish. First: trend identification — the EMA 9 is above EMA 21, price is making higher highs. Uptrend confirmed. Second: S/R zone — price has pulled back to a tested support zone. Third: confirmation — a bullish engulfing candle closes above the zone. Entry signal confirmed. Fourth: RSI at 48 and rising — no extreme reading. Fifth: stop loss placed below the zone. Take profit at 2:1. Risk at 0.8% of account. All eight checklist items pass. Trade submitted. This is how every single trade should be placed.",
    "Every trade has a thesis. Every thesis passes the checklist. No checklist pass — no trade.",
    [
      { type: 'label', startAtMs: 2000, durationMs: 4000, candleRef: 'last', text: 'STEP 1: Uptrend confirmed', color: '#1dd278', animateIn: 'pop' },
      { type: 'circle', startAtMs: 7000, durationMs: 3000, candleRef: 'last-1', color: '#facc15', animateIn: 'pop' },
      { type: 'label', startAtMs: 7500, durationMs: 3000, candleRef: 'last-1', text: 'STEP 2: At support zone', color: '#facc15', animateIn: 'fade' },
      { type: 'highlight', startAtMs: 11000, durationMs: 3500, candleRef: 'last', color: 'rgba(29,210,120,0.3)', animateIn: 'fade' },
      { type: 'label', startAtMs: 11500, durationMs: 3500, candleRef: 'last', text: 'STEP 3: Engulfing close', color: '#1dd278', animateIn: 'pop' },
      { type: 'arrow', startAtMs: 16000, durationMs: 4000, candleRef: 'last', color: '#00d4aa', text: 'ALL 8 PASS → ENTER', animateIn: 'draw' },
    ],
    32
  ),
];

const MODULE_13: AcademyModule = {
  id: 13, title: 'Full Strategy Integration', tier: 3, tierName: 'PROFESSIONAL',
  ariaIntroLine: "You have learned everything. Now prove you can apply it all at once. This is the final exam.",
  lessons: MODULE_13_LESSONS,
  mission: mission('m13-mission', 13, 'The Final Exam',
    "Complete 10 trades in this session. Win rate must be 60% or higher. Every trade must have a stop loss. No trade may exceed 1.5% risk. No revenge trading. No FOMO entries. No stop loss widening. I grade every trade individually and give a final score out of 100. Score 70 or above to graduate as a Professional Trader.",
    [
      { id: 'ten-trades', description: '10 trades completed' },
      { id: 'win-rate-60', description: 'Win rate of 60% or higher' },
      { id: 'all-sl', description: 'Every trade had a stop loss' },
      { id: 'risk-under-1-5', description: 'No trade exceeded 1.5% risk' },
      { id: 'no-violations', description: 'No psychological violations' },
    ],
    'percentage',
    "You have done it. Ten trades. Disciplined risk. No emotional violations. A win rate above 60%. Score above 70. You have completed the Trading Academy. You are not a beginner anymore. You are not a student anymore. You are a trader. Everything I taught you — price, candles, trend, levels, stops, sizing, entries, EMAs, RSI, breakouts, ranges, psychology — you applied it all. Graduation achieved.",
    "The final exam requires 10 disciplined trades with a 60% win rate. All rules must be followed. Review what went wrong and try again — you have the knowledge, now build the consistency.",
    [
      "This is the final exam. Ten trades. All the rules apply simultaneously.",
      "Every trade needs a stop loss, under 1.5% risk, with a 2:1 minimum R:R. Use the checklist.",
      "After any loss, pause for at least 3 candles before re-entering.",
      "Win rate needs to reach 60%. That means 6 wins out of 10 trades minimum.",
      "I am grading each trade on setup quality, risk management, and discipline. Every violation costs points.",
      "Take your time. There is no clock. 10 disciplined trades at whatever pace you need.",
    ]
  ),
};

export const ACADEMY_MODULES: AcademyModule[] = [
  MODULE_1, MODULE_2, MODULE_3, MODULE_4,
  MODULE_5, MODULE_6, MODULE_7, MODULE_8, MODULE_9,
  MODULE_10, MODULE_11, MODULE_12, MODULE_13,
];

export function getModule(moduleId: number): AcademyModule {
  return ACADEMY_MODULES.find(m => m.id === moduleId) ?? ACADEMY_MODULES[0];
}

export function getLesson(lessonId: string): ARIALesson | undefined {
  for (const mod of ACADEMY_MODULES) {
    const found = mod.lessons.find(l => l.id === lessonId);
    if (found) return found;
  }
  return undefined;
}

export function isModuleUnlocked(moduleId: number, completedMissionIds: string[]): boolean {
  if (moduleId === 1) return true;
  const prevMissionId = `m${moduleId - 1}-mission`;
  return completedMissionIds.includes(prevMissionId);
}

export function isLessonUnlocked(lesson: ARIALesson, completedLessonIds: string[], completedMissionIds: string[]): boolean {
  if (!isModuleUnlocked(lesson.moduleId, completedMissionIds)) return false;
  if (lesson.lessonNumber === 1) return true;
  const prevLessonId = `m${lesson.moduleId}-l${lesson.lessonNumber - 1}`;
  return completedLessonIds.includes(prevLessonId);
}

export function isMissionUnlocked(missionId: string, completedLessonIds: string[]): boolean {
  const moduleIdStr = missionId.replace('m', '').replace('-mission', '');
  const moduleId = parseInt(moduleIdStr);
  const module = getModule(moduleId);
  return module.lessons.every(l => completedLessonIds.includes(l.id));
}

export function getNextLessonOrMission(
  moduleId: number, completedLessonIds: string[], completedMissionIds: string[]
): { type: 'lesson'; lesson: ARIALesson } | { type: 'mission'; mission: TradingMission } | { type: 'complete' } {
  const module = getModule(moduleId);
  for (const lesson of module.lessons) {
    if (!completedLessonIds.includes(lesson.id)) {
      return { type: 'lesson', lesson };
    }
  }
  if (!completedMissionIds.includes(module.mission.id)) {
    return { type: 'mission', mission: module.mission };
  }
  const nextModule = ACADEMY_MODULES.find(m => m.id === moduleId + 1);
  if (!nextModule) return { type: 'complete' };
  return { type: 'lesson', lesson: nextModule.lessons[0] };
}
