// AG-UI Event Encoder Implementation using Official Package
// Based on: https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/events.mdx
// Using: @ag-ui/core@0.0.35

import { EventType } from '@ag-ui/core';

/**
 * Romanian Language Learning AG-UI Event Encoder
 * Uses official AG-UI core package for proper protocol compliance
 */
export class RomanianAgUIEncoder {
  private sessionId: string;
  private agentId: string;

  constructor(sessionId: string, agentId: string = 'romanian-tutor') {
    this.sessionId = sessionId;
    this.agentId = agentId;
  }

  /**
   * Create a properly formatted AG-UI event
   */
  private createEvent(type: string, data: any): string {
    const event = {
      type,
      data,
      metadata: {
        agentId: this.agentId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    return `data: ${JSON.stringify(event)}\n\n`;
  }

  /**
   * Create lifecycle events using official AG-UI
   */
  createLifecycleEvent(type: typeof EventType.RUN_STARTED | typeof EventType.RUN_FINISHED, data?: any): string {
    return this.createEvent(type, data ?? {});
  }

  /**
   * Create text message events for streaming
   */
  createTextMessageEvent(
    type: typeof EventType.TEXT_MESSAGE_START | typeof EventType.TEXT_MESSAGE_CONTENT | typeof EventType.TEXT_MESSAGE_END,
    content: string,
    messageId?: string
  ): string {
    const messageData = {
      id: messageId ?? crypto.randomUUID(),
      content,
      role: 'assistant',
    };

    return this.createEvent(type, messageData);
  }

  /**
   * Create tool call events
   */
  createToolCallEvent(
    type: typeof EventType.TOOL_CALL_START | typeof EventType.TOOL_CALL_END,
    toolName: string,
    parameters?: Record<string, unknown>,
    result?: unknown
  ): string {
    const toolCallData = {
      id: crypto.randomUUID(),
      name: toolName,
      parameters: parameters ?? {},
      result,
      status: type === EventType.TOOL_CALL_START ? 'running' : 'completed',
    };

    return this.createEvent(type, toolCallData);
  }

  /**
   * Create state update events
   */
  createStateEvent(state: Record<string, unknown>): string {
    const stateData = {
      state,
      timestamp: new Date().toISOString(),
    };

    return this.createEvent(EventType.STATE_SNAPSHOT, stateData);
  }

  /**
   * Create thinking/processing event
   */
  createThinkingEvent(message: string): string {
    const thinkingData = {
      message,
      status: 'thinking',
    };

    return this.createEvent(EventType.THINKING_START, thinkingData);
  }

  /**
   * Create error event
   */
  createErrorEvent(error: string, context?: Record<string, unknown>): string {
    const errorData = {
      error,
      context,
    };

    return this.createEvent(EventType.RUN_ERROR, errorData);
  }

  /**
   * Romanian learning specific events
   */
  createPronunciationEvent(
    text: string,
    score: number,
    feedback: string,
    suggestions: string[],
    audioUrl?: string
  ): string {
    return this.createToolCallEvent(
      EventType.TOOL_CALL_END,
      'assess-pronunciation',
      { text },
      {
        score,
        feedback,
        suggestions,
        audioUrl,
        type: 'pronunciation',
        practiceWords: ['română', 'bună', 'mulțumesc'],
      }
    );
  }

  createGrammarEvent(
    originalText: string,
    hasErrors: boolean,
    corrections: string[],
    improvedText: string,
    explanation?: string
  ): string {
    return this.createToolCallEvent(
      EventType.TOOL_CALL_END,
      'check-grammar',
      { text: originalText },
      {
        originalText,
        hasErrors,
        corrections,
        improvedText,
        explanation,
        type: 'grammar',
      }
    );
  }

  createSpeechEvent(
    text: string,
    voice: string,
    audioUrl: string
  ): string {
    return this.createToolCallEvent(
      EventType.TOOL_CALL_END,
      'generate-speech',
      { text, voice },
      {
        text,
        voice,
        audioUrl,
        message: `🔊 Listen to the pronunciation of "${text}" in Romanian:`,
        type: 'speech',
      }
    );
  }

  createCulturalNoteEvent(
    phrase: string,
    context: string,
    usage: string,
    examples: string[]
  ): string {
    const culturalData = {
      content: `💡 Cultural note: ${context}`,
      cultural: {
        phrase,
        context,
        usage,
        examples,
      },
      type: 'cultural-note',
    };

    return this.createEvent(EventType.TEXT_MESSAGE_CONTENT, culturalData);
  }
} 