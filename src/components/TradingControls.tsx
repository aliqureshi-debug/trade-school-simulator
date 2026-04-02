import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Trade } from '@/types/trading';
import { ArrowUpCircle, ArrowDownCircle, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradingControlsProps {
  activeTrade: Trade | null;
  currentPrice: number;
  unrealizedPnl: number;
  balance: number;
  lotSize: number;
  stopLoss: number | null;
  takeProfit: number | null;
  cooldownSeconds: number;
  onBuy: () => void;
  onSell: () => void;
  onClose: () => void;
  onLotSizeChange: (v: number) => void;
  onStopLossChange: (v: number | null) => void;
  onTakeProfitChange: (v: number | null) => void;
}

function RiskBar({ risk, maxRisk = 5 }: { risk: number; maxRisk?: number }) {
  const pct = Math.min((risk / maxRisk) * 100, 100);
  const color = risk < 1 ? '#00b88a' : risk < 2 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>
        {risk.toFixed(2)}%
      </span>
    </div>
  );
}

function RRBar({ sl, tp, entry }: { sl: number | null; tp: number | null; entry: number }) {
  if (!sl || !tp) return null;
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  const total = risk + reward;
  if (total === 0) return null;
  const rr = reward / risk;
  const riskPct = (risk / total) * 100;
  const rewardPct = (reward / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
        <span>RISK</span>
        <span className={rr >= 2 ? 'text-profit' : rr >= 1.5 ? 'text-yellow-400' : 'text-loss'}>
          R:R  {rr.toFixed(1)}:1
        </span>
        <span>REWARD</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden flex">
        <div style={{ width: `${riskPct}%`, background: 'hsl(348,100%,55%)' }} />
        <div style={{ width: `${rewardPct}%`, background: 'hsl(152,100%,39%)' }} />
      </div>
    </div>
  );
}

export function TradingControls({
  activeTrade,
  currentPrice,
  unrealizedPnl,
  balance,
  lotSize,
  stopLoss,
  takeProfit,
  cooldownSeconds,
  onBuy,
  onSell,
  onClose,
  onLotSizeChange,
  onStopLossChange,
  onTakeProfitChange,
}: TradingControlsProps) {
  const [slInput, setSlInput] = useState('');
  const [tpInput, setTpInput] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);

  // Sync SL/TP inputs to current price when price changes and fields are empty
  useEffect(() => {
    if (!slInput && !activeTrade) setSlInput('');
    if (!tpInput && !activeTrade) setTpInput('');
  }, [activeTrade, slInput, tpInput]);

  const riskDollars = stopLoss
    ? Math.abs(currentPrice - stopLoss) * lotSize * 100
    : lotSize * currentPrice * 0.01;
  const riskPct = (riskDollars / balance) * 100;

  const handleSLChange = (val: string) => {
    setSlInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onStopLossChange(num);
      // Auto-suggest TP for 2:1
      if (!tpInput) {
        const risk = Math.abs(currentPrice - num);
        const suggestedTP = currentPrice > num ? currentPrice + risk * 2 : currentPrice - risk * 2;
        setTpInput(suggestedTP.toFixed(2));
        onTakeProfitChange(suggestedTP);
      }
    } else {
      onStopLossChange(null);
    }
  };

  const handleTPChange = (val: string) => {
    setTpInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onTakeProfitChange(num);
    } else {
      onTakeProfitChange(null);
    }
  };

  const slPips = stopLoss ? Math.abs(currentPrice - stopLoss).toFixed(2) : null;
  const tpPips = takeProfit ? Math.abs(takeProfit - currentPrice).toFixed(2) : null;

  const disabled = cooldownSeconds > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      {/* Price / Balance */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground">Current Price</p>
          <p className="text-xl font-mono font-bold text-foreground">${currentPrice.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Balance</p>
          <p className="text-xl font-mono font-bold text-foreground">${balance.toFixed(2)}</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTrade ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-3"
          >
            {/* Live P&L */}
            <div className="bg-secondary/40 rounded-lg p-3 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {activeTrade.type.toUpperCase()} @ ${activeTrade.entryPrice.toFixed(2)}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <motion.p
                      key={Math.round(unrealizedPnl)}
                      className={`text-2xl font-mono font-bold ${unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}
                      initial={{ scale: 1.05 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
                    </motion.p>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.abs(currentPrice - activeTrade.entryPrice).toFixed(2)} pts
                    </span>
                  </div>
                </div>
                {!confirmClose ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmClose(true)}
                    className="gap-1 glow-red"
                    data-testid="button-close-trade"
                  >
                    <X className="w-3 h-3" />
                    Close
                  </Button>
                ) : (
                  <div className="flex gap-1.5">
                    <Button variant="destructive" size="sm" onClick={() => { onClose(); setConfirmClose(false); }} data-testid="button-confirm-close">
                      Confirm
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmClose(false)} data-testid="button-cancel-close">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              {activeTrade.stopLoss && (
                <div className="text-[10px] text-muted-foreground font-mono">
                  SL: ${activeTrade.stopLoss.toFixed(2)}
                  {activeTrade.takeProfit && ` · TP: $${activeTrade.takeProfit.toFixed(2)}`}
                  {activeTrade.rrRatio && ` · R:R ${activeTrade.rrRatio}:1`}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-4"
          >
            {/* Lot size */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Lot Size</label>
                <input
                  type="number"
                  min={0.01}
                  max={10}
                  step={0.01}
                  value={lotSize}
                  onChange={e => onLotSizeChange(parseFloat(e.target.value) || 0.01)}
                  className="w-16 text-right text-xs font-mono bg-secondary border border-border rounded px-2 py-0.5 text-foreground"
                  data-testid="input-lot-size"
                />
              </div>
              <Slider
                min={0.01}
                max={1}
                step={0.01}
                value={[lotSize]}
                onValueChange={([v]) => onLotSizeChange(v)}
                className="mb-2"
                data-testid="slider-lot-size"
              />
              <RiskBar risk={riskPct} />
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Risk: ~${riskDollars.toFixed(0)} · {riskPct < 1 ? '✓ Safe' : riskPct < 2 ? '⚠ Moderate' : '⛔ High'}
              </p>
            </div>

            {/* SL / TP */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Stop Loss</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`≈ ${(currentPrice - 1).toFixed(2)}`}
                  value={slInput}
                  onChange={e => handleSLChange(e.target.value)}
                  className="w-full text-xs font-mono bg-secondary border border-border rounded px-2 py-1 text-foreground"
                  data-testid="input-stop-loss"
                />
                {slPips && <p className="text-[9px] text-muted-foreground mt-0.5">{slPips} pts from price</p>}
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">Take Profit</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder={`≈ ${(currentPrice + 2).toFixed(2)}`}
                  value={tpInput}
                  onChange={e => handleTPChange(e.target.value)}
                  className="w-full text-xs font-mono bg-secondary border border-border rounded px-2 py-1 text-foreground"
                  data-testid="input-take-profit"
                />
                {tpPips && <p className="text-[9px] text-muted-foreground mt-0.5">{tpPips} pts from price</p>}
              </div>
            </div>

            <RRBar sl={stopLoss} tp={takeProfit} entry={currentPrice} />

            {/* Cooldown warning */}
            {disabled && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-[10px] text-red-300">
                  Cooldown active — {cooldownSeconds}s remaining. Take a breath.
                </p>
              </div>
            )}

            {/* Buy / Sell */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="buy"
                size="lg"
                onClick={onBuy}
                disabled={disabled}
                className="gap-2 relative"
                data-testid="button-buy"
              >
                {disabled ? (
                  <span className="font-mono text-sm">{cooldownSeconds}s</span>
                ) : (
                  <>
                    <ArrowUpCircle className="w-5 h-5" />
                    BUY
                  </>
                )}
              </Button>
              <Button
                variant="sell"
                size="lg"
                onClick={onSell}
                disabled={disabled}
                className="gap-2"
                data-testid="button-sell"
              >
                {disabled ? (
                  <span className="font-mono text-sm">{cooldownSeconds}s</span>
                ) : (
                  <>
                    <ArrowDownCircle className="w-5 h-5" />
                    SELL
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
