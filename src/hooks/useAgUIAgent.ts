'use client';

import { useState } from 'react';
import type { RomanianAgentState } from '~/lib/ag-ui/types';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

/**
 * Simplified React hook for AG-UI protocol communication
 * Minimal version to fix build errors - to be properly implemented later
 */
export function useAgUIAgent() {
  // State management
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [agentState, setAgentState] = useState<Partial<RomanianAgentState>>({
    conversationId: '',
    userLevel: 'beginner',
    sessionMetrics: {
      pronunciationScores: [],
      grammarCorrections: 0,
      wordsLearned: [],
      culturalNotesShared: 0,
    },
    preferences: {
      voice: 'ro-RO-AlinaNeural',
      learningPace: 'medium',
      focusAreas: [],
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current streaming message
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string;
    content: string;
  } | null>(null);
  
  const [sessionId] = useState('session-' + Date.now());

  // Stub functions
  const sendMessage = async (message: string) => {
    console.log('sendMessage called with:', message);
    // TODO: Implement actual AG-UI communication
  };

  const clearError = () => {
    setError(null);
  };

  return {
    messages,
    agentState,
    streamingMessage,
    isLoading,
    isConnected,
    error,
    sendMessage,
    clearError,
    sessionId,
  };
} 