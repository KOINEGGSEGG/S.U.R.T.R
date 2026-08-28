import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { SurtrState, ChatMessage } from '@/types/surtr';

interface SurtrContextValue {
  state: SurtrState;
  previousState: SurtrState | null;
  messages: ChatMessage[];
  error: string | null;
  setState: (state: SurtrState) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  resetToIdle: () => void;
}

type Action =
  | { type: 'SET_STATE'; payload: SurtrState }
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_ERROR'; payload: string | null };

interface SurtrInternalState {
  state: SurtrState;
  previousState: SurtrState | null;
  messages: ChatMessage[];
  error: string | null;
}

const initialState: SurtrInternalState = {
  state: 'STARTING',
  previousState: null,
  messages: [],
  error: null,
};

function reducer(state: SurtrInternalState, action: Action): SurtrInternalState {
  switch (action.type) {
    case 'SET_STATE':
      if (state.state === action.payload) return state;
      return {
        ...state,
        previousState: state.state,
        state: action.payload,
        error: action.payload === 'ERROR' ? state.error : null,
      };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const SurtrContext = createContext<SurtrContextValue | null>(null);

export function SurtrProvider({ children }: { children: ReactNode }) {
  const [internal, dispatch] = useReducer(reducer, initialState);

  const setState = useCallback((s: SurtrState) => {
    dispatch({ type: 'SET_STATE', payload: s });
  }, []);

  const addMessage = useCallback((m: ChatMessage) => {
    dispatch({ type: 'ADD_MESSAGE', payload: m });
  }, []);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, []);

  const setError = useCallback((e: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: e });
  }, []);

  const resetToIdle = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_STATE', payload: 'IDLE' });
  }, []);

  const value: SurtrContextValue = {
    state: internal.state,
    previousState: internal.previousState,
    messages: internal.messages,
    error: internal.error,
    setState,
    addMessage,
    clearMessages,
    setError,
    resetToIdle,
  };

  return <SurtrContext.Provider value={value}>{children}</SurtrContext.Provider>;
}

export function useSurtr() {
  const ctx = useContext(SurtrContext);
  if (!ctx) throw new Error('useSurtr must be used within SurtrProvider');
  return ctx;
}
