import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from './Logo';
import { Visualizer } from './Visualizer';
import { SURTR_CONFIG, STATE_LABELS } from '@/config/surtr';
import { useSurtr } from '@/state/SurtrContext';
import type { SurtrState } from '@/types/surtr';

interface Props {
  bootProgress: number;
  booted: boolean;
}

export function SurtrStage({ bootProgress, booted }: Props) {
  const { state, error } = useSurtr();
  const accent = SURTR_CONFIG.accentColor;
  const glow = SURTR_CONFIG.accentGlow;

  const intensity =
    state === 'LISTENING' ? 1.2 :
    state === 'SPEAKING' ? 1.5 :
    1;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center">
      {/* Canvas visualizer behind everything */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-[500px] w-[500px] max-h-[80vh] max-w-[80vh]">
          <Visualizer state={state} accentColor={accent} intensity={intensity} />
        </div>
      </div>

      {/* Logo + name */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
          animate={{
            opacity: booted ? 1 : bootProgress,
            scale: booted ? 1 : 0.8 + bootProgress * 0.2,
            filter: booted ? 'blur(0px)' : `blur(${(1 - bootProgress) * 10}px)`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Logo size={140} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, letterSpacing: '0.5em' }}
          animate={{
            opacity: booted ? 1 : Math.max(0, bootProgress - 0.3),
            y: booted ? 0 : 20,
            letterSpacing: booted ? '0.8em' : '0.5em',
          }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mt-8 text-center"
        >
          <h1
            className="text-2xl font-light tracking-[0.8em] uppercase"
            style={{
              color: accent,
              textShadow: `0 0 20px ${glow}`,
            }}
          >
            {SURTR_CONFIG.displayName}
          </h1>
        </motion.div>

        {/* Status text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <p
              className="text-xs font-medium tracking-[0.4em] uppercase"
              style={{
                color: state === 'ERROR' ? '#ef4444' : `${accent}99`,
              }}
            >
              {state === 'ERROR' && error ? error : STATE_LABELS[state]}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
