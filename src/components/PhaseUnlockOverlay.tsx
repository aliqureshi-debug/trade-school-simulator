import { motion, AnimatePresence } from 'framer-motion';
import { Phase } from '@/types/trading';

interface PhaseUnlockOverlayProps {
  visible: boolean;
  phase: Phase | null;
}

export function PhaseUnlockOverlay({ visible, phase }: PhaseUnlockOverlayProps) {
  return (
    <AnimatePresence>
      {visible && phase && (
        <motion.div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ background: 'rgba(7, 12, 22, 0.92)', backdropFilter: 'blur(8px)' }}
        >
          {/* Particles */}
          {Array.from({ length: 30 }).map((_, i) => {
            const angle = (i / 30) * Math.PI * 2;
            const dist = 120 + Math.random() * 180;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            const size = 2 + Math.random() * 4;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: size,
                  height: size,
                  background: 'hsl(174, 100%, 37%)',
                  left: '50%',
                  top: '50%',
                }}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{ x, y, opacity: 0 }}
                transition={{ duration: 1.5, delay: Math.random() * 0.4, ease: 'easeOut' }}
              />
            );
          })}

          {/* Content */}
          <div className="text-center space-y-6 px-8 max-w-lg">
            {/* Phase badge */}
            <motion.div
              className="text-[11px] font-bold text-primary tracking-[0.3em] uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Phase {phase.id} Unlocked
            </motion.div>

            {/* Title */}
            <motion.h1
              className="text-4xl font-bold text-foreground"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
              style={{ textShadow: '0 0 40px hsl(174, 100%, 37%)' }}
            >
              {phase.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {phase.subtitle}
            </motion.p>

            {/* ARIA avatar */}
            <motion.div
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{
                  border: '2px solid hsl(174, 100%, 37%)',
                  boxShadow: '0 0 40px rgba(0, 190, 180, 0.5)',
                  background: 'rgba(0, 190, 180, 0.1)',
                }}
              >
                🎓
              </div>
              <p className="text-sm text-primary font-medium">ARIA is ready to brief you</p>
            </motion.div>

            {/* Dismiss hint */}
            <motion.p
              className="text-[10px] text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              Continuing in a moment...
            </motion.p>
          </div>

          {/* Glowing border ring */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ border: '2px solid transparent' }}
            animate={{
              boxShadow: [
                'inset 0 0 80px rgba(0,190,180,0.05)',
                'inset 0 0 120px rgba(0,190,180,0.15)',
                'inset 0 0 80px rgba(0,190,180,0.05)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
