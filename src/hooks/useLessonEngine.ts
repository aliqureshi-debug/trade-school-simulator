import { useState, useCallback, useRef, useEffect } from 'react';
import { ARIALesson, LessonAnnotation, LessonProgress } from '@/types/trading';

export type LessonState = 'idle' | 'playing' | 'complete';

export interface ActiveAnnotation extends LessonAnnotation {
  progress: number;
}

export interface LessonEngineState {
  lessonState: LessonState;
  currentLesson: ARIALesson | null;
  elapsedMs: number;
  typewriterText: string;
  activeAnnotations: ActiveAnnotation[];
  canAdvance: boolean;
  lessonComplete: boolean;
}

export interface LessonEngineActions {
  startLesson: (lesson: ARIALesson) => void;
  advanceLesson: () => void;
  skipLesson: () => void;
  resetLesson: () => void;
}

const CHARS_PER_SEC_NORMAL = 28;
const CHARS_PER_SEC_FAST = 65;

export function useLessonEngine(
  lessonProgress: LessonProgress,
  onLessonComplete: (lessonId: string) => void
): LessonEngineState & LessonEngineActions {
  const [lessonState, setLessonState] = useState<LessonState>('idle');
  const [currentLesson, setCurrentLesson] = useState<ARIALesson | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [typewriterText, setTypewriterText] = useState('');
  const [activeAnnotations, setActiveAnnotations] = useState<ActiveAnnotation[]>([]);
  const [canAdvance, setCanAdvance] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const completedRef = useRef(false);

  const charsPerMs = lessonProgress.lessonSpeed === 'instant'
    ? Infinity
    : (lessonProgress.lessonSpeed === 'fast' ? CHARS_PER_SEC_FAST : CHARS_PER_SEC_NORMAL) / 1000;

  const runLoop = useCallback((lesson: ARIALesson) => {
    const tick = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      setElapsedMs(elapsed);

      const totalDurationMs = lesson.duration * 1000;

      if (lessonProgress.lessonSpeed === 'instant') {
        setTypewriterText(lesson.narration);
        setActiveAnnotations(lesson.annotationSequence.map(a => ({ ...a, progress: 1 })));
        setCanAdvance(true);
      } else {
        const charsToShow = Math.floor(elapsed * charsPerMs);
        setTypewriterText(lesson.narration.slice(0, charsToShow));
        const narrationDone = charsToShow >= lesson.narration.length;

        const annotations: ActiveAnnotation[] = [];
        for (const ann of lesson.annotationSequence) {
          if (elapsed >= ann.startAtMs) {
            const progress = Math.min(1, (elapsed - ann.startAtMs) / ann.durationMs);
            annotations.push({ ...ann, progress });
          }
        }
        setActiveAnnotations(annotations);

        const timeAdvance = elapsed >= totalDurationMs + 5000;
        setCanAdvance(narrationDone || timeAdvance);
      }

      if (!completedRef.current) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [charsPerMs, lessonProgress.lessonSpeed]);

  const startLesson = useCallback((lesson: ARIALesson) => {
    cancelAnimationFrame(animFrameRef.current);
    completedRef.current = false;
    startTimeRef.current = Date.now();
    setCurrentLesson(lesson);
    setLessonState('playing');
    setElapsedMs(0);
    setTypewriterText('');
    setActiveAnnotations([]);
    setCanAdvance(false);
    setLessonComplete(false);

    if (lessonProgress.lessonSpeed === 'instant') {
      setTypewriterText(lesson.narration);
      setActiveAnnotations(lesson.annotationSequence.map(a => ({ ...a, progress: 1 })));
      setCanAdvance(true);
    } else {
      runLoop(lesson);
    }
  }, [runLoop, lessonProgress.lessonSpeed]);

  const advanceLesson = useCallback(() => {
    if (!currentLesson || !canAdvance) return;
    cancelAnimationFrame(animFrameRef.current);
    completedRef.current = true;
    setLessonState('complete');
    setLessonComplete(true);
    onLessonComplete(currentLesson.id);
  }, [currentLesson, canAdvance, onLessonComplete]);

  const skipLesson = useCallback(() => {
    if (!currentLesson) return;
    cancelAnimationFrame(animFrameRef.current);
    completedRef.current = true;
    setTypewriterText(currentLesson.narration);
    setActiveAnnotations(currentLesson.annotationSequence.map(a => ({ ...a, progress: 1 })));
    setCanAdvance(true);
    setLessonState('complete');
    setLessonComplete(true);
    onLessonComplete(currentLesson.id);
  }, [currentLesson, onLessonComplete]);

  const resetLesson = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    completedRef.current = true;
    setLessonState('idle');
    setCurrentLesson(null);
    setElapsedMs(0);
    setTypewriterText('');
    setActiveAnnotations([]);
    setCanAdvance(false);
    setLessonComplete(false);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    lessonState,
    currentLesson,
    elapsedMs,
    typewriterText,
    activeAnnotations,
    canAdvance,
    lessonComplete,
    startLesson,
    advanceLesson,
    skipLesson,
    resetLesson,
  };
}
