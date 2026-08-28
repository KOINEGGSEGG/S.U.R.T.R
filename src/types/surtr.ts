export type SurtrState =
  | 'STARTING'
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SEARCHING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'ERROR';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SurtrConfig {
  name: string;
  displayName: string;
  accentColor: string;
  accentGlow: string;
  personality: string;
  provider: string;
  model: string;
}

export interface AIProvider {
  sendMessage(
    messages: ChatMessage[],
    systemPrompt: string
  ): Promise<string>;
}

export interface STTProvider {
  isSupported: boolean;
  start(): void;
  stop(): void;
  onResult(callback: (transcript: string, isFinal: boolean) => void): void;
  onError(callback: (error: string) => void): void;
}

export interface TTSProvider {
  isSupported: boolean;
  speak(text: string): void;
  cancel(): void;
  onStart(callback: () => void): void;
  onEnd(callback: () => void): void;
  onError(callback: (error: string) => void): void;
}

export interface ToolProvider {
  name: string;
  isAvailable: boolean;
  execute(action: string, params: Record<string, unknown>): Promise<string>;
}

export interface SearchProvider {
  isAvailable: boolean;
  search(query: string): Promise<string>;
}
