import { useEffect, useRef } from 'react';
import { CoachMessage, AriaMode } from '@/types/trading';
import { TradingMission } from '@/types/trading';
import { CriteriaStatus } from '@/hooks/useMissionEngine';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachPanelProps {
  messages: CoachMessage[];
  ariaMode: AriaMode;
  cooldownSeconds?: number;
  activeMission?: TradingMission | null;
  criteriaStatus?: CriteriaStatus[];
  missionActive?: boolean;
}

const typeBadge: Record<CoachMessage['type'], { label: string; color: string }> = {
  learn: { label: 'LEARN', color: '#00d4aa' },
  action: { label: 'ACTION', color: '#1dd278' },
  review: { label: 'REVIEW', color: '#facc15' },
  warn: { label: 'WARN', color: '#f59e0b' },
  danger: { label: 'DANGER', color: '#ef4444' },
};

const ariaColors: Record<AriaMode, { border: string; glow: string; bg: string; dot: string; label: string }> = {
  teaching: {
    border: '#00d4aa',
    glow: 'rgba(0,212,170,0.4)',
    bg: 'rgba(0,212,170,0.08)',
    dot: '#00d4aa',
    label: 'TEACHING',
  },
  guiding: {
    border: '#00d4aa',
    glow: 'rgba(0,212,170,0.25)',
    bg: 'rgba(0,212,170,0.06)',
    dot: '#00d4aa',
    label: 'GUIDING',
  },
  watching: {
    border: '#3b82f6',
    glow: 'rgba(59,130,246,0.25)',
    bg: 'rgba(59,130,246,0.06)',
    dot: '#3b82f6',
    label: 'WATCHING',
  },
  caution: {
    border: '#f59e0b',
    glow: 'rgba(245,158,11,0.4)',
    bg: 'rgba(245,158,11,0.08)',
    dot: '#f59e0b',
    label: 'CAUTION',
  },
  danger: {
    border: '#ef4444',
    glow: 'rgba(239,68,68,0.4)',
    bg: 'rgba(239,68,68,0.08)',
    dot: '#ef4444',
    label: 'DANGER',
  },
  celebrating: {
    border: '#1dd278',
    glow: 'rgba(29,210,120,0.5)',
    bg: 'rgba(29,210,120,0.1)',
    dot: '#1dd278',
    label: 'CELEBRATING',
  },
};

function TypewriterText({ text, id }: { text: string; id: string }) {
  const displayedRef = useRef('');
  const indexRef = useRef(0);
  const prevIdRef = useRef('');
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prevIdRef.current === id) return;
    prevIdRef.current = id;
    indexRef.current = 0;
    displayedRef.current = '';

    const interval = setInterval(() => {
      indexRef.current++;
      displayedRef.current = text.slice(0, indexRef.current);
      if (spanRef.current) spanRef.current.textContent = displayedRef.current;
      if (indexRef.current >= text.length) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [id, text]);

  return <span ref={spanRef}></span>;
}

export function CoachPanel({
  messages,
  ariaMode,
  cooldownSeconds = 0,
  activeMission,
  criteriaStatus = [],
  missionActive = false,
}: CoachPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colors = ariaColors[ariaMode];
  const lastN = messages.slice(-8);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isPulsing = ariaMode === 'teaching' || ariaMode === 'celebrating' || ariaMode === 'guiding';

  return (
    <div className="flex flex-col h-full" data-testid="coach-panel">
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0"
        style={{ background: colors.bg, transition: 'background 0.8s ease' }}
      >
        <div className="relative shrink-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
            style={{
              border: `2px solid ${colors.border}`,
              boxShadow: `0 0 12px ${colors.glow}`,
              background: colors.bg,
              color: colors.border,
              transition: 'border-color 0.8s, box-shadow 0.8s',
              animation: isPulsing ? 'pulse 2s ease-in-out infinite' : 'none',
            }}
          >
            A
          </div>
          <div
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-card"
            style={{ background: colors.dot, transition: 'background 0.5s' }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">ARIA</h3>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
              style={{
                color: colors.border,
                background: `${colors.border}18`,
                border: `1px solid ${colors.border}40`,
                transition: 'all 0.5s',
                animation: ariaMode === 'celebrating' ? 'pulse 1s ease-in-out infinite' : 'none',
              }}
            >
              {colors.label}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">
            {ariaMode === 'teaching' && 'Delivering lesson narration'}
            {ariaMode === 'guiding' && 'Guiding your mission'}
            {ariaMode === 'watching' && 'Monitoring your trade'}
            {ariaMode === 'caution' && 'Warning — check your plan'}
            {ariaMode === 'danger' && cooldownSeconds > 0 ? `Cooldown: ${cooldownSeconds}s` : ariaMode === 'danger' ? 'Intervention active' : ''}
            {ariaMode === 'celebrating' && 'Achievement unlocked!'}
          </p>
        </div>

        {cooldownSeconds > 0 && (
          <div
            className="shrink-0 text-xs font-bold font-mono px-2 py-1 rounded"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444' }}
            data-testid="text-cooldown"
          >
            {cooldownSeconds}s
          </div>
        )}
      </div>

      {missionActive && activeMission && criteriaStatus.length > 0 && (
        <div
          className="px-3 py-2 border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}
          data-testid="mission-hud"
        >
          <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#f59e0b' }}>
            MISSION: {activeMission.title}
          </div>
          <div className="space-y-1">
            {criteriaStatus.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 text-[9px]">
                <span
                  className="w-3 h-3 rounded-full shrink-0 flex items-center justify-center"
                  style={{
                    background: c.isMet ? 'rgba(29,210,120,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${c.isMet ? '#1dd278' : 'rgba(255,255,255,0.1)'}`,
                    color: c.isMet ? '#1dd278' : '#4b5563',
                    fontSize: 7,
                  }}
                >
                  {c.isMet ? '✓' : '○'}
                </span>
                <span className={c.isMet ? 'text-foreground' : 'text-muted-foreground'} style={{ lineHeight: 1.3 }}>
                  {c.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        <AnimatePresence initial={false}>
          {lastN.map((message, idx) => {
            const badge = typeBadge[message.type];
            const isLast = idx === lastN.length - 1;
            const opacity = Math.max(0.35, 0.4 + (idx / lastN.length) * 0.6);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="rounded-lg p-2.5 border border-border/30"
                style={{ background: 'rgba(255,255,255,0.025)' }}
                data-testid={isLast ? 'coach-message-latest' : undefined}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="text-[8px] font-bold px-1.5 py-[1px] rounded uppercase"
                    style={{ background: `${badge.color}18`, color: badge.color, border: `1px solid ${badge.color}30` }}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-foreground/90 leading-relaxed">
                  {isLast ? (
                    <TypewriterText text={message.text} id={message.id} />
                  ) : (
                    message.text
                  )}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
