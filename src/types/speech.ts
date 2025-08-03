export interface SpeechSynthesisRequest {
  text: string;
  voice?: string;
  rate?: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
  pitch?: 'x-low' | 'low' | 'medium' | 'high' | 'x-high';
}

export interface SpeechSynthesisResponse {
  success: boolean;
  audioData?: ArrayBuffer;
  error?: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
}

export interface SpeechSettings {
  voice: 'ro-RO-AlinaNeural' | 'ro-RO-EmilNeural';
  rate: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
  pitch: 'x-low' | 'low' | 'medium' | 'high' | 'x-high';
  autoPlay: boolean;
}

// Pronunciation Assessment Types
export interface PronunciationAssessmentRequest {
  referenceText: string;
  audioData: ArrayBuffer;
  language?: string;
}

export interface PronunciationAssessmentResponse {
  success: boolean;
  assessment?: PronunciationAssessment;
  error?: string;
}

export interface PronunciationAssessment {
  accuracyScore: number;      // 0-100: Overall pronunciation accuracy
  fluencyScore: number;       // 0-100: Speech fluency  
  completenessScore: number;  // 0-100: How much of reference text was spoken
  pronScore: number;          // 0-100: Overall pronunciation score
  words: WordAssessment[];    // Word-level breakdown
}

export interface WordAssessment {
  word: string;
  accuracyScore: number;
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
  syllables?: SyllableAssessment[];
}

export interface SyllableAssessment {
  syllable: string;
  accuracyScore: number;
  offset: number;
  duration: number;
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

export interface RecordingSession {
  state: RecordingState;
  startTime?: number;
  duration: number;
  audioBlob?: Blob;
  error?: string;
}

export interface PronunciationFeedback {
  overallScore: number;
  improvements: string[];
  strongPoints: string[];
  wordLevelFeedback: WordFeedback[];
}

export interface WordFeedback {
  word: string;
  score: number;
  feedback: string;
  needsPractice: boolean;
} 