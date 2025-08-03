import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { synthesizeSpeech, ROMANIAN_VOICES, assessPronunciation } from "~/lib/azure-speech";

export const speechRouter = createTRPCRouter({
  // Environment validation endpoint
  validateEnvironment: publicProcedure
    .query(() => {
      const hasKey = !!process.env.AZURE_SPEECH_KEY;
      const hasRegion = !!process.env.AZURE_SPEECH_REGION;
      const isConfigured = hasKey && hasRegion;
      
      console.log('🔧 Environment validation check:', {
        hasAzureKey: hasKey,
        hasAzureRegion: hasRegion,
        azureRegion: process.env.AZURE_SPEECH_REGION ?? 'not set',
        isFullyConfigured: isConfigured
      });
      
      return {
        isConfigured,
        details: {
          azureSpeechKey: hasKey ? 'configured' : 'missing',
          azureSpeechRegion: hasRegion ? process.env.AZURE_SPEECH_REGION : 'missing',
        },
        message: isConfigured 
          ? 'Azure Speech Service is properly configured' 
          : 'Missing Azure Speech Service configuration. Please check your environment variables.'
      };
    }),

  synthesize: publicProcedure
    .input(z.object({
      text: z.string().min(1).max(1000), // Limit text length for performance
      voice: z.enum([ROMANIAN_VOICES.ALINA, ROMANIAN_VOICES.EMIL]).optional(),
      rate: z.enum(['x-slow', 'slow', 'medium', 'fast', 'x-fast']).default('medium'),
      pitch: z.enum(['x-low', 'low', 'medium', 'high', 'x-high']).default('medium'),
    }))
    .mutation(async ({ input }) => {
      try {
        const audioData = await synthesizeSpeech({
          text: input.text,
          voice: input.voice,
          rate: input.rate,
          pitch: input.pitch,
        });

        // Convert ArrayBuffer to base64 for transmission
        const base64Audio = Buffer.from(audioData).toString('base64');

        return {
          success: true,
          audioData: base64Audio,
          mimeType: 'audio/wav',
        };
      } catch (error) {
        console.error('Speech synthesis error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to synthesize speech',
        };
      }
    }),

  getVoices: publicProcedure
    .query(() => {
      return {
        voices: [
          {
            id: ROMANIAN_VOICES.ALINA,
            name: 'Alina',
            gender: 'female',
            description: 'Natural, cheerful female voice',
            language: 'ro-RO',
          },
          {
            id: ROMANIAN_VOICES.EMIL,
            name: 'Emil', 
            gender: 'male',
            description: 'Calm, clear male voice',
            language: 'ro-RO',
          },
        ],
      };
    }),

  assessPronunciation: publicProcedure
    .input(z.object({
      referenceText: z.string().min(1).max(500), // Limit for performance
      audioData: z.string(), // Base64 encoded audio data
      language: z.string().default('ro-RO'),
    }))
    .mutation(async ({ input }) => {
      try {
        // Convert base64 audio data to ArrayBuffer
        const audioBuffer = Buffer.from(input.audioData, 'base64').buffer;

        const assessment = await assessPronunciation({
          referenceText: input.referenceText,
          audioData: audioBuffer,
          language: input.language,
        });

        return {
          success: true,
          assessment,
        };
      } catch (error) {
        console.error('Pronunciation assessment error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to assess pronunciation',
        };
      }
    }),
}); 