import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Bug } from 'lucide-react';
import { SURTR_STATES, SURTR_CONFIG } from '@/config/surtr';
import type { SurtrState } from '@/types/surtr';

interface Props {
  currentState: SurtrState;
  onStateChange: (state: SurtrState) => void;
}

export function StateSwitcher({ currentState, onStateChange }: Props) {
  const [open, setOpen] = useState(false);
  const accent = SURTR_CONFIG.accentColor;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <motion.button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-sm"
        style={{ borderColor: `${accent}30`, background: `${accent}08` }}
        title="Developer state tester"
      >
        <Bug size={12} style={{ color: accent }} />
        <span className="text-[10px] font-medium tracking-wider uppercase" style={{ color: `${accent}aa` }}>
          States
        </span>
      </motion.button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 flex flex-col gap-1 rounded-lg border p-2 backdrop-blur-md"
          style={{ borderColor: `${accent}20`, background: '#000000c0' }}
        >
          {SURTR_STATES.map((s) => (
            <button
              key={s}
              onClick={() => onStateChange(s)}
              className="rounded px-3 py-1 text-left text-[11px] font-medium tracking-wider uppercase transition-colors"
              style={{
                color: s === currentState ? accent : '#64748b',
                background: s === currentState ? `${accent}15` : 'transparent',
              }}
            >
              {s}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
