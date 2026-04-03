import { TradingMission } from '@/types/trading';
import { CriteriaStatus, MissionResult } from '@/hooks/useMissionEngine';

interface MissionDebriefProps {
  mission: TradingMission;
  result: MissionResult;
  criteriaStatus: CriteriaStatus[];
  missionScore?: number;
  onClose: () => void;
  onRetry: () => void;
}

export function MissionDebrief({
  mission,
  result,
  criteriaStatus,
  missionScore,
  onClose,
  onRetry,
}: MissionDebriefProps) {
  const isSuccess = result === 'success';
  const accent = isSuccess ? '#00d4aa' : '#f59e0b';
  const metCount = criteriaStatus.filter(c => c.isMet).length;
  const totalCount = criteriaStatus.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      data-testid="mission-debrief"
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl overflow-hidden"
        style={{
          background: 'rgba(8,12,20,0.97)',
          border: `1px solid ${accent}40`,
          boxShadow: `0 0 40px ${accent}20`,
        }}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ background: `${accent}20`, border: `2px solid ${accent}`, color: accent }}
            >
              {isSuccess ? '✓' : '!'}
            </div>
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: accent }}
              >
                {isSuccess ? 'Mission Complete' : 'Mission Incomplete'}
              </div>
              <div className="text-sm font-bold text-foreground">{mission.title}</div>
            </div>
          </div>

          <p className="text-sm leading-relaxed mb-5 text-muted-foreground">
            {isSuccess ? mission.successMessage : mission.failureMessage}
          </p>

          {mission.id === 'm13-mission' && missionScore !== undefined && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)' }}>
              <div className="text-xs text-muted-foreground mb-1">Final Exam Score</div>
              <div className="text-3xl font-bold" style={{ color: missionScore >= 70 ? '#00d4aa' : '#f59e0b' }}>
                {missionScore}/100
              </div>
              <div className="text-xs mt-1" style={{ color: missionScore >= 70 ? '#00d4aa' : '#f59e0b' }}>
                {missionScore >= 70 ? 'PROFESSIONAL TRADER — GRADUATED' : `Need 70 to graduate. Score: ${missionScore}`}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-5">
            <div className="text-xs text-muted-foreground mb-2">
              Criteria: {metCount}/{totalCount}
            </div>
            {criteriaStatus.map(c => (
              <div
                key={c.id}
                className="flex items-start gap-2 text-xs"
                data-testid={`criterion-${c.id}`}
              >
                <span
                  className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-[1px]"
                  style={{
                    background: c.isMet ? 'rgba(29,210,120,0.2)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${c.isMet ? '#1dd278' : '#ef4444'}`,
                    color: c.isMet ? '#1dd278' : '#ef4444',
                  }}
                >
                  {c.isMet ? '✓' : '✗'}
                </span>
                <span className={c.isMet ? 'text-foreground' : 'text-muted-foreground'}>
                  {c.description}
                </span>
              </div>
            ))}
          </div>

          {isSuccess && (
            <div
              className="text-xs font-mono mb-4 p-2 rounded"
              style={{
                background: 'rgba(0,212,170,0.08)',
                border: '1px solid rgba(0,212,170,0.2)',
                color: '#00d4aa',
              }}
            >
              +{mission.xpReward} XP earned
            </div>
          )}

          <div className="flex gap-2">
            {isSuccess ? (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                style={{ background: '#00d4aa', color: '#080c14' }}
                data-testid="button-mission-continue"
              >
                CONTINUE →
              </button>
            ) : (
              <>
                <button
                  onClick={onRetry}
                  className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: 'rgba(0,212,170,0.15)',
                    border: '1px solid #00d4aa',
                    color: '#00d4aa',
                  }}
                  data-testid="button-mission-retry"
                >
                  TRY AGAIN
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-lg text-sm font-bold transition-all opacity-60 hover:opacity-100"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  data-testid="button-mission-dismiss"
                >
                  DISMISS
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
