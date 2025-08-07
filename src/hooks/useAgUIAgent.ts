'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { EventType } from '@ag-ui/core';
import type { RomanianAgentState, PronunciationData, GrammarData } from '~/lib/ag-ui/types';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    pronunciation?: PronunciationData;
    grammar?: GrammarData;
    speech?: { audioUrl: string; text: string; voice: string };
  };
}

/**
 * React hook for AG-UI protocol communication
 * Handles event-driven communication with Romanian tutor agent
 * Based on: https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/
 */
export function useAgUIAgent() {
  // State management
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [agentState, setAgentState] = useState<Partial<AgentState>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Current streaming message
  const [streamingMessage, setStreamingMessage] = useState<{
    id: string;
    content: string;
    isComplete: boolean;
  } | null>(null);

  // Session management
  const sessionId = useRef<string>(crypto.randomUUID());
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Send message to the Romanian tutor agent
   */
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send to AG-UI endpoint with Server-Sent Events
      const response = await fetch('/api/copilotkit-agui', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: messageContent.trim(),
          sessionId: sessionId.current,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // Process Server-Sent Events stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      setIsConnected(true);

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            setIsConnected(false);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line.length > 6) {
              try {
                const eventData = JSON.parse(line.slice(6));
                handleAgUIEvent(eventData);
              } catch (parseError) {
                console.warn('Failed to parse AG-UI event:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Add error message
      const errorMessage: AgentMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Scuze, a apărut o eroare. Încearcă din nou. (Sorry, an error occurred. Please try again.)',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsConnected(false);
    }
  }, [messages, isLoading]);

  /**
   * Handle AG-UI protocol events
   */
  const handleAgUIEvent = useCallback((event: any) => {
    const { type, data, timestamp, metadata } = event;

    switch (type as EventType) {
      case 'RUN_STARTED':
        setIsLoading(true);
        break;

      case 'RUN_FINISHED':
        setIsLoading(false);
        // Complete any streaming message
        if (streamingMessage && !streamingMessage.isComplete) {
          completeStreamingMessage();
        }
        break;

      case 'TEXT_MESSAGE_START':
        // Start new streaming message
        setStreamingMessage({
          id: data.messageId || crypto.randomUUID(),
          content: '',
          isComplete: false,
        });
        break;

      case 'TEXT_MESSAGE_CONTENT':
        // Append content to streaming message
        if (streamingMessage) {
          setStreamingMessage(prev => prev ? {
            ...prev,
            content: prev.content + (data.content || ''),
          } : null);
        }
        break;

      case 'TEXT_MESSAGE_END':
        // Complete streaming message
        completeStreamingMessage();
        break;

      case 'TOOL_CALL_START':
        // Show tool execution indicator
        console.log(`Starting tool: ${data.toolName}`);
        break;

      case 'TOOL_CALL_END':
        // Handle tool results
        handleToolResult(data);
        break;

      case 'STATE_SNAPSHOT':
      case 'STATE_DELTA':
        // Update agent state
        if (data.state) {
          setAgentState(prev => ({ ...prev, ...data.state }));
        }
        break;

      case 'AGENT_THINKING':
        // Show thinking indicator (optional)
        console.log(`Agent thinking: ${data.message}`);
        break;

      case 'AGENT_ERROR':
        setError(data.error || 'Agent error occurred');
        setIsLoading(false);
        break;

      default:
        console.log('Unhandled AG-UI event:', type, data);
    }
  }, [streamingMessage]);

  /**
   * Complete the currently streaming message
   */
  const completeStreamingMessage = useCallback(() => {
    if (!streamingMessage) return;

    const assistantMessage: AgentMessage = {
      id: streamingMessage.id,
      role: 'assistant',
      content: streamingMessage.content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setStreamingMessage(null);
  }, [streamingMessage]);

  /**
   * Handle tool execution results
   */
  const handleToolResult = useCallback((data: any) => {
    const { toolName, result } = data;

    if (!result) return;

    // Create tool result message based on type
    let resultMessage = '';
    let metadata = {};

    switch (toolName) {
      case 'assess-pronunciation':
        resultMessage = `🎯 Pronunciation Score: ${result.score}/100\n${result.feedback}`;
        if (result.suggestions?.length > 0) {
          resultMessage += `\n\nSuggestions:\n${result.suggestions.map((s: string) => `• ${s}`).join('\n')}`;
        }
        metadata = { pronunciation: result };
        break;

      case 'check-grammar':
        if (result.hasErrors) {
          resultMessage = `📝 Grammar Check: Found some areas for improvement\n${result.feedback}`;
          if (result.corrections?.length > 0) {
            resultMessage += `\n\nCorrections:\n${result.corrections.map((c: string) => `• ${c}`).join('\n')}`;
          }
        } else {
          resultMessage = `✅ Grammar Check: ${result.feedback}`;
        }
        metadata = { grammar: result };
        break;

      case 'generate-speech':
        resultMessage = result.message || `🔊 Audio generated for "${result.text}"`;
        metadata = { speech: result };
        break;

      default:
        resultMessage = `Tool result: ${JSON.stringify(result)}`;
    }

    // Add tool result as assistant message
    const toolMessage: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: resultMessage,
      timestamp: new Date(),
      metadata,
    };

    setMessages(prev => [...prev, toolMessage]);
  }, []);

  /**
   * Initialize with greeting message
   */
  useEffect(() => {
    const greeting: AgentMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Bună! (Hello!) Sunt profesorul tău de română. (I am your Romanian teacher.) Cum te numești? (What is your name?)',
      timestamp: new Date(),
    };

    setMessages([greeting]);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    // Messages and state
    messages,
    agentState,
    streamingMessage,
    
    // Connection status
    isLoading,
    isConnected,
    error,
    
    // Actions
    sendMessage,
    
    // Utilities
    sessionId: sessionId.current,
    clearError: () => setError(null),
    clearMessages: () => setMessages([]),
  };
} 