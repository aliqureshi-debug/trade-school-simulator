import { ARIALesson } from '@/types/trading';
import { LessonState } from '@/hooks/useLessonEngine';

interface LessonOverlayProps {
  lesson: ARIALesson;
  lessonState: LessonState;
  typewriterText: string;
  canAdvance: boolean;
  onAdvance: () => void;
  onSkip: () => void;
  lessonNumber: number;
  totalLessons: number;
}

export function LessonOverlay({
  lesson,
  lessonState,
  typewriterText,
  canAdvance,
  onAdvance,
  onSkip,
  lessonNumber,
  totalLessons,
}: LessonOverlayProps) {
  const isComplete = lessonState === 'complete';

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-20 pointer-events-auto"
      style={{
        background: 'linear-gradient(to top, rgba(8,12,20,0.98) 0%, rgba(8,12,20,0.92) 70%, transparent 100%)',
        padding: '16px 16px 12px 16px',
        borderTop: '1px solid rgba(0,212,170,0.12)',
      }}
      data-testid="lesson-overlay"
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: 'rgba(0,212,170,0.15)',
            border: '2px solid #00d4aa',
            color: '#00d4aa',
            animation: 'pulse 2s infinite',
          }}
        >
          A
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: '#00d4aa' }}>
              Lesson {lessonNumber}/{totalLessons}
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground truncate">{lesson.title}</span>
          </div>

          <p
            className="text-sm leading-relaxed font-mono"
            style={{ color: '#e2e8f0', minHeight: '3em' }}
            data-testid="lesson-narration"
          >
            {typewriterText}
            {!isComplete && !canAdvance && (
              <span
                className="inline-block w-[2px] h-[14px] ml-[1px] relative top-[2px]"
                style={{
                  background: '#00d4aa',
                  animation: 'blink 1s step-end infinite',
                }}
              />
            )}
          </p>

          {lesson.caption && (
            <p
              className="text-xs mt-2 italic"
              style={{
                color: '#94a3b8',
                borderLeft: '2px solid rgba(0,212,170,0.4)',
                paddingLeft: '8px',
              }}
            >
              {lesson.caption}
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col gap-2 ml-2">
          {canAdvance && (
            <button
              onClick={onAdvance}
              className="px-4 py-2 rounded text-xs font-bold transition-all"
              style={{
                background: isComplete ? '#00d4aa' : 'rgba(0,212,170,0.2)',
                color: isComplete ? '#080c14' : '#00d4aa',
                border: '1px solid #00d4aa',
              }}
              data-testid="button-lesson-next"
            >
              {isComplete ? 'DONE ✓' : 'NEXT →'}
            </button>
          )}
          {!canAdvance && (
            <button
              onClick={onSkip}
              className="px-3 py-1 rounded text-xs transition-opacity hover:opacity-100 opacity-40"
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(148,163,184,0.3)',
              }}
              data-testid="button-lesson-skip"
            >
              SKIP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
