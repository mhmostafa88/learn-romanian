'use client';

import { useState } from 'react';
import { RecordingButton } from './RecordingButton';
import { api } from '../../trpc/react';
import { convertToWav } from '../../lib/audio-utils';
import type { 
  RecordingState, 
  PronunciationAssessment as Assessment,
  PronunciationFeedback 
} from '../../types/speech';

interface PronunciationAssessmentProps {
  referenceText: string;
  onAssessmentComplete?: (assessment: Assessment) => void;
  className?: string;
}

export function PronunciationAssessment({
  referenceText,
  onAssessmentComplete,
  className = '',
}: PronunciationAssessmentProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [micTest, setMicTest] = useState<{
    testing: boolean;
    lastLevel: number;
    isWorking: boolean;
    clipping: boolean;
  }>({ testing: false, lastLevel: 0, isWorking: false, clipping: false });
  const [diagnosticTest, setDiagnosticTest] = useState<{
    running: boolean;
    result: {
      success: boolean;
      originalSize?: number;
      wavSize?: number;
      error?: string;
      message: string;
    } | null;
  }>({ running: false, result: null });

  // tRPC mutation for pronunciation assessment
  const assessmentMutation = api.speech.assessPronunciation.useMutation();
  
  // Environment validation
  const environmentCheck = api.speech.validateEnvironment.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Microphone test functionality
  const testMicrophone = async () => {
    setMicTest(prev => ({ ...prev, testing: true }));
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let maxLevel = 0;
      let sampleCount = 0;
      let clippingCount = 0; // Count samples at max level
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const level = Math.round((average / 255) * 100);
        
        // Check for clipping (level at or near maximum)
        if (level >= 95) {
          clippingCount++;
        }
        
        maxLevel = Math.max(maxLevel, level);
        sampleCount++;
        
        setMicTest(prev => ({ 
          ...prev, 
          lastLevel: level,
          isWorking: maxLevel > 10, // Consider working if we've seen some signal
          clipping: clippingCount > 3 // Mark as clipping if we see it multiple times
        }));
        
        if (sampleCount < 50) { // Test for ~2.5 seconds
          requestAnimationFrame(checkAudio);
        } else {
          // Test complete
          stream.getTracks().forEach(track => track.stop());
          void audioContext.close();
          setMicTest(prev => ({ 
            ...prev, 
            testing: false,
            isWorking: maxLevel > 10,
            clipping: clippingCount > 3
          }));
        }
      };
      
      checkAudio();
    } catch (error) {
      console.error('Microphone test failed:', error);
      setMicTest({ testing: false, lastLevel: 0, isWorking: false, clipping: false });
    }
  };

  // Diagnostic test - record and analyze audio locally
  const runDiagnosticTest = async () => {
    setDiagnosticTest({ running: true, result: null });
    
    try {
      console.log('🔬 Starting diagnostic test...');
      
      // Record a short clip
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: 'audio/webm;codecs=pcm',
        audioBitsPerSecond: 128000 
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=pcm' });
          console.log('🔬 Diagnostic: audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            source: 'diagnostic-test'
          });
          
          // Process through our audio pipeline
          const wavBuffer = await convertToWav(audioBlob);
          console.log('🔬 Diagnostic: WAV conversion complete, size:', wavBuffer.byteLength);
          
          setDiagnosticTest({
            running: false,
            result: {
              success: true,
              originalSize: audioBlob.size,
              wavSize: wavBuffer.byteLength,
              message: 'Audio processing pipeline working correctly'
            }
          });
          
        } catch (error) {
          console.error('🔬 Diagnostic failed:', error);
          setDiagnosticTest({
            running: false,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'Audio processing pipeline has issues'
            }
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      // Record for 2 seconds
      mediaRecorder.start(250);
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 2000);
      
    } catch (error) {
      console.error('🔬 Diagnostic test setup failed:', error);
      setDiagnosticTest({
        running: false,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to start diagnostic test'
        }
      });
    }
  };

  // Test using the same recording setup as RecordingButton
  const testRecordingButtonMethod = async () => {
    setDiagnosticTest({ running: true, result: null });
    
    try {
      console.log('🔬 Testing RecordingButton method...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          latency: 0,
          sampleSize: 16
        } 
      });

      // Use the same MIME type selection logic as RecordingButton
      const mimeTypes = [
        'audio/webm;codecs=pcm',
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg'
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
        selectedMimeType = 'audio/webm';
      }

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: selectedMimeType,
        audioBitsPerSecond: 128000
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(chunks, { type: selectedMimeType });
          console.log('🔬 RecordingButton method: audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            source: 'recordingbutton-method-test'
          });
          
          const wavBuffer = await convertToWav(audioBlob);
          console.log('🔬 RecordingButton method: WAV conversion complete, size:', wavBuffer.byteLength);
          
          setDiagnosticTest({
            running: false,
            result: {
              success: true,
              originalSize: audioBlob.size,
              wavSize: wavBuffer.byteLength,
              message: `RecordingButton method working - MIME: ${selectedMimeType}`
            }
          });
          
        } catch (error) {
          console.error('🔬 RecordingButton method failed:', error);
          setDiagnosticTest({
            running: false,
            result: {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              message: 'RecordingButton method has issues'
            }
          });
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250);
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 2000);
      
    } catch (error) {
      console.error('🔬 RecordingButton method test setup failed:', error);
      setDiagnosticTest({
        running: false,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Failed to start RecordingButton method test'
        }
      });
    }
  };

  // Generate user-friendly feedback from assessment results
  const generateFeedback = (assessment: Assessment): PronunciationFeedback => {
    const { pronScore, accuracyScore, fluencyScore, words } = assessment;
    
    const improvements: string[] = [];
    const strongPoints: string[] = [];
    
    // Overall feedback based on scores
    if (accuracyScore < 70) {
      improvements.push('Focus on clearer pronunciation of individual sounds');
    }
    if (fluencyScore < 70) {
      improvements.push('Practice speaking more smoothly and naturally');
    }
    if (pronScore >= 80) {
      strongPoints.push('Excellent overall pronunciation!');
    } else if (accuracyScore >= 80) {
      strongPoints.push('Very clear pronunciation');
    }
    if (fluencyScore >= 80) {
      strongPoints.push('Good speech rhythm and flow');
    }
    
    // Word-level analysis
    const problemWords = words.filter(w => w.accuracyScore < 70);
    if (problemWords.length > 0) {
      improvements.push(`Pay attention to: ${problemWords.map(w => w.word).join(', ')}`);
    }
    
    const goodWords = words.filter(w => w.accuracyScore >= 85);
    if (goodWords.length > 0) {
      strongPoints.push(`Well pronounced: ${goodWords.slice(0, 3).map(w => w.word).join(', ')}`);
    }
    
    return {
      overallScore: pronScore,
      improvements,
      strongPoints,
      wordLevelFeedback: words.map(word => ({
        word: word.word,
        score: word.accuracyScore,
        feedback: word.accuracyScore >= 80 
          ? 'Excellent pronunciation!'
          : word.accuracyScore >= 70
          ? 'Good, could be clearer'
          : 'Needs practice',
        needsPractice: word.accuracyScore < 75,
      })),
    };
  };

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    setRecordingState('processing');

    try {
      console.log('🎙️ Processing recorded audio blob:', {
        size: audioBlob.size,
        type: audioBlob.type,
        source: 'pronunciation-recording'
      });
      
      // Convert audio blob to proper WAV format for Azure Speech Services
      console.log('🚨 CRITICAL: About to call convertToWav...');
      const wavArrayBuffer = await convertToWav(audioBlob);
      console.log('🚨 CRITICAL: convertToWav returned, size:', wavArrayBuffer.byteLength);
      console.log('🔄 Converting to base64, size:', wavArrayBuffer.byteLength);
      
      // Convert to base64 using chunked approach to prevent call stack overflow
      const uint8Array = new Uint8Array(wavArrayBuffer);
      let base64Audio = '';
      const chunkSize = 8192; // Process in 8KB chunks
      
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        let chunkString = '';
        for (const byte of chunk) {
          chunkString += String.fromCharCode(byte);
        }
        base64Audio += btoa(chunkString);
      }
      
      console.log('✅ Base64 conversion complete, length:', base64Audio.length);

      // Call tRPC pronunciation assessment endpoint
      const result = await assessmentMutation.mutateAsync({
        referenceText,
        audioData: base64Audio,
        language: 'ro-RO',
      });

      if (result.success && result.assessment) {
        const assessment = result.assessment as Assessment;
        setAssessment(assessment);
        
        console.log('Assessment completed:', assessment);
        
        // Generate user-friendly feedback
        const feedback = generateFeedback(assessment);
        setFeedback(feedback);
        
        setRecordingState('completed');
        onAssessmentComplete?.(assessment);
      } else {
        throw new Error(result.error ?? 'Assessment failed');
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Assessment failed';
      console.error('❌ Pronunciation assessment failed:', errorMessage);
      setError(errorMessage);
      setRecordingState('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordingStateChange = (state: RecordingState) => {
    setRecordingState(state);
    
    // Clear previous results when starting new recording
    if (state === 'recording') {
      setAssessment(null);
      setFeedback(null);
      setError(null);
    }
  };



  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const hasLowCompleteness = assessment && assessment.completenessScore < 50;
  const wordCount = referenceText.split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className={`pronunciation-assessment ${className}`}>
      {/* Reference Text Display */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Practice Text ({wordCount} words):</h3>
        <p className="text-lg text-gray-900">{referenceText}</p>
      </div>

      {/* Recording Tips Toggle */}
      <div className="mb-4">
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          {showTips ? '🔽 Hide Recording Tips' : '💡 Show Recording Tips'}
        </button>
        
        {showTips && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm">
            <h4 className="font-medium text-blue-900 mb-2">📢 For Better Recognition:</h4>
            <ul className="space-y-1 text-blue-800">
              <li>• <strong>Speak clearly</strong> and at normal speed</li>
              <li>• <strong>Don&apos;t pause too long</strong> between words (max 1 second)</li>
              <li>• <strong>Say the complete phrase</strong> in one recording</li>
              <li>• <strong>Start speaking immediately</strong> after pressing record (avoid long silence at start)</li>
              <li>• <strong>Speak continuously</strong> - don&apos;t start and stop multiple times</li>
              <li>• <strong>Ensure good microphone</strong> - speak 6-12 inches away</li>
              <li>• <strong>Minimize background noise</strong></li>
              <li>• <strong>Keep recording until finished</strong> - don&apos;t stop early</li>
              <li>• <strong>Practice the text first</strong> to avoid hesitation during recording</li>
            </ul>
            <div className="mt-2 p-2 bg-blue-100 rounded text-xs">
              <p><strong>💡 Pro tip:</strong> If you get very low completeness scores, try speaking faster with fewer pauses. The system works best with natural, conversational speech patterns.</p>
            </div>
          </div>
        )}
      </div>

      {/* Environment Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">🔧 Azure Speech Service Status</h4>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            environmentCheck.isLoading ? 'bg-gray-200 text-gray-600' :
            environmentCheck.data?.isConfigured ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {environmentCheck.isLoading ? 'Checking...' :
             environmentCheck.data?.isConfigured ? 'Configured' : 'Not Configured'}
          </div>
        </div>
        
        {environmentCheck.data && (
          <div className="text-xs text-gray-600">
            <p className="mb-1">{environmentCheck.data.message}</p>
            {!environmentCheck.data.isConfigured && (
              <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
                <p className="font-medium">⚠️ Configuration Issues:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {environmentCheck.data.details.azureSpeechKey === 'missing' && (
                    <li>Missing AZURE_SPEECH_KEY environment variable</li>
                  )}
                  {environmentCheck.data.details.azureSpeechRegion === 'missing' && (
                    <li>Missing AZURE_SPEECH_REGION environment variable</li>
                  )}
                </ul>
                <p className="mt-2 text-xs">
                  Add these to your .env file and restart the server.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Microphone Test */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">🎤 Microphone Test</h4>
          <button
            onClick={() => void testMicrophone()}
            disabled={micTest.testing}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
          >
            {micTest.testing ? 'Testing...' : 'Test Mic'}
          </button>
        </div>
        
        {micTest.testing && (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-full rounded-full transition-all duration-100 ${
                    micTest.lastLevel >= 95 ? 'bg-red-600 animate-pulse' : // Clipping - red and pulsing
                    micTest.lastLevel > 30 ? 'bg-green-500' : 
                    micTest.lastLevel > 10 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(micTest.lastLevel, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-8">{micTest.lastLevel}%</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {micTest.lastLevel >= 95 
                ? "⚠️ CLIPPING! Volume too high - reduce microphone volume"
                : "Say something to test your microphone..."
              }
            </p>
          </div>
        )}
        
        {!micTest.testing && micTest.lastLevel > 0 && (
          <div className={`text-xs p-2 rounded ${
            micTest.clipping
              ? 'bg-red-50 text-red-700 border border-red-200'
              : micTest.isWorking 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {micTest.clipping 
              ? '🔊 CLIPPING DETECTED! Reduce microphone volume before recording' 
              : micTest.isWorking 
              ? '✅ Microphone is working well!' 
              : '❌ Microphone signal very low - check volume and permissions'
            }
          </div>
        )}
      </div>

      {/* Diagnostic Test */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-700">🔬 Audio Pipeline Test</h4>
          <div className="flex gap-2">
            <button
              onClick={() => void runDiagnosticTest()}
              disabled={diagnosticTest.running}
              className="px-3 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded disabled:opacity-50"
            >
              {diagnosticTest.running ? 'Testing...' : 'Test Basic'}
            </button>
            <button
              onClick={() => void testRecordingButtonMethod()}
              disabled={diagnosticTest.running}
              className="px-3 py-1 text-xs bg-blue-200 hover:bg-blue-300 rounded disabled:opacity-50"
            >
              {diagnosticTest.running ? 'Testing...' : 'Test RecButton'}
            </button>
          </div>
        </div>
        
        {diagnosticTest.running && (
          <p className="text-xs text-blue-600">Recording and processing audio locally (2 seconds)...</p>
        )}
        
        {diagnosticTest.result && (
          <div className={`text-xs p-2 rounded mt-2 ${
            diagnosticTest.result.success 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <p className="font-medium">{diagnosticTest.result.message}</p>
            {diagnosticTest.result.success && (
              <p className="mt-1">
                Sizes: {diagnosticTest.result.originalSize} → {diagnosticTest.result.wavSize} bytes
                {diagnosticTest.result.wavSize && diagnosticTest.result.originalSize && 
                  ` (${((diagnosticTest.result.wavSize / diagnosticTest.result.originalSize) * 100).toFixed(0)}% of original)`
                }
              </p>
            )}
            {diagnosticTest.result.error && (
              <p className="mt-1">Error: {diagnosticTest.result.error}</p>
            )}
          </div>
        )}
        
        <p className="text-xs text-blue-600 mt-2">
          These tests help identify audio processing issues. &quot;Test Basic&quot; uses simple recording, &quot;Test RecButton&quot; uses the same method as pronunciation recording.
        </p>
      </div>

      {/* Recording Controls */}
      <div className="mb-6">
        <RecordingButton
          onRecordingComplete={handleRecordingComplete}
          onRecordingStateChange={handleRecordingStateChange}
          disabled={isProcessing}
          className="w-full"
          maxDuration={15} // Reduced from 30 to encourage concise speech
        />
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Analyzing your pronunciation...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Low Completeness Warning */}
      {hasLowCompleteness && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Incomplete Recognition</h4>
          <p className="text-yellow-700 text-sm mb-2">
            Only {assessment?.words.filter(w => w.accuracyScore > 0).length} out of {wordCount} words were recognized.
          </p>
          <div className="text-sm text-yellow-800">
            <p><strong>Most common causes:</strong></p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Speaking too slowly with long pauses between words (&gt;1 second)</li>
              <li>Starting recording but waiting too long before speaking</li>
              <li>Stopping recording before finishing the complete phrase</li>
              <li>Speaking too quietly or microphone volume too low</li>
              <li>Hesitating or repeating words during recording</li>
              <li>Background noise interfering with speech detection</li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
              <p><strong>🚀 Quick fix:</strong> Press record, immediately start speaking the entire phrase at normal conversation speed without pauses, then stop recording. Treat it like you&apos;re having a normal conversation.</p>
            </div>
          </div>
        </div>
      )}

      {/* Audio Clipping Warning */}
      {error && error.includes('No speech was recognized') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-red-800 mb-2">🔊 Audio Quality Issue Detected</h4>
          <p className="text-red-700 text-sm mb-3">
            Your microphone volume appears to be too high, causing audio distortion (clipping).
          </p>
          <div className="text-sm text-red-800">
            <p className="font-medium mb-2">🛠️ How to fix this:</p>
            <ul className="list-disc list-inside space-y-1 mb-3">
              <li><strong>Reduce microphone volume</strong> in System Preferences → Sound → Input</li>
              <li><strong>Speak further away</strong> from your microphone (12-18 inches)</li>
              <li><strong>Lower your voice volume</strong> slightly</li>
              <li><strong>Use headphones</strong> to avoid audio feedback</li>
            </ul>
            <div className="bg-red-100 p-2 rounded text-xs">
              <p><strong>💡 Quick tip:</strong> The microphone test above will show you if the volume is too high (red bars = clipping).</p>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Results */}
      {assessment && feedback && !isProcessing && (
        <div className="space-y-6">
          {/* Overall Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(assessment.pronScore)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(assessment.pronScore)}`}>
                {assessment.pronScore}
              </div>
              <div className="text-sm text-gray-600">Overall</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(assessment.accuracyScore)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(assessment.accuracyScore)}`}>
                {assessment.accuracyScore}
              </div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(assessment.fluencyScore)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(assessment.fluencyScore)}`}>
                {assessment.fluencyScore}
              </div>
              <div className="text-sm text-gray-600">Fluency</div>
            </div>
            <div className={`text-center p-4 rounded-lg ${getScoreBgColor(assessment.completenessScore)}`}>
              <div className={`text-2xl font-bold ${getScoreColor(assessment.completenessScore)}`}>
                {assessment.completenessScore}
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>

          {/* Word-level Feedback */}
          <div>
            <h4 className="text-lg font-medium mb-3">Word Analysis:</h4>
            <div className="flex flex-wrap gap-2">
              {assessment.words.map((word, index) => (
                <span
                  key={index}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${word.accuracyScore >= 80 
                      ? 'bg-green-100 text-green-800' 
                      : word.accuracyScore >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : word.accuracyScore === 0
                      ? 'bg-gray-100 text-gray-600 line-through'
                      : 'bg-red-100 text-red-800'
                    }
                  `}
                  title={`${word.word}: ${word.accuracyScore}% accuracy${word.errorType ? ` (${word.errorType})` : ''}`}
                >
                  {word.word} ({word.accuracyScore})
                </span>
              ))}
            </div>
            {assessment.words.some(w => w.accuracyScore === 0) && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="line-through">Crossed out words</span> were not recognized in your recording.
              </p>
            )}
          </div>

          {/* Improvement Suggestions */}
          {feedback.improvements.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-3">💡 Improvement Tips:</h4>
              <ul className="space-y-2">
                {feedback.improvements.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strong Points */}
          {feedback.strongPoints.length > 0 && (
            <div>
              <h4 className="text-lg font-medium mb-3">✅ You&apos;re doing well:</h4>
              <ul className="space-y-2">
                {feedback.strongPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 