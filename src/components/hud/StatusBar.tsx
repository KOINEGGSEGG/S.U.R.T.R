import { motion, AnimatePresence } from 'framer-motion';
import { useSurtr } from '@/state/SurtrContext';
import { STATE_LABELS, SURTR_CONFIG } from '@/config/surtr';

export function StatusBar() {
  const { state, error } = useSurtr();
  const accent = SURTR_CONFIG.accentColor;
  const isError = state === 'ERROR';

  return (
    <div className="pointer-events-none absolute top-0 left-0 right-0 flex justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 rounded-full border px-4 py-1.5 backdrop-blur-md"
          style={{
            borderColor: isError ? '#ef444440' : `${accent}30`,
            background: isError ? '#ef444408' : `${accent}08`,
          }}
        >
          <motion.div
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: isError ? '#ef4444' : accent,
              boxShadow: `0 0 8px ${isError ? '#ef4444' : accent}`,
            }}
            animate={{
              opacity: state === 'IDLE' ? [0.4, 1, 0.4] : 1,
              scale: state === 'LISTENING' ? [1, 1.4, 1] : 1,
            }}
            transition={{
              duration: state === 'IDLE' ? 2 : 0.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <span
            className="text-xs font-medium tracking-[0.3em] uppercase"
            style={{ color: isError ? '#ef4444' : `${accent}cc` }}
          >
            {isError && error ? error : STATE_LABELS[state]}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
