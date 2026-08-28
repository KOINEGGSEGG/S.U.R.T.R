# SURTR — Seriously Useful Robot That Responds

A voice-first, JARVIS-inspired AI assistant interface built for localhost fullscreen use.

## Quick Start

1. The dev server runs automatically — just open the preview.
2. Press **F** to enter fullscreen, **Esc** to exit.
3. Click the **microphone icon** at the bottom to speak to SURTR.
4. Click the **chat icon** (top right) for text mode.
5. Use the **States** panel (bottom left) to test each visual state.

## Your Logo

Place your SURTR logo PNG at:

```
src/assets/surtr-logo.png
```

A placeholder is there now. Replace it with your real logo file (keep the filename `surtr-logo.png`). The logo is referenced in exactly one place (`src/components/core/Logo.tsx`) so swapping it is trivial.

## Gemini API Key

SURTR's backend (a Supabase Edge Function) needs your Gemini API key to function. The key stays server-side and is never exposed to the browser.

**To add it:**
1. Click the **database icon** at the top of the Bolt interface.
2. Go to the **Secrets** tab.
3. Add a secret named `GEMINI_API_KEY` with your API key value.

Without the key, SURTR will show a clear "AI service not configured" error when you try to talk to it.

## Architecture

```
src/
  components/
    core/       — SurtrStage, Logo, Visualizer (canvas animations)
    boot/       — BootSequence (cinematic startup)
    hud/        — StatusBar, FullscreenToggle, VoiceControls, StateSwitcher
    chat/       — ChatPanel, ChatToggle (expandable text mode)
  state/        — SurtrContext (single source of truth for all states)
  hooks/       — useFullscreen, useSpeechRecognition (STT), useSpeechSynthesis (TTS)
  services/
    ai/         — GeminiClient (calls backend edge function)
  config/      — SURTR identity, personality, accent color
  types/        — Shared TypeScript interfaces
  assets/       — surtr-logo.png (your logo)

supabase/
  functions/
    surtr-chat/ — Edge function: proxies Gemini API, keeps key server-side
```

## How It Works

### Voice Interaction
1. Click the mic button → SURTR enters LISTENING state
2. Speak your request → browser Speech Recognition transcribes it
3. SURTR enters THINKING → sends text to the backend edge function
4. Edge function calls Gemini API with the SURTR personality prompt
5. Response comes back → SURTR enters SPEAKING
6. Browser Speech Synthesis reads the response aloud
7. SURTR returns to IDLE

### State System
All visual elements are driven by a single state in `SurtrContext`:
- **STARTING** — Boot sequence
- **IDLE** — Waiting, subtle breathing glow
- **LISTENING** — Reactive waveform rings, expanding pulses
- **THINKING** — Rotating scan segments, orbiting particles
- **SEARCHING** — Expanding search rings, rotating crosshair
- **EXECUTING** — Converging energy lines
- **SPEAKING** — Voice-reactive radial bars
- **ERROR** — Red glitch segments

### Backend
The `surtr-chat` edge function:
- Receives chat messages from the frontend
- Calls the Gemini API using a server-side API key
- Returns the AI response to the frontend
- The API key never reaches the browser

## Future Extensibility

- **AI provider**: Swap Gemini by editing the edge function — the frontend interface stays the same
- **STT provider**: `useSpeechRecognition` can be replaced with Whisper/other — the UI only cares about LISTENING state
- **TTS provider**: `useSpeechSynthesis` can be replaced with ElevenLabs/other — the UI only cares about SPEAKING state
- **Web search**: Add a `surtr-search` edge function; UI already has SEARCHING state
- **Computer tools**: Add a tool router edge function with an allowlist; UI already has EXECUTING state
- **Memory**: Short-term context is in state; long-term memory can use Supabase tables

## Keyboard Shortcuts

- **F** — Toggle fullscreen
- **Esc** — Close chat panel / exit fullscreen
