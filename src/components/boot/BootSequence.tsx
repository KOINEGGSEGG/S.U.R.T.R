import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SURTR_CONFIG } from '@/config/surtr';

interface Props {
  onComplete: () => void;
}

const BOOT_LINES = [
  'SURTR CORE v1.0.0',
  'Initializing neural interface...',
  'Loading personality matrix...',
  'Calibrating voice systems...',
  'Establishing AI provider link...',
  'Activating visual cortex...',
  'SURTR is ready.',
];

export function BootSequence({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const accent = SURTR_CONFIG.accentColor;
  const glow = SURTR_CONFIG.accentGlow;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines(i + 1);
        }, 250 + i * 220)
      );
    });

    timers.push(
      setTimeout(() => {
        setFadingOut(true);
      }, 250 + BOOT_LINES.length * 220 + 400)
    );

    timers.push(
      setTimeout(() => {
        onComplete();
      }, 250 + BOOT_LINES.length * 220 + 400 + 600)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      animate={{ opacity: fadingOut ? 0 : 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Central glow ring */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative"
        >
          <div
            className="h-32 w-32 rounded-full border"
            style={{ borderColor: `${accent}30` }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: accent }}
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span
              className="text-4xl font-bold"
              style={{ color: accent, textShadow: `0 0 30px ${glow}` }}
            >
              S
            </span>
          </motion.div>
        </motion.div>

        {/* Boot text lines */}
        <div className="h-40 w-80 font-mono text-xs">
          <AnimatePresence>
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 py-0.5"
              >
                <span style={{ color: accent }}>{'>'}</span>
                <span
                  className={i === BOOT_LINES.length - 1 ? 'font-bold' : ''}
                  style={{
                    color: i === BOOT_LINES.length - 1 ? accent : '#64748b',
                  }}
                >
                  {line}
                </span>
                {i < BOOT_LINES.length - 1 && i === visibleLines - 1 && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    style={{ color: accent }}
                  >
                    _
                  </motion.span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
