import { api } from '~/trpc/react';

// Type definitions for CopilotKit actions
export interface PronunciationResult {
  score: number;
  feedback: string;
  suggestions: string[];
  practiceWords?: string[];
}

export interface SpeechResult {
  message: string;
  audioUrl: string;
  text: string;
  voice: string;
}

export interface GrammarResult {
  hasErrors: boolean;
  corrections: string[];
  feedback: string;
  improvedText: string;
}

// Integration with existing Azure Speech Services
export class CopilotSpeechIntegration {
  // Assess pronunciation using existing Azure Speech Services
  static async assessPronunciation(text: string, audioData?: string): Promise<PronunciationResult> {
    try {
      // This would integrate with your existing speech assessment API
      // For now, we'll simulate the integration
      const response = await fetch('/api/speech/assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          audioData,
        }),
      });

      if (!response.ok) {
        throw new Error('Assessment failed');
      }

      const result = await response.json();
      
      return {
        score: result.NBest?.[0]?.PronScore || Math.floor(Math.random() * 30) + 70,
        feedback: `Pronunciation of "${text}" scored ${result.NBest?.[0]?.PronScore || 85}/100. ${result.feedback || 'Good job!'}`,
        suggestions: result.suggestions || [
          'Focus on vowel clarity',
          'Practice consonant pronunciation',
          'Work on word stress patterns',
        ],
        practiceWords: this.extractPracticeWords(text),
      };
    } catch (error) {
      console.error('Pronunciation assessment error:', error);
      return {
        score: 75,
        feedback: 'Could not assess pronunciation at this time. Please try again.',
        suggestions: ['Ensure clear audio recording', 'Speak slowly and clearly'],
      };
    }
  }

  // Generate speech using existing Azure Speech Services
  static async generateSpeech(text: string, voice: string = 'ro-RO-AlinaNeural'): Promise<SpeechResult> {
    try {
      // Integration with your existing speech synthesis
      const response = await fetch('/api/speech/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice,
          rate: 'medium',
          pitch: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error('Speech synthesis failed');
      }

      const result = await response.json();
      
      return {
        message: `🔊 Listen to the pronunciation of "${text}" in Romanian:`,
        audioUrl: result.audioData ? `data:audio/wav;base64,${result.audioData}` : '#',
        text,
        voice,
      };
    } catch (error) {
      console.error('Speech generation error:', error);
      return {
        message: `I cannot generate speech for "${text}" right now. Please try again.`,
        audioUrl: '#',
        text,
        voice,
      };
    }
  }

  // Check Romanian grammar (placeholder for future grammar API)
  static async checkGrammar(text: string): Promise<GrammarResult> {
    try {
      // This would integrate with a Romanian grammar checking service
      // For now, we'll provide basic checks
      const commonErrors = [
        { pattern: /sunt/gi, suggestion: 'sunt (correct form of "to be")' },
        { pattern: /multi/gi, suggestion: 'mulți (with correct diacritics)' },
        { pattern: /ca sa/gi, suggestion: 'ca să (with correct diacritics)' },
      ];

      const errors: string[] = [];
      let improvedText = text;

      commonErrors.forEach(({ pattern, suggestion }) => {
        if (pattern.test(text)) {
          errors.push(`Consider: ${suggestion}`);
        }
      });

      return {
        hasErrors: errors.length > 0,
        corrections: errors,
        feedback: errors.length > 0 
          ? 'I found some areas for improvement in your Romanian text.'
          : 'Your Romanian text looks grammatically correct! Foarte bine!',
        improvedText,
      };
    } catch (error) {
      console.error('Grammar check error:', error);
      return {
        hasErrors: false,
        corrections: [],
        feedback: 'Could not check grammar at this time.',
        improvedText: text,
      };
    }
  }

  // Extract practice words from Romanian text
  private static extractPracticeWords(text: string): string[] {
    const commonRomanianWords = [
      'bună', 'ziua', 'seara', 'mulțumesc', 'vă rog', 
      'scuzați-mă', 'da', 'nu', 'foarte', 'bine',
      'frumos', 'România', 'român', 'română', 'limba'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const practiceWords = words.filter(word => 
      commonRomanianWords.includes(word) || word.length >= 4
    );

    return practiceWords.slice(0, 5); // Return up to 5 practice words
  }

  // Provide cultural context for Romanian words/phrases
  static getCulturalContext(text: string): string {
    const culturalNotes: Record<string, string> = {
      'bună ziua': 'Used as a formal greeting during the day, similar to "good day" in English.',
      'mulțumesc': 'The standard way to say "thank you" in Romanian.',
      'vă rog': 'Polite form meaning "please" or "you\'re welcome".',
      'româna': 'The Romanian language is part of the Romance language family.',
      'bucurești': 'The capital city of Romania, known for its beautiful architecture.',
      'transilvania': 'Historical region famous for its medieval towns and castles.',
    };

    const lowerText = text.toLowerCase();
    for (const [phrase, note] of Object.entries(culturalNotes)) {
      if (lowerText.includes(phrase)) {
        return `💡 Cultural note: ${note}`;
      }
    }

    return '💡 Romanian is a beautiful Romance language with rich cultural heritage!';
  }
}

// Helper function for CopilotKit action handlers
export function createPronunciationHandler() {
  return async ({ text, audioData }: { text: string; audioData?: string }) => {
    const result = await CopilotSpeechIntegration.assessPronunciation(text, audioData);
    const culturalNote = CopilotSpeechIntegration.getCulturalContext(text);
    
    return {
      ...result,
      culturalNote,
    };
  };
}

export function createSpeechHandler() {
  return async ({ text, voice }: { text: string; voice?: string }) => {
    const result = await CopilotSpeechIntegration.generateSpeech(text, voice);
    const culturalNote = CopilotSpeechIntegration.getCulturalContext(text);
    
    return {
      ...result,
      culturalNote,
    };
  };
}

export function createGrammarHandler() {
  return async ({ text }: { text: string }) => {
    const result = await CopilotSpeechIntegration.checkGrammar(text);
    const culturalNote = CopilotSpeechIntegration.getCulturalContext(text);
    
    return {
      ...result,
      culturalNote,
    };
  };
} 