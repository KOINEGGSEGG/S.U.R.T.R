import { Maximize, Minimize } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFullscreen } from '@/hooks/useFullscreen';
import { SURTR_CONFIG } from '@/config/surtr';

export function FullscreenToggle() {
  const { isFullscreen, toggle } = useFullscreen();
  const accent = SURTR_CONFIG.accentColor;

  return (
    <motion.button
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center rounded-full border p-2.5 backdrop-blur-sm transition-colors"
      style={{
        borderColor: `${accent}30`,
        background: `${accent}08`,
      }}
      title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
    >
      {isFullscreen ? (
        <Minimize size={16} style={{ color: accent }} />
      ) : (
        <Maximize size={16} style={{ color: accent }} />
      )}
    </motion.button>
  );
}
