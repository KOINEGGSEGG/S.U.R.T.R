import { useRef, useEffect } from 'react';
import type { SurtrState } from '@/types/surtr';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  drift: number;
}

interface Ring {
  radius: number;
  opacity: number;
  speed: number;
  lineWidth: number;
}

interface Props {
  state: SurtrState;
  accentColor: string;
  intensity?: number;
}

export function Visualizer({ state, accentColor, intensity = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const intensityRef = useRef(intensity);
  const rafRef = useRef<number>(0);

  stateRef.current = state;
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let time = 0;

    const particles: Particle[] = [];
    const rings: Ring[] = [];
    const waveform: number[] = new Array(80).fill(0);
    const smoothState: { value: number } = { value: 0 };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = height / 2;
    }

    function hexToRgb(hex: string): [number, number, number] {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    function spawnParticle(baseRadius: number, count = 1) {
      for (let c = 0; c < count; c++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.2 + Math.random() * 0.5;
        const dir = Math.random() < 0.5 ? 1 : -1;
        particles.push({
          x: cx + Math.cos(angle) * baseRadius,
          y: cy + Math.sin(angle) * baseRadius,
          vx: Math.cos(angle) * speed * dir,
          vy: Math.sin(angle) * speed * dir,
          life: 0,
          maxLife: 80 + Math.random() * 80,
          size: 0.8 + Math.random() * 1.5,
          drift: (Math.random() - 0.5) * 0.02,
        });
      }
    }

    function spawnRing(startRadius: number, opacity = 0.5, speed = 1.2, lineWidth = 1) {
      rings.push({ radius: startRadius, opacity, speed, lineWidth });
    }

    function drawIdle(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const baseRadius = 120;
      const pulse = (Math.sin(t * 0.012) + 1) / 2;

      // Layered breathing glow
      const glowR = baseRadius + pulse * 15;
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, glowR * 1.8);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.06 + pulse * 0.04})`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},${0.02 + pulse * 0.015})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);

      // Thin outer ring
      ctx!.strokeStyle = `rgba(${r},${g},${b},${0.08 + pulse * 0.06})`;
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius + 35, 0, Math.PI * 2);
      ctx!.stroke();

      // Slow rotating arc — elegant sweep
      const arcAngle = t * 0.003;
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.25)`;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius + 35, arcAngle, arcAngle + Math.PI * 0.25);
      ctx!.stroke();

      // Counter-rotating thin arc
      const arc2 = -t * 0.004;
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.12)`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius + 50, arc2, arc2 + Math.PI * 0.15);
      ctx!.stroke();

      // Inner faint ring
      ctx!.strokeStyle = `rgba(${r},${g},${b},${0.04 + pulse * 0.03})`;
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius - 25, 0, Math.PI * 2);
      ctx!.stroke();

      // Sparse particles
      if (Math.random() < 0.03) spawnParticle(baseRadius);
    }

    function drawListening(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const baseRadius = 120;

      // Smooth waveform with easing
      for (let i = 0; i < waveform.length; i++) {
        const target = (Math.sin(t * 0.04 + i * 0.25) + 1) / 2;
        waveform[i] += (target - waveform[i]) * 0.1;
      }

      // Waveform ring — smooth and organic
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const angle = (i / waveform.length) * Math.PI * 2;
        const r2 = baseRadius + waveform[i] * 25 * intensityRef.current;
        const x = cx + Math.cos(angle) * r2;
        const y = cy + Math.sin(angle) * r2;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.4)`;
      ctx!.stroke();

      // Inner waveform echo
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const angle = (i / waveform.length) * Math.PI * 2;
        const r2 = baseRadius - 15 + waveform[i] * 12 * intensityRef.current;
        const x = cx + Math.cos(angle) * r2;
        const y = cy + Math.sin(angle) * r2;
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.15)`;
      ctx!.stroke();

      // Expanding rings — gentle pulse
      if (t % 45 === 0) spawnRing(75, 0.35, 0.8, 0.5);
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += ring.speed;
        ring.opacity -= 0.005;
        if (ring.opacity <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx!.strokeStyle = `rgba(${r},${g},${b},${ring.opacity})`;
        ctx!.lineWidth = ring.lineWidth;
        ctx!.beginPath();
        ctx!.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // Soft center glow
      const pulse = (Math.sin(t * 0.025) + 1) / 2;
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.9);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.1 * pulse})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);

      if (Math.random() < 0.1) spawnParticle(baseRadius);
    }

    function drawThinking(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const baseRadius = 120;

      // Rotating arc segments — sleek and thin
      const segments = 4;
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2 + t * 0.008;
        const sweep = Math.PI * 0.12;
        const opacity = 0.15 + (Math.sin(t * 0.015 + i * 1.5) + 1) / 2 * 0.2;
        ctx!.strokeStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseRadius + 25, angle, angle + sweep);
        ctx!.stroke();
      }

      // Inner counter-rotating ring
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.1)`;
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius - 30, -t * 0.006, -t * 0.006 + Math.PI * 1.4);
      ctx!.stroke();

      // Scanning line — smooth gradient sweep
      const scanAngle = t * 0.015;
      const scanLen = baseRadius + 50;
      const scanGrad = ctx!.createLinearGradient(
        cx, cy,
        cx + Math.cos(scanAngle) * scanLen,
        cy + Math.sin(scanAngle) * scanLen
      );
      scanGrad.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
      scanGrad.addColorStop(0.7, `rgba(${r},${g},${b},0.08)`);
      scanGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.strokeStyle = scanGrad;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.moveTo(cx, cy);
      ctx!.lineTo(cx + Math.cos(scanAngle) * scanLen, cy + Math.sin(scanAngle) * scanLen);
      ctx!.stroke();

      // Orbiting particles — smooth circular paths
      for (let i = 0; i < 4; i++) {
        const a = t * 0.012 + (i * Math.PI * 2) / 4;
        const orbitR = baseRadius + 15 + Math.sin(t * 0.02 + i) * 5;
        const px = cx + Math.cos(a) * orbitR;
        const py = cy + Math.sin(a) * orbitR;
        ctx!.fillStyle = `rgba(${r},${g},${b},${0.4 + Math.sin(t * 0.03 + i) * 0.2})`;
        ctx!.beginPath();
        ctx!.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Faint outer ring
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.05)`;
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius + 45, 0, Math.PI * 2);
      ctx!.stroke();

      if (Math.random() < 0.06) spawnParticle(baseRadius);
    }

    function drawSpeaking(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const baseRadius = 120;

      // Voice-reactive radial bars — smooth and layered
      const bars = 64;
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const phase = t * 0.035 + i * 0.15;
        const amp = ((Math.sin(phase) + 1) / 2) * intensityRef.current;
        const barLen = 10 + amp * 35;
        const x1 = cx + Math.cos(angle) * baseRadius;
        const y1 = cy + Math.sin(angle) * baseRadius;
        const x2 = cx + Math.cos(angle) * (baseRadius + barLen);
        const y2 = cy + Math.sin(angle) * (baseRadius + barLen);
        ctx!.strokeStyle = `rgba(${r},${g},${b},${0.2 + amp * 0.35})`;
        ctx!.lineWidth = 1.5;
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.stroke();
      }

      // Inner echo bars — thinner, delayed
      for (let i = 0; i < bars; i++) {
        const angle = (i / bars) * Math.PI * 2;
        const phase = t * 0.035 + i * 0.15 + 0.5;
        const amp = ((Math.sin(phase) + 1) / 2) * intensityRef.current;
        const barLen = 5 + amp * 18;
        const x1 = cx + Math.cos(angle) * (baseRadius - 20);
        const y1 = cy + Math.sin(angle) * (baseRadius - 20);
        const x2 = cx + Math.cos(angle) * (baseRadius - 20 - barLen);
        const y2 = cy + Math.sin(angle) * (baseRadius - 20 - barLen);
        ctx!.strokeStyle = `rgba(${r},${g},${b},${0.1 + amp * 0.15})`;
        ctx!.lineWidth = 0.5;
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.stroke();
      }

      // Pulsing core
      const pulse = (Math.sin(t * 0.035) + 1) / 2;
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.7);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.12 * pulse})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);

      if (Math.random() < 0.08) spawnParticle(baseRadius);
    }

    function drawSearching(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const baseRadius = 120;

      // Expanding search rings — gentle and continuous
      if (t % 30 === 0) spawnRing(70, 0.3, 1.0, 0.5);
      for (let i = rings.length - 1; i >= 0; i--) {
        const ring = rings[i];
        ring.radius += ring.speed * 1.2;
        ring.opacity -= 0.006;
        if (ring.opacity <= 0) {
          rings.splice(i, 1);
          continue;
        }
        ctx!.strokeStyle = `rgba(${r},${g},${b},${ring.opacity * 0.5})`;
        ctx!.lineWidth = ring.lineWidth;
        ctx!.beginPath();
        ctx!.arc(cx, cy, ring.radius, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // Rotating crosshair — thin and elegant
      const crossAngle = t * 0.008;
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.2)`;
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const a = crossAngle + (i * Math.PI) / 2;
        ctx!.beginPath();
        ctx!.moveTo(cx + Math.cos(a) * (baseRadius - 5), cy + Math.sin(a) * (baseRadius - 5));
        ctx!.lineTo(cx + Math.cos(a) * (baseRadius + 35), cy + Math.sin(a) * (baseRadius + 35));
        ctx!.stroke();
      }

      // Rotating arc sweep
      const sweepAngle = t * 0.01;
      ctx!.strokeStyle = `rgba(${r},${g},${b},0.25)`;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius + 15, sweepAngle, sweepAngle + Math.PI * 0.2);
      ctx!.stroke();

      if (Math.random() < 0.05) spawnParticle(baseRadius);
    }

    function drawExecuting(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const baseRadius = 120;

      // Energy particles converging to center — smooth
      const lines = 6;
      for (let i = 0; i < lines; i++) {
        const angle = (i / lines) * Math.PI * 2 + t * 0.003;
        const progress = ((t * 0.015 + i * 0.4) % 1);
        const startR = baseRadius + 55;
        const endR = baseRadius - 25;
        const curR = startR + (endR - startR) * progress;
        const x = cx + Math.cos(angle) * curR;
        const y = cy + Math.sin(angle) * curR;
        const alpha = (1 - progress) * 0.5;
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx!.fill();

        // Trailing line
        const trailR = startR + (endR - startR) * Math.max(0, progress - 0.08);
        const tx = cx + Math.cos(angle) * trailR;
        const ty = cy + Math.sin(angle) * trailR;
        ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha * 0.4})`;
        ctx!.lineWidth = 0.5;
        ctx!.beginPath();
        ctx!.moveTo(tx, ty);
        ctx!.lineTo(x, y);
        ctx!.stroke();
      }

      // Pulsing ring
      const pulse = (Math.sin(t * 0.018) + 1) / 2;
      ctx!.strokeStyle = `rgba(${r},${g},${b},${0.2 * pulse})`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius + 5, 0, Math.PI * 2);
      ctx!.stroke();
    }

    function drawError(t: number) {
      const [r, g, b] = hexToRgb('#ef4444');
      const baseRadius = 120;
      const pulse = (Math.sin(t * 0.015) + 1) / 2;

      ctx!.strokeStyle = `rgba(${r},${g},${b},${0.3 * pulse})`;
      ctx!.lineWidth = 1.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx!.stroke();

      // Glitch arcs — subtle and irregular
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const len = 0.15 + Math.random() * 0.25;
        ctx!.strokeStyle = `rgba(${r},${g},${b},${0.2 + Math.random() * 0.2})`;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.arc(cx, cy, baseRadius + 12, a, a + len);
        ctx!.stroke();
      }
    }

    function drawStarting(t: number) {
      const [r, g, b] = hexToRgb(accentColor);
      const progress = Math.min(t / 180, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const baseRadius = 120;

      // Ring fading in with easing
      ctx!.strokeStyle = `rgba(${r},${g},${b},${0.15 * eased})`;
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.arc(cx, cy, baseRadius * eased, 0, Math.PI * 2);
      ctx!.stroke();

      // Faint glow
      const grad = ctx!.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * eased * 1.5);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.05 * eased})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, width, height);

      if (Math.random() < 0.02 * eased) spawnParticle(baseRadius * eased);
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx += p.drift;
        p.vy += p.drift;
        p.life++;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = (1 - p.life / p.maxLife) * 0.4;
        const [r, g, b] = hexToRgb(accentColor);
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }
    }

    function render() {
      ctx!.clearRect(0, 0, width, height);
      const s = stateRef.current;

      switch (s) {
        case 'STARTING': drawStarting(time); break;
        case 'IDLE': drawIdle(time); break;
        case 'LISTENING': drawListening(time); break;
        case 'THINKING': drawThinking(time); break;
        case 'SEARCHING': drawSearching(time); break;
        case 'EXECUTING': drawExecuting(time); break;
        case 'SPEAKING': drawSpeaking(time); break;
        case 'ERROR': drawError(time); break;
      }

      updateParticles();
      time++;
      rafRef.current = requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize);
    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: 'none' }}
    />
  );
}
