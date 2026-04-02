import { useEffect, useState } from 'react';
import { CandlestickChart } from '@/components/CandlestickChart';
import { CoachPanel } from '@/components/CoachPanel';
import { TradingControls } from '@/components/TradingControls';
import { StatsBar, AchievementToast } from '@/components/StatsBar';
import { TradeHistory } from '@/components/TradeHistory';
import { ChallengeCard } from '@/components/ChallengeCard';
import { PhaseUnlockOverlay } from '@/components/PhaseUnlockOverlay';
import { PhaseBadge } from '@/components/PhaseBadge';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { getPhase, getNextPhase } from '@/lib/phases';
import { Pause, Play, GraduationCap, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { sound } from '@/lib/soundEngine';

const MIN_WIDTH = 1280;

const Index = () => {
  const engine = useTradingEngine();
  const {
    candles,
    trades,
    activeTrade,
    coachMessages,
    stats,
    currentPrice,
    unrealizedPnl,
    srZones,
    newAchievement,
    isPaused,
    ariaState,
    cooldownSeconds,
    phaseUnlocking,
    xpGain,
    tradeResult,
    ema9,
    ema21,
    lotSize,
    stopLoss,
    takeProfit,
    setIsPaused,
    openTrade,
    closeTrade,
    setLotSize,
    setStopLoss,
    setTakeProfit,
  } = engine;

  const [muted, setMuted] = useState(false);
  const [screenTooNarrow, setScreenTooNarrow] = useState(window.innerWidth < MIN_WIDTH);

  useEffect(() => {
    const handleResize = () => setScreenTooNarrow(window.innerWidth < MIN_WIDTH);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
  };

  const currentPhase = getPhase(stats.phase);
  const nextPhase = getNextPhase(stats.phase);

  if (screenTooNarrow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3 px-8">
          <div className="text-4xl">🖥️</div>
          <h2 className="text-xl font-bold text-foreground">Please use a wider screen</h2>
          <p className="text-sm text-muted-foreground">TradeSchool requires at least 1280px width for the best experience.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden" style={{ minWidth: `${MIN_WIDTH}px` }}>
      {/* Achievement Toast */}
      <AchievementToast achievement={newAchievement} />

      {/* Phase Unlock Overlay */}
      <PhaseUnlockOverlay visible={phaseUnlocking} phase={nextPhase} />

      {/* Trade result vignette overlay */}
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
                ? 'rgba(29, 184, 138, 0.06)'
                : 'rgba(226, 76, 74, 0.08)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header
        className="border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Trade<span className="text-primary">School</span>
          </h1>
          <PhaseBadge currentPhase={stats.phase} totalXpEarned={stats.xpTotal} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleMute} className="w-8 h-8" data-testid="button-mute">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8"
            data-testid="button-pause"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      </motion.header>

      {/* Stats */}
      <motion.div
        className="px-4 pt-2 pb-1 shrink-0"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
      >
        <StatsBar stats={stats} xpGain={xpGain} />
      </motion.div>

      {/* Main layout */}
      <div className="flex-1 flex gap-3 px-4 pb-3 min-h-0 overflow-hidden">

        {/* Left: Chart + Challenge + Controls/History */}
        <motion.div
          className="flex-1 flex flex-col gap-2.5 min-w-0"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        >
          {/* Challenge card */}
          <ChallengeCard
            phase={currentPhase}
            progress={stats.challengeProgress}
            isComplete={phaseUnlocking}
          />

          {/* Chart */}
          <div className="flex-1 bg-card border border-border rounded-lg p-1 min-h-0 overflow-hidden" style={{ minHeight: 280 }}>
            <CandlestickChart
              candles={candles}
              srZones={srZones}
              entryPrice={activeTrade?.entryPrice}
              stopLoss={activeTrade?.stopLoss ?? stopLoss}
              takeProfit={activeTrade?.takeProfit ?? takeProfit}
              ema9={ema9}
              ema21={ema21}
            />
          </div>

          {/* Controls + History */}
          <div className="grid grid-cols-2 gap-2.5 shrink-0">
            <TradingControls
              activeTrade={activeTrade}
              currentPrice={currentPrice}
              unrealizedPnl={unrealizedPnl}
              balance={stats.balance}
              lotSize={lotSize}
              stopLoss={stopLoss}
              takeProfit={takeProfit}
              cooldownSeconds={cooldownSeconds}
              onBuy={() => openTrade('buy')}
              onSell={() => openTrade('sell')}
              onClose={closeTrade}
              onLotSizeChange={setLotSize}
              onStopLossChange={setStopLoss}
              onTakeProfitChange={setTakeProfit}
            />
            <TradeHistory trades={trades} />
          </div>
        </motion.div>

        {/* Right: ARIA Coach Panel */}
        <motion.div
          className="w-80 xl:w-96 bg-card border border-border rounded-lg overflow-hidden flex flex-col shrink-0"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
        >
          <CoachPanel messages={coachMessages} ariaState={ariaState} />
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
