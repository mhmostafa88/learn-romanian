'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '~/trpc/react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '~/types/chat';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get initial greeting
  const { data: greeting } = api.chat.getGreeting.useQuery();

  // Send message mutation
  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      if (data.success && data.userMessage && data.assistantMessage) {
        setMessages(prev => [...prev, data.userMessage, data.assistantMessage]);
      } else if (data.error) {
        // Add error message
        const errorMessage: ChatMessageType = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Scuze, a apărut o eroare: ${data.error} (Sorry, there was an error: ${data.error})`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
      setIsLoading(false);
      setInputMessage('');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Scuze, nu pot să răspund acum. Încearcă din nou. (Sorry, I can\'t respond right now. Please try again.)',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    },
  });

  // Add greeting message when component mounts
  useEffect(() => {
    if (greeting && messages.length === 0) {
      setMessages([greeting]);
    }
  }, [greeting, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);
    
    // Add user message to UI immediately
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Send to server
    sendMessageMutation.mutate({
      message: inputMessage.trim(),
      conversation: messages,
    });
  };

  return (
    <div className="flex h-[600px] flex-col rounded-lg border bg-white shadow-lg dark:bg-gray-800">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          🇷🇴 Romanian Conversation Practice
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Practice Romanian with your AI tutor
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Scrie un mesaj în română... (Type a message in Romanian...)"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
} 