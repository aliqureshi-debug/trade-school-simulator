import { useRef, useEffect, useCallback, useState } from 'react';
import { Candle, SRZone } from '@/types/trading';
import { ActiveAnnotation } from '@/hooks/useLessonEngine';

interface CandlestickChartProps {
  candles: Candle[];
  srZones: SRZone[];
  entryPrice?: number;
  stopLoss?: number | null;
  takeProfit?: number | null;
  ema9?: number[];
  ema21?: number[];
  annotations?: ActiveAnnotation[];
  dimForLesson?: boolean;
}

interface CrosshairState {
  x: number;
  y: number;
  visible: boolean;
  candle: Candle | null;
  candleIndex: number;
}

function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, text?: string) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  if (text) {
    ctx.font = 'bold 10px Inter';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, (x1 + x2) / 2, (y1 + y2) / 2 - 6);
  }
}

export function CandlestickChart({
  candles,
  srZones,
  entryPrice,
  stopLoss,
  takeProfit,
  ema9 = [],
  ema21 = [],
  annotations = [],
  dimForLesson = false,
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
    annotations.forEach(a => {
      if (a.priceRef) allPrices.push(a.priceRef);
      if (a.candleRef && visible.length > 0) {
        const refMap: Record<string, number> = { 'last': 0, 'last-1': 1, 'last-2': 2, 'last-3': 3, 'last-4': 4, 'last-5': 5 };
        const idx = visible.length - 1 - (refMap[a.candleRef] ?? 0);
        if (idx >= 0 && idx < visible.length) {
          allPrices.push(visible[idx].high, visible[idx].low);
        }
      }
    });

    const rawMin = Math.min(...allPrices);
    const rawMax = Math.max(...allPrices);
    const pad = (rawMax - rawMin) * 0.12 || 2;
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

    // S/R zones
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

    // Entry / SL / TP lines
    if (entryPrice) {
      const entryY = priceToY(entryPrice);
      ctx.strokeStyle = 'hsla(174, 100%, 37%, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(chartLeft, entryY); ctx.lineTo(chartRight, entryY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(174, 100%, 37%)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`ENTRY ${entryPrice.toFixed(2)}`, chartRight - 2, entryY - 3);
    }
    if (stopLoss) {
      const slY = priceToY(stopLoss);
      ctx.strokeStyle = 'hsla(348, 100%, 55%, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(chartLeft, slY); ctx.lineTo(chartRight, slY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'hsl(348, 100%, 55%)';
      ctx.font = 'bold 9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`SL  ${stopLoss.toFixed(2)}`, chartRight - 2, slY - 3);
    }
    if (takeProfit) {
      const tpY = priceToY(takeProfit);
      ctx.strokeStyle = 'hsla(152, 100%, 39%, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(chartLeft, tpY); ctx.lineTo(chartRight, tpY); ctx.stroke();
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
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
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
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, highY); ctx.lineTo(x, lowY); ctx.stroke();
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(Math.abs(openY - closeY), 1.5);
      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyH);
      const volH = (candle.volume / maxVolume) * volumeHeight;
      const volY = height - volH;
      ctx.fillStyle = isGreen ? 'hsla(152, 100%, 39%, 0.25)' : 'hsla(348, 100%, 55%, 0.25)';
      ctx.fillRect(x - bodyWidth / 2, volY, bodyWidth, volH);
    });

    // Dim overlay for lesson mode
    if (dimForLesson) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, 0, width, chartHeight + 24);
    }

    // Lesson annotations
    if (annotations.length > 0) {
      const refMap: Record<string, number> = { 'last': 0, 'last-1': 1, 'last-2': 2, 'last-3': 3, 'last-4': 4, 'last-5': 5 };

      const getCandleX = (ref: string): number => {
        const offset = refMap[ref] ?? 0;
        const idx = visible.length - 1 - offset;
        if (idx < 0) return chartLeft + candleSlotWidth * 0.5;
        return chartLeft + (idx + 0.5) * candleSlotWidth;
      };

      const getCandleMidY = (ref: string): number => {
        const offset = refMap[ref] ?? 0;
        const idx = visible.length - 1 - offset;
        if (idx < 0 || idx >= visible.length) return chartHeight / 2;
        const c = visible[idx];
        return priceToY((c.high + c.low) / 2);
      };

      const getCandleHighY = (ref: string): number => {
        const offset = refMap[ref] ?? 0;
        const idx = visible.length - 1 - offset;
        if (idx < 0 || idx >= visible.length) return chartHeight / 2;
        return priceToY(visible[idx].high);
      };

      const getCandleLowY = (ref: string): number => {
        const offset = refMap[ref] ?? 0;
        const idx = visible.length - 1 - offset;
        if (idx < 0 || idx >= visible.length) return chartHeight / 2;
        return priceToY(visible[idx].low);
      };

      const currentPrice = visible[visible.length - 1]?.close ?? 100;

      for (const ann of annotations) {
        const alpha = ann.animateIn === 'fade' ? Math.min(1, ann.progress * 2) : 1;
        const color = ann.color ?? '#00d4aa';
        ctx.globalAlpha = alpha;

        const cx = ann.candleRef ? getCandleX(ann.candleRef) : (ann.x ?? chartRight * 0.7);
        const cy = ann.priceRef
          ? priceToY(ann.priceRef)
          : ann.priceDelta !== undefined
          ? priceToY(currentPrice + ann.priceDelta)
          : ann.candleRef
          ? getCandleMidY(ann.candleRef)
          : (ann.y ?? chartHeight / 2);

        switch (ann.type) {
          case 'arrow': {
            const drawProgress = Math.min(1, ann.progress * 1.5);
            const x2 = cx;
            const y2 = cy - 20;
            const x1 = cx - 20;
            const y1 = cy + 20;
            const currX = x1 + (x2 - x1) * drawProgress;
            const currY = y1 + (y2 - y1) * drawProgress;
            drawArrow(ctx, x1, y1, currX, currY, color, drawProgress > 0.8 ? ann.text : undefined);
            break;
          }
          case 'label': {
            ctx.font = 'bold 11px Inter';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            const labelY = ann.candleRef ? getCandleHighY(ann.candleRef) - 12 : cy - 12;
            ctx.fillText(ann.text ?? '', cx, labelY);
            break;
          }
          case 'circle': {
            const pulse = 0.8 + Math.sin(Date.now() / 300) * 0.2;
            const radius = 16 + (1 - ann.progress) * 8;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2 * pulse;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * ann.progress, 0, Math.PI * 2);
            ctx.stroke();
            break;
          }
          case 'line': {
            const drawProgress = Math.min(1, ann.progress * 2);
            const lineY = ann.priceRef ? priceToY(ann.priceRef) : ann.priceDelta !== undefined ? priceToY(currentPrice + ann.priceDelta) : cy;
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(chartLeft, lineY);
            ctx.lineTo(chartLeft + (chartRight - chartLeft) * drawProgress, lineY);
            ctx.stroke();
            ctx.setLineDash([]);
            if (ann.text && drawProgress > 0.7) {
              ctx.font = 'bold 10px Inter';
              ctx.fillStyle = color;
              ctx.textAlign = 'right';
              ctx.fillText(ann.text, chartRight - 4, lineY - 4);
            }
            break;
          }
          case 'bracket': {
            const topY = ann.candleRef ? getCandleHighY(ann.candleRef) : cy - 20;
            const botY = ann.candleRef ? getCandleLowY(ann.candleRef) : cy + 20;
            const bx = cx + 12;
            const drawProgress = Math.min(1, ann.progress * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(bx, topY);
            ctx.lineTo(bx, topY + (botY - topY) * drawProgress);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(bx - 4, topY);
            ctx.lineTo(bx + 4, topY);
            ctx.stroke();
            if (drawProgress > 0.95 && ann.text) {
              ctx.beginPath();
              ctx.moveTo(bx - 4, botY);
              ctx.lineTo(bx + 4, botY);
              ctx.stroke();
              ctx.font = 'bold 10px Inter';
              ctx.fillStyle = color;
              ctx.textAlign = 'left';
              ctx.fillText(ann.text, bx + 6, (topY + botY) / 2 + 4);
            }
            break;
          }
          case 'highlight': {
            const topY = ann.candleRef ? getCandleHighY(ann.candleRef) - 2 : cy - 20;
            const botY = ann.candleRef ? getCandleLowY(ann.candleRef) + 2 : cy + 20;
            const slotStart = cx - candleSlotWidth / 2;
            const hexColor = color.replace('#', '');
            const r = parseInt(hexColor.slice(0, 2), 16);
            const g = parseInt(hexColor.slice(2, 4), 16);
            const b = parseInt(hexColor.slice(4, 6), 16);
            ctx.fillStyle = ann.color ?? `rgba(${r},${g},${b},0.2)`;
            ctx.fillRect(slotStart, topY, candleSlotWidth, botY - topY);
            break;
          }
          case 'band': {
            const bandPrice = ann.priceDelta !== undefined ? currentPrice + ann.priceDelta : ann.priceRef ?? currentPrice;
            const bandY = priceToY(bandPrice);
            const bandH = Math.max(20, Math.abs(priceToY(bandPrice - 1) - priceToY(bandPrice)));
            ctx.fillStyle = ann.color ?? 'rgba(0,212,170,0.12)';
            ctx.fillRect(chartLeft, bandY - bandH / 2, chartRight - chartLeft, bandH);
            if (ann.text) {
              ctx.font = 'bold 10px Inter';
              ctx.fillStyle = color;
              ctx.textAlign = 'right';
              ctx.fillText(ann.text, chartRight - 4, bandY + 4);
            }
            break;
          }
          case 'crossout': {
            const topY = ann.candleRef ? getCandleHighY(ann.candleRef) : cy - 15;
            const botY = ann.candleRef ? getCandleLowY(ann.candleRef) : cy + 15;
            const slotStart = cx - candleSlotWidth * 0.4;
            const slotEnd = cx + candleSlotWidth * 0.4;
            const drawProgress = Math.min(1, ann.progress * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(slotStart, topY);
            ctx.lineTo(slotStart + (slotEnd - slotStart) * drawProgress, topY + (botY - topY) * drawProgress);
            ctx.stroke();
            if (drawProgress > 0.5) {
              ctx.beginPath();
              ctx.moveTo(slotEnd, topY);
              ctx.lineTo(slotEnd - (slotEnd - slotStart) * (drawProgress - 0.5) * 2, topY + (botY - topY) * (drawProgress - 0.5) * 2);
              ctx.stroke();
            }
            break;
          }
        }

        ctx.globalAlpha = 1;
        ctx.textAlign = 'left';
      }
    }

    // Current price line
    const lastCandle = visible[visible.length - 1];
    const prevCandle = visible[visible.length - 2];
    const lastY = priceToY(lastCandle.close);
    const priceUp = !prevCandle || lastCandle.close >= prevCandle.close;

    priceLabelAnimRef.current = (priceLabelAnimRef.current + 0.05) % (Math.PI * 2);
    const labelOpacity = 0.75 + Math.sin(priceLabelAnimRef.current) * 0.25;

    ctx.strokeStyle = priceUp ? `hsla(152,100%,39%,0.5)` : `hsla(348,100%,55%,0.5)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(chartLeft, lastY); ctx.lineTo(chartRight, lastY); ctx.stroke();
    ctx.setLineDash([]);

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
      ctx.beginPath(); ctx.moveTo(ch.x, 0); ctx.lineTo(ch.x, height - volumeHeight); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, ch.y); ctx.lineTo(chartRight, ch.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [candles, srZones, entryPrice, stopLoss, takeProfit, ema9, ema21, annotations, dimForLesson]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => drawChart());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [drawChart]);

  useEffect(() => { drawChart(); }, [drawChart]);

  useEffect(() => {
    let animId: number;
    const loop = () => { drawChart(); animId = requestAnimationFrame(loop); };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [drawChart]);

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

    const zoom = zoomRef.current;
    const startIdx = Math.max(0, candles.length - zoom - panOffsetRef.current);
    const endIdx = Math.max(1, candles.length - panOffsetRef.current);
    const vis = candles.slice(startIdx, endIdx);
    const candleSlotWidth = (rect.width - 60) / vis.length;
    const candleIdx = Math.max(0, Math.min(vis.length - 1, Math.floor(x / candleSlotWidth)));
    const candle = vis[candleIdx] ?? null;

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

  const handleMouseUp = useCallback(() => { isDraggingRef.current = false; }, []);

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
        data-testid="candlestick-chart"
      />
      {ch.visible && ch.candle && (
        <div
          className="absolute top-2 left-2 pointer-events-none z-10"
          style={{ background: 'rgba(13,18,28,0.92)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 10px', backdropFilter: 'blur(4px)' }}
        >
          <div className="flex gap-3 text-[10px] font-mono">
            <span className="text-muted-foreground">O</span>
            <span>{ch.candle.open.toFixed(2)}</span>
            <span className="text-muted-foreground">H</span>
            <span style={{ color: 'hsl(152,100%,39%)' }}>{ch.candle.high.toFixed(2)}</span>
            <span className="text-muted-foreground">L</span>
            <span style={{ color: 'hsl(348,100%,55%)' }}>{ch.candle.low.toFixed(2)}</span>
            <span className="text-muted-foreground">C</span>
            <span style={{ color: ch.candle.close >= ch.candle.open ? 'hsl(152,100%,39%)' : 'hsl(348,100%,55%)' }}>
              {ch.candle.close.toFixed(2)}
            </span>
            <span className="text-muted-foreground">Vol</span>
            <span>{ch.candle.volume.toLocaleString()}</span>
          </div>
        </div>
      )}
      <div className="absolute bottom-1 right-16 flex gap-3 text-[9px] pointer-events-none text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-[2px] inline-block" style={{ background: 'hsla(45,100%,60%,0.7)' }} />EMA 9
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-[2px] inline-block" style={{ background: 'hsla(280,80%,70%,0.7)' }} />EMA 21
        </span>
      </div>
    </div>
  );
}
