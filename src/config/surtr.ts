import type { SurtrConfig, SurtrState } from '@/types/surtr';

export const SURTR_CONFIG: SurtrConfig = {
  name: 'SURTR',
  displayName: 'S.U.R.T.R',
  accentColor: '#22d3ee',
  accentGlow: 'rgba(34, 211, 238, 0.4)',
  personality:
    'You are SURTR — Seriously Useful Robot That Responds. ' +
    'You are a confident, helpful, concise personal AI assistant. ' +
    'You speak naturally and efficiently, like JARVIS. ' +
    'Avoid excessive emojis, generic chatbot language, and repetitive phrases. ' +
    'Keep responses short and natural for voice interaction. ' +
    'Address the user as "sir" occasionally but not every sentence.',
  provider: 'gemini',
  model: 'gemini-3.6-flash',
};

export const SURTR_STATES: SurtrState[] = [
  'STARTING',
  'IDLE',
  'LISTENING',
  'THINKING',
  'SEARCHING',
  'EXECUTING',
  'SPEAKING',
  'ERROR',
];

export const STATE_LABELS: Record<SurtrState, string> = {
  STARTING: 'INITIALIZING',
  IDLE: 'READY',
  LISTENING: 'LISTENING',
  THINKING: 'PROCESSING',
  SEARCHING: 'SEARCHING',
  EXECUTING: 'EXECUTING',
  SPEAKING: 'SPEAKING',
  ERROR: 'SYSTEM ERROR',
};
