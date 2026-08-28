import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { SURTR_CONFIG } from '@/config/surtr';

interface Props {
  onClick: () => void;
  active: boolean;
}

export function ChatToggle({ onClick, active }: Props) {
  const accent = SURTR_CONFIG.accentColor;

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center rounded-full border p-2.5 backdrop-blur-sm transition-colors"
      style={{
        borderColor: active ? `${accent}60` : `${accent}30`,
        background: active ? `${accent}15` : `${accent}08`,
      }}
      title="Toggle text chat"
    >
      <MessageSquare size={16} style={{ color: accent }} />
    </motion.button>
  );
}
