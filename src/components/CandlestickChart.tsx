import { useRef, useEffect, useCallback, useState } from 'react';
import { Candle, SRZone } from '@/types/trading';

interface CandlestickChartProps {
  candles: Candle[];
  srZones: SRZone[];
  entryPrice?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  ema9?: number[];
  ema21?: number[];
}

interface CrosshairState {
  x: number;
  y: number;
  visible: boolean;
  candle: Candle | null;
  candleIndex: number;
}

export function CandlestickChart({
  candles,
  srZones,
  entryPrice,
  stopLoss,
  takeProfit,
  ema9 = [],
  ema21 = [],
}: CandlestickChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panOffsetRef = useRef(0);
  const zoomRef = useRef(60);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const priceLabelAnimRef = useRef(0);
  const [crosshair, setCrosshair] = useState<CrosshairState>({ x: 0, y: 0, visible: false, candle: null, candleIndex: -1 });
  const crosshairRef = useRef<CrosshairState>({ x: 0, y: 0, visible: false, candle: null, candleIndex: -1 });

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;
    const volumeHeight = height * 0.12;
    const priceAxisWidth = 60;
    const chartHeight = height - volumeHeight - 24;
    const chartLeft = 0;
    const chartRight = width - priceAxisWidth;

    // Clamp zoom
    const zoom = Math.max(20, Math.min(120, zoomRef.current));
    zoomRef.current = zoom;

    const totalCandles = candles.length;
    const maxPanOffset = Math.max(0, totalCandles - zoom);
    panOffsetRef.current = Math.max(0, Math.min(maxPanOffset, panOffsetRef.current));

    const startIdx = Math.max(0, totalCandles - zoom - panOffsetRef.current);
    const endIdx = Math.max(1, totalCandles - panOffsetRef.current);
    const visible = candles.slice(startIdx, endIdx);

    if (visible.length === 0) return;

    const allPrices = visible.flatMap(c => [c.high, c.low]);
    srZones.forEach(z => allPrices.push(z.price));
    if (entryPrice) allPrices.push(entryPrice);
    if (stopLoss) allPrices.push(stopLoss);
    if (takeProfit) allPrices.push(takeProfit);

    const rawMin = Math.min(...allPrices);
    const rawMax = Math.max(...allPrices);
    const pad = (rawMax - rawMin) * 0.1 || 2;
    const minPrice = rawMin - pad;
    const maxPrice = rawMax + pad;
    const priceRange = maxPrice - minPrice || 1;

    const priceToY = (p: number) => 12 + (1 - (p - minPrice) / priceRange) * chartHeight;
    const maxVolume = Math.max(...visible.map(c => c.volume), 1);
    const candleSlotWidth = (chartRight - chartLeft) / visible.length;
    const bodyWidth = Math.max(Math.min(candleSlotWidth * 0.65, 16), 2);

    // Background
    ctx.fillStyle = 'hsl(215, 28%, 7%)';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'hsla(215, 20%, 20%, 0.8)';
    ctx.lineWidth = 0.5;
    const gridCount = 6;
    for (let i = 0; i <= gridCount; i++) {
      const price = minPrice + (priceRange / gridCount) * i;
      const y = priceToY(price);
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
      ctx.fillStyle = 'hsl(215, 15%, 45%)';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), chartRight + 4, y + 3);
    }

    // S/R zones as bands
    srZones.forEach(zone => {
      const zoneY = priceToY(zone.price);
      const bandH = Math.max(priceRange > 0 ? (0.5 / priceRange) * chartHeight : 4, 4);

      if (zone.type === 'resistance') {
        ctx.fillStyle = 'rgba(226,76,74,0.08)';
        ctx.fillRect(chartLeft, zoneY - bandH / 2, chartRight - chartLeft, bandH);
        ctx.strokeStyle = 'rgba(226,76,74,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(chartLeft, zoneY);
        ctx.lineTo(chartLeft + 4, zoneY);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(226,76,74,0.3)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(chartLeft + 4, zoneY);
        ctx.lineTo(chartRight, zoneY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(226,76,74,0.8)';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`R  ${zone.price.toFixed(2)}`, chartRight - 2, zoneY - 3);
      } else {
        ctx.fillStyle = 'rgba(29,158,117,0.08)';
        ctx.fillRect(chartLeft, zoneY - bandH / 2, chartRight - chartLeft, bandH);
        ctx.strokeStyle = 'rgba(29,158,117,0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(chartLeft, zoneY);
        ctx.lineTo(chartLeft + 4, zoneY);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(29,158,117,0.3)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(chartLeft + 4, zoneY);
        ctx.lineTo(chartRight, zoneY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(29,158,117,0.8)';
        ctx.font = 'bold 9px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`S  ${zone.price.toFixed(2)}`, chartRight - 2, zoneY + 11);
      }
    });

    // Entry line
    if (entryPrice) {
      const entryY = priceToY(entryPrice);
      ctx.strokeStyle = 'hsla(174, 100%, 37%, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, entryY);
      ctx.lineTo(chartRight, entryY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(174, 100%, 37%)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`ENTRY ${entryPrice.toFixed(2)}`, chartRight - 2, entryY - 3);
    }

    // Stop loss line
    if (stopLoss) {
      const slY = priceToY(stopLoss);
      ctx.strokeStyle = 'hsla(348, 100%, 55%, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, slY);
      ctx.lineTo(chartRight, slY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(348, 100%, 55%)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`SL  ${stopLoss.toFixed(2)}`, chartRight - 2, slY - 3);
    }

    // Take profit line
    if (takeProfit) {
      const tpY = priceToY(takeProfit);
      ctx.strokeStyle = 'hsla(152, 100%, 39%, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(chartLeft, tpY);
      ctx.lineTo(chartRight, tpY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(152, 100%, 39%)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`TP  ${takeProfit.toFixed(2)}`, chartRight - 2, tpY + 11);
    }

    // EMA lines
    if (ema9.length >= endIdx && ema21.length >= endIdx) {
      const visibleEma9 = ema9.slice(startIdx, endIdx);
      const visibleEma21 = ema21.slice(startIdx, endIdx);

      const drawEma = (values: number[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        values.forEach((v, i) => {
          const x = chartLeft + (i + 0.5) * candleSlotWidth;
          const y = priceToY(v);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      };

      drawEma(visibleEma9, 'hsla(45, 100%, 60%, 0.7)');
      drawEma(visibleEma21, 'hsla(280, 80%, 70%, 0.7)');
    }

    // Candles
    visible.forEach((candle, i) => {
      const x = chartLeft + (i + 0.5) * candleSlotWidth;
      const isGreen = candle.close >= candle.open;
      const green = 'hsl(152, 100%, 39%)';
      const red = 'hsl(348, 100%, 55%)';
      const color = isGreen ? green : red;

      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(openY - closeY), 1.5);
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyH);

      // Volume bar
      const volH = (candle.volume / maxVolume) * volumeHeight;
      const volY = height - volH;
      ctx.fillStyle = isGreen ? 'hsla(152, 100%, 39%, 0.25)' : 'hsla(348, 100%, 55%, 0.25)';
      ctx.fillRect(x - bodyWidth / 2, volY, bodyWidth, volH);
    });

    // Current price line (dashed, animated label)
    const lastCandle = visible[visible.length - 1];
    const prevCandle = visible[visible.length - 2];
    const lastY = priceToY(lastCandle.close);
    const priceUp = !prevCandle || lastCandle.close >= prevCandle.close;

    priceLabelAnimRef.current = (priceLabelAnimRef.current + 0.05) % (Math.PI * 2);
    const labelOpacity = 0.75 + Math.sin(priceLabelAnimRef.current) * 0.25;

    ctx.strokeStyle = priceUp ? `hsla(152,100%,39%,0.5)` : `hsla(348,100%,55%,0.5)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(chartLeft, lastY);
    ctx.lineTo(chartRight, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label box on right axis
    const labelColor = priceUp ? 'hsl(152,100%,39%)' : 'hsl(348,100%,55%)';
    ctx.globalAlpha = labelOpacity;
    ctx.fillStyle = labelColor;
    ctx.fillRect(chartRight + 1, lastY - 9, priceAxisWidth - 2, 18);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'hsl(215, 28%, 7%)';
    ctx.font = 'bold 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(lastCandle.close.toFixed(2), chartRight + priceAxisWidth / 2, lastY + 4);

    // Crosshair
    const ch = crosshairRef.current;
    if (ch.visible) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ch.x, 0);
      ctx.lineTo(ch.x, height - volumeHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, ch.y);
      ctx.lineTo(chartRight, ch.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, srZones, entryPrice, stopLoss, takeProfit, ema9, ema21]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => drawChart());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawChart]);

  // Redraw on data change
  useEffect(() => {
    drawChart();
  }, [drawChart]);

  // Animation loop for breathing price label
  useEffect(() => {
    let animId: number;
    const loop = () => {
      drawChart();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [drawChart]);

  // Mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartXRef.current;
      dragStartXRef.current = e.clientX;
      const candlesPerPx = zoomRef.current / (rect.width - 60);
      panOffsetRef.current = Math.max(0, panOffsetRef.current + dx * candlesPerPx);
      return;
    }

    // Find nearest candle
    const zoom = zoomRef.current;
    const startIdx = Math.max(0, candles.length - zoom - panOffsetRef.current);
    const endIdx = Math.max(1, candles.length - panOffsetRef.current);
    const visible = candles.slice(startIdx, endIdx);
    const candleSlotWidth = (rect.width - 60) / visible.length;
    const candleIdx = Math.max(0, Math.min(visible.length - 1, Math.floor(x / candleSlotWidth)));
    const candle = visible[candleIdx] ?? null;

    const state = { x, y, visible: true, candle, candleIndex: candleIdx };
    crosshairRef.current = state;
    setCrosshair(state);
  }, [candles]);

  const handleMouseLeave = useCallback(() => {
    const state = { x: 0, y: 0, visible: false, candle: null, candleIndex: -1 };
    crosshairRef.current = state;
    setCrosshair(state);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 5 : -5;
    zoomRef.current = Math.max(20, Math.min(120, zoomRef.current + delta));
  }, []);

  const ch = crosshair;

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ position: 'relative', willChange: 'transform' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ position: 'absolute', inset: 0, minHeight: '300px', cursor: isDraggingRef.current ? 'grabbing' : 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
      {ch.visible && ch.candle && (
        <div
          className="absolute top-2 left-2 pointer-events-none z-10"
          style={{ background: 'rgba(13,18,28,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 10px', backdropFilter: 'blur(4px)' }}
        >
          <div className="flex gap-3 text-[10px] font-mono">
            <span className="text-muted-foreground">O</span>
            <span className="text-foreground">{ch.candle.open.toFixed(2)}</span>
            <span className="text-muted-foreground">H</span>
            <span className="text-profit">{ch.candle.high.toFixed(2)}</span>
            <span className="text-muted-foreground">L</span>
            <span className="text-loss">{ch.candle.low.toFixed(2)}</span>
            <span className="text-muted-foreground">C</span>
            <span className={ch.candle.close >= ch.candle.open ? 'text-profit' : 'text-loss'}>
              {ch.candle.close.toFixed(2)}
            </span>
            <span className="text-muted-foreground">Vol</span>
            <span className="text-foreground">{ch.candle.volume.toLocaleString()}</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 right-16 flex gap-3 text-[9px] pointer-events-none">
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] inline-block" style={{ background: 'hsla(45,100%,60%,0.7)' }} />EMA 9</span>
        <span className="flex items-center gap-1"><span className="w-3 h-[2px] inline-block" style={{ background: 'hsla(280,80%,70%,0.7)' }} />EMA 21</span>
      </div>
    </div>
  );
}
