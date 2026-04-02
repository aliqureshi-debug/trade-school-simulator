import { Trade, Achievement, UserProfile } from '@/types/trading';

export interface SavedState {
  phase: number;
  xp: number;
  xpTotal: number;
  xpToNext: number;
  level: number;
  balance: number;
  trades: Trade[];
  achievements: Achievement[];
  challengeProgress: number;
  stopLossCount: number;
  conceptsSeen: string[];
  totalTrades: number;
  winRate: number;
  muted: boolean;
  userProfile?: UserProfile;
  savedAt: number;
}

const STORAGE_KEY = 'tradeschool_v1';
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveState(state: SavedState): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be full or unavailable
    }
  }, 500);
}

export function loadState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (
      typeof parsed.phase !== 'number' ||
      typeof parsed.xp !== 'number' ||
      typeof parsed.level !== 'number'
    ) {
      return null;
    }
    return parsed;
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
