import { useState } from 'react';
import { UserProfile, UserArchetype, LessonProgress } from '@/types/trading';

interface SettingsModalProps {
  onClose: () => void;
  userProfile: UserProfile | null;
  muted: boolean;
  lessonProgress: LessonProgress;
  onToggleMute: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateLessonSpeed: (speed: 'normal' | 'fast' | 'instant') => void;
  onUpdateCandleSpeed: (ms: number) => void;
  onResetProgress: () => void;
  devMode?: boolean;
  onDevSkipLesson?: () => void;
  onDevUnlockAll?: () => void;
}

const ARCHETYPES: { id: UserArchetype; name: string }[] = [
  { id: 'scalper', name: 'Scalper' },
  { id: 'swing', name: 'Swing Trader' },
  { id: 'risk-manager', name: 'Risk Manager' },
];

export function SettingsModal({
  onClose,
  userProfile,
  muted,
  lessonProgress,
  onToggleMute,
  onUpdateProfile,
  onUpdateLessonSpeed,
  onUpdateCandleSpeed,
  onResetProgress,
  devMode,
  onDevSkipLesson,
  onDevUnlockAll,
}: SettingsModalProps) {
  const [tab, setTab] = useState<'profile' | 'display' | 'reset'>('profile');
  const [editName, setEditName] = useState(userProfile?.name ?? '');
  const [editArchetype, setEditArchetype] = useState<UserArchetype>(userProfile?.archetype ?? 'swing');
  const [resetConfirm, setResetConfirm] = useState('');
  const [showArchetypeConfirm, setShowArchetypeConfirm] = useState(false);

  const handleSaveProfile = () => {
    if (!editName.trim()) return;
    onUpdateProfile({
      name: editName.trim(),
      archetype: editArchetype,
      created: userProfile?.created ?? Date.now(),
    });
  };

  const handleReset = () => {
    if (resetConfirm !== 'RESET') return;
    onResetProgress();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      data-testid="settings-modal"
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl overflow-hidden"
        style={{
          background: 'rgba(8,12,20,0.97)',
          border: '1px solid rgba(255,255,255,0.08)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-bold text-foreground">Settings</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg"
            data-testid="button-settings-close"
          >
            ×
          </button>
        </div>

        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {(['profile', 'display', 'reset'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-widest transition-all"
              style={{
                color: tab === t ? '#00d4aa' : '#6b7280',
                borderBottom: `2px solid ${tab === t ? '#00d4aa' : 'transparent'}`,
                background: 'transparent',
              }}
              data-testid={`button-settings-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded text-sm font-mono outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#e2e8f0',
                  }}
                  maxLength={30}
                  data-testid="input-settings-name"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                  Archetype
                </label>
                <div className="space-y-1.5">
                  {ARCHETYPES.map(a => (
                    <button
                      key={a.id}
                      onClick={() => {
                        if (a.id !== userProfile?.archetype) setShowArchetypeConfirm(true);
                        setEditArchetype(a.id);
                      }}
                      className="w-full text-left px-3 py-2 rounded text-sm transition-all"
                      style={{
                        background: editArchetype === a.id ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${editArchetype === a.id ? '#00d4aa' : 'rgba(255,255,255,0.08)'}`,
                        color: editArchetype === a.id ? '#00d4aa' : '#9ca3af',
                      }}
                      data-testid={`button-settings-archetype-${a.id}`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
                {showArchetypeConfirm && editArchetype !== userProfile?.archetype && (
                  <p className="text-xs mt-2" style={{ color: '#f59e0b' }}>
                    Changing archetype adjusts ARIA's coaching style. Your progress is preserved.
                  </p>
                )}
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={!editName.trim()}
                className="w-full py-2 rounded text-sm font-bold transition-all"
                style={{
                  background: editName.trim() ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${editName.trim() ? '#00d4aa' : 'rgba(255,255,255,0.06)'}`,
                  color: editName.trim() ? '#00d4aa' : '#4b5563',
                }}
                data-testid="button-save-profile"
              >
                SAVE PROFILE
              </button>
            </div>
          )}

          {tab === 'display' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-foreground font-medium">Sound effects</div>
                  <div className="text-xs text-muted-foreground">Trading sounds and ARIA alerts</div>
                </div>
                <button
                  onClick={onToggleMute}
                  className="w-11 h-6 rounded-full transition-all relative"
                  style={{ background: muted ? 'rgba(255,255,255,0.1)' : '#00d4aa' }}
                  data-testid="button-toggle-mute"
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: muted ? 2 : 22 }}
                  />
                </button>
              </div>

              <div>
                <div className="text-sm text-foreground font-medium mb-2">Lesson animation speed</div>
                <div className="flex gap-2">
                  {(['normal', 'fast', 'instant'] as const).map(speed => (
                    <button
                      key={speed}
                      onClick={() => onUpdateLessonSpeed(speed)}
                      className="flex-1 py-2 rounded text-xs font-bold uppercase transition-all"
                      style={{
                        background: lessonProgress.lessonSpeed === speed ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${lessonProgress.lessonSpeed === speed ? '#00d4aa' : 'rgba(255,255,255,0.08)'}`,
                        color: lessonProgress.lessonSpeed === speed ? '#00d4aa' : '#6b7280',
                      }}
                      data-testid={`button-lesson-speed-${speed}`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-foreground font-medium mb-2">Chart candle speed</div>
                <div className="flex gap-2">
                  {[
                    { label: '1s', ms: 1000 },
                    { label: '2s', ms: 2000 },
                    { label: '3s', ms: 3000 },
                  ].map(opt => (
                    <button
                      key={opt.ms}
                      onClick={() => onUpdateCandleSpeed(opt.ms)}
                      className="flex-1 py-2 rounded text-xs font-bold transition-all"
                      style={{
                        background: lessonProgress.candleSpeedMs === opt.ms ? 'rgba(0,212,170,0.15)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${lessonProgress.candleSpeedMs === opt.ms ? '#00d4aa' : 'rgba(255,255,255,0.08)'}`,
                        color: lessonProgress.candleSpeedMs === opt.ms ? '#00d4aa' : '#6b7280',
                      }}
                      data-testid={`button-candle-speed-${opt.ms}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {devMode && (
                <div
                  className="p-3 rounded-lg"
                  style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}
                >
                  <div className="text-xs font-bold mb-2" style={{ color: '#a855f7' }}>
                    DEV MODE ACTIVE
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onDevSkipLesson}
                      className="flex-1 py-1.5 rounded text-xs font-bold"
                      style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#a855f7' }}
                      data-testid="button-dev-skip"
                    >
                      SKIP LESSON
                    </button>
                    <button
                      onClick={onDevUnlockAll}
                      className="flex-1 py-1.5 rounded text-xs font-bold"
                      style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#a855f7' }}
                      data-testid="button-dev-unlock"
                    >
                      UNLOCK ALL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'reset' && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div className="text-sm font-bold text-foreground mb-1">Reset all progress</div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This will permanently delete all lessons completed, missions, XP, trades, and achievements.
                  Your account will restart at Module 1, Lesson 1 with $10,000 balance.
                  This cannot be undone.
                </p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
                  Type RESET to confirm
                </label>
                <input
                  type="text"
                  value={resetConfirm}
                  onChange={e => setResetConfirm(e.target.value.toUpperCase())}
                  placeholder="RESET"
                  className="w-full px-3 py-2 rounded text-sm font-mono outline-none"
                  style={{
                    background: 'rgba(239,68,68,0.05)',
                    border: `1px solid ${resetConfirm === 'RESET' ? '#ef4444' : 'rgba(239,68,68,0.2)'}`,
                    color: '#e2e8f0',
                  }}
                  data-testid="input-reset-confirm"
                />
              </div>

              <button
                onClick={handleReset}
                disabled={resetConfirm !== 'RESET'}
                className="w-full py-2.5 rounded text-sm font-bold transition-all"
                style={{
                  background: resetConfirm === 'RESET' ? '#ef4444' : 'rgba(239,68,68,0.05)',
                  color: resetConfirm === 'RESET' ? 'white' : '#6b7280',
                  cursor: resetConfirm === 'RESET' ? 'pointer' : 'not-allowed',
                }}
                data-testid="button-reset-progress"
              >
                RESET ALL PROGRESS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
