import { Agent, Mastra } from '@mastra/core';
import { createTool } from '@mastra/core/tools';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { Memory } from '@mastra/memory';

const memory = new Memory({
  options: {
    // Enable working memory to track user progress and preferences
    workingMemory: {
      enabled: true,
      scope: "resource",
      // Persist across all threads for the same user
      template: `# Romanian Learning Profile

## Personal Info
- Name:
- Learning Level: [beginner, intermediate, advanced]
- Native Language:
- Timezone:

## Learning Progress
- Pronunciation Scores: []
- Grammar Topics Covered: []
- Words Learned: []
- Cultural Notes Shared: 0

## Preferences
- Voice: ro-RO-AlinaNeural
- Learning Pace: medium
- Focus Areas: [vocabulary, pronunciation, grammar, culture]

## Current Session
- Current Topic:
- Last Lesson:
- Questions Asked: []
`
    },
    // Keep recent conversation history
    lastMessages: 10
    // Disable semantic recall for local playground (requires vector store configuration)
    // semanticRecall: {
    //   topK: 3,
    //   messageRange: 2,
    //   scope: 'resource',
    // },
  }
});
const pronunciationTool = createTool({
  id: "assess-pronunciation",
  description: "Assess user pronunciation of Romanian text",
  inputSchema: z.object({
    text: z.string().describe("The Romanian text to assess pronunciation for"),
    audioData: z.string().optional().describe("Base64 encoded audio data")
  }),
  execute: async ({ context }) => {
    const score = Math.floor(Math.random() * 30) + 70;
    return {
      score,
      feedback: `Pronunciation of "${context.text}" scored ${score}/100. ${score > 85 ? "Excellent pronunciation!" : "Good effort! Keep practicing Romanian sounds."}`,
      suggestions: [
        `Focus on the Romanian "\u0103" sound - it's unique to Romanian`,
        'Practice rolling the "r" sound gently',
        "Pay attention to stress patterns in Romanian words"
      ],
      practiceWords: ["rom\xE2n\u0103", "bun\u0103", "mul\u021Bumesc"]
    };
  }
});
const generateSpeechTool = createTool({
  id: "generate-speech",
  description: "Generate speech audio for Romanian text pronunciation examples",
  inputSchema: z.object({
    text: z.string().describe("Romanian text to convert to speech"),
    voice: z.string().optional().describe("Voice to use (default: ro-RO-AlinaNeural)")
  }),
  execute: async ({ context }) => {
    const voice = context.voice ?? "ro-RO-AlinaNeural";
    const audioUrl = `/api/speech/synthesize?text=${encodeURIComponent(context.text)}&voice=${voice}`;
    return {
      audioUrl,
      text: context.text,
      voice,
      message: `\u{1F50A} Listen to the pronunciation of "${context.text}" in Romanian:`,
      culturalNote: generateCulturalNote(context.text)
    };
  }
});
const grammarCheckTool = createTool({
  id: "check-grammar",
  description: "Check and correct Romanian grammar with detailed explanations",
  inputSchema: z.object({
    text: z.string().describe("Romanian text to check for grammar errors")
  }),
  execute: async ({ context }) => {
    const hasErrors = Math.random() > 0.7;
    const commonErrors = [
      'Consider using "sunt" instead of "\xEEi" for "I am"',
      "Romanian adjectives must agree in gender and number with their nouns",
      "Remember that Romanian has definite articles attached to nouns",
      "Check the correct use of accusative vs. nominative case"
    ];
    const corrections = hasErrors ? [commonErrors[Math.floor(Math.random() * commonErrors.length)]] : [];
    return {
      hasErrors,
      corrections,
      feedback: hasErrors ? "I found some areas for improvement in your Romanian text. These are common learning points!" : "Foarte bine! (Very good!) Your Romanian grammar looks excellent!",
      improvedText: context.text,
      // In real implementation, would provide corrected text
      explanation: hasErrors ? "Romanian grammar has some unique features compared to English. Keep practicing!" : "Your understanding of Romanian grammar is progressing well."
    };
  }
});
function generateCulturalNote(text) {
  const culturalNotes = {
    "bun\u0103 ziua": "This is the formal daytime greeting in Romania, used from morning until evening.",
    "bun\u0103 seara": "Evening greeting used after 6 PM in Romania.",
    "mul\u021Bumesc": 'This is the standard way to say "thank you" in Romanian.',
    "v\u0103 rog": `A polite expression meaning "please" or "you're welcome" in formal situations.`,
    "foarte": 'An intensifying adverb meaning "very" - commonly used in Romanian.'
  };
  for (const [phrase, note] of Object.entries(culturalNotes)) {
    if (text.toLowerCase().includes(phrase)) {
      return `\u{1F4A1} Cultural note: ${note}`;
    }
  }
  return "";
}
const ROMANIAN_TUTOR_INSTRUCTIONS = `
You are a patient and encouraging Romanian language tutor named "Profesor Rom\xE2n\u0103". Your goal is to help students learn Romanian through conversation, pronunciation practice, and grammar instruction.

## Your Personality:
- Patient, encouraging, and culturally knowledgeable about Romania
- Adapt to the student's level (beginner, intermediate, advanced)
- Use a mix of Romanian and English to facilitate learning
- Share interesting facts about Romanian culture and language

## Teaching Approach:
1. **Start conversations in Romanian** with English translations for beginners
2. **Correct mistakes gently** and explain the reasoning clearly
3. **Encourage pronunciation practice** using the pronunciation assessment tool
4. **Share cultural context** when relevant (history, traditions, customs)
5. **Use examples and comparisons** to English when helpful
6. **Celebrate progress** and acknowledge improvements

## Available Tools:
- **assess-pronunciation**: Use when student wants pronunciation feedback on Romanian text
- **generate-speech**: Use to provide audio examples of correct Romanian pronunciation
- **check-grammar**: Use to check and correct Romanian text with explanations

## Response Guidelines:
- Always respond warmly and encouragingly
- For beginners: Start with Romanian
- For intermediate/advanced: Use more complex sentences and grammar
- Include cultural insights about Romanian words, phrases, or customs
- Encourage speaking practice and real-world usage
- Use the tools proactively to enhance learning

## Examples of Good Responses:
- "Bun\u0103! (Hello!) Let's practice some Romanian greetings today."
- "Foarte bine! (Very good!) Your pronunciation is improving."
- "That's a great question about Romanian grammar. Let me explain..."
- "In Romania, we often say... [cultural context]"

Remember: Create an immersive but supportive Romanian learning environment that builds confidence!
`.trim();
const romanianTutorAgent = new Agent({
  name: "Romanian Tutor",
  instructions: ROMANIAN_TUTOR_INSTRUCTIONS,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  model: openai("gpt-4"),
  // Using OpenAI GPT-4 model
  tools: {
    "assess-pronunciation": pronunciationTool,
    "generate-speech": generateSpeechTool,
    "check-grammar": grammarCheckTool
  },
  memory
});

const mastra = new Mastra({
  agents: {
    romanianTutor: romanianTutorAgent
  }
});
const bundler = {};

export { bundler, mastra as default };
