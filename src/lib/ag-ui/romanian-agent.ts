// Romanian Tutor Agent with Official AG-UI Protocol Implementation
// Based on: https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/agents.mdx
// Using: @ag-ui/core@0.0.35

import { EventType } from '@ag-ui/core';
import type { RomanianAgentState, PronunciationData, GrammarData, CulturalNote } from './types';
import { RomanianAgUIEncoder } from './encoder';

/**
 * Romanian Language Learning Agent implementing Official AG-UI Protocol
 * Provides pronunciation assessment, grammar checking, and cultural education
 */
export class RomanianTutorAgent {
  private state: RomanianAgentState;
  private eventEncoder: RomanianAgUIEncoder;
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? crypto.randomUUID();
    this.eventEncoder = new RomanianAgUIEncoder(this.sessionId, 'romanian-tutor');
    
    // Initialize agent state based on AG-UI state management
    this.state = {
      conversationId: crypto.randomUUID(),
      currentTopic: 'introduction',
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
        focusAreas: ['pronunciation', 'grammar', 'culture'],
      },
    };
  }

  /**
   * Process user message and generate response with AG-UI events
   */
  async processMessage(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }> = []
  ): Promise<AsyncGenerator<string, void, unknown>> {
    return this.generateResponse(userMessage, conversationHistory);
  }

  /**
   * Generate streaming response with proper AG-UI event emission
   */
  private async *generateResponse(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>
  ): AsyncGenerator<string, void, unknown> {
    try {
      // Emit RUN_STARTED event using official AG-UI
      yield this.eventEncoder.createLifecycleEvent(EventType.RUN_STARTED);

      // Emit thinking event
      yield this.eventEncoder.createThinkingEvent('Analyzing your Romanian message...');

      // Update state with new conversation
      this.updateState(userMessage, conversationHistory);

      // Emit state snapshot
      yield this.eventEncoder.createStateEvent(this.state as Record<string, unknown>);

      // Analyze message and determine response strategy
      const messageAnalysis = await this.analyzeMessage(userMessage);
      
      // Start text message
      const messageId = crypto.randomUUID();
      yield this.eventEncoder.createTextMessageEvent(
        EventType.TEXT_MESSAGE_START,
        '',
        messageId
      );

      // Generate contextual response
      const response = await this.generateContextualResponse(userMessage, messageAnalysis);
      
      // Stream response content word by word
      const words = response.split(' ');
      for (const word of words) {
        yield this.eventEncoder.createTextMessageEvent(
          EventType.TEXT_MESSAGE_CONTENT,
          word + ' ',
          messageId
        );
        
        // Small delay for realistic streaming
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // End text message
      yield this.eventEncoder.createTextMessageEvent(
        EventType.TEXT_MESSAGE_END,
        '',
        messageId
      );

      // Execute tools if needed
      yield* this.executeToolsIfNeeded(userMessage, messageAnalysis);

      // Emit cultural notes if relevant
      yield* this.emitCulturalNotes(userMessage);

      // Emit RUN_FINISHED event
      yield this.eventEncoder.createLifecycleEvent(EventType.RUN_FINISHED);

    } catch (error) {
      // Emit error event using official AG-UI
      yield this.eventEncoder.createErrorEvent(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { userMessage, timestamp: new Date().toISOString() }
      );
    }
  }

  /**
   * Execute tools based on message analysis
   */
  private async *executeToolsIfNeeded(
    userMessage: string,
    analysis: MessageAnalysis
  ): AsyncGenerator<string, void, unknown> {
    // Check for pronunciation assessment request
    if (analysis.requestsPronunciation) {
      yield* this.executePronunciationTool(analysis.textToAssess ?? userMessage);
    }

    // Check for grammar checking request
    if (analysis.requestsGrammarCheck) {
      yield* this.executeGrammarTool(analysis.textToCheck ?? userMessage);
    }

    // Check for speech generation request
    if (analysis.requestsSpeech) {
      yield* this.executeSpeechTool(analysis.textToSpeak ?? userMessage);
    }
  }

  /**
   * Execute pronunciation assessment tool with official AG-UI events
   */
  private async *executePronunciationTool(text: string): AsyncGenerator<string, void, unknown> {
    yield this.eventEncoder.createToolCallEvent(
      EventType.TOOL_CALL_START,
      'assess-pronunciation',
      { text }
    );

    try {
      // Simulate pronunciation assessment (integrate with Azure Speech Services)
      const score = Math.floor(Math.random() * 30) + 70; // 70-100
      const feedback = `Pronunciation of "${text}" scored ${score}/100. ${score > 85 ? 'Excellent!' : 'Good effort! Keep practicing.'}`;
      const suggestions = [
        'Focus on vowel clarity',
        'Practice the "ă" sound',
        'Work on consonant pronunciation',
      ];

      // Update state
      this.state.sessionMetrics.pronunciationScores.push(score);

      yield this.eventEncoder.createPronunciationEvent(
        text,
        score,
        feedback,
        suggestions
      );

    } catch (error) {
      yield this.eventEncoder.createErrorEvent(
        'Pronunciation assessment failed',
        { text, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Execute grammar checking tool with official AG-UI events
   */
  private async *executeGrammarTool(text: string): AsyncGenerator<string, void, unknown> {
    yield this.eventEncoder.createToolCallEvent(
      EventType.TOOL_CALL_START,
      'check-grammar',
      { text }
    );

    try {
      // Simple grammar checking (integrate with Romanian grammar API)
      const hasErrors = Math.random() > 0.7;
      const corrections = hasErrors ? ['Consider using "sunt" instead of "îi"'] : [];
      const feedback = hasErrors 
        ? 'I found some areas for improvement in your Romanian text.'
        : 'Your Romanian grammar looks good! Foarte bine!';

      if (hasErrors) {
        this.state.sessionMetrics.grammarCorrections++;
      }

      yield this.eventEncoder.createGrammarEvent(
        text,
        hasErrors,
        corrections,
        text, // Would be corrected text in real implementation
        feedback
      );

    } catch (error) {
      yield this.eventEncoder.createErrorEvent(
        'Grammar checking failed',
        { text, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Execute speech generation tool with official AG-UI events
   */
  private async *executeSpeechTool(text: string): AsyncGenerator<string, void, unknown> {
    yield this.eventEncoder.createToolCallEvent(
      EventType.TOOL_CALL_START,
      'generate-speech',
      { text, voice: this.state.preferences.voice }
    );

    try {
      // Generate speech URL (integrate with Azure Speech Services)
      const audioUrl = `/api/speech/synthesize?text=${encodeURIComponent(text)}&voice=${this.state.preferences.voice}`;

      yield this.eventEncoder.createSpeechEvent(
        text,
        this.state.preferences.voice,
        audioUrl
      );

    } catch (error) {
      yield this.eventEncoder.createErrorEvent(
        'Speech generation failed',
        { text, error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Emit cultural notes if relevant using official AG-UI events
   */
  private async *emitCulturalNotes(userMessage: string): AsyncGenerator<string, void, unknown> {
    const culturalNotes = this.getCulturalNotes(userMessage);
    
    for (const note of culturalNotes) {
      yield this.eventEncoder.createCulturalNoteEvent(
        note.phrase,
        note.context,
        note.usage,
        note.examples
      );
      
      this.state.sessionMetrics.culturalNotesShared++;
    }
  }

  /**
   * Analyze user message to determine response strategy
   */
  private async analyzeMessage(message: string): Promise<MessageAnalysis> {
    return {
      requestsPronunciation: /pronunciation|pronounce|speak|sound/i.test(message),
      requestsGrammarCheck: /grammar|correct|check|mistake/i.test(message),
      requestsSpeech: /listen|audio|hear|play/i.test(message),
      containsRomanian: /bună|mulțumesc|vă rog|foarte|sunt|românește/i.test(message),
      textToAssess: this.extractTextToAssess(message),
      textToCheck: this.extractTextToCheck(message),
      textToSpeak: this.extractTextToSpeak(message),
      userLevel: this.determineUserLevel(message),
      topic: this.identifyTopic(message),
    };
  }

  /**
   * Generate contextual response based on analysis
   */
  private async generateContextualResponse(
    userMessage: string, 
    analysis: MessageAnalysis
  ): Promise<string> {
    if (analysis.containsRomanian) {
      return `Foarte bine! (Very good!) I can see you're practicing Romanian. ${this.getEncouragingResponse()}`;
    }

    if (analysis.requestsPronunciation) {
      return `I'll help you with pronunciation! Let me assess how you're doing with Romanian sounds.`;
    }

    if (analysis.requestsGrammarCheck) {
      return `Let me check your Romanian grammar for you. I'll look for any areas where we can improve.`;
    }

    // Default conversational response
    return this.getConversationalResponse(userMessage, analysis);
  }

  /**
   * Helper methods for content generation
   */
  private getEncouragingResponse(): string {
    const responses = [
      "Keep practicing those Romanian sounds!",
      "Your Romanian is improving!",
      "Great job using Romanian phrases!",
      "I love seeing you practice Romanian!",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getConversationalResponse(message: string, analysis: MessageAnalysis): string {
    if (analysis.topic === 'greetings') {
      return "Bună! (Hello!) Let's practice some Romanian greetings. Try saying 'Bună ziua' (Good day) or 'Bună seara' (Good evening).";
    }
    
    return "Bună! I'm your Romanian tutor. I can help you with pronunciation, grammar, and cultural insights. What would you like to practice today?";
  }

  /**
   * Update agent state based on conversation
   */
  private updateState(userMessage: string, conversationHistory: Array<{ role: string; content: string; timestamp: Date }>): void {
    // Update conversation context
    this.state.currentTopic = this.identifyTopic(userMessage);
    
    // Track new words
    const romanianWords = this.extractRomanianWords(userMessage);
    for (const word of romanianWords) {
      if (!this.state.sessionMetrics.wordsLearned.includes(word)) {
        this.state.sessionMetrics.wordsLearned.push(word);
      }
    }

    // Adjust user level based on complexity
    if (conversationHistory.length > 5) {
      this.state.userLevel = this.assessUserLevel(conversationHistory);
    }
  }

  // Helper methods for message analysis
  private extractTextToAssess(message: string): string | undefined {
    const regex = /pronunciation of ["']([^"']+)["']/i;
    const match = regex.exec(message);
    return match?.[1];
  }

  private extractTextToCheck(message: string): string | undefined {
    const regex = /check ["']([^"']+)["']/i;
    const match = regex.exec(message);
    return match?.[1];
  }

  private extractTextToSpeak(message: string): string | undefined {
    const regex = /speak ["']([^"']+)["']/i;
    const match = regex.exec(message);
    return match?.[1];
  }

  private determineUserLevel(message: string): 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic - in practice would be more sophisticated
    if (message.length > 100) return 'advanced';
    if (message.length > 50) return 'intermediate';
    return 'beginner';
  }

  private identifyTopic(message: string): string {
    if (/bună|salut|hello/i.test(message)) return 'greetings';
    if (/mulțumesc|thanks/i.test(message)) return 'politeness';
    if (/pronunț|pronunciation/i.test(message)) return 'pronunciation';
    if (/gramm|grammar/i.test(message)) return 'grammar';
    return 'general';
  }

  private extractRomanianWords(message: string): string[] {
    const romanianWords = ['bună', 'mulțumesc', 'vă rog', 'foarte', 'sunt', 'da', 'nu'];
    return romanianWords.filter(word => message.toLowerCase().includes(word));
  }

  private assessUserLevel(history: Array<{ role: string; content: string; timestamp: Date }>): 'beginner' | 'intermediate' | 'advanced' {
    // Analyze conversation complexity to determine level
    const avgLength = history.reduce((acc, msg) => acc + msg.content.length, 0) / history.length;
    if (avgLength > 100) return 'advanced';
    if (avgLength > 50) return 'intermediate';
    return 'beginner';
  }

  private getCulturalNotes(message: string): Array<{phrase: string; context: string; usage: string; examples: string[]}> {
    const notes = [];
    if (message.toLowerCase().includes('bună ziua')) {
      notes.push({
        phrase: 'bună ziua',
        context: 'Formal daytime greeting in Romanian',
        usage: 'Used from morning until evening (roughly 6 AM - 6 PM)',
        examples: ['Bună ziua, domnule! (Good day, sir!)', 'Bună ziua, cum mai sunteți? (Good day, how are you?)'],
      });
    }
    return notes;
  }
}

/**
 * Message analysis interface
 */
interface MessageAnalysis {
  requestsPronunciation: boolean;
  requestsGrammarCheck: boolean;
  requestsSpeech: boolean;
  containsRomanian: boolean;
  textToAssess?: string;
  textToCheck?: string;
  textToSpeak?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
} 