export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationContext {
  messages: ChatMessage[];
  isLoading: boolean;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  error?: string;
} 