import { useState, useEffect } from 'react';
import { UserProfile, UserArchetype } from '@/types/trading';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const ARCHETYPES: { id: UserArchetype; name: string; description: string; ariaStyle: string }[] = [
  {
    id: 'scalper',
    name: 'Scalper',
    description: 'Fast decisions. Multiple trades per session. High frequency.',
    ariaStyle: 'I will coach you at speed. Quick pattern recognition, immediate feedback, rapid-fire analysis.',
  },
  {
    id: 'swing',
    name: 'Swing Trader',
    description: 'Longer holds. Trend-based entries. Patience over frequency.',
    ariaStyle: 'I will teach you to read trends deeply and hold positions with confidence through normal volatility.',
  },
  {
    id: 'risk-manager',
    name: 'Risk Manager',
    description: 'Capital preservation first. Strict rules. Consistent small gains.',
    ariaStyle: 'I will emphasize position sizing, stop losses, and drawdown management above all else.',
  },
];

const UI_TOOLTIPS = [
  { element: 'Chart', description: 'This is the live price chart. Each bar is a candle — a price bar showing open, high, low, and close for a time period.' },
  { element: 'Module Strip', description: 'This bar shows your current Academy module and lesson progress. Circles are lessons, the star is the mission.' },
  { element: 'Trading Controls', description: 'Here you open BUY and SELL trades, set stop losses and take profits, and manage your position size.' },
  { element: 'ARIA Panel', description: 'This is where I live. I provide real-time coaching, lesson narrations, and mission guidance during every session.' },
  { element: 'Stats Bar', description: 'Your account balance, XP level, win rate, and key statistics are shown here at all times.' },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [screen, setScreen] = useState(1);
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState<UserArchetype | null>(null);
  const [tooltipIdx, setTooltipIdx] = useState(0);
  const [glitching, setGlitching] = useState(true);
  const [typeText, setTypeText] = useState('');

  const fullText = "Welcome to TradeSchool. I am ARIA — your Adaptive Risk Intelligence Agent. I will be with you every step of the way from your very first trade to your graduation as a professional.";

  useEffect(() => {
    if (screen !== 1) return;
    const glitchTimeout = setTimeout(() => setGlitching(false), 1200);
    return () => clearTimeout(glitchTimeout);
  }, [screen]);

  useEffect(() => {
    if (screen !== 1 || glitching) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypeText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(interval);
    }, 22);
    return () => clearInterval(interval);
  }, [screen, glitching]);

  const handleNameSubmit = () => {
    if (name.trim().length < 1 || !archetype) return;
    setScreen(3);
  };

  const handleTooltipNext = () => {
    if (tooltipIdx < UI_TOOLTIPS.length - 1) {
      setTooltipIdx(t => t + 1);
    } else {
      setScreen(4);
    }
  };

  const handleStart = () => {
    if (!archetype) return;
    onComplete({
      name: name.trim() || 'Trader',
      archetype,
      created: Date.now(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(4,6,12,0.98)' }}
      data-testid="onboarding"
    >
      {screen === 1 && (
        <div className="max-w-lg w-full mx-4 text-center">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-8 flex items-center justify-center text-4xl font-bold"
            style={{
              background: glitching
                ? 'rgba(0,212,170,0.3)'
                : 'rgba(0,212,170,0.12)',
              border: '3px solid #00d4aa',
              boxShadow: '0 0 40px rgba(0,212,170,0.3)',
              color: '#00d4aa',
              animation: glitching ? 'glitch 0.1s infinite' : 'pulse 2s infinite',
              transition: 'all 0.5s',
            }}
          >
            {glitching ? (
              <span style={{ fontFamily: 'monospace', letterSpacing: '-2px', opacity: 0.7 }}>▓▒░</span>
            ) : 'A'}
          </div>

          <p
            className="text-base leading-relaxed font-mono mb-8"
            style={{ color: '#e2e8f0', minHeight: '5em' }}
            data-testid="text-onboarding-intro"
          >
            {typeText}
            {typeText.length < fullText.length && (
              <span className="inline-block w-[2px] h-[14px] ml-[1px] relative top-[2px] bg-teal-400" style={{ animation: 'blink 1s step-end infinite' }} />
            )}
          </p>

          {typeText.length >= fullText.length && (
            <button
              onClick={() => setScreen(2)}
              className="px-8 py-3 rounded-lg text-sm font-bold transition-all"
              style={{ background: '#00d4aa', color: '#080c14' }}
              data-testid="button-onboarding-begin"
            >
              BEGIN →
            </button>
          )}
        </div>
      )}

      {screen === 2 && (
        <div className="max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Tell me about yourself</h2>
            <p className="text-sm text-muted-foreground">I adapt my coaching to who you are.</p>
          </div>

          <div className="mb-5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
              Your name (or call sign)
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 rounded-lg text-sm font-mono outline-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e2e8f0',
              }}
              onFocus={e => (e.target.style.borderColor = '#00d4aa')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
              maxLength={30}
              autoFocus
              data-testid="input-name"
            />
          </div>

          <div className="mb-6">
            <label className="text-xs text-muted-foreground uppercase tracking-widest block mb-2">
              Trading archetype
            </label>
            <div className="space-y-2">
              {ARCHETYPES.map(a => (
                <button
                  key={a.id}
                  onClick={() => setArchetype(a.id)}
                  className="w-full text-left p-4 rounded-lg transition-all"
                  style={{
                    background: archetype === a.id ? 'rgba(0,212,170,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${archetype === a.id ? '#00d4aa' : 'rgba(255,255,255,0.1)'}`,
                  }}
                  data-testid={`button-archetype-${a.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center"
                      style={{
                        border: `2px solid ${archetype === a.id ? '#00d4aa' : 'rgba(255,255,255,0.2)'}`,
                        background: archetype === a.id ? '#00d4aa' : 'transparent',
                      }}
                    >
                      {archetype === a.id && <span className="text-[8px] text-black font-bold">✓</span>}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                      {archetype === a.id && (
                        <div className="text-xs mt-1" style={{ color: '#00d4aa' }}>{a.ariaStyle}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleNameSubmit}
            disabled={!name.trim() || !archetype}
            className="w-full py-3 rounded-lg text-sm font-bold transition-all"
            style={{
              background: name.trim() && archetype ? '#00d4aa' : 'rgba(255,255,255,0.05)',
              color: name.trim() && archetype ? '#080c14' : '#4b5563',
              cursor: name.trim() && archetype ? 'pointer' : 'not-allowed',
            }}
            data-testid="button-onboarding-next"
          >
            CONTINUE →
          </button>
        </div>
      )}

      {screen === 3 && (
        <div className="max-w-lg w-full mx-4">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Let me show you around</h2>
            <p className="text-sm text-muted-foreground">
              {tooltipIdx + 1} of {UI_TOOLTIPS.length} — {UI_TOOLTIPS[tooltipIdx].element}
            </p>
          </div>

          <div
            className="p-6 rounded-xl mb-6"
            style={{
              background: 'rgba(0,212,170,0.05)',
              border: '1px solid rgba(0,212,170,0.2)',
            }}
          >
            <div
              className="text-4xl mb-4 text-center"
              style={{ color: '#00d4aa' }}
            >
              {['📊', '🎯', '⚙️', '🤖', '📈'][tooltipIdx]}
            </div>
            <h3 className="text-base font-bold text-foreground text-center mb-3">
              {UI_TOOLTIPS[tooltipIdx].element}
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              {UI_TOOLTIPS[tooltipIdx].description}
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {UI_TOOLTIPS.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i === tooltipIdx ? '#00d4aa' : 'rgba(255,255,255,0.15)',
                  transform: i === tooltipIdx ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          <button
            onClick={handleTooltipNext}
            className="w-full py-3 rounded-lg text-sm font-bold"
            style={{ background: '#00d4aa', color: '#080c14' }}
            data-testid="button-tooltip-next"
          >
            {tooltipIdx < UI_TOOLTIPS.length - 1 ? 'NEXT →' : 'SEE IT ALL →'}
          </button>
        </div>
      )}

      {screen === 4 && (
        <div className="max-w-lg w-full mx-4 text-center">
          <div
            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-2xl"
            style={{ background: 'rgba(0,212,170,0.12)', border: '2px solid #00d4aa', color: '#00d4aa' }}
          >
            A
          </div>

          <h2 className="text-xl font-bold text-foreground mb-3">
            {name ? `Ready, ${name}.` : 'Ready.'}
          </h2>

          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Module 1, Lesson 1 will begin immediately. I will explain everything.
            Watch the chart, listen to my narration, and follow my annotations.
            You will understand price movement within the next 10 minutes.
          </p>

          <div
            className="p-4 rounded-lg mb-6 text-left"
            style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)' }}
          >
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-widest">Your profile</div>
            <div className="text-sm text-foreground font-mono">
              Name: <span style={{ color: '#00d4aa' }}>{name || 'Trader'}</span>
            </div>
            <div className="text-sm text-foreground font-mono">
              Archetype: <span style={{ color: '#00d4aa' }}>{ARCHETYPES.find(a => a.id === archetype)?.name ?? 'Unknown'}</span>
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-4 rounded-lg text-base font-bold transition-all"
            style={{
              background: '#00d4aa',
              color: '#080c14',
              boxShadow: '0 0 24px rgba(0,212,170,0.3)',
            }}
            data-testid="button-start-academy"
          >
            START THE ACADEMY →
          </button>
        </div>
      )}
    </div>
  );
}
