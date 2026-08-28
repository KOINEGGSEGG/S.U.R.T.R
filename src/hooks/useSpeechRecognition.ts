import { useRef, useState, useCallback, useEffect } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  start: () => void;
  stop: () => void;
  onResult: (cb: (result: SpeechRecognitionResult) => void) => void;
  onError: (cb: (error: string) => void) => void;
  onEnd: (cb: () => void) => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const resultCbRef = useRef<((r: SpeechRecognitionResult) => void)>(() => {});
  const errorCbRef = useRef<(e: string) => void>(() => {});
  const endCbRef = useRef<() => void>(() => {});
  const shouldListenRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        resultCbRef.current({
          transcript: result[0].transcript,
          isFinal: result.isFinal,
        });
      }
    };

    recognition.onerror = (event: any) => {
      errorCbRef.current(event.error || 'Speech recognition error');
    };

    recognition.onend = () => {
      setIsListening(false);
      endCbRef.current();
    };

    recognitionRef.current = recognition;

    return () => {
      shouldListenRef.current = false;
      recognition.stop();
    };
  }, [isSupported]);

  const start = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldListenRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // Already started
    }
  }, []);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    shouldListenRef.current = false;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch {
      // Already stopped
    }
  }, []);

  const onResult = useCallback((cb: (r: SpeechRecognitionResult) => void) => {
    resultCbRef.current = cb;
  }, []);

  const onError = useCallback((cb: (e: string) => void) => {
    errorCbRef.current = cb;
  }, []);

  const onEnd = useCallback((cb: () => void) => {
    endCbRef.current = cb;
  }, []);

  return { isSupported, isListening, start, stop, onResult, onError, onEnd };
}
