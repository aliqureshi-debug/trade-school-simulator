import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, CheckCircle2, Circle } from 'lucide-react';
import { PHASES } from '@/lib/phases';

interface PhaseBadgeProps {
  currentPhase: number;
  totalXpEarned: number;
}

export function PhaseBadge({ currentPhase }: PhaseBadgeProps) {
  const current = PHASES.find(p => p.id === currentPhase) || PHASES[0];

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button className="text-[10px] bg-primary/15 text-primary px-2.5 py-1 rounded-full font-medium ml-1 hover:bg-primary/25 transition-colors cursor-pointer border border-primary/20" data-testid="button-phase-badge">
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
