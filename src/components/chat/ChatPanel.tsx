import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send } from 'lucide-react';
import { useState } from 'react';
import { useSurtr } from '@/state/SurtrContext';
import { SURTR_CONFIG } from '@/config/surtr';
import type { ChatMessage } from '@/types/surtr';

interface Props {
  open: boolean;
  onClose: () => void;
  onSend: (text: string) => void;
  thinking: boolean;
}

export function ChatPanel({ open, onClose, onSend, thinking }: Props) {
  const { messages } = useSurtr();
  const accent = SURTR_CONFIG.accentColor;
  const glow = SURTR_CONFIG.accentGlow;
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: open ? 0 : '100%', opacity: open ? 1 : 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 z-30 flex h-full w-full max-w-md flex-col border-l backdrop-blur-xl"
      style={{
        borderColor: `${accent}20`,
        background: '#000000e0',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: `${accent}15` }}>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 6px ${glow}` }} />
          <span className="text-sm font-medium tracking-wider uppercase" style={{ color: accent }}>
            SURTR
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 transition-colors hover:bg-white/5"
        >
          <X size={16} style={{ color: '#64748b' }} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 && !thinking && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-600">No messages yet. Speak or type to begin.</p>
          </div>
        )}
        <div className="flex flex-col gap-3">
          {messages.map((msg: ChatMessage) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm"
                style={{
                  background: msg.role === 'user' ? `${accent}15` : `${accent}08`,
                  border: `1px solid ${accent}20`,
                  color: msg.role === 'user' ? '#e2e8f0' : `${accent}dd`,
                }}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {thinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-1.5 rounded-2xl px-4 py-3" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t px-5 py-4" style={{ borderColor: `${accent}15` }}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message SURTR..."
            className="flex-1 rounded-full border px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
            style={{
              borderColor: `${accent}25`,
              background: `${accent}05`,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex items-center justify-center rounded-full border p-2.5 transition-colors disabled:opacity-30"
            style={{ borderColor: `${accent}40`, background: `${accent}10` }}
          >
            <Send size={16} style={{ color: accent }} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
