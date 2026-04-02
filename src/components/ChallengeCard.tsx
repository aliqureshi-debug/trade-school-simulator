import { Phase } from '@/types/trading';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';

interface ChallengeCardProps {
  phase: Phase;
  progress: number;
  isComplete?: boolean;
}

export function ChallengeCard({ phase, progress, isComplete }: ChallengeCardProps) {
  const required = phase.challenge.criteria.count ?? 1;
  const pct = Math.min((progress / required) * 100, 100);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${phase.id}-${isComplete}`}
        initial={{ opacity: 0, y: -8, rotateX: isComplete ? 10 : 0 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-lg border"
        style={{
          borderColor: isComplete ? 'rgba(0, 184, 138, 0.5)' : 'rgba(0, 190, 180, 0.25)',
          background: isComplete
            ? 'linear-gradient(135deg, rgba(0, 184, 138, 0.12), rgba(0, 184, 138, 0.04))'
            : 'linear-gradient(135deg, rgba(0, 190, 180, 0.08), rgba(13, 18, 28, 0.95))',
        }}
      >
        <div className="px-4 py-3">
          {isComplete ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-profit shrink-0" />
              <div>
                <p className="text-xs font-bold text-profit">Challenge Complete!</p>
                <p className="text-[10px] text-muted-foreground">Next phase unlocking...</p>
              </div>
              <div className="ml-auto flex items-center gap-1 text-xp text-xs font-bold">
                <Star className="w-3.5 h-3.5" />
                +{phase.challenge.xpReward} XP
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Phase {phase.id} Challenge</span>
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-xp bg-xp/10 px-1.5 py-0.5 rounded-full">
                      <Star className="w-2.5 h-2.5" />
                      {phase.challenge.xpReward} XP
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground">{phase.challenge.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{phase.challenge.instruction}</p>
                </div>
              </div>

              {/* Progress bar */}
              {required > 1 && (
                <div>
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span className="font-mono">{progress}/{required}</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
