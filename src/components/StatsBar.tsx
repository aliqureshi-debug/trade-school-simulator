import { PlayerStats, Achievement, LessonProgress } from '@/types/trading';
import { Star, Trophy, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ACADEMY_MODULES } from '@/lib/academy';

interface StatsBarProps {
  stats: PlayerStats;
  xpGain: number | null;
  lessonProgress: LessonProgress;
}

export function StatsBar({ stats, xpGain, lessonProgress }: StatsBarProps) {
  const xpPercent = Math.min(100, (stats.xp / stats.xpToNext) * 100);
  const pnlTotal = stats.balance - stats.startingBalance;
  const currentModule = ACADEMY_MODULES.find(m => m.id === lessonProgress.currentModuleId);
  const completedModules = ACADEMY_MODULES.filter(m =>
    lessonProgress.completedMissionIds.includes(m.mission.id)
  ).length;

  const tierColors: Record<string, string> = {
    RECRUIT: '#3b82f6',
    TRADER: '#00d4aa',
    PROFESSIONAL: '#a855f7',
  };
  const tierColor = currentModule ? tierColors[currentModule.tierName] : '#00d4aa';

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-2 flex-wrap"
      style={{
        background: 'rgba(8,12,20,0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
      data-testid="stats-bar"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" style={{ color: '#facc15' }} />
          <span className="text-xs font-bold" style={{ color: '#facc15' }}>Lv {stats.level}</span>
        </div>
        <div className="relative w-24 h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #facc15, #fde68a)' }}
            animate={{ width: `${xpPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
          {xpGain && (
            <motion.div
              className="absolute inset-y-0 w-6"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}
              initial={{ left: '-24px' }}
              animate={{ left: '120px' }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          )}
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">{stats.xp}/{stats.xpToNext}</span>

        <div className="relative h-4 w-12">
          <AnimatePresence>
            {xpGain && (
              <motion.span
                key={`xp-${Date.now()}`}
                className="absolute text-[10px] font-bold whitespace-nowrap"
                style={{ color: '#facc15' }}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -18 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: 'easeOut' }}
              >
                +{xpGain} XP
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {currentModule && (
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
            style={{ background: `${tierColor}18`, color: tierColor }}
            data-testid="text-current-tier"
          >
            {currentModule.tierName}
          </span>
          <span className="text-[10px] text-muted-foreground">
            M{currentModule.id}: {currentModule.title}
          </span>
          <span className="text-[9px] text-muted-foreground">
            ({completedModules}/13)
          </span>
        </div>
      )}

      <div className="flex items-center gap-4 text-xs">
        <div className="text-center" data-testid="stat-balance">
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Balance</p>
          <p className="font-mono font-bold text-foreground">${stats.balance.toFixed(0)}</p>
        </div>
        <div className="text-center" data-testid="stat-pnl">
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">P&L</p>
          <p className={`font-mono font-bold ${pnlTotal >= 0 ? '' : ''}`}
             style={{ color: pnlTotal >= 0 ? '#1dd278' : '#ef4444' }}>
            {pnlTotal >= 0 ? '+' : ''}${pnlTotal.toFixed(0)}
          </p>
        </div>
        <div className="text-center" data-testid="stat-win-rate">
          <p className="text-[8px] text-muted-foreground uppercase tracking-wider">Win%</p>
          <p className="font-mono font-bold text-foreground">{stats.winRate}%</p>
        </div>
        {stats.winStreak > 0 && (
          <div className="flex items-center gap-1" data-testid="stat-streak">
            <Flame className="w-3 h-3" style={{ color: '#f59e0b' }} />
            <span className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>{stats.winStreak}</span>
          </div>
        )}
        <div className="flex items-center gap-0.5">
          <Trophy className="w-3 h-3 text-muted-foreground" />
          <span className="text-[9px] text-muted-foreground ml-0.5">
            {stats.achievements.filter(a => a.unlocked).length}/{stats.achievements.length}
          </span>
          {stats.achievements.filter(a => a.unlocked).slice(-3).map(a => (
            <span key={a.id} title={a.title} className="text-xs ml-0.5">{a.icon}</span>
          ))}
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
          data-testid="achievement-toast"
        >
          <div
            className="rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3"
            style={{
              background: 'rgba(8,12,20,0.96)',
              border: '2px solid rgba(250,204,21,0.4)',
              boxShadow: '0 0 30px rgba(250,204,21,0.15)',
            }}
          >
            <motion.span
              className="text-2xl"
              initial={{ rotate: -30, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.1 }}
            >
              {achievement.icon}
            </motion.span>
            <div>
              <p className="text-[9px] font-bold tracking-wider uppercase" style={{ color: '#facc15' }}>
                Achievement Unlocked
              </p>
              <p className="text-sm font-bold text-foreground">{achievement.title}</p>
              <p className="text-[10px] text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
