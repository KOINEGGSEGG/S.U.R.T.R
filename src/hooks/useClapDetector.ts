import { useRef, useState, useCallback, useEffect } from 'react';

export type Sensitivity = 'low' | 'medium' | 'high';

const THRESHOLDS: Record<Sensitivity, number> = {
  low: 0.22,
  medium: 0.14,
  high: 0.08,
};

const CLAP_GAP_MIN = 200;
const CLAP_GAP_MAX = 1500;
const COOLDOWN = 100;

interface Options {
  onDoubleClap: () => void;
  sensitivity?: Sensitivity;
}

export function useClapDetector({ onDoubleClap, sensitivity = 'medium' }: Options) {
  const [isActive, setIsActive] = useState(false);
  const [clapCount, setClapCount] = useState(0);
  const [isSupported] = useState(
    typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      ('AudioContext' in window || 'webkitAudioContext' in window)
  );

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const sensRef = useRef(sensitivity);
  const bgRef = useRef(0.01);
  const lastClapRef = useRef(0);
  const lastSpikeRef = useRef(0);
  const cbRef = useRef(onDoubleClap);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  sensRef.current = sensitivity;
  cbRef.current = onDoubleClap;

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || !runningRef.current) return;

    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);

    bgRef.current = bgRef.current * 0.97 + rms * 0.03;

    const now = performance.now();
    const thresh = Math.max(THRESHOLDS[sensRef.current], bgRef.current * 4);

    if (rms > thresh && now - lastSpikeRef.current > COOLDOWN) {
      lastSpikeRef.current = now;

      if (lastClapRef.current > 0) {
        const gap = now - lastClapRef.current;
        if (gap >= CLAP_GAP_MIN && gap <= CLAP_GAP_MAX) {
          lastClapRef.current = 0;
          setClapCount(0);
          if (resetTimer.current) clearTimeout(resetTimer.current);
          cbRef.current();
        }
      } else {
        lastClapRef.current = now;
        setClapCount(1);
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => {
          setClapCount(0);
          lastClapRef.current = 0;
        }, CLAP_GAP_MAX);
      }
    }

    if (runningRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported || runningRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      if (ctx.state === 'suspended') await ctx.resume();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;

      runningRef.current = true;
      setIsActive(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      // Permission denied or unavailable
    }
  }, [isSupported, loop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    analyserRef.current = null;
    lastClapRef.current = 0;
    bgRef.current = 0.01;
    setIsActive(false);
    setClapCount(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { isSupported, isActive, clapCount, start, stop };
}
