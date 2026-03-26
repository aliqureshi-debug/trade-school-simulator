import { Button } from '@/components/ui/button';
import { Trade } from '@/types/trading';
import { ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';

interface TradingControlsProps {
  activeTrade: Trade | null;
  currentPrice: number;
  unrealizedPnl: number;
  balance: number;
  onBuy: () => void;
  onSell: () => void;
  onClose: () => void;
}

export function TradingControls({
  activeTrade,
  currentPrice,
  unrealizedPnl,
  balance,
  onBuy,
  onSell,
  onClose,
}: TradingControlsProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-muted-foreground">Current Price</p>
          <p className="text-xl font-mono font-bold text-foreground">${currentPrice.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className="text-xl font-mono font-bold text-foreground">${balance.toFixed(2)}</p>
        </div>
      </div>

      {activeTrade ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
            <div>
              <p className="text-xs text-muted-foreground">
                {activeTrade.type.toUpperCase()} @ ${activeTrade.entryPrice.toFixed(2)}
              </p>
              <p className={`text-lg font-mono font-bold ${unrealizedPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={onClose} className="gap-1">
              <X className="w-3 h-3" />
              Close Trade
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="buy" size="lg" onClick={onBuy} className="gap-2">
            <ArrowUpCircle className="w-5 h-5" />
            BUY
          </Button>
          <Button variant="sell" size="lg" onClick={onSell} className="gap-2">
            <ArrowDownCircle className="w-5 h-5" />
            SELL
          </Button>
        </div>
      )}
    </div>
  );
}
