import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { romanianTutorAgent } from '../agents/romanian-tutor';

// Use agent with structured output for reliable, consistent data format
const structuredAnalysisStep = createStep({
  id: 'structured-analysis',
  inputSchema: z.object({
    userMessage: z.string(),
    conversationHistory: z.array(z.any()),
    userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
  outputSchema: z.object({
    grammarErrors: z.array(z.string()),
    complexity: z.enum(['simple', 'medium', 'complex']),
    topics: z.array(z.string()),
  }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent('romanianTutor');
    if (!agent) {
      throw new Error('Romanian tutor agent not found');
    }
    
    // Use structured output to get parsed data directly
    const result = await agent.generate(
      [{ 
        role: "user", 
        content: `Analyze this Romanian text for a ${inputData.userLevel ?? 'beginner'} level student: "${inputData.userMessage}". Provide feedback on grammar, complexity, and topics.` 
      }],
      {
        output: z.object({
          grammarErrors: z.array(z.string()),
          complexity: z.enum(['simple', 'medium', 'complex']),
          topics: z.array(z.string()),
        })
      }
    );
    
    return result.object;
  },
});

const generateResponseStep = createStep({
  id: 'generate-response',
  inputSchema: z.object({
    grammarErrors: z.array(z.string()),
    complexity: z.enum(['simple', 'medium', 'complex']),
    topics: z.array(z.string()),
  }),
  outputSchema: z.object({
    response: z.string(),
    suggestions: z.array(z.string()),
    grammarNotes: z.array(z.string()),
    nextTopics: z.array(z.string()),
  }),
  // eslint-disable-next-line @typescript-eslint/unbound-method
  execute: async ({ inputData, mastra, getInitData }) => {
    const agent = mastra?.getAgent('romanianTutor');
    if (!agent) {
      throw new Error('Romanian tutor agent not found');
    }

    // Get the original user message from workflow input  
    const typedInitData = getInitData() as { userMessage?: string; userLevel?: 'beginner' | 'intermediate' | 'advanced' } | undefined;
    const userMessage = typedInitData?.userMessage ?? '';
    const userLevel = typedInitData?.userLevel ?? 'beginner';

    // Generate intelligent response based on analysis
    const result = await agent.generate(
      [{ 
        role: "user", 
        content: `Based on this analysis of a ${userLevel} student's Romanian text "${userMessage}":
        
Analysis Results:
- Grammar errors: ${inputData.grammarErrors.join(', ') || 'None found'}
- Complexity level: ${inputData.complexity}
- Topics covered: ${inputData.topics.join(', ')}

Please provide:
1. An encouraging response in Romanian
2. Specific learning suggestions based on the analysis
3. Grammar notes if there were errors
4. Next topics they should study

Format your response naturally as a helpful Romanian tutor would.`
      }],
      {
        output: z.object({
          response: z.string(),
          suggestions: z.array(z.string()),
          grammarNotes: z.array(z.string()),
          nextTopics: z.array(z.string()),
        })
      }
    );

    return result.object;
  },
});

// Define conversation workflow for Romanian learning with structured output
export const conversationWorkflow = createWorkflow({
  id: 'romanian-conversation',
  inputSchema: z.object({
    userMessage: z.string(),
    conversationHistory: z.array(z.any()),
    userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  }),
  outputSchema: z.object({
    response: z.string(),
    suggestions: z.array(z.string()),
    grammarNotes: z.array(z.string()),
    nextTopics: z.array(z.string()),
  }),
})
  .then(structuredAnalysisStep)  // Single step with structured output
  .then(generateResponseStep)    // Generate final response
  .commit(); 