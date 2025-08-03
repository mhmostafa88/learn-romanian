import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

// Azure Speech Service configuration
const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY!,
  process.env.AZURE_SPEECH_REGION!
);

// Validate environment configuration on module load
if (!process.env.AZURE_SPEECH_KEY || !process.env.AZURE_SPEECH_REGION) {
  console.error('🚨 AZURE SPEECH CONFIGURATION ERROR:');
  console.error('Missing required environment variables:');
  console.error('AZURE_SPEECH_KEY:', process.env.AZURE_SPEECH_KEY ? 'SET' : 'MISSING');
  console.error('AZURE_SPEECH_REGION:', process.env.AZURE_SPEECH_REGION ? 'SET' : 'MISSING');
  console.error('Please check your .env file or environment configuration.');
}

// Configure for Romanian language
speechConfig.speechSynthesisLanguage = 'ro-RO';
speechConfig.speechSynthesisVoiceName = 'ro-RO-AlinaNeural'; // Female Romanian voice

export interface SpeechSynthesisOptions {
  text: string;
  voice?: string;
  rate?: string; // Speaking rate (x-slow, slow, medium, fast, x-fast)
  pitch?: string; // Pitch (x-low, low, medium, high, x-high)
}

/**
 * Convert text to speech and return audio data
 */
export async function synthesizeSpeech(options: SpeechSynthesisOptions): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const { text, voice, rate = 'medium', pitch = 'medium' } = options;
    
    // Create synthesizer
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);
    
    // Use SSML for better control over speech
    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ro-RO">
        <voice name="${voice ?? 'ro-RO-AlinaNeural'}">
          <prosody rate="${rate}" pitch="${pitch}">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioData = result.audioData;
          synthesizer.close();
          resolve(audioData);
        } else {
          synthesizer.close();
          reject(new Error(`Speech synthesis failed: ${result.errorDetails}`));
        }
      },
      (error) => {
        synthesizer.close();
        reject(new Error(`Speech synthesis error: ${String(error)}`));
      }
    );
  });
}

/**
 * Available Romanian voices
 */
export const ROMANIAN_VOICES = {
  ALINA: 'ro-RO-AlinaNeural', // Female, cheerful
  EMIL: 'ro-RO-EmilNeural',   // Male, calm
} as const;

export type RomanianVoice = typeof ROMANIAN_VOICES[keyof typeof ROMANIAN_VOICES];

// Pronunciation Assessment Types
export interface PronunciationAssessmentOptions {
  referenceText: string;
  audioData: ArrayBuffer;
  language?: string;
}

// Azure SDK response interfaces
interface AzureSyllableResult {
  Syllable: string;
  PronunciationAssessment?: {
    AccuracyScore: number;
  };
  Offset: number;
  Duration: number;
}

interface AzureWordResult {
  Word: string;
  PronunciationAssessment?: {
    AccuracyScore: number;
    ErrorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
  };
  Syllables?: AzureSyllableResult[];
}

interface AzureAssessmentResponse {
  NBest?: Array<{
    Words?: AzureWordResult[];
  }>;
}

export interface PronunciationAssessmentResult {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  pronScore: number;
  words: Array<{
    word: string;
    accuracyScore: number;
    errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
    syllables?: Array<{
      syllable: string;
      accuracyScore: number;
      offset: number;
      duration: number;
    }>;
  }>;
}

/**
 * Assess pronunciation quality using Azure Speech Services
 */
export async function assessPronunciation(
  options: PronunciationAssessmentOptions
): Promise<PronunciationAssessmentResult> {
  return new Promise((resolve, reject) => {
    const { referenceText, audioData, language = 'ro-RO' } = options;
    
    console.log('🎤 Starting pronunciation assessment:', {
      referenceTextLength: referenceText.length,
      referenceText: referenceText.substring(0, 50) + (referenceText.length > 50 ? '...' : ''),
      audioDataSize: audioData.byteLength,
      language,
      wordCount: referenceText.split(/\s+/).filter(w => w.length > 0).length
    });

    // Create a fresh speech config for this request to avoid conflicts
    const requestSpeechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    
    // Set language and other properties for Romanian
    requestSpeechConfig.speechRecognitionLanguage = language;
    requestSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_RecoLanguage, language);
    
    // Add properties to improve recognition of longer phrases
    requestSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "8000");
    requestSpeechConfig.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "2000");
    requestSpeechConfig.setProperty(sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs, "2000");
    
    console.log('🔧 Azure config set for language:', language);

    // Configure pronunciation assessment with more specific settings
    const pronunciationConfig = new sdk.PronunciationAssessmentConfig(
      referenceText,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Word,
      true // Enable detailed results
    );
    
    // Configure speech recognizer for assessment
    const audioBuffer = Buffer.from(audioData);
    console.log('📊 Audio buffer info:', {
      size: audioBuffer.length,
      firstBytes: Array.from(audioBuffer.slice(0, 12)).map(b => b.toString(16).padStart(2, '0')).join(' '),
      durationEstimate: `${(audioBuffer.length / 32000).toFixed(2)}s`, // Rough estimate for 16kHz 16-bit
      sampleCount: Math.floor(audioBuffer.length / 2), // 16-bit samples
      bytesPerSecond: 32000 // 16kHz * 16bit / 8
    });
    
    // Extract WAV header information for validation
    const dataView = new DataView(audioBuffer.buffer);
    const fmtChunkSize = dataView.getUint32(16, true);
    const audioFormat = dataView.getUint16(20, true);
    const numChannels = dataView.getUint16(22, true);
    const sampleRate = dataView.getUint32(24, true);
    const bitsPerSample = dataView.getUint16(34, true);
    
    console.log('📊 WAV file analysis:', {
      formatChunkSize: fmtChunkSize,
      audioFormat: audioFormat, // Should be 1 for PCM
      channels: numChannels,
      sampleRate: sampleRate,
      bitsPerSample: bitsPerSample,
      expectedSampleRate: 16000,
      formatValid: audioFormat === 1 && sampleRate === 16000 && bitsPerSample === 16
    });
    
    // Validate WAV header
    const riffHeader = audioBuffer.toString('ascii', 0, 4);
    const waveHeader = audioBuffer.toString('ascii', 8, 12);
    console.log('🔍 WAV headers check:', { riffHeader, waveHeader });
    
    if (riffHeader !== 'RIFF' || waveHeader !== 'WAVE') {
      reject(new Error('Invalid WAV format: missing RIFF/WAVE headers'));
      return;
    }
    
    if (audioFormat !== 1) {
      console.warn('⚠️ Non-PCM audio format detected:', audioFormat);
    }
    
    if (sampleRate !== 16000) {
      console.warn('⚠️ Unexpected sample rate:', sampleRate, 'expected 16000');
    }
    
    // Analyze actual audio data for speech content
    const dataChunkStart = 44; // Standard WAV header size
    if (audioBuffer.length > dataChunkStart + 100) {
      const sampleData = [];
      let maxSample = 0;
      let totalEnergy = 0;
      const samplesToAnalyze = Math.min(1000, Math.floor((audioBuffer.length - dataChunkStart) / 2));
      
      for (let i = 0; i < samplesToAnalyze; i++) {
        const byteOffset = dataChunkStart + (i * 2);
        const sample = dataView.getInt16(byteOffset, true) / 32768; // Normalize to -1 to 1
        sampleData.push(sample);
        maxSample = Math.max(maxSample, Math.abs(sample));
        totalEnergy += sample * sample;
      }
      
      const rmsLevel = Math.sqrt(totalEnergy / samplesToAnalyze);
      const hasSignal = rmsLevel > 0.001;
      
      console.log('🎵 Audio signal analysis:', {
        samplesAnalyzed: samplesToAnalyze,
        maxAmplitude: maxSample.toFixed(4),
        rmsLevel: rmsLevel.toFixed(4),
        hasSignal: hasSignal,
        signalStrength: hasSignal ? (rmsLevel > 0.1 ? 'strong' : rmsLevel > 0.01 ? 'moderate' : 'weak') : 'none',
        firstFewSamples: sampleData.slice(0, 10).map(s => s.toFixed(3))
      });
      
      if (!hasSignal) {
        console.warn('⚠️ No audio signal detected in WAV data - recording may be silent');
      }
    }
    
    // Create push stream for flexible audio input
    const pushStream = sdk.AudioInputStream.createPushStream();
    pushStream.write(audioBuffer);
    pushStream.close();
    
    const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
    const recognizer = new sdk.SpeechRecognizer(requestSpeechConfig, audioConfig);
    
    // Apply pronunciation assessment configuration
    pronunciationConfig.applyTo(recognizer);
    
    console.log('🚀 Starting Azure recognition...');

    recognizer.recognizeOnceAsync(
      (result) => {
        console.log('📥 Azure recognition completed');
        console.log('Result reason:', result.reason, '(', sdk.ResultReason[result.reason], ')');
        console.log('Recognized text:', `"${result.text}"`);
        console.log('Result duration:', result.duration, `(${(result.duration / 10000000).toFixed(2)}s)`);
        console.log('Result offset:', result.offset, `(${(result.offset / 10000000).toFixed(2)}s)`);
        
        // Enhanced logging for all result types
        console.log('🔍 Detailed result analysis:', {
          reason: result.reason,
          reasonName: sdk.ResultReason[result.reason],
          text: result.text,
          resultId: result.resultId,
          errorDetails: result.errorDetails ?? 'none',
          hasJsonResult: !!result.properties?.getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult)
        });
        
        if (result.reason === sdk.ResultReason.RecognizedSpeech) {
          try {
            // Parse pronunciation assessment results
            const pronunciationResult = sdk.PronunciationAssessmentResult.fromResult(result);
            
            console.log('🎯 Pronunciation scores:', {
              accuracy: pronunciationResult.accuracyScore,
              fluency: pronunciationResult.fluencyScore,
              completeness: pronunciationResult.completenessScore,
              overall: pronunciationResult.pronunciationScore
            });
            
            // Check if we have actual pronunciation data
            if (pronunciationResult.accuracyScore === 0 && 
                pronunciationResult.fluencyScore === 0 && 
                pronunciationResult.completenessScore === 0) {
              console.warn('🚨 All pronunciation scores are zero - this indicates a problem:');
              console.warn('- Audio might not contain recognizable speech');
              console.warn('- Reference text might not match spoken content');
              console.warn('- Language setting might be incorrect');
              console.warn('- Audio quality might be too poor for assessment');
            }
            
            // Extract word-level details
            const jsonResult = result.properties
              .getProperty(sdk.PropertyId.SpeechServiceResponse_JsonResult);
            
            console.log('📄 Raw JSON response length:', jsonResult?.length || 0);
            
            // Log the actual JSON response for debugging
            if (jsonResult) {
              console.log('📋 Full Azure JSON response:', jsonResult.substring(0, 500) + (jsonResult.length > 500 ? '...' : ''));
            }
            
            let words: AzureWordResult[] = [];
            if (jsonResult) {
              try {
                const parsed = JSON.parse(jsonResult) as AzureAssessmentResponse;
                words = parsed.NBest?.[0]?.Words ?? [];
                console.log('📝 Word-level results:', words.map(w => ({
                  word: w.Word,
                  score: w.PronunciationAssessment?.AccuracyScore,
                  error: w.PronunciationAssessment?.ErrorType
                })));
                
                // Enhanced comparison logging
                const referenceWords = referenceText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                const recognizedWords = result.text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                console.log('🔍 Enhanced text comparison:', {
                  reference: referenceWords,
                  referenceCount: referenceWords.length,
                  recognized: recognizedWords,
                  recognizedCount: recognizedWords.length,
                  completenessRatio: `${recognizedWords.length}/${referenceWords.length}`,
                  match: referenceWords.length === recognizedWords.length,
                  missingWords: referenceWords.filter(w => !recognizedWords.includes(w.replace(/[!?.]/g, '')))
                });
                
                // Check for specific issues
                if (words.length === 0) {
                  console.warn('⚠️ No word-level results found in Azure response');
                }
                if (result.text.trim() === '') {
                  console.warn('⚠️ Azure recognized empty text - audio might be silent or unclear');
                }
                if (result.text.toLowerCase() !== referenceText.toLowerCase()) {
                  console.warn('⚠️ Recognized text does not match reference text exactly');
                  console.warn('This will result in low completeness scores');
                }
                
              } catch (parseError) {
                console.warn('⚠️ Failed to parse assessment response:', parseError);
                console.warn('Raw response that failed to parse:', jsonResult?.substring(0, 200));
              }
            } else {
              console.error('❌ No JSON result found in Azure response - this should not happen');
            }

            const assessmentResult: PronunciationAssessmentResult = {
              accuracyScore: pronunciationResult.accuracyScore,
              fluencyScore: pronunciationResult.fluencyScore,
              completenessScore: pronunciationResult.completenessScore,
              pronScore: pronunciationResult.pronunciationScore,
              words: words.map((word: AzureWordResult) => ({
                word: word.Word,
                accuracyScore: word.PronunciationAssessment?.AccuracyScore ?? 0,
                errorType: word.PronunciationAssessment?.ErrorType ?? 'None',
                syllables: word.Syllables?.map((syllable: AzureSyllableResult) => ({
                  syllable: syllable.Syllable,
                  accuracyScore: syllable.PronunciationAssessment?.AccuracyScore ?? 0,
                  offset: syllable.Offset ?? 0,
                  duration: syllable.Duration ?? 0,
                })) ?? [],
              })),
            };

            recognizer.close();
            resolve(assessmentResult);
          } catch (error) {
            recognizer.close();
            console.error('❌ Error processing pronunciation results:', error);
            reject(new Error(`Failed to parse pronunciation assessment results: ${String(error)}`));
          }
        } else if (result.reason === sdk.ResultReason.NoMatch) {
          recognizer.close();
          const noMatchDetails = sdk.NoMatchDetails.fromResult(result);
          console.error('❌ No speech recognized. Details:', {
            reason: noMatchDetails.reason,
            reasonText: sdk.NoMatchReason[noMatchDetails.reason],
            errorDetails: result.errorDetails
          });
          reject(new Error('No speech was recognized. Please ensure you are speaking clearly and the microphone is working.'));
        } else {
          recognizer.close();
          console.error('❌ Recognition failed:', {
            reason: result.reason,
            reasonText: sdk.ResultReason[result.reason],
            errorDetails: result.errorDetails
          });
          reject(new Error(`Speech recognition failed: ${sdk.ResultReason[result.reason]}. Error details: ${result.errorDetails || 'Unknown error'}`));
        }
      },
      (error) => {
        recognizer.close();
        console.error('❌ Azure recognition error:', error);
        reject(new Error(`Pronunciation assessment error: ${String(error)}`));
      }
    );
  });
} 