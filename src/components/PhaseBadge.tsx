import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, CheckCircle2, Circle } from 'lucide-react';

const PHASES = [
  { id: 1, title: 'What Is a Trade', desc: 'Place your first buy and sell. Learn price, profit, and loss basics.', unlockXp: 0 },
  { id: 2, title: 'Trend Recognition', desc: 'Identify uptrends and downtrends before trading.', unlockXp: 100 },
  { id: 3, title: 'Candlestick Reading', desc: 'Understand candle anatomy, wicks, and rejection signals.', unlockXp: 250 },
  { id: 4, title: 'Support & Resistance', desc: 'Trade bounces off key horizontal price levels.', unlockXp: 500 },
  { id: 5, title: 'Volume Analysis', desc: 'Use volume to confirm breakouts and filter fake moves.', unlockXp: 800 },
  { id: 6, title: 'Entry Timing', desc: 'Wait for confirmation before entering trades.', unlockXp: 1200 },
  { id: 7, title: 'Risk Management', desc: 'Master stop losses, position sizing, and take profits.', unlockXp: 1800 },
  { id: 8, title: 'Market Patterns', desc: 'Recognize pullbacks, consolidation, and breakout setups.', unlockXp: 2500 },
  { id: 9, title: 'Indicators', desc: 'Learn SMA, RSI, MACD, and Bollinger Bands.', unlockXp: 3500 },
  { id: 10, title: 'Trading Psychology', desc: 'Conquer revenge trading, FOMO, and emotional attachment.', unlockXp: 5000 },
];

interface PhaseBadgeProps {
  currentPhase: number;
  totalXpEarned: number;
}

export function PhaseBadge({ currentPhase, totalXpEarned }: PhaseBadgeProps) {
  const current = PHASES.find(p => p.id === currentPhase) || PHASES[0];

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button className="text-[10px] bg-primary/15 text-primary px-2.5 py-1 rounded-full font-medium ml-1 hover:bg-primary/25 transition-colors cursor-pointer border border-primary/20">
          Phase {current.id}: {current.title}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-72 p-0 bg-card border-border">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-bold text-foreground">📚 Learning Curriculum</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Complete phases to unlock new concepts</p>
        </div>
        <div className="p-2 max-h-64 overflow-y-auto space-y-0.5">
          {PHASES.map(phase => {
            const isComplete = phase.id < currentPhase;
            const isCurrent = phase.id === currentPhase;
            const isLocked = phase.id > currentPhase;

            return (
              <div
                key={phase.id}
                className={`flex items-start gap-2 p-2 rounded-md text-xs transition-colors ${
                  isCurrent ? 'bg-primary/10 border border-primary/20' :
                  isComplete ? 'opacity-70' : 'opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  ) : isCurrent ? (
                    <Circle className="w-3.5 h-3.5 text-primary fill-primary/30" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`font-semibold leading-tight ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                    {phase.id}. {phase.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{phase.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
