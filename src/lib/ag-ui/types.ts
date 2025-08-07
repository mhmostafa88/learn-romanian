// AG-UI Protocol Types Implementation using Official Package
// Based on: https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/
// Using: @ag-ui/core@0.0.35

export * from '@ag-ui/core';

// Additional Romanian Learning Specific Types
export interface PronunciationData {
  text: string;
  score: number;
  feedback: string;
  suggestions: string[];
  audioUrl?: string;
}

export interface GrammarData {
  originalText: string;
  hasErrors: boolean;
  corrections: string[];
  improvedText: string;
  explanation?: string;
}

export interface CulturalNote {
  phrase: string;
  context: string;
  usage: string;
  examples: string[];
}

/**
 * Romanian Learning Specific Event Data
 */
export interface RomanianLearningEventData {
  type: 'pronunciation' | 'grammar' | 'cultural' | 'conversation';
  content: string;
  result?: PronunciationData | GrammarData | CulturalNote;
  userProgress?: {
    scoreImprovement: number;
    newWordsLearned: string[];
    skillsProgressed: string[];
  };
}

/**
 * Extended Agent State for Romanian Learning
 */
export interface RomanianAgentState {
  conversationId: string;
  userId?: string;
  currentTopic?: string;
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  sessionMetrics: {
    pronunciationScores: number[];
    grammarCorrections: number;
    wordsLearned: string[];
    culturalNotesShared: number;
  };
  preferences: {
    voice: string;
    learningPace: 'slow' | 'medium' | 'fast';
    focusAreas: string[];
  };
} 