/**
 * Audio utility functions for format conversion and processing
 */

// Extend Window interface for webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/**
 * Analyze audio buffer for quality issues
 */
export function analyzeAudioQuality(audioBuffer: AudioBuffer): {
  hasAudio: boolean;
  maxAmplitude: number;
  rmsLevel: number;
  silentSamples: number;
  quality: 'good' | 'quiet' | 'silent' | 'clipping';
  issues: string[];
  actualAudioStart: number; // Where non-silent audio begins
  audioSegments: number; // Number of segments with speech
} {
  const channelData = audioBuffer.getChannelData(0);
  const sampleCount = channelData.length;
  
  let maxAmplitude = 0;
  let rmsSum = 0;
  let silentSamples = 0;
  let actualAudioStart = -1;
  let audioSegments = 0;
  
  // Analyze the entire buffer, not just the first part
  for (let i = 0; i < sampleCount; i++) {
    const sample = Math.abs(channelData[i] ?? 0);
    maxAmplitude = Math.max(maxAmplitude, sample);
    rmsSum += sample * sample;
    
    // Count silent samples (very low amplitude)
    if (sample < 0.001) {
      silentSamples++;
    } else {
      // Mark where actual audio starts
      if (actualAudioStart === -1) {
        actualAudioStart = i;
      }
    }
  }
  
  // Count audio segments (areas with sustained signal)
  const windowSize = Math.floor(audioBuffer.sampleRate * 0.1); // 100ms windows
  for (let i = 0; i < sampleCount; i += windowSize) {
    let windowEnergy = 0;
    const windowEnd = Math.min(i + windowSize, sampleCount);
    
    for (let j = i; j < windowEnd; j++) {
      const sample = channelData[j] ?? 0;
      windowEnergy += sample * sample;
    }
    
    const windowRms = Math.sqrt(windowEnergy / (windowEnd - i));
    if (windowRms > 0.01) { // Threshold for "speech"
      audioSegments++;
    }
  }
  
  const rmsLevel = Math.sqrt(rmsSum / sampleCount);
  const silentRatio = silentSamples / sampleCount;
  
  const analysis = {
    hasAudio: rmsLevel > 0.001,
    maxAmplitude,
    rmsLevel,
    silentSamples,
    actualAudioStart,
    audioSegments,
    quality: 'good' as 'good' | 'quiet' | 'silent' | 'clipping',
    issues: [] as string[]
  };
  
  // Determine quality and issues with better logic
  if (rmsLevel < 0.001) {
    analysis.quality = 'silent';
    analysis.issues.push('No audio detected - check microphone');
  } else if (rmsLevel < 0.01) {
    analysis.quality = 'quiet';
    analysis.issues.push('Audio level very low - speak louder or closer to microphone');
  } else if (maxAmplitude > 0.95) {
    analysis.quality = 'clipping';
    analysis.issues.push('Audio clipping detected - reduce volume or distance from microphone');
  } else if (silentRatio > 0.9) {
    analysis.quality = 'quiet';
    analysis.issues.push('Too much silence - speak more continuously');
  } else if (audioSegments < 2) {
    analysis.quality = 'quiet';
    analysis.issues.push('Very short speech detected - try speaking longer phrases');
  }
  
  return analysis;
}

/**
 * Trim silence from the beginning and end of audio buffer
 */
function trimSilence(audioBuffer: AudioBuffer, qualityAnalysis: ReturnType<typeof analyzeAudioQuality>): AudioBuffer {
  console.log('✂️ trimSilence called with analysis:', {
    actualAudioStart: qualityAnalysis.actualAudioStart,
    totalLength: audioBuffer.length,
    duration: audioBuffer.duration.toFixed(2)
  });
  
  const channelData = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  
  // Find start of actual audio (skip initial silence)
  const startSample = Math.max(0, qualityAnalysis.actualAudioStart - Math.floor(sampleRate * 0.1)); // Keep 100ms before audio starts
  
  // Find end of actual audio (remove trailing silence)
  let endSample = channelData.length - 1;
  const silenceThreshold = 0.001;
  
  // Scan backwards from the end to find last significant audio
  for (let i = channelData.length - 1; i >= startSample; i--) {
    if (Math.abs(channelData[i] ?? 0) > silenceThreshold) {
      endSample = Math.min(i + Math.floor(sampleRate * 0.1), channelData.length - 1); // Keep 100ms after audio ends
      break;
    }
  }
  
  // Ensure we have a reasonable audio segment
  const minDuration = sampleRate * 0.5; // At least 500ms
  if (endSample - startSample < minDuration) {
    console.log('⚠️ Audio segment too short after trimming, keeping original');
    return audioBuffer;
  }
  
  console.log('✂️ Trimming audio:', {
    originalLength: channelData.length,
    originalDuration: audioBuffer.duration.toFixed(2),
    trimmedStart: startSample,
    trimmedEnd: endSample,
    trimmedLength: endSample - startSample,
    trimmedDuration: ((endSample - startSample) / sampleRate).toFixed(2),
    silenceTrimmedFromStart: (startSample / sampleRate).toFixed(2) + 's',
    silenceTrimmedFromEnd: ((channelData.length - endSample) / sampleRate).toFixed(2) + 's'
  });
  
  // Create new buffer with trimmed audio
  const trimmedLength = endSample - startSample;
  const audioContext = new AudioContext();
  const trimmedBuffer = audioContext.createBuffer(1, trimmedLength, sampleRate);
  
  // Copy the relevant audio segment
  const trimmedData = new Float32Array(trimmedLength);
  for (let i = 0; i < trimmedLength; i++) {
    trimmedData[i] = channelData[startSample + i] ?? 0;
  }
  
  trimmedBuffer.copyToChannel(trimmedData, 0);
  
  console.log('✅ Audio trimming complete');
  return trimmedBuffer;
}

/**
 * Apply audio processing to improve quality
 */
export function processAudioForSpeech(audioBuffer: AudioBuffer): AudioBuffer {
  console.log('🔧 processAudioForSpeech called with buffer:', {
    sampleRate: audioBuffer.sampleRate,
    length: audioBuffer.length,
    duration: audioBuffer.duration.toFixed(2)
  });
  
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const processedData = new Float32Array(channelData.length);
  
  // Log input audio data
  const inputFirstSamples = Array.from(channelData.slice(0, 10)).map(s => s.toFixed(4));
  console.log('🎵 Input audio first 10 samples:', inputFirstSamples);
  console.log('🎵 Input audio stats:', {
    maxValue: Math.max(...Array.from(channelData.slice(0, 1000))).toFixed(4),
    nonZeroCount: Array.from(channelData.slice(0, 1000)).filter(s => Math.abs(s) > 0.001).length
  });
  
  // Copy original data
  processedData.set(channelData);
  
  // Apply noise gate (remove very quiet samples)
  const noiseThreshold = 0.001;
  for (const [i, sample] of processedData.entries()) {
    if (Math.abs(sample) < noiseThreshold) {
      processedData[i] = 0;
    }
  }
  
  // Find max amplitude and apply appropriate processing
  let maxAmplitude = 0;
  for (const sample of processedData) {
    maxAmplitude = Math.max(maxAmplitude, Math.abs(sample));
  }
  
  console.log('🔧 Audio processing - max amplitude:', maxAmplitude);
  
  // Handle different amplitude scenarios
  if (maxAmplitude >= 0.95) {
    // Clipping detected - apply soft compression and normalization
    console.log('🛠️ Applying clipping recovery...');
    
    for (const [i, sample] of processedData.entries()) {
      // Soft clipping recovery using tanh function
      const normalizedSample = sample / maxAmplitude;
      const recoveredSample = Math.tanh(normalizedSample * 0.8) * 0.7;
      processedData[i] = recoveredSample;
    }
    
    console.log('✅ Clipping recovery applied - reduced peak from', maxAmplitude.toFixed(3), 'to ~0.7');
    
  } else if (maxAmplitude > 0 && maxAmplitude < 0.1) {
    // Boost quiet audio
    const boost = Math.min(0.3 / maxAmplitude, 3.0); // Max 3x boost
    for (const [i, sample] of processedData.entries()) {
      processedData[i] = sample * boost;
    }
    console.log('🔊 Applied audio boost:', boost.toFixed(2) + 'x');
    
  } else if (maxAmplitude > 0.7) {
    // High but not clipping - gentle normalization
    const reduction = 0.6 / maxAmplitude;
    for (const [i, sample] of processedData.entries()) {
      processedData[i] = sample * reduction;
    }
    console.log('🔉 Applied gentle volume reduction:', reduction.toFixed(2) + 'x');
  }
  
  // Log output audio data
  const outputFirstSamples = Array.from(processedData.slice(0, 10)).map(s => s.toFixed(4));
  console.log('🎵 Output audio first 10 samples:', outputFirstSamples);
  console.log('🎵 Output audio stats:', {
    maxValue: Math.max(...Array.from(processedData.slice(0, 1000))).toFixed(4),
    nonZeroCount: Array.from(processedData.slice(0, 1000)).filter(s => Math.abs(s) > 0.001).length
  });
  
  // Create new AudioBuffer with processed data
  const audioContext = new AudioContext();
  const processedBuffer = audioContext.createBuffer(
    1, 
    processedData.length, 
    sampleRate
  );
  processedBuffer.copyToChannel(processedData, 0);
  
  console.log('✅ processAudioForSpeech completed');
  return processedBuffer;
}

/**
 * Convert audio blob to proper WAV format for Azure Speech Services
 * Requires 16kHz mono WAV format
 */
export async function convertToWav(audioBlob: Blob): Promise<ArrayBuffer> {
  console.log('🔊 AUDIO CONVERSION START - convertToWav called');
  console.log('Input audio blob size:', audioBlob.size, 'type:', audioBlob.type);
  console.log('🚨 CRITICAL DEBUG: convertToWav function is definitely being called');
  
  try {
    console.log('🎵 Starting audio context creation...');
    
    const audioContext = new AudioContext();
    
    console.log('🎵 Audio context created, converting blob to buffer...');
    const arrayBuffer = await audioBlob.arrayBuffer();
    console.log('📊 Array buffer size:', arrayBuffer.byteLength);
    
    console.log('🔄 Starting audio decoding...');
    let audioBuffer: AudioBuffer;
    
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log('✅ Audio decoded successfully:', {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration.toFixed(1),
        length: audioBuffer.length
      });
    } catch (error) {
      console.error('❌ Audio decoding failed:', error);
      await audioContext.close();
      throw new Error(`Failed to decode audio data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Analyze audio quality before processing
    console.log('🔍 Starting audio quality analysis...');
    const qualityAnalysis = analyzeAudioQuality(audioBuffer);
    console.log('📊 Audio quality analysis complete:', qualityAnalysis);
    
    // Log samples from where audio actually starts, not just the beginning
    const channelData = audioBuffer.getChannelData(0);
    const audioStartSample = Math.max(0, qualityAnalysis.actualAudioStart - 10);
    const analysisSamples = qualityAnalysis.actualAudioStart > 0 ? 
      Array.from(channelData.slice(audioStartSample, audioStartSample + 20)).map(s => s.toFixed(4)) :
      Array.from(channelData.slice(0, 20)).map(s => s.toFixed(4));
    
    console.log('🎵 Audio buffer samples (from actual content start):', analysisSamples);
    console.log('🎵 Audio buffer comprehensive stats:', {
      totalLength: channelData.length,
      durationSeconds: audioBuffer.duration.toFixed(2),
      actualAudioStartTime: qualityAnalysis.actualAudioStart > 0 ? 
        `${(qualityAnalysis.actualAudioStart / audioBuffer.sampleRate).toFixed(2)}s` : 'immediate',
      maxAmplitude: qualityAnalysis.maxAmplitude.toFixed(4),
      rmsLevel: qualityAnalysis.rmsLevel.toFixed(4),
      audioSegments: qualityAnalysis.audioSegments,
      silenceRatio: `${((qualityAnalysis.silentSamples / channelData.length) * 100).toFixed(1)}%`,
      quality: qualityAnalysis.quality
    });
    
    if (!qualityAnalysis.hasAudio) {
      await audioContext.close();
      console.error('🚨 CRITICAL: No audio detected in decoded buffer - this should not happen if microphone works');
      throw new Error('No audio detected in recording. Please check your microphone and try again.');
    }
    
    if (qualityAnalysis.issues.length > 0) {
      console.warn('⚠️ Audio quality issues detected:', qualityAnalysis.issues);
    }
    
    // Process audio to improve quality - always process clipping audio
    console.log('🔧 Determining if audio processing is needed...');
    const needsProcessing = qualityAnalysis.quality === 'clipping' || 
                           qualityAnalysis.quality === 'quiet' ||
                           qualityAnalysis.actualAudioStart > audioBuffer.sampleRate * 0.5; // More than 0.5s of initial silence
    
    console.log('📋 Audio processing decision:', { 
      quality: qualityAnalysis.quality, 
      needsProcessing,
      maxAmplitude: qualityAnalysis.maxAmplitude,
      rmsLevel: qualityAnalysis.rmsLevel,
      initialSilence: qualityAnalysis.actualAudioStart > 0 ? 
        `${(qualityAnalysis.actualAudioStart / audioBuffer.sampleRate).toFixed(2)}s` : 'none',
      audioSegments: qualityAnalysis.audioSegments
    });
    
    let processedBuffer = audioBuffer;
    
    // Trim silence if there's significant initial silence
    if (qualityAnalysis.actualAudioStart > audioBuffer.sampleRate * 0.3) { // More than 300ms
      console.log('✂️ Trimming initial silence...');
      processedBuffer = trimSilence(audioBuffer, qualityAnalysis);
    }
    
    // Apply additional processing if needed
    if (needsProcessing) {
      processedBuffer = processAudioForSpeech(processedBuffer);
    }
    
    console.log('🔧 Starting WAV conversion...');
    const wavBuffer = audioBufferToWav(processedBuffer);
    
    // Close audio context to free resources
    await audioContext.close();
    console.log('✅ WAV conversion complete, size:', wavBuffer.byteLength);
    
    return wavBuffer;
    
  } catch (error) {
    console.error('❌ CRITICAL: Audio conversion failed with error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('❌ Falling back - this might cause silent audio!');
    
    // Improved fallback logic - only use for actual WAV files
    if (audioBlob.type === 'audio/wav' && audioBlob.size < 500000) {
      console.log('🔄 Using original WAV audio as fallback');
      return await audioBlob.arrayBuffer();
    }
    
    // Don't silently fallback for non-WAV files - this causes silent audio
    console.error('🚨 CRITICAL: Cannot fallback for non-WAV audio type:', audioBlob.type);
    throw error; // Re-throw the error so the UI can handle it
  }
}

/**
 * Convert AudioBuffer to WAV format with proper 16kHz mono format for Azure
 */
function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  console.log('🔧 audioBufferToWav called with buffer:', {
    length: buffer.length,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
    duration: buffer.duration
  });
  
  const targetSampleRate = 16000; // Required by Azure Speech Services
  const numberOfChannels = 1; // Mono audio required
  
  // Very strict safety check to prevent any call stack issues
  const maxSamples = 10 * 48000; // 10 seconds at 48kHz max
  if (buffer.length > maxSamples) {
    console.error('❌ Audio buffer too large:', buffer.length, 'max:', maxSamples);
    throw new Error('Audio buffer too large for processing');
  }
  
  console.log('🎵 Getting channel data...');
  // Get audio data and convert to mono if needed
  let channelData: Float32Array;
  if (buffer.numberOfChannels > 1) {
    console.log('🔀 Converting stereo to mono...');
    // Mix multiple channels to mono
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    channelData = new Float32Array(left.length);
    
    // Process in smaller chunks to prevent call stack overflow
    const chunkSize = 10000;
    for (let start = 0; start < left.length; start += chunkSize) {
      const end = Math.min(start + chunkSize, left.length);
      for (let i = start; i < end; i++) {
        const leftSample = left[i] ?? 0;
        const rightSample = right?.[i] ?? 0;
        channelData[i] = right ? (leftSample + rightSample) / 2 : leftSample;
      }
    }
  } else {
    console.log('🎵 Using mono channel data directly...');
    channelData = buffer.getChannelData(0);
  }
  
  console.log('📊 Channel data length:', channelData.length);
  
  // Always resample to exactly 16kHz for Azure compatibility
  let audioData: Float32Array;
  if (buffer.sampleRate !== targetSampleRate) {
    console.log(`🔄 Resampling from ${buffer.sampleRate}Hz to ${targetSampleRate}Hz`);
    audioData = resampleAudio(channelData, buffer.sampleRate, targetSampleRate);
  } else {
    console.log('✅ Sample rate already 16kHz, no resampling needed');
    audioData = channelData;
  }
  
  console.log('📊 Final audio data length:', audioData.length);
  
  // Final safety check before creating WAV
  if (audioData.length > 160000) { // 10 seconds at 16kHz
    console.error('❌ Final audio data too large:', audioData.length);
    throw new Error('Processed audio data too large');
  }
  
  console.log('📝 Creating WAV file structure...');
  
  // Create WAV file with exact Azure Speech Services specification
  const length = audioData.length;
  const byteRate = targetSampleRate * numberOfChannels * 2; // 16-bit = 2 bytes per sample
  const blockAlign = numberOfChannels * 2;
  const dataSize = length * 2;
  const fileSize = 36 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);
  
  // Write WAV header with exact specification for Azure
  let pos = 0;
  
  // RIFF chunk descriptor - write as raw bytes
  view.setUint8(pos++, 0x52); // 'R'
  view.setUint8(pos++, 0x49); // 'I'
  view.setUint8(pos++, 0x46); // 'F'
  view.setUint8(pos++, 0x46); // 'F'
  view.setUint32(pos, fileSize, true); pos += 4;    // File size - little endian
  view.setUint8(pos++, 0x57); // 'W'
  view.setUint8(pos++, 0x41); // 'A'
  view.setUint8(pos++, 0x56); // 'V'
  view.setUint8(pos++, 0x45); // 'E'
  
  // fmt sub-chunk - write as raw bytes  
  view.setUint8(pos++, 0x66); // 'f'
  view.setUint8(pos++, 0x6d); // 'm'
  view.setUint8(pos++, 0x74); // 't'
  view.setUint8(pos++, 0x20); // ' '
  view.setUint32(pos, 16, true); pos += 4;          // PCM chunk size - little endian
  view.setUint16(pos, 1, true); pos += 2;           // PCM format - little endian
  view.setUint16(pos, numberOfChannels, true); pos += 2; // Mono - little endian
  view.setUint32(pos, targetSampleRate, true); pos += 4; // Sample rate - little endian
  view.setUint32(pos, byteRate, true); pos += 4;         // Byte rate - little endian
  view.setUint16(pos, blockAlign, true); pos += 2;       // Block align - little endian
  view.setUint16(pos, 16, true); pos += 2;               // Bits per sample - little endian
  
  // data sub-chunk - write as raw bytes
  view.setUint8(pos++, 0x64); // 'd'
  view.setUint8(pos++, 0x61); // 'a'
  view.setUint8(pos++, 0x74); // 't'
  view.setUint8(pos++, 0x61); // 'a'
  view.setUint32(pos, dataSize, true); pos += 4;    // Data size - little endian
  
  console.log('✏️ Writing PCM data...');
  console.log('WAV header info:', {
    fileSize,
    dataSize,
    sampleRate: targetSampleRate,
    channels: numberOfChannels,
    bitsPerSample: 16,
    byteRate,
    blockAlign
  });
  
  // Convert float samples to 16-bit PCM with very conservative chunking
  const chunkSize = 5000; // Smaller chunks
  for (let start = 0; start < audioData.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, audioData.length);
    for (let i = start; i < end; i++) {
      // Clamp and convert to 16-bit signed integer
      const sample = Math.max(-1, Math.min(1, audioData[i] ?? 0));
      const pcmValue = Math.round(sample * 32767); // Convert to 16-bit range
      view.setInt16(44 + i * 2, pcmValue, true); // Little endian
    }
    
    // Log progress for large files
    if (audioData.length > 50000 && start % 25000 === 0) {
      console.log(`📊 PCM writing progress: ${Math.round((start / audioData.length) * 100)}%`);
    }
  }
  
  console.log('✅ WAV file created successfully, size:', arrayBuffer.byteLength);
  return arrayBuffer;
}

/**
 * Simple linear interpolation resampling with chunked processing
 */
function resampleAudio(
  inputBuffer: Float32Array, 
  inputSampleRate: number, 
  outputSampleRate: number
): Float32Array {
  // Safety checks to prevent infinite loops
  if (inputSampleRate <= 0 || outputSampleRate <= 0) {
    throw new Error('Invalid sample rates');
  }
  
  if (inputBuffer.length === 0) {
    return new Float32Array(0);
  }
  
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(inputBuffer.length / ratio);
  
  // Prevent extremely large output buffers or invalid sizes
  if (outputLength <= 0 || outputLength > inputBuffer.length * 10) {
    console.warn('Invalid resampling ratio, using original audio');
    return inputBuffer;
  }
  
  // For very large arrays, use a more memory-efficient approach
  if (outputLength > 50000) {
    console.log('Using chunked resampling for large audio buffer');
    return resampleAudioChunked(inputBuffer, inputSampleRate, outputSampleRate);
  }
  
  const outputBuffer = new Float32Array(outputLength);
  
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    
    // Ensure we don't go out of bounds
    if (srcIndexFloor >= inputBuffer.length) {
      outputBuffer[i] = 0;
      continue;
    }
    
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    const sample1 = inputBuffer[srcIndexFloor] ?? 0;
    const sample2 = inputBuffer[srcIndexCeil] ?? 0;
    
    outputBuffer[i] = sample1 * (1 - fraction) + sample2 * fraction;
  }
  
  return outputBuffer;
}

/**
 * Chunked resampling for large audio buffers to prevent call stack overflow
 */
function resampleAudioChunked(
  inputBuffer: Float32Array, 
  inputSampleRate: number, 
  outputSampleRate: number
): Float32Array {
  const ratio = inputSampleRate / outputSampleRate;
  const outputLength = Math.floor(inputBuffer.length / ratio);
  const outputBuffer = new Float32Array(outputLength);
  
  const chunkSize = 10000; // Process in chunks of 10k samples
  
  for (let start = 0; start < outputLength; start += chunkSize) {
    const end = Math.min(start + chunkSize, outputLength);
    
    for (let i = start; i < end; i++) {
      const srcIndex = i * ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      
      if (srcIndexFloor >= inputBuffer.length) {
        outputBuffer[i] = 0;
        continue;
      }
      
      const srcIndexCeil = Math.min(srcIndexFloor + 1, inputBuffer.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      const sample1 = inputBuffer[srcIndexFloor] ?? 0;
      const sample2 = inputBuffer[srcIndexCeil] ?? 0;
      
      outputBuffer[i] = sample1 * (1 - fraction) + sample2 * fraction;
    }
    
    // Process next chunk immediately (removed setTimeout as it's not needed for sync processing)
  }
  
  return outputBuffer;
}

/**
 * Create a silent WAV file as fallback
 */
function createSilentWav(durationSeconds: number): ArrayBuffer {
  const sampleRate = 16000;
  const samples = Math.floor(durationSeconds * sampleRate);
  const arrayBuffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(arrayBuffer);
  
  // WAV header using raw bytes like the main function
  let pos = 0;
  
  // RIFF chunk descriptor
  view.setUint8(pos++, 0x52); // 'R'
  view.setUint8(pos++, 0x49); // 'I'
  view.setUint8(pos++, 0x46); // 'F'
  view.setUint8(pos++, 0x46); // 'F'
  view.setUint32(pos, 36 + samples * 2, true); pos += 4; // file length - 8
  view.setUint8(pos++, 0x57); // 'W'
  view.setUint8(pos++, 0x41); // 'A'
  view.setUint8(pos++, 0x56); // 'V'
  view.setUint8(pos++, 0x45); // 'E'
  
  // fmt sub-chunk
  view.setUint8(pos++, 0x66); // 'f'
  view.setUint8(pos++, 0x6d); // 'm'
  view.setUint8(pos++, 0x74); // 't'
  view.setUint8(pos++, 0x20); // ' '
  view.setUint32(pos, 16, true); pos += 4; // length of format data
  view.setUint16(pos, 1, true); pos += 2; // PCM format
  view.setUint16(pos, 1, true); pos += 2; // mono
  view.setUint32(pos, sampleRate, true); pos += 4; // sample rate
  view.setUint32(pos, sampleRate * 2, true); pos += 4; // byte rate
  view.setUint16(pos, 2, true); pos += 2; // block align
  view.setUint16(pos, 16, true); pos += 2; // bits per sample
  
  // data sub-chunk
  view.setUint8(pos++, 0x64); // 'd'
  view.setUint8(pos++, 0x61); // 'a'
  view.setUint8(pos++, 0x74); // 't'
  view.setUint8(pos++, 0x61); // 'a'
  view.setUint32(pos, samples * 2, true); pos += 4; // data length
  
  // Silent audio data (all zeros) - pos should now be 44
  for (let i = 0; i < samples; i++) {
    view.setInt16(44 + i * 2, 0, true);
  }
  
  return arrayBuffer;
} 