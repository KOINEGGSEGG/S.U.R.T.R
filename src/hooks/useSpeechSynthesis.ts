import { useRef, useState, useCallback, useEffect } from 'react';

interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  cancel: () => void;
  onStart: (cb: () => void) => void;
  onEnd: (cb: () => void) => void;
  onError: (cb: (error: string) => void) => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const startCbRef = useRef<() => void>(() => {});
  const endCbRef = useRef<() => void>(() => {});
  const errorCbRef = useRef<(e: string) => void>(() => {});

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const handleEnd = () => {
      setIsSpeaking(false);
      endCbRef.current();
    };

    const handleError = (event: SpeechSynthesisErrorEvent) => {
      setIsSpeaking(false);
      errorCbRef.current(event.error || 'Speech synthesis error');
    };

    const handleStart = () => {
      setIsSpeaking(true);
      startCbRef.current();
    };

    speechSynthesis.addEventListener('end', handleEnd);
    speechSynthesis.addEventListener('error', handleError);
    speechSynthesis.addEventListener('start', handleStart);

    return () => {
      speechSynthesis.removeEventListener('end', handleEnd);
      speechSynthesis.removeEventListener('error', handleError);
      speechSynthesis.removeEventListener('start', handleStart);
    };
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text) return;

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 0.9;
    utterance.volume = 1.0;

    // Prefer a male English voice for a JARVIS-like feel
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('male')
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSupported]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const onStart = useCallback((cb: () => void) => {
    startCbRef.current = cb;
  }, []);

  const onEnd = useCallback((cb: () => void) => {
    endCbRef.current = cb;
  }, []);

  const onError = useCallback((cb: (e: string) => void) => {
    errorCbRef.current = cb;
  }, []);

  return { isSupported, isSpeaking, speak, cancel, onStart, onEnd, onError };
}
