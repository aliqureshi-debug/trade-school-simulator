import { Trade, Achievement, LessonProgress, PlayerStats } from '@/types/trading';

export interface SavedState {
  xp: number;
  xpTotal: number;
  xpToNext: number;
  level: number;
  balance: number;
  trades: Trade[];
  achievements: Achievement[];
  stopLossCount: number;
  winStreak: number;
  maxWinStreak: number;
  totalTrades: number;
  winRate: number;
  muted: boolean;
  lessonProgress: LessonProgress;
  savedAt: number;
}

const STORAGE_KEY = 'tradeschool_v2';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function isValidLessonProgress(lp: unknown): lp is LessonProgress {
  if (!lp || typeof lp !== 'object') return false;
  const obj = lp as Record<string, unknown>;
  return (
    Array.isArray(obj.completedLessonIds) &&
    Array.isArray(obj.completedMissionIds) &&
    typeof obj.currentModuleId === 'number' &&
    typeof obj.currentLessonIndex === 'number' &&
    typeof obj.hasCompletedOnboarding === 'boolean'
  );
}

function isValidAchievementsArray(arr: unknown): arr is Achievement[] {
  if (!Array.isArray(arr)) return false;
  return arr.every(a =>
    a && typeof a === 'object' &&
    typeof (a as Record<string, unknown>).id === 'string' &&
    typeof (a as Record<string, unknown>).unlocked === 'boolean'
  );
}

function isValidTradesArray(arr: unknown): arr is Trade[] {
  if (!Array.isArray(arr)) return false;
  return arr.every(t =>
    t && typeof t === 'object' &&
    typeof (t as Record<string, unknown>).id === 'string' &&
    typeof (t as Record<string, unknown>).type === 'string' &&
    typeof (t as Record<string, unknown>).status === 'string'
  );
}

export function saveState(state: SavedState): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable
    }
  }, 500);
}

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    if (
      typeof parsed.xp !== 'number' ||
      typeof parsed.level !== 'number' ||
      typeof parsed.balance !== 'number' ||
      typeof parsed.xpTotal !== 'number' ||
      typeof parsed.xpToNext !== 'number'
    ) {
      return null;
    }

    if (!isValidTradesArray(parsed.trades)) return null;
    if (!isValidAchievementsArray(parsed.achievements)) return null;
    if (!isValidLessonProgress(parsed.lessonProgress)) return null;

    return {
      xp: Math.max(0, parsed.xp as number),
      xpTotal: Math.max(0, (parsed.xpTotal as number) ?? 0),
      xpToNext: Math.max(1, (parsed.xpToNext as number) ?? 150),
      level: Math.max(1, (parsed.level as number)),
      balance: Math.max(0, (parsed.balance as number)),
      trades: parsed.trades as Trade[],
      achievements: parsed.achievements as Achievement[],
      stopLossCount: Math.max(0, ((parsed.stopLossCount as number) ?? 0)),
      winStreak: Math.max(0, ((parsed.winStreak as number) ?? 0)),
      maxWinStreak: Math.max(0, ((parsed.maxWinStreak as number) ?? 0)),
      totalTrades: Math.max(0, ((parsed.totalTrades as number) ?? 0)),
      winRate: Math.max(0, Math.min(100, ((parsed.winRate as number) ?? 0))),
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
      lessonProgress: parsed.lessonProgress as LessonProgress,
      savedAt: (parsed.savedAt as number) ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export function hasSavedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function clearState(): void {
  try {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function buildDefaultLessonProgress(): LessonProgress {
  return {
    completedLessonIds: [],
    completedMissionIds: [],
    currentModuleId: 1,
    currentLessonIndex: 0,
    missionActive: false,
    missionState: null,
    hasCompletedOnboarding: false,
    userProfile: null,
    lessonSpeed: 'normal',
    candleSpeedMs: 2000,
  };
}

export function buildStatsFromSave(saved: SavedState): PlayerStats {
  return {
    level: saved.level,
    xp: saved.xp,
    xpToNext: saved.xpToNext,
    xpTotal: saved.xpTotal,
    totalTrades: saved.totalTrades,
    winRate: saved.winRate,
    balance: saved.balance,
    startingBalance: 10000,
    achievements: saved.achievements,
    stopLossCount: saved.stopLossCount,
    winStreak: saved.winStreak,
    maxWinStreak: saved.maxWinStreak,
  };
}
