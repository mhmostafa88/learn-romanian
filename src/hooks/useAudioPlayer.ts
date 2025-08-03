import { useState, useRef, useCallback } from 'react';
import type { AudioPlayerState } from '~/types/speech';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
  });

  const playAudio = useCallback((audioData: string, mimeType = 'audio/wav') => {
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create blob from base64 data
      const binaryString = atob(audioData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        setState(prev => ({ ...prev, duration: audio.duration }));
      });

      audio.addEventListener('timeupdate', () => {
        setState(prev => ({ ...prev, currentTime: audio.currentTime }));
      });

      audio.addEventListener('play', () => {
        setState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
      });

      audio.addEventListener('pause', () => {
        setState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
      });

      audio.addEventListener('ended', () => {
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isPaused: false,
          currentTime: 0 
        }));
        URL.revokeObjectURL(audioUrl);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isPaused: false 
        }));
        URL.revokeObjectURL(audioUrl);
      });

      // Start playback
      audio.play().catch((error) => {
        console.error('Failed to play audio:', error);
        setState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isPaused: false 
        }));
      });

    } catch (error) {
      console.error('Error creating audio:', error);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current?.paused) {
      audioRef.current.play().catch((error) => {
        console.error('Failed to resume audio:', error);
      });
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setState({
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
      });
    }
  }, []);

  return {
    ...state,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
  };
} 