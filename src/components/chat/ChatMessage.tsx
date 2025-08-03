'use client';

import { useState } from 'react';
import { api } from '~/trpc/react';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';
import { PronunciationAssessment } from '../pronunciation/PronunciationAssessment';
import type { ChatMessage as ChatMessageType } from '~/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isLoadingSpeech, setIsLoadingSpeech] = useState(false);
  const [showPronunciation, setShowPronunciation] = useState(false);
  const { isPlaying, playAudio, pauseAudio, resumeAudio } = useAudioPlayer();

  // Speech synthesis mutation
  const synthesizeMutation = api.speech.synthesize.useMutation({
    onSuccess: (data) => {
      if (data.success && data.audioData) {
        playAudio(data.audioData, data.mimeType);
      } else if (data.error) {
        console.error('Speech synthesis failed:', data.error);
      }
      setIsLoadingSpeech(false);
    },
    onError: (error) => {
      console.error('Speech synthesis error:', error);
      setIsLoadingSpeech(false);
    },
  });

  const handlePlaySpeech = () => {
    if (isPlaying) {
      pauseAudio();
    } else if (isLoadingSpeech) {
      return; // Don't start new synthesis while loading
    } else {
      setIsLoadingSpeech(true);
      synthesizeMutation.mutate({
        text: message.content,
        voice: 'ro-RO-AlinaNeural',
        rate: 'medium',
        pitch: 'medium',
      });
    }
  };

  const handleResumeSpeech = () => {
    resumeAudio();
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium">
            {isUser ? 'You' : 'Profesor Română'}
          </div>
          {/* Speech and pronunciation buttons for assistant messages only */}
          {!isUser && (
            <div className="flex gap-1 ml-2">
              {/* Speech button */}
              <button
                onClick={isPlaying ? pauseAudio : handlePlaySpeech}
                disabled={isLoadingSpeech}
                className={`p-1 rounded-md transition-colors hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isPlaying ? 'Pause speech' : 'Play speech'}
              >
                {isLoadingSpeech ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zM14 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* Pronunciation button */}
              <button
                onClick={() => setShowPronunciation(!showPronunciation)}
                className={`p-1 rounded-md transition-colors hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 ${
                  showPronunciation ? 'bg-blue-100 dark:bg-blue-900' : ''
                }`}
                title="Practice pronunciation"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div className="text-xs mt-1 opacity-70">
          {message.timestamp.toLocaleTimeString()}
        </div>
        
        {/* Pronunciation Assessment */}
        {!isUser && showPronunciation && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
            <PronunciationAssessment
              referenceText={message.content}
              onAssessmentComplete={(assessment) => {
                console.log('Assessment completed:', assessment);
                // Could add analytics or progress tracking here
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 