'use client';

import React, { useState } from 'react';

/**
 * Simplified AG-UI Protocol Chat Interface for Romanian Learning
 * Temporary simplified version to fix build errors
 */
export function AgUIChatInterface() {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Array<{id: string, role: string, content: string}>>([
    {
      id: '1',
      role: 'assistant', 
      content: 'Bună! Sunt profesorul tău de română. (Hello! I am your Romanian teacher.) How can I help you learn Romanian today?'
    }
  ]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);

    // Add assistant response (temporary)
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `I received your message: "${inputMessage}". AG-UI integration is being updated for compatibility.`
    };

    setMessages(prev => [...prev, assistantMessage]);
    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-yellow-50 border-2 border-blue-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-yellow-500 text-white p-4 shadow-lg">
        <h2 className="text-xl font-bold">🇷🇴 Romanian Tutor - AG-UI</h2>
        <p className="text-sm opacity-90">Learn Romanian with AI assistance</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message in Romanian or English..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
} 