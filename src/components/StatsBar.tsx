import { PlayerStats, Achievement } from '@/types/trading';
import { Star, Trophy } from 'lucide-react';

interface StatsBarProps {
  stats: PlayerStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const xpPercent = (stats.xp / stats.xpToNext) * 100;
  const pnlTotal = stats.balance - stats.startingBalance;

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Level & XP */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-xp" />
            <span className="text-sm font-bold text-xp">Lvl {stats.level}</span>
          </div>
          <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-xp rounded-full transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{stats.xp}/{stats.xpToNext}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="text-muted-foreground">Trades</p>
            <p className="font-mono font-bold text-foreground">{stats.totalTrades}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Win Rate</p>
            <p className="font-mono font-bold text-foreground">{stats.winRate}%</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">P&L</p>
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

interface AchievementPopupProps {
  achievement: Achievement | null;
}

export function AchievementPopup({ achievement }: AchievementPopupProps) {
  if (!achievement) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-float-up">
      <div className="bg-card border-2 border-xp/50 rounded-xl px-6 py-3 shadow-lg shadow-xp/20 flex items-center gap-3">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <p className="text-xs text-xp font-bold">ACHIEVEMENT UNLOCKED</p>
          <p className="text-sm font-semibold text-foreground">{achievement.title}</p>
        </div>
      </div>
    </div>
  );
}
