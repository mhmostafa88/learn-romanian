import OpenAI from 'openai';
import type { ChatMessage } from '~/types/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ROMANIAN_TUTOR_PROMPT = `You are a friendly and patient Romanian language tutor. Your goal is to help the user practice Romanian conversation.

Guidelines:
- Always respond in Romanian.
- Keep responses conversational and encouraging
- Correct mistakes gently by providing the correct phrase
- Ask follow-up questions to keep the conversation going
- Use simple to intermediate vocabulary unless the user shows advanced proficiency
- Be enthusiastic about Romanian culture and language

Start conversations with greetings like "Bună!" or "Salut!" and ask how the user is doing.`;

export async function generateRomanianResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: ROMANIAN_TUTOR_PROMPT },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? 'Ne pare rău, nu am putut genera un răspuns.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate response from Romanian tutor');
  }
} 