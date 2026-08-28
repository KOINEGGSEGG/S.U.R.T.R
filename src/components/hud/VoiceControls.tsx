import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useSurtr } from '@/state/SurtrContext';
import { SURTR_CONFIG } from '@/config/surtr';
import type { Sensitivity } from '@/hooks/useClapDetector';

interface Props {
  micActive: boolean;
  clapCount: number;
  capturing: boolean;
  onMicToggle: () => void;
  ttsEnabled: boolean;
  onTtsToggle: () => void;
  sttSupported: boolean;
  clapSupported: boolean;
  sensitivity: Sensitivity;
  onSensitivityChange: (s: Sensitivity) => void;
}

const SENSITIVITY_ORDER: Sensitivity[] = ['low', 'medium', 'high'];

export function VoiceControls({
  micActive,
  clapCount,
  capturing,
  onMicToggle,
  ttsEnabled,
  onTtsToggle,
  sttSupported,
  clapSupported,
  sensitivity,
  onSensitivityChange,
}: Props) {
  const { state } = useSurtr();
  const accent = SURTR_CONFIG.accentColor;

  const statusText = !micActive
    ? 'Mic paused'
    : capturing
    ? 'Listening for command'
    : clapCount > 0
    ? 'One... waiting for second'
    : 'Listening for claps';

  return (
    <div className="flex items-center gap-3">
      {/* TTS toggle */}
      <motion.button
        onClick={onTtsToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center rounded-full border p-2.5 backdrop-blur-sm transition-colors"
        style={{
          borderColor: ttsEnabled ? `${accent}40` : '#ffffff15',
          background: ttsEnabled ? `${accent}10` : 'transparent',
        }}
        title={ttsEnabled ? 'Voice responses on' : 'Voice responses off'}
      >
        {ttsEnabled ? (
          <Volume2 size={16} style={{ color: accent }} />
        ) : (
          <VolumeX size={16} style={{ color: '#64748b' }} />
        )}
      </motion.button>

      {/* Mic button */}
      <motion.button
        onClick={onMicToggle}
        disabled={!clapSupported}
        whileHover={{ scale: clapSupported ? 1.1 : 1 }}
        whileTap={{ scale: clapSupported ? 0.95 : 1 }}
        className="relative flex items-center justify-center rounded-full border-2 p-4 backdrop-blur-sm transition-colors disabled:cursor-not-allowed"
        style={{
          borderColor: micActive ? accent : `${accent}40`,
          background: micActive ? `${accent}15` : `${accent}08`,
          boxShadow: micActive ? `0 0 20px ${SURTR_CONFIG.accentGlow}` : 'none',
        }}
        title={clapSupported ? (micActive ? 'Pause clap detection' : 'Enable clap detection') : 'Audio detection not supported'}
      >
        {micActive && (
          <motion.div
            className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: accent }}
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {micActive ? (
          <Mic size={20} style={{ color: accent }} />
        ) : (
          <MicOff size={20} style={{ color: clapSupported ? `${accent}aa` : '#475569' }} />
        )}
      </motion.button>

      {/* Sound wave indicator */}
      <AnimatePresence>
        {micActive && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className="flex items-center gap-1"
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1 rounded-full"
                style={{ backgroundColor: accent }}
                animate={{ height: clapCount > 0 || capturing ? [4, 20, 4] : [4, 9, 4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <span
        className="hidden text-[10px] font-medium tracking-[0.18em] uppercase sm:inline"
        style={{ color: micActive ? `${accent}99` : '#64748b' }}
      >
        {statusText}
      </span>

      {/* Sensitivity selector */}
      {micActive && clapSupported && (
        <div className="ml-2 hidden items-center gap-1 sm:flex">
          {SENSITIVITY_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => onSensitivityChange(s)}
              className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider transition-colors"
              style={{
                color: sensitivity === s ? accent : '#64748b',
                background: sensitivity === s ? `${accent}15` : 'transparent',
                border: `1px solid ${sensitivity === s ? `${accent}40` : 'transparent'}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
