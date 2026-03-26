import { CandlestickChart } from '@/components/CandlestickChart';
import { CoachPanel } from '@/components/CoachPanel';
import { TradingControls } from '@/components/TradingControls';
import { StatsBar, AchievementPopup } from '@/components/StatsBar';
import { TradeHistory } from '@/components/TradeHistory';
import { PhaseBadge } from '@/components/PhaseBadge';
import { useTradingEngine } from '@/hooks/useTradingEngine';
import { Pause, Play, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    candles,
    trades,
    activeTrade,
    coachMessages,
    stats,
    currentPrice,
    unrealizedPnl,
    supportResistance,
    newAchievement,
    isPaused,
    setIsPaused,
    openTrade,
    closeTrade,
  } = useTradingEngine();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AchievementPopup achievement={newAchievement} />

      {/* Header */}
      <header className="border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            Trade<span className="text-primary">School</span>
          </h1>
          <PhaseBadge currentPhase={stats.phase} totalXpEarned={stats.xp} />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Stats */}
      <div className="px-4 py-2">
        <StatsBar stats={stats} />
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 px-4 pb-4 min-h-0">
        {/* Chart + Controls */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Chart */}
          <div className="flex-1 bg-card border border-border rounded-lg p-2 min-h-[300px]">
            <CandlestickChart
              candles={candles}
              support={supportResistance.support}
              resistance={supportResistance.resistance}
              entryPrice={activeTrade?.entryPrice}
            />
          </div>

          {/* Controls + History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TradingControls
              activeTrade={activeTrade}
              currentPrice={currentPrice}
              unrealizedPnl={unrealizedPnl}
              balance={stats.balance}
              onBuy={() => openTrade('buy')}
              onSell={() => openTrade('sell')}
              onClose={closeTrade}
            />
            <TradeHistory trades={trades} />
          </div>
        </div>

        {/* Coach Panel */}
        <div className="w-full lg:w-80 xl:w-96 bg-card border border-border rounded-lg overflow-hidden flex flex-col max-h-[300px] lg:max-h-none">
          <CoachPanel messages={coachMessages} />
        </div>
      </div>
    </div>
  );
};

export default Index;
