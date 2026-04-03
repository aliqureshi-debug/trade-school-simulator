import { useEffect, useState, useCallback } from 'react';
import { CandlestickChart } from '@/components/CandlestickChart';
import { CoachPanel } from '@/components/CoachPanel';
import { TradingControls } from '@/components/TradingControls';
import { StatsBar, AchievementToast } from '@/components/StatsBar';
import { TradeHistory } from '@/components/TradeHistory';
import { LessonOverlay } from '@/components/LessonOverlay';
import { ModuleOverviewStrip } from '@/components/ModuleOverviewStrip';
import { MissionDebrief } from '@/components/MissionDebrief';
import { Onboarding } from '@/components/Onboarding';
import { SettingsModal } from '@/components/SettingsModal';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { useLessonEngine } from '@/hooks/useLessonEngine';
import { useMissionEngine } from '@/hooks/useMissionEngine';
import { ACADEMY_MODULES, getLesson } from '@/lib/academy';
import { detectMarketCondition } from '@/lib/chartEngine';
import {
  getLessonStartMessage, getLessonCompleteMessage, getMissionStartMessage,
  getMissionCompleteMessage, getMissionFailureMessage, getModuleCompleteMessage,
} from '@/lib/ariaEngine';
import { UserProfile, LessonProgress, ARIALesson } from '@/types/trading';
import { GraduationCap, Volume2, VolumeX, Pause, Play, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const engine = useTradingEngine();
  const {
    candles, trades, activeTrade, coachMessages, stats, currentPrice,
    unrealizedPnl, srZones, newAchievement, isPaused, ariaMode,
    cooldownSeconds, xpGain, tradeResult, ema9, ema21,
    lotSize, stopLoss, takeProfit, newsEvent, muted, lessonProgress,
    devMode, candleTickCount,
    setIsPaused, openTrade, closeTrade, setLotSize, setStopLoss, setTakeProfit,
    devUnlockAll, resetProgress, toggleMute, addCoachMessage, addXp,
    unlockAchievement, setLessonProgress, setAriaMode, setMuted,
  } = engine;

  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!lessonProgress.hasCompletedOnboarding);
  const [activeLesson, setActiveLesson] = useState<ARIALesson | null>(null);
  const [isReplayMode, setIsReplayMode] = useState(false);
  const [showMissionDebrief, setShowMissionDebrief] = useState(false);

  // Mission engine
  const missionEng = useMissionEngine();

  const handleLessonComplete = useCallback((lessonId: string) => {
    const lesson = getLesson(lessonId);
    if (!lesson) return;

    const moduleId = lesson.moduleId;
    const currentModule = ACADEMY_MODULES.find(m => m.id === moduleId);
    if (!currentModule) return;

    addCoachMessage(getLessonCompleteMessage(lesson.title, moduleId));
    addXp(20);
    setAriaMode('teaching');

    if (!isReplayMode) {
      setLessonProgress(prev => {
        const alreadyDone = prev.completedLessonIds.includes(lessonId);
        if (alreadyDone) return prev;
        const updated = { ...prev, completedLessonIds: [...prev.completedLessonIds, lessonId] };
        const moduleComplete = currentModule.lessons.every(l => updated.completedLessonIds.includes(l.id));
        if (moduleComplete && !prev.completedLessonIds.includes(lessonId)) {
          const nextIdx = currentModule.lessons.findIndex(l => !updated.completedLessonIds.includes(l.id));
          return {
            ...updated,
            currentLessonIndex: Math.min(currentModule.lessons.length, prev.currentLessonIndex + 1),
          };
        }
        return {
          ...updated,
          currentLessonIndex: Math.min(currentModule.lessons.length, prev.currentLessonIndex + 1),
        };
      });
    }
  }, [addCoachMessage, addXp, setAriaMode, setLessonProgress, isReplayMode]);

  const lessonEng = useLessonEngine(lessonProgress, handleLessonComplete);
  const { lessonState, typewriterText, activeAnnotations, canAdvance } = lessonEng;

  const handleStartLesson = useCallback((lessonId: string) => {
    const lesson = getLesson(lessonId);
    if (!lesson) return;
    setActiveLesson(lesson);
    setIsReplayMode(lessonProgress.completedLessonIds.includes(lessonId));
    setAriaMode('teaching');
    addCoachMessage(getLessonStartMessage(lesson.title, lesson.moduleId));
    lessonEng.startLesson(lesson);
  }, [lessonProgress.completedLessonIds, setAriaMode, addCoachMessage, lessonEng]);

  const handleLessonAdvance = useCallback(() => {
    lessonEng.advanceLesson();
    if (lessonState === 'complete' || canAdvance) {
      setActiveLesson(null);
      lessonEng.resetLesson();

      if (!isReplayMode) {
        const currentModule = ACADEMY_MODULES.find(m => m.id === lessonProgress.currentModuleId);
        if (currentModule) {
          const allDone = currentModule.lessons.every(l =>
            lessonProgress.completedLessonIds.includes(l.id) || l.id === activeLesson?.id
          );
          if (allDone) {
            const missionUnlocked = !lessonProgress.completedMissionIds.includes(currentModule.mission.id);
            if (missionUnlocked) {
              setTimeout(() => {
                addCoachMessage(getMissionStartMessage(currentModule.mission.title, currentModule.mission.briefing));
              }, 500);
            }
          }
        }
      }
    }
  }, [lessonEng, lessonState, canAdvance, isReplayMode, lessonProgress, activeLesson, addCoachMessage]);

  const handleLessonSkip = useCallback(() => {
    lessonEng.skipLesson();
    setActiveLesson(null);
    lessonEng.resetLesson();
  }, [lessonEng]);

  const handleStartMission = useCallback(() => {
    const currentModule = ACADEMY_MODULES.find(m => m.id === lessonProgress.currentModuleId);
    if (!currentModule) return;
    const mission = currentModule.mission;
    setLessonProgress(prev => ({ ...prev, missionActive: true }));
    missionEng.startMission(mission);
    addCoachMessage(getMissionStartMessage(mission.title, mission.briefing));
    setAriaMode('guiding');
  }, [lessonProgress.currentModuleId, setLessonProgress, missionEng, addCoachMessage, setAriaMode]);

  // Watch for mission result
  useEffect(() => {
    if (missionEng.missionResult && !showMissionDebrief) {
      setShowMissionDebrief(true);
    }
  }, [missionEng.missionResult, showMissionDebrief]);

  const handleMissionSuccess = useCallback(() => {
    const mission = missionEng.activeMission;
    if (!mission) return;
    const moduleId = lessonProgress.currentModuleId;
    const xpReward = Math.round(100 + (900 / 12) * (moduleId - 1));
    addXp(xpReward);
    addCoachMessage(getMissionCompleteMessage(mission.successMessage, xpReward, moduleId));

    setLessonProgress(prev => {
      const updated = {
        ...prev,
        completedMissionIds: [...prev.completedMissionIds, mission.id],
        missionActive: false,
        missionState: null,
      };

      const currentModule = ACADEMY_MODULES.find(m => m.id === moduleId);
      if (currentModule) {
        const moduleXpBonus = moduleId * 150;
        setTimeout(() => {
          addXp(moduleXpBonus);
          addCoachMessage(getModuleCompleteMessage(moduleId, currentModule.title, moduleXpBonus));
          if (moduleId === 1) unlockAchievement('module-1');
          if (moduleId === 4) unlockAchievement('module-4');
          if (moduleId === 9) unlockAchievement('module-9');
          if (moduleId === 13) {
            unlockAchievement('module-13');
            unlockAchievement('graduation');
          }
        }, 1000);

        const nextModuleId = Math.min(13, moduleId + 1);
        if (nextModuleId > moduleId) {
          return {
            ...updated,
            currentModuleId: nextModuleId,
            currentLessonIndex: 0,
          };
        }
      }
      return updated;
    });

    missionEng.resetMission();
    setShowMissionDebrief(false);
    setAriaMode('watching');
  }, [missionEng, lessonProgress.currentModuleId, addXp, addCoachMessage, setLessonProgress, unlockAchievement, setAriaMode]);

  const handleMissionRetry = useCallback(() => {
    missionEng.clearResult();
    setShowMissionDebrief(false);
    handleStartMission();
  }, [missionEng, handleStartMission]);

  const handleMissionDismiss = useCallback(() => {
    missionEng.clearResult();
    setShowMissionDebrief(false);
    setLessonProgress(prev => ({ ...prev, missionActive: false }));
    missionEng.resetMission();
    setAriaMode('watching');
    if (missionEng.activeMission) {
      addCoachMessage(getMissionFailureMessage(missionEng.activeMission.failureMessage));
    }
  }, [missionEng, setLessonProgress, setAriaMode, addCoachMessage]);

  // Candle tick — update mission engine
  useEffect(() => {
    if (activeTrade && missionEng.activeMission) {
      missionEng.onCandleTick(activeTrade, trades);
    }
  }, [candleTickCount]);

  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    setLessonProgress(prev => ({
      ...prev,
      hasCompletedOnboarding: true,
      userProfile: profile,
    }));
    setShowOnboarding(false);

    setTimeout(() => {
      const firstModule = ACADEMY_MODULES[0];
      const firstLesson = firstModule?.lessons[0];
      if (firstLesson) {
        handleStartLesson(firstLesson.id);
      }
    }, 800);
  }, [setLessonProgress, handleStartLesson]);

  const handleDevSkipLesson = useCallback(() => {
    if (activeLesson) {
      lessonEng.skipLesson();
      setActiveLesson(null);
      lessonEng.resetLesson();
    }
  }, [activeLesson, lessonEng]);

  const currentModule = ACADEMY_MODULES.find(m => m.id === lessonProgress.currentModuleId) ?? ACADEMY_MODULES[0];

  const currentLessonForStrip = currentModule.lessons[lessonProgress.currentLessonIndex] ?? currentModule.lessons[0];
  const lessonNumberInModule = currentModule.lessons.findIndex(l => l.id === activeLesson?.id) + 1;

  const isLessonActive = lessonState !== 'idle';
  const isMissionActive = lessonProgress.missionActive ?? false;

  const handleOpenTrade = useCallback((type: 'buy' | 'sell') => {
    if (isMissionActive) {
      const violations = missionEng.validateTradeOpen(
        {
          type,
          entryPrice: currentPrice,
          lotSize,
          stopLoss: stopLoss ?? undefined,
          takeProfit: takeProfit ?? undefined,
        },
        stats, candles, detectMarketCondition(candles)
      );

      const blocking = violations.filter(v => v.blocking);
      if (blocking.length > 0) {
        addCoachMessage({
          id: `val-${Date.now()}`,
          text: `Cannot open trade: ${blocking[0].message}`,
          type: 'warn',
          timestamp: Date.now(),
        });
        return;
      }

      violations.filter(v => !v.blocking).forEach(v => {
        addCoachMessage({ id: `val-warn-${Date.now()}`, text: v.message, type: 'warn', timestamp: Date.now() });
      });
    }

    openTrade(type, stopLoss ?? undefined, takeProfit ?? undefined, missionEng.activeMission?.id);
  }, [isMissionActive, missionEng, currentPrice, lotSize, stopLoss, takeProfit, stats, candles, addCoachMessage, openTrade]);

  const handleCloseTrade = useCallback(() => {
    closeTrade();
    if (activeTrade && missionEng.activeMission) {
      const closed = { ...activeTrade, exitPrice: currentPrice, exitTime: Date.now(), pnl: 0, status: 'closed' as const };
      setTimeout(() => {
        missionEng.onTradeClose(closed, stats, candles, detectMarketCondition(candles), trades);
      }, 50);
    }
  }, [closeTrade, activeTrade, missionEng, currentPrice, stats, candles, trades]);

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: 'hsl(215, 28%, 5%)', color: '#e2e8f0' }}
    >
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}

      <AchievementToast achievement={newAchievement} />

      {showMissionDebrief && missionEng.activeMission && (
        <MissionDebrief
          mission={missionEng.activeMission}
          result={missionEng.missionResult}
          criteriaStatus={missionEng.criteriaStatus}
          missionScore={missionEng.missionScore}
          onClose={missionEng.missionResult === 'success' ? handleMissionSuccess : handleMissionDismiss}
          onRetry={handleMissionRetry}
        />
      )}

      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          userProfile={lessonProgress.userProfile}
          muted={muted}
          lessonProgress={lessonProgress}
          onToggleMute={toggleMute}
          onUpdateProfile={(profile) => setLessonProgress(prev => ({ ...prev, userProfile: profile }))}
          onUpdateLessonSpeed={(speed) => setLessonProgress(prev => ({ ...prev, lessonSpeed: speed }))}
          onUpdateCandleSpeed={(ms) => setLessonProgress(prev => ({ ...prev, candleSpeedMs: ms }))}
          onResetProgress={resetProgress}
          devMode={devMode}
          onDevSkipLesson={handleDevSkipLesson}
          onDevUnlockAll={devUnlockAll}
        />
      )}

      <AnimatePresence>
        {tradeResult && (
          <motion.div
            className="fixed inset-0 pointer-events-none z-[9990]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: tradeResult === 'win'
                ? 'rgba(29,210,120,0.06)'
                : 'rgba(239,68,68,0.08)',
            }}
          />
        )}
      </AnimatePresence>

      <header
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(8,12,20,0.9)' }}
        data-testid="header"
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5" style={{ color: '#00d4aa' }} />
          <h1 className="text-base font-bold tracking-tight">
            Trade<span style={{ color: '#00d4aa' }}>School</span>
          </h1>
          {lessonProgress.userProfile && (
            <span className="text-xs text-muted-foreground ml-1">
              — {lessonProgress.userProfile.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            data-testid="button-mute"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            data-testid="button-pause"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.05)' }}
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      <StatsBar stats={stats} xpGain={xpGain} lessonProgress={lessonProgress} />

      <ModuleOverviewStrip
        lessonProgress={lessonProgress}
        currentModule={currentModule}
        onStartLesson={handleStartLesson}
        onStartMission={handleStartMission}
        onReplayLesson={(id) => { setIsReplayMode(true); handleStartLesson(id); }}
        isLessonActive={isLessonActive}
        isMissionActive={isMissionActive}
      />

      <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div
            className="flex-1 relative min-h-0 overflow-hidden"
            style={{ minHeight: 280 }}
          >
            <CandlestickChart
              candles={candles}
              srZones={srZones}
              entryPrice={activeTrade?.entryPrice}
              stopLoss={activeTrade?.stopLoss ?? stopLoss}
              takeProfit={activeTrade?.takeProfit ?? takeProfit}
              ema9={ema9}
              ema21={ema21}
              annotations={activeAnnotations}
              dimForLesson={isLessonActive}
            />

            {isLessonActive && activeLesson && (
              <LessonOverlay
                lesson={activeLesson}
                lessonState={lessonState}
                typewriterText={typewriterText}
                canAdvance={canAdvance}
                onAdvance={handleLessonAdvance}
                onSkip={handleLessonSkip}
                lessonNumber={lessonNumberInModule || 1}
                totalLessons={currentModule.lessons.length}
              />
            )}
          </div>

          <div
            className="shrink-0 flex gap-0"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', height: 180 }}
          >
            <div className="flex-1 min-w-0">
              <TradingControls
                activeTrade={activeTrade}
                currentPrice={currentPrice}
                unrealizedPnl={unrealizedPnl}
                balance={stats.balance}
                lotSize={lotSize}
                stopLoss={stopLoss}
                takeProfit={takeProfit}
                cooldownSeconds={cooldownSeconds}
                onBuy={() => handleOpenTrade('buy')}
                onSell={() => handleOpenTrade('sell')}
                onClose={handleCloseTrade}
                onLotSizeChange={setLotSize}
                onStopLossChange={setStopLoss}
                onTakeProfitChange={setTakeProfit}
              />
            </div>
            <div
              className="w-56 shrink-0 overflow-hidden"
              style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
            >
              <TradeHistory trades={trades} />
            </div>
          </div>
        </div>

        <div
          className="w-72 xl:w-80 shrink-0 flex flex-col min-h-0"
          style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
          data-testid="coach-panel-wrapper"
        >
          <CoachPanel
            messages={coachMessages}
            ariaMode={ariaMode}
            cooldownSeconds={cooldownSeconds}
            activeMission={missionEng.activeMission}
            criteriaStatus={missionEng.criteriaStatus}
            missionActive={isMissionActive}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
