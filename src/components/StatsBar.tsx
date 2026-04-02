import { useRef, useEffect } from 'react';
import { PlayerStats, Achievement } from '@/types/trading';
import { Star, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsBarProps {
  stats: PlayerStats;
  xpGain: number | null;
}

export function StatsBar({ stats, xpGain }: StatsBarProps) {
  const xpPercent = (stats.xp / stats.xpToNext) * 100;
  const pnlTotal = stats.balance - stats.startingBalance;
  const prevXpRef = useRef(xpPercent);
  const shimmerRef = useRef(false);

  useEffect(() => {
    if (xpGain && xpGain > 0) shimmerRef.current = true;
    prevXpRef.current = xpPercent;
  }, [xpGain, xpPercent]);

  return (
    <div className="bg-card border border-border rounded-lg px-4 py-2.5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Level & XP */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-xp" />
            <span className="text-sm font-bold text-xp">Lvl {stats.level}</span>
          </div>
          <div className="relative w-28 h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-xp rounded-full relative overflow-hidden"
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Shimmer sweep */}
              {xpGain && (
                <motion.div
                  className="absolute inset-y-0 w-8"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)' }}
                  initial={{ left: '-32px' }}
                  animate={{ left: '120px' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
              )}
            </motion.div>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{stats.xp}/{stats.xpToNext}</span>

          {/* Floating +XP */}
          <div className="relative w-10 h-4">
            <AnimatePresence>
              {xpGain && (
                <motion.span
                  key={`xp-${Date.now()}`}
                  className="absolute text-[11px] font-bold text-xp whitespace-nowrap"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                >
                  +{xpGain} XP
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-5 text-xs">
          <div className="text-center" data-testid="stat-trades">
            <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Trades</p>
            <p className="font-mono font-bold text-foreground">{stats.totalTrades}</p>
          </div>
          <div className="text-center" data-testid="stat-win-rate">
            <p className="text-muted-foreground text-[9px] uppercase tracking-wider">Win Rate</p>
            <p className="font-mono font-bold text-foreground">{stats.winRate}%</p>
          </div>
          <div className="text-center" data-testid="stat-pnl">
            <p className="text-muted-foreground text-[9px] uppercase tracking-wider">P&L</p>
            <p className={`font-mono font-bold ${pnlTotal >= 0 ? 'text-profit' : 'text-loss'}`}>
              {pnlTotal >= 0 ? '+' : ''}${pnlTotal.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Achievements */}
        <div className="flex items-center gap-1">
          <Trophy className="w-3.5 h-3.5 text-muted-foreground mr-1" />
          {stats.achievements.filter(a => a.unlocked).map(a => (
            <span key={a.id} title={a.title} className="text-sm">{a.icon}</span>
          ))}
          {stats.achievements.filter(a => a.unlocked).length === 0 && (
            <span className="text-[10px] text-muted-foreground">No achievements yet</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface AchievementToastProps {
  achievement: Achievement | null;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          className="fixed top-6 right-6 z-[9999] pointer-events-none"
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <div className="bg-card border-2 border-xp/50 rounded-xl px-5 py-3 shadow-2xl shadow-xp/20 flex items-center gap-3">
            <motion.span
              className="text-2xl"
              initial={{ rotate: -30, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
            >
              {achievement.icon}
            </motion.span>
            <div>
              <p className="text-[10px] text-xp font-bold tracking-wider uppercase">Achievement Unlocked</p>
              <p className="text-sm font-bold text-foreground">{achievement.title}</p>
              <p className="text-[10px] text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
