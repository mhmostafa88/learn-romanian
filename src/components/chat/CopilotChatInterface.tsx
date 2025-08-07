'use client';

import React from 'react';
import { CopilotKit } from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';

interface CopilotChatInterfaceProps {
  children?: React.ReactNode;
}

export function CopilotChatInterface({ children }: CopilotChatInterfaceProps) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <div className="relative h-full">
        {children}
        <CopilotSidebar
          defaultOpen={true}
          labels={{
            title: '🇷🇴 Romanian Tutor',
            initial: 'Bună! Sunt profesorul tău de română. Cum te numești? (Hello! I am your Romanian teacher. What is your name?)',
          }}
          instructions="You are helping the user learn Romanian. You can assess pronunciation, generate speech examples, and check grammar. Be encouraging and provide cultural context when relevant."
          className="copilot-sidebar-romanian"
        />
      </div>
    </CopilotKit>
  );
}

// Enhanced chat component that can be used as a standalone widget
export function CopilotChatWidget() {
  return (
    <div className="flex h-[600px] flex-col rounded-lg border bg-white shadow-lg dark:bg-gray-800">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          🇷🇴 Romanian Conversation Practice
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enhanced with AI tutoring and pronunciation assessment
        </p>
      </div>

      {/* CopilotKit Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <CopilotChatInterface />
      </div>
    </div>
  );
} 