import { useEffect, useRef, useState } from 'react';
import { CoachMessage, AriaState } from '@/types/trading';
import { motion, AnimatePresence } from 'framer-motion';

interface CoachPanelProps {
  messages: CoachMessage[];
  ariaState: AriaState;
}

const typeBadge: Record<CoachMessage['type'], { label: string; className: string }> = {
  learn: { label: 'LEARN', className: 'bg-primary/20 text-primary' },
  action: { label: 'ACTION', className: 'bg-emerald-500/20 text-emerald-400' },
  review: { label: 'REVIEW', className: 'bg-yellow-500/20 text-yellow-400' },
  warn: { label: 'WARN', className: 'bg-amber-500/20 text-amber-400' },
  danger: { label: 'DANGER', className: 'bg-red-500/20 text-red-400' },
};

const ariaColors: Record<AriaState, { border: string; glow: string; bg: string; dot: string }> = {
  teal: {
    border: 'hsl(174, 100%, 37%)',
    glow: 'rgba(0, 190, 180, 0.5)',
    bg: 'rgba(0, 190, 180, 0.12)',
    dot: 'hsl(152, 100%, 39%)',
  },
  amber: {
    border: 'hsl(40, 100%, 55%)',
    glow: 'rgba(255, 180, 0, 0.5)',
    bg: 'rgba(255, 180, 0, 0.08)',
    dot: 'hsl(40, 100%, 55%)',
  },
  red: {
    border: 'hsl(0, 90%, 55%)',
    glow: 'rgba(220, 50, 50, 0.5)',
    bg: 'rgba(220, 50, 50, 0.08)',
    dot: 'hsl(0, 90%, 55%)',
  },
};

function TypewriterText({ text, id }: { text: string; id: string }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const prevIdRef = useRef('');

  useEffect(() => {
    if (prevIdRef.current === id) return;
    prevIdRef.current = id;
    indexRef.current = 0;
    setDisplayed('');

    const interval = setInterval(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) clearInterval(interval);
    }, 18);

    return () => clearInterval(interval);
  }, [id, text]);

  return <span>{displayed}</span>;
}

export function CoachPanel({ messages, ariaState }: CoachPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colors = ariaColors[ariaState];
  const lastN = messages.slice(-8);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* ARIA Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border" style={{ background: colors.bg, transition: 'background 0.8s ease' }}>
        <div className="relative shrink-0">
          {/* Breathing border animation */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
            style={{
              border: `2px solid ${colors.border}`,
              boxShadow: `0 0 12px ${colors.glow}`,
              animation: 'ariaBreath 3s ease-in-out infinite',
              background: colors.bg,
              transition: 'border-color 0.8s, box-shadow 0.8s',
            }}
          >
            🎓
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
              style={{ color: colors.border, background: colors.bg, border: `1px solid ${colors.border}`, transition: 'all 0.5s' }}
            >
              {ariaState === 'teal' ? 'Teaching' : ariaState === 'amber' ? 'Caution' : 'Alert'}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">Always watching, always teaching</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
        <AnimatePresence initial={false}>
          {lastN.map((message, idx) => {
            const badge = typeBadge[message.type];
            const isLast = idx === lastN.length - 1;
            const opacity = Math.max(0.3, 0.4 + (idx / lastN.length) * 0.6);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="rounded-lg p-3 border border-border/40"
                style={{ background: 'linear-gradient(135deg, hsl(174 30% 12%), hsl(215 25% 10%))' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}>
                    {badge.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-mono">
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
