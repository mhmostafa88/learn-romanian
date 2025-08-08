// Mastra framework configuration for Romanian language learning
// Entry point for Mastra CLI and playground

import { Mastra } from '@mastra/core';
import { romanianTutorAgent } from '../lib/mastra/agents/romanian-tutor';

// Initialize Mastra instance for the playground
const mastra = new Mastra({
  agents: {
    romanianTutor: romanianTutorAgent,
  },
});

// Export both named and default exports for compatibility
export { mastra };
export default mastra; 