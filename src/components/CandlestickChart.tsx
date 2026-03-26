import { useRef, useEffect } from 'react';
import { Candle } from '@/types/trading';

interface CandlestickChartProps {
  candles: Candle[];
  support: number;
  resistance: number;
  entryPrice?: number;
}

export function CandlestickChart({ candles, support, resistance, entryPrice }: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const volumeHeight = height * 0.15;
    const chartHeight = height - volumeHeight - 20;

    // Clear
    ctx.fillStyle = 'hsl(215, 28%, 7%)';
    ctx.fillRect(0, 0, width, height);

    const visibleCandles = candles.slice(-60);
    const allPrices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...allPrices, support) - 0.5;
    const maxPrice = Math.max(...allPrices, resistance) + 0.5;
    const priceRange = maxPrice - minPrice;

    const maxVolume = Math.max(...visibleCandles.map(c => c.volume));

    const candleWidth = (width - 40) / visibleCandles.length;
    const bodyWidth = Math.max(candleWidth * 0.6, 3);

    const priceToY = (price: number) => 20 + (1 - (price - minPrice) / priceRange) * chartHeight;

    // Grid lines
    ctx.strokeStyle = 'hsl(215, 20%, 13%)';
    ctx.lineWidth = 0.5;
    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const price = minPrice + (priceRange / gridSteps) * i;
      const y = priceToY(price);
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Price labels
      ctx.fillStyle = 'hsl(215, 15%, 40%)';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), 2, y + 3);
    }

    // Support line
    const supportY = priceToY(support);
    ctx.strokeStyle = 'hsla(152, 100%, 39%, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, supportY);
    ctx.lineTo(width, supportY);
    ctx.stroke();
    ctx.fillStyle = 'hsla(152, 100%, 39%, 0.7)';
    ctx.font = '9px Inter';
    ctx.fillText(`Support: $${support.toFixed(2)}`, width - 120, supportY - 4);

    // Resistance line
    const resistanceY = priceToY(resistance);
    ctx.strokeStyle = 'hsla(348, 100%, 55%, 0.4)';
    ctx.beginPath();
    ctx.moveTo(30, resistanceY);
    ctx.lineTo(width, resistanceY);
    ctx.stroke();
    ctx.fillStyle = 'hsla(348, 100%, 55%, 0.7)';
    ctx.fillText(`Resistance: $${resistance.toFixed(2)}`, width - 140, resistanceY - 4);
    ctx.setLineDash([]);

    // Entry line
    if (entryPrice) {
      const entryY = priceToY(entryPrice);
      ctx.strokeStyle = 'hsla(174, 100%, 37%, 0.6)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, entryY);
      ctx.lineTo(width, entryY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(174, 100%, 37%)';
      ctx.font = '9px Inter';
      ctx.fillText(`Entry: $${entryPrice.toFixed(2)}`, width - 110, entryY + 12);
    }

    // Candles
    visibleCandles.forEach((candle, i) => {
      const x = 35 + i * candleWidth + candleWidth / 2;
      const isGreen = candle.close >= candle.open;

      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      // Wick
      ctx.strokeStyle = isGreen ? 'hsl(152, 100%, 39%)' : 'hsl(348, 100%, 55%)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(openY - closeY), 1);

      if (isGreen) {
        ctx.fillStyle = 'hsl(152, 100%, 39%)';
      } else {
        ctx.fillStyle = 'hsl(348, 100%, 55%)';
      }
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);

      // Volume bars
      const volHeight = (candle.volume / maxVolume) * volumeHeight;
      const volY = height - volHeight;
      ctx.fillStyle = isGreen ? 'hsla(152, 100%, 39%, 0.2)' : 'hsla(348, 100%, 55%, 0.2)';
      ctx.fillRect(x - bodyWidth / 2, volY, bodyWidth, volHeight);
    });

    // Current price indicator
    const lastCandle = visibleCandles[visibleCandles.length - 1];
    const lastY = priceToY(lastCandle.close);
    const isLastGreen = lastCandle.close >= lastCandle.open;

    ctx.fillStyle = isLastGreen ? 'hsl(152, 100%, 39%)' : 'hsl(348, 100%, 55%)';
    ctx.fillRect(width - 70, lastY - 9, 68, 18);
    ctx.fillStyle = 'hsl(215, 28%, 7%)';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(`$${lastCandle.close.toFixed(2)}`, width - 36, lastY + 4);
  }, [candles, support, resistance, entryPrice]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '300px' }}
    />
  );
}
