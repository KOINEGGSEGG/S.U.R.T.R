import type { ChatMessage, AIProvider } from '@/types/surtr';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class GeminiClient implements AIProvider {
  async sendMessage(messages: ChatMessage[], systemPrompt: string): Promise<string> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Backend not configured');
    }

    const apiUrl = `${SUPABASE_URL}/functions/v1/surtr-chat`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const msg = errorBody.error || `Request failed (${response.status})`;
      throw new Error(msg);
    }

    const data = await response.json();

    if (!data.response || typeof data.response !== 'string') {
      throw new Error('Malformed response from AI service');
    }

    return data.response;
  }
}
