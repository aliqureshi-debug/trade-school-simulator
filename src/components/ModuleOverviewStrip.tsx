import { useState } from 'react';
import { AcademyModule, LessonProgress } from '@/types/trading';
import { ACADEMY_MODULES, isLessonUnlocked } from '@/lib/academy';

interface ModuleOverviewStripProps {
  lessonProgress: LessonProgress;
  currentModule: AcademyModule;
  onStartLesson: (lessonId: string) => void;
  onStartMission: () => void;
  onReplayLesson: (lessonId: string) => void;
  isLessonActive: boolean;
  isMissionActive: boolean;
}

export function ModuleOverviewStrip({
  lessonProgress,
  currentModule,
  onStartLesson,
  onStartMission,
  onReplayLesson,
  isLessonActive,
  isMissionActive,
}: ModuleOverviewStripProps) {
  const [showReview, setShowReview] = useState(false);

  const { completedLessonIds, completedMissionIds } = lessonProgress;
  const missionUnlocked = currentModule.lessons.every(l => completedLessonIds.includes(l.id));
  const missionComplete = completedMissionIds.includes(currentModule.mission.id);

  const allCompletedLessons = ACADEMY_MODULES
    .flatMap(m => m.lessons)
    .filter(l => completedLessonIds.includes(l.id));

  const tierColors: Record<string, string> = {
    RECRUIT: '#3b82f6',
    TRADER: '#00d4aa',
    PROFESSIONAL: '#a855f7',
  };
  const tierColor = tierColors[currentModule.tierName] ?? '#00d4aa';

  const nextUncompletedLesson = currentModule.lessons.find(l => !completedLessonIds.includes(l.id));

  if (isLessonActive || isMissionActive) return null;

  return (
    <div
      className="w-full"
      style={{
        background: 'rgba(8,12,20,0.8)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 16px',
      }}
      data-testid="module-overview-strip"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-[2px] rounded"
            style={{ background: `${tierColor}20`, color: tierColor }}
          >
            {currentModule.tierName}
          </span>
          <span className="text-xs font-bold text-foreground">
            Module {currentModule.id}: {currentModule.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-1">
          {currentModule.lessons.map((lesson, i) => {
            const isDone = completedLessonIds.includes(lesson.id);
            const isCurrent = !isDone && (i === 0 || completedLessonIds.includes(`m${currentModule.id}-l${i}`));

            return (
              <button
                key={lesson.id}
                onClick={() => isDone ? onReplayLesson(lesson.id) : (isCurrent ? onStartLesson(lesson.id) : undefined)}
                title={`L${i + 1}: ${lesson.title}${isDone ? ' (completed)' : ''}`}
                data-testid={`lesson-dot-${lesson.id}`}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: `2px solid ${isDone ? tierColor : isCurrent ? tierColor : 'rgba(255,255,255,0.15)'}`,
                  background: isDone ? tierColor : 'transparent',
                  cursor: isDone || isCurrent ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  animation: isCurrent ? 'pulse 2s infinite' : 'none',
                  flexShrink: 0,
                }}
              />
            );
          })}

          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${missionComplete ? '#f59e0b' : missionUnlocked ? '#f59e0b' : 'rgba(255,255,255,0.15)'}`,
              background: missionComplete ? '#f59e0b' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              marginLeft: 4,
              animation: missionUnlocked && !missionComplete ? 'pulse 2s infinite' : 'none',
            }}
            title={missionComplete ? 'Mission complete' : missionUnlocked ? 'Mission ready' : 'Complete all lessons to unlock'}
          >
            ★
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!missionComplete && (
            <button
              onClick={() => {
                if (nextUncompletedLesson) {
                  onStartLesson(nextUncompletedLesson.id);
                } else if (missionUnlocked) {
                  onStartMission();
                }
              }}
              className="px-3 py-1 rounded text-xs font-bold transition-all"
              style={{
                background: 'rgba(0,212,170,0.15)',
                border: '1px solid #00d4aa',
                color: '#00d4aa',
                cursor: 'pointer',
              }}
              data-testid="button-continue-module"
            >
              {nextUncompletedLesson
                ? (completedLessonIds.length === 0 ? 'START →' : 'CONTINUE →')
                : missionUnlocked
                ? 'START MISSION →'
                : '—'}
            </button>
          )}

          {missionComplete && (
            <span className="text-xs" style={{ color: '#f59e0b' }}>
              ✓ Module Complete
            </span>
          )}

          {allCompletedLessons.length > 0 && (
            <button
              onClick={() => setShowReview(v => !v)}
              className="text-[10px] underline underline-offset-2 opacity-60 hover:opacity-100"
              style={{ color: '#94a3b8' }}
              data-testid="button-toggle-review"
            >
              {showReview ? 'Hide review' : 'Review lessons'}
            </button>
          )}
        </div>
      </div>

      {showReview && (
        <div
          className="mt-3 flex flex-wrap gap-1"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}
        >
          {allCompletedLessons.map(lesson => (
            <button
              key={lesson.id}
              onClick={() => onReplayLesson(lesson.id)}
              className="text-[10px] px-2 py-1 rounded transition-all hover:opacity-80"
              style={{
                background: 'rgba(0,212,170,0.08)',
                border: '1px solid rgba(0,212,170,0.2)',
                color: '#94a3b8',
              }}
              data-testid={`button-replay-${lesson.id}`}
            >
              M{lesson.moduleId}.L{lesson.lessonNumber}: {lesson.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
