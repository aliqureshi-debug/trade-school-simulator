import { Trade } from '@/types/trading';
import { History } from 'lucide-react';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const closedTrades = trades.filter(t => t.status === 'closed').slice().reverse();

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <History className="w-3.5 h-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trade History</h3>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {closedTrades.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">No trades yet. Place your first trade!</p>
        ) : (
          <div className="divide-y divide-border">
            {closedTrades.map(trade => (
              <div key={trade.id} className="px-4 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`font-bold font-mono ${trade.type === 'buy' ? 'text-profit' : 'text-loss'}`}>
                    {trade.type.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    ${trade.entryPrice?.toFixed(2)} → ${trade.exitPrice?.toFixed(2)}
                  </span>
                </div>
                <span className={`font-mono font-bold ${(trade.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {(trade.pnl || 0) >= 0 ? '+' : ''}${(trade.pnl || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
