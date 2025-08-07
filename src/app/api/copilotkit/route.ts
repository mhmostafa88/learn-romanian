import { CopilotBackend, OpenAIAdapter } from '@copilotkit/backend';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest): Promise<Response> {
  const copilotKit = new CopilotBackend({
    actions: [
      {
        name: 'assess-pronunciation',
        description: 'Assess user pronunciation of Romanian text and provide feedback',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The Romanian text to assess pronunciation for',
            },
            audioData: {
              type: 'string',
              description: 'Base64 encoded audio data (optional)',
            },
          },
          required: ['text'],
        },
        handler: async ({ text, audioData }) => {
          // Integration with your existing Azure Speech Services
          // For now, return mock data
          return {
            score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
            feedback: `Good pronunciation of "${text}"! Keep practicing the Romanian sounds.`,
            suggestions: [
              'Focus on the vowel sounds',
              'Practice the rolling "r" sound',
              'Pay attention to stress patterns',
            ],
          };
        },
      },
      {
        name: 'generate-speech',
        description: 'Generate speech audio for Romanian text pronunciation examples',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Romanian text to convert to speech',
            },
            voice: {
              type: 'string',
              description: 'Voice to use (default: ro-RO-AlinaNeural)',
              default: 'ro-RO-AlinaNeural',
            },
          },
          required: ['text'],
        },
        handler: async ({ text, voice = 'ro-RO-AlinaNeural' }) => {
          // This would integrate with your existing speech synthesis
          return {
            message: `I'll speak "${text}" in Romanian for you to practice.`,
            audioUrl: `/api/speech/synthesize?text=${encodeURIComponent(text)}&voice=${voice}`,
            text,
            voice,
          };
        },
      },
      {
        name: 'check-grammar',
        description: 'Check and correct Romanian grammar in user text',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Romanian text to check for grammar errors',
            },
          },
          required: ['text'],
        },
        handler: async ({ text }) => {
          // Placeholder for grammar checking logic
          // In production, this would use a Romanian grammar API
          return {
            hasErrors: Math.random() > 0.7,
            corrections: Math.random() > 0.7 ? ['Consider using "sunt" instead of "îi"'] : [],
            feedback: 'Your Romanian grammar looks good! Keep practicing.',
            improvedText: text, // Would contain corrected version
          };
        },
      },
    ],
  });

  const openaiAdapter = new OpenAIAdapter({
    model: 'gpt-4',
    systemMessage: `You are a patient and encouraging Romanian language tutor. Your goal is to help students learn Romanian through conversation, pronunciation practice, and grammar instruction.

## Your Personality:
- Patient and encouraging
- Culturally knowledgeable about Romania
- Adapt to the student's level (beginner, intermediate, advanced)
- Use a mix of Romanian and English to help learning

## Teaching Approach:
1. Start conversations in Romanian, but provide English translations when needed
2. Correct mistakes gently and explain the reasoning
3. Encourage pronunciation practice using the pronunciation assessment action
4. Share cultural context when relevant
5. Use examples and comparisons to English when helpful

## Available Actions:
- assess-pronunciation: Use when student wants pronunciation feedback
- generate-speech: Use to provide audio examples of correct pronunciation
- check-grammar: Use to check and correct Romanian text

## Response Format:
- Always respond in Romanian first, followed by English translation in parentheses for beginners
- Use speech generation for pronunciation examples
- Encourage speaking practice and cultural learning

Remember: Create an immersive but supportive learning environment. Bună ziua! (Good day!)`,
  });

  return copilotKit.response(req, openaiAdapter);
} 