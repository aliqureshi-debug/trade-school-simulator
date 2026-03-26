import { useEffect, useRef } from 'react';
import { CoachMessage } from '@/types/trading';
import { GraduationCap } from 'lucide-react';

interface CoachPanelProps {
  messages: CoachMessage[];
}

const modeBadge = {
  explain: { label: 'LEARN', className: 'bg-primary/20 text-primary' },
  guide: { label: 'ACTION', className: 'bg-success/20 text-success' },
  debrief: { label: 'REVIEW', className: 'bg-xp/20 text-xp' },
};

export function CoachPanel({ messages }: CoachPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Trading Coach</h3>
          <p className="text-xs text-muted-foreground">Always watching, always teaching</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg) => {
          const badge = modeBadge[msg.mode];
          return (
            <div key={msg.id} className="coach-gradient rounded-lg p-3 border border-border/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badge.className}`}>
                  {badge.label}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed">{msg.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
