'use client';

import { useState, useRef, useEffect } from 'react';
import type { RecordingState, RecordingSession } from '../../types/speech';

interface RecordingButtonProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onRecordingStateChange?: (state: RecordingState) => void;
  maxDuration?: number; // in seconds, default 30
  disabled?: boolean;
  className?: string;
}

export function RecordingButton({
  onRecordingComplete,
  onRecordingStateChange,
  maxDuration = 30,
  disabled = false,
  className = '',
}: RecordingButtonProps) {
  const [session, setSession] = useState<RecordingSession>({
    state: 'idle',
    duration: 0,
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Update parent component when recording state changes
  useEffect(() => {
    onRecordingStateChange?.(session.state);
  }, [session.state, onRecordingStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      // Request microphone permission with optimized settings for speech recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          // Remove specific sampleRate constraint - let browser choose the best
          channelCount: 1,    // Mono audio
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true, // Add automatic gain control
          // Add more constraints for better quality
          latency: 0,
          sampleSize: 16
        } 
      });

      console.log('🎤 Got media stream with tracks:', stream.getAudioTracks().map(track => ({
        kind: track.kind,
        label: track.label,
        enabled: track.enabled,
        muted: track.muted,
        settings: track.getSettings()
      })));

      // Check what audio settings we actually got
      const track = stream.getAudioTracks()[0];
      if (track) {
        const settings = track.getSettings();
        console.log('🔧 Actual audio track settings:', settings);
      }

      // Initialize MediaRecorder with the best supported format for Azure
      const mimeTypes = [
        'audio/webm;codecs=pcm',  // Best quality, uncompressed
        'audio/webm;codecs=opus', // Good quality, compressed
        'audio/webm',             // Fallback
        'audio/mp4',              // Alternative
        'audio/ogg'               // Last resort
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('🎵 Selected MIME type:', mimeType);
          break;
        }
      }
      
      if (!selectedMimeType) {
        selectedMimeType = 'audio/webm'; // Ultimate fallback
        console.warn('⚠️ No optimal MIME type supported, using fallback');
      }
      
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000 // Higher bitrate for better quality
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📊 Audio chunk received:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped, processing', audioChunksRef.current.length, 'chunks');
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: selectedMimeType
        });
        
        console.log('📦 Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length,
          chunkSizes: audioChunksRef.current.map(chunk => chunk.size)
        });
        
        // Enhanced analysis of the blob for better debugging
        audioBlob.arrayBuffer().then(buffer => {
          const firstBytes = new Uint8Array(buffer.slice(0, 12));
          const isValid = buffer.byteLength > 1000 && firstBytes[0] !== 0; // Basic validation
          
          console.log('🔍 RecordingButton audio blob analysis:', {
            arrayBufferSize: buffer.byteLength,
            firstBytes: Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' '),
            isValid: isValid,
            estimatedDuration: `${(buffer.byteLength / 32000).toFixed(2)}s`,
            qualityCheck: buffer.byteLength < 5000 ? 'very-short' : 
                         buffer.byteLength < 20000 ? 'short' : 'normal'
          });
          
          if (!isValid) {
            console.warn('⚠️ Audio blob appears to be invalid or empty');
            setSession(prev => ({ 
              ...prev, 
              state: 'error',
              error: 'Recording appears to be empty. Please check your microphone.' 
            }));
            return;
          }
        }).catch(err => {
          console.error('❌ Failed to analyze audio blob:', err);
        });
        
        setSession(prev => ({ 
          ...prev, 
          state: 'completed',
          audioBlob 
        }));
        
        onRecordingComplete(audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => {
          console.log('🔌 Stopping track:', track.label);
          track.stop();
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error('📹 MediaRecorder error:', event);
      };

      // Start recording with smaller time slices for better data flow
      mediaRecorder.start(250); // Collect data every 250ms
      
      console.log('🎤 Recording started with state:', mediaRecorder.state);
      
      setSession({
        state: 'recording',
        startTime: Date.now(),
        duration: 0,
      });

      // Start duration timer
      timerRef.current = setInterval(() => {
        setSession(prev => {
          const newDuration = prev.startTime 
            ? (Date.now() - prev.startTime) / 1000 
            : 0;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            void stopRecording();
            return prev;
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 100);

    } catch (error) {
      console.error('Error starting recording:', error);
      setSession(prev => ({ 
        ...prev, 
        state: 'error',
        error: error instanceof Error ? error.message : 'Recording failed'
      }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    setSession({
      state: 'idle',
      duration: 0,
    });
  };

  const formatDuration = (seconds: number): string => {
    return `${Math.floor(seconds)}s`;
  };

  const getButtonText = (): string => {
    switch (session.state) {
      case 'idle':
        return 'Practice Pronunciation';
      case 'recording':
        return `Recording... ${formatDuration(session.duration)}`;
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Record Again';
      case 'error':
        return 'Try Again';
      default:
        return 'Practice Pronunciation';
    }
  };

  const getButtonIcon = (): string => {
    switch (session.state) {
      case 'recording':
        return '⏹️';
      case 'processing':
        return '⏳';
      case 'completed':
        return '🔄';
      case 'error':
        return '⚠️';
      default:
        return '🎤';
    }
  };

  const handleClick = () => {
    switch (session.state) {
      case 'idle':
        void startRecording().catch((error) => {
          console.error('Failed to start recording:', error);
        });
        break;
      case 'recording':
        stopRecording();
        break;
      case 'completed':
      case 'error':
        resetRecording();
        break;
    }
  };

  const isClickDisabled = disabled || 
    session.state === 'processing' || 
    !navigator.mediaDevices?.getUserMedia;

  return (
    <div className={`pronunciation-recording ${className}`}>
      <button
        onClick={handleClick}
        disabled={isClickDisabled}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
          ${session.state === 'recording' 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-blue-500 hover:bg-blue-600 text-white'
          }
          ${isClickDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        <span className="text-lg">{getButtonIcon()}</span>
        <span>{getButtonText()}</span>
      </button>
      
      {session.state === 'recording' && (
        <div className="mt-2">
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-red-500 h-full transition-all duration-100"
              style={{ width: `${(session.duration / maxDuration) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {formatDuration(session.duration)} / {maxDuration}s
          </p>
        </div>
      )}
      
      {session.error && (
        <p className="text-red-500 text-sm mt-2">
          {session.error}
        </p>
      )}
    </div>
  );
} 