import { useState } from 'react';
import logoSrc from '@/assets/surtr_logo-removebg-preview.png';

export function Logo({ size = 140 }: { size?: number }) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-full border-2"
        style={{
          width: size,
          height: size,
          borderColor: SURTR_ACCENT,
          boxShadow: `0 0 40px ${SURTR_GLOW}`,
        }}
      >
        <span
          className="text-2xl font-bold tracking-widest"
          style={{ color: SURTR_ACCENT }}
        >
          S
        </span>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt="SURTR"
      onError={() => setError(true)}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: `drop-shadow(0 0 20px ${SURTR_GLOW})`,
      }}
    />
  );
}

const SURTR_ACCENT = '#22d3ee';
const SURTR_GLOW = 'rgba(34, 211, 238, 0.4)';
