import { useState, useCallback, useRef, useEffect } from 'react';
import { SurtrProvider, useSurtr } from '@/state/SurtrContext';
import { BootSequence } from '@/components/boot/BootSequence';
import { SurtrStage } from '@/components/core/SurtrStage';
import { StatusBar } from '@/components/hud/StatusBar';
import { FullscreenToggle } from '@/components/hud/FullscreenToggle';
import { VoiceControls } from '@/components/hud/VoiceControls';
import { StateSwitcher } from '@/components/hud/StateSwitcher';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ChatToggle } from '@/components/chat/ChatToggle';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useClapDetector, type Sensitivity } from '@/hooks/useClapDetector';
import { GeminiClient } from '@/services/ai/geminiClient';
import { SURTR_CONFIG } from '@/config/surtr';
import { supabase } from '@/services/supabase';
import type { ChatMessage } from '@/types/surtr';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function SurtrApp() {
  const { state, setState, messages, addMessage, setError, resetToIdle } = useSurtr();
  const [booted, setBooted] = useState(false);
  const [bootProgress, setBootProgress] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [sensitivity, setSensitivity] = useState<Sensitivity>('medium');

  const aiClient = useRef(new GeminiClient());
  const commandTranscript = useRef('');
  const commandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  const capturingRef = useRef(false);
  const sensitivityLoaded = useRef(false);

  const { isSupported: sttSupported, isListening, start: startListening, stop: stopListening, onResult, onError: onSttError, onEnd: onSttEnd } = useSpeechRecognition();
  const { isSupported: ttsSupported, speak, cancel: cancelSpeech, onStart: onTtsStart, onEnd: onTtsEnd, onError: onTtsError } = useSpeechSynthesis();

  // Load sensitivity from DB
  useEffect(() => {
    if (sensitivityLoaded.current) return;
    sensitivityLoaded.current = true;
    (async () => {
      const { data } = await supabase.from('surtr_settings').select('sensitivity').eq('id', 'singleton').maybeSingle();
      if (data?.sensitivity) setSensitivity(data.sensitivity as Sensitivity);
    })();
  }, []);

  // Save sensitivity to DB
  const updateSensitivity = useCallback(async (s: Sensitivity) => {
    setSensitivity(s);
    await supabase.from('surtr_settings').upsert({ id: 'singleton', sensitivity: s, updated_at: new Date().toISOString() });
  }, []);

  // Clap detector activates SURTR
  const handleDoubleClap = useCallback(() => {
    if (processingRef.current || capturingRef.current || !sttSupported) return;
    capturingRef.current = true;
    setState('LISTENING');
    commandTranscript.current = '';
    startListening();
    commandTimer.current = setTimeout(() => {
      const cmd = commandTranscript.current.trim();
      if (cmd) submitVoiceCommand(cmd);
      else cancelCapture();
    }, 5000);
  }, [sttSupported, startListening, setState]);

  const { isSupported: clapSupported, isActive: clapActive, clapCount, start: startClaps, stop: stopClaps } = useClapDetector({
    onDoubleClap: handleDoubleClap,
    sensitivity,
  });

  const cancelCapture = useCallback(() => {
    capturingRef.current = false;
    if (commandTimer.current) clearTimeout(commandTimer.current);
    commandTranscript.current = '';
    stopListening();
    setState('IDLE');
  }, [stopListening, setState]);

  // Process AI request
  const processAIRequest = useCallback(async (userText: string) => {
    processingRef.current = true;
    stopListening();

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    setState('THINKING');
    setThinking(true);

    try {
      const response = await aiClient.current.sendMessage(
        [...messages, userMessage],
        SURTR_CONFIG.personality
      );

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };
      addMessage(assistantMessage);

      setThinking(false);

      if (ttsEnabled && ttsSupported) {
        setState('SPEAKING');
        speak(response);
      } else {
        processingRef.current = false;
        setState('IDLE');
      }
    } catch (err) {
      setThinking(false);
      processingRef.current = false;
      const msg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(msg);
      setState('ERROR');

      setTimeout(() => {
        resetToIdle();
      }, 4000);
    }
  }, [messages, addMessage, setState, setError, resetToIdle, speak, stopListening, ttsEnabled, ttsSupported]);

  const submitVoiceCommand = useCallback((text: string) => {
    const cleanText = text.trim();
    if (!cleanText || processingRef.current) return;
    if (commandTimer.current) clearTimeout(commandTimer.current);
    commandTranscript.current = '';
    capturingRef.current = false;
    stopListening();
    processAIRequest(cleanText);
  }, [processAIRequest, stopListening]);

  // TTS callbacks
  onTtsStart(() => {
    if (state !== 'SPEAKING') setState('SPEAKING');
  });

  onTtsEnd(() => {
    processingRef.current = false;
    setState('IDLE');
  });

  onTtsError(() => {
    processingRef.current = false;
    setState('IDLE');
  });

  // Speech recognition results during command capture
  onResult((result) => {
    const spoken = result.transcript.trim();
    if (!spoken || processingRef.current || !capturingRef.current) return;

    commandTranscript.current = spoken;

    if (commandTimer.current) clearTimeout(commandTimer.current);

    if (result.isFinal && spoken) {
      submitVoiceCommand(spoken);
      return;
    }

    commandTimer.current = setTimeout(() => {
      const pending = commandTranscript.current.trim();
      if (pending) submitVoiceCommand(pending);
      else cancelCapture();
    }, 1800);
  });

  onSttError(() => {
    cancelCapture();
  });

  onSttEnd(() => {
    if (!processingRef.current && !capturingRef.current) {
      setState('IDLE');
    }
  });

  // Mic toggle controls clap detector
  const handleMicToggle = useCallback(() => {
    if (clapActive) {
      stopClaps();
      cancelSpeech();
      cancelCapture();
    } else {
      startClaps();
    }
  }, [clapActive, startClaps, stopClaps, cancelSpeech, cancelCapture]);

  // TTS toggle
  const handleTtsToggle = useCallback(() => {
    setTtsEnabled((prev) => {
      if (prev && state === 'SPEAKING') {
        cancelSpeech();
        setState('IDLE');
      }
      return !prev;
    });
  }, [state, cancelSpeech, setState]);

  // Chat send
  const handleChatSend = useCallback((text: string) => {
    processAIRequest(text);
  }, [processAIRequest]);

  const handleBootComplete = useCallback(() => {
    setBooted(true);
    setState('IDLE');
    if (clapSupported) startClaps();
  }, [setState, startClaps, clapSupported]);

  // Pause clap detector while SURTR is speaking or thinking
  useEffect(() => {
    if (!clapActive) return;
    if (state === 'SPEAKING' || state === 'THINKING') {
      stopClaps();
    }
  }, [state, clapActive, stopClaps]);

  // Resume clap detector when returning to IDLE
  useEffect(() => {
    if (booted && state === 'IDLE' && !clapActive && clapSupported) {
      const t = setTimeout(() => startClaps(), 300);
      return () => clearTimeout(t);
    }
  }, [booted, state, clapActive, clapSupported, startClaps]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!chatOpen && !(e.target instanceof HTMLInputElement)) {
          const el = document.documentElement;
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          } else {
            el.requestFullscreen().catch(() => {});
          }
        }
      }
      if (e.key === 'Escape') {
        if (chatOpen) {
          setChatOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [chatOpen]);

  const accent = SURTR_CONFIG.accentColor;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, #0a0f14 0%, #000000 70%)`,
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Boot sequence */}
      {!booted && (
        <BootSequence onComplete={handleBootComplete} />
      )}

      {/* Main interface */}
      {booted && (
        <>
          {/* Central stage */}
          <div className="absolute inset-0">
            <SurtrStage bootProgress={bootProgress} booted={booted} />
          </div>

          {/* Top HUD */}
          <StatusBar />

          {/* Top-right controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <ChatToggle onClick={() => setChatOpen(!chatOpen)} active={chatOpen} />
            <FullscreenToggle />
          </div>

          {/* Bottom-center voice controls */}
          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
            <VoiceControls
              micActive={clapActive}
              clapCount={clapCount}
              capturing={capturingRef.current}
              onMicToggle={handleMicToggle}
              ttsEnabled={ttsEnabled}
              onTtsToggle={handleTtsToggle}
              sttSupported={sttSupported}
              clapSupported={clapSupported}
              sensitivity={sensitivity}
              onSensitivityChange={updateSensitivity}
            />
          </div>

          {/* Dev state switcher */}
          <StateSwitcher currentState={state} onStateChange={setState} />

          {/* Chat panel */}
          <ChatPanel
            open={chatOpen}
            onClose={() => setChatOpen(false)}
            onSend={handleChatSend}
            thinking={thinking}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SurtrProvider>
      <SurtrApp />
    </SurtrProvider>
  );
}
