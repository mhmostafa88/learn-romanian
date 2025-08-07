'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAgUIAgent } from '~/hooks/useAgUIAgent';
import type { AssistantMessage } from '@ag-ui/core';

/**
 * AG-UI Protocol Chat Interface for Romanian Learning
 * Implements real-time streaming communication with Romanian tutor agent
 * Based on: https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/
 */
export function AgUIChatInterface() {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    agentState,
    streamingMessage,
    isLoading,
    isConnected,
    error,
    sendMessage,
    clearError,
    sessionId,
  } = useAgUIAgent();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const message = inputMessage.trim();
    setInputMessage('');
    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex h-[700px] flex-col rounded-lg border bg-white shadow-lg dark:bg-gray-800">
      {/* Enhanced Header with AG-UI Status */}
      <div className="border-b px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              🇷🇴 Romanian Tutor <span className="text-sm bg-blue-500 px-2 py-1 rounded">AG-UI</span>
            </h2>
            <p className="text-sm text-blue-100">
              Enhanced with real-time streaming and event-driven communication
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {isConnected && (
              <div className="flex items-center gap-1 text-green-200">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Connected
              </div>
            )}
            {agentState.userLevel && (
              <div className="bg-blue-500 px-2 py-1 rounded text-xs">
                Level: {agentState.userLevel}
              </div>
            )}
          </div>
        </div>
        
        {/* Session Info */}
        <div className="mt-2 text-xs text-blue-200">
          Session: {sessionId.slice(-8)}
          {agentState.sessionMetrics?.wordsLearned && 
            ` • Words learned: ${agentState.sessionMetrics.wordsLearned.length}`
          }
          {agentState.sessionMetrics?.pronunciationScores && 
            agentState.sessionMetrics.pronunciationScores.length > 0 &&
            ` • Avg. pronunciation: ${Math.round(
              agentState.sessionMetrics.pronunciationScores.reduce((a, b) => a + b, 0) / 
              agentState.sessionMetrics.pronunciationScores.length
            )}/100`
          }
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <AgUIMessage key={message.id} message={message} />
        ))}
        
        {/* Streaming Message */}
        {streamingMessage && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm font-medium text-blue-700">Profesor Română</div>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
              <div className="whitespace-pre-wrap text-gray-800">
                {streamingMessage.content}
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading Indicator */}
        {isLoading && !streamingMessage && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-300">Processing your message...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <form onSubmit={handleSendMessage} className="border-t p-4 bg-gray-50 dark:bg-gray-700">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scrie un mesaj în română... (Type a message in Romanian...)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white resize-none"
              disabled={isLoading}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            {/* Character count */}
            <div className="absolute bottom-1 right-1 text-xs text-gray-400">
              {inputMessage.length}/500
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 min-w-[80px]"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              'Trimite'
            )}
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="mt-2 flex flex-wrap gap-2">
          <QuickAction
            label="🎯 Check pronunciation"
            action={() => setInputMessage('Can you check my pronunciation of "bună ziua"?')}
            disabled={isLoading}
          />
          <QuickAction
            label="📝 Check grammar"
            action={() => setInputMessage('Please check my grammar: "Eu sunt foarte fericit"')}
            disabled={isLoading}
          />
          <QuickAction
            label="🔊 Generate speech"
            action={() => setInputMessage('Can you speak "mulțumesc foarte mult" for me?')}
            disabled={isLoading}
          />
          <QuickAction
            label="💡 Cultural note"
            action={() => setInputMessage('Tell me about Romanian greetings')}
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}

/**
 * Individual message component with AG-UI metadata support
 */
function AgUIMessage({ message }: { message: AgentMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-medium">
            {isUser ? 'You' : 'Profesor Română'}
          </div>
          <div className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
        
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {/* Metadata display for tool results */}
        {message.metadata && (
          <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
            {message.metadata.pronunciation && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Score: {message.metadata.pronunciation.score}/100
              </div>
            )}
            {message.metadata.grammar && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {message.metadata.grammar.hasErrors ? 'Grammar issues found' : 'Grammar looks good!'}
              </div>
            )}
            {message.metadata.speech && (
              <div className="text-sm text-purple-600 dark:text-purple-400">
                🔊 Audio available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Quick action button component
 */
function QuickAction({ 
  label, 
  action, 
  disabled 
}: { 
  label: string; 
  action: () => void; 
  disabled: boolean; 
}) {
  return (
    <button
      onClick={action}
      disabled={disabled}
      className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {label}
    </button>
  );
} 