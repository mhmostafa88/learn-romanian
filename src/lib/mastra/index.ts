// Full Mastra Framework Configuration for Romanian Language Learning
// Properly configured with agents

import { Mastra } from '@mastra/core';
import type { Agent } from '@mastra/core';
import { romanianTutorAgent } from './agents/romanian-tutor';

// Initialize full Mastra framework with agents
export const mastra = new Mastra({
  agents: {
    romanianTutor: romanianTutorAgent as Agent,
  },
});

// Export components for direct use
export { romanianTutorAgent } from './agents/romanian-tutor';

// Enhanced configuration export
export const mastraConfig = {
  agents: {
    romanianTutor: {
      name: 'Romanian Tutor',
      description: 'AI Romanian language tutor with full Mastra framework support, memory, and cultural education',
      capabilities: [
        'pronunciation-assessment',
        'grammar-checking',
        'speech-generation',
        'cultural-education',
        'conversation-practice',
        'progress-tracking'
      ],
    },
  },
  workflows: {
    pronunciation: {
      id: 'pronunciation-assessment',
      description: 'Comprehensive Romanian pronunciation assessment with Azure Speech Services integration',
    },
    conversation: {
      id: 'conversation-flow',
      description: 'Structured Romanian conversation flow with state management and progress tracking',
    },
  },
  features: {
    memory: {
      enabled: true,
      workingMemory: true,
      semanticRecall: true,
      progressTracking: true,
    },
    integrations: {
      azureSpeech: true,
      openai: true,
    },
  },
};

export default mastra; 