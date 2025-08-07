# Official AG-UI Protocol Integration with Mastra Agents

## Overview

This document describes the integration of the **Official AG-UI Protocol** using `@ag-ui/core` package with **Mastra agents** for the Romanian language learning application. The AG-UI protocol provides standardized event-driven communication between AI agents and user interfaces, enabling real-time streaming, state management, and tool execution.

**Official Package**: `@ag-ui/core@0.0.35`

**References:**
- [AG-UI Protocol Repository](https://github.com/ag-ui-protocol/ag-ui)
- [AG-UI Protocol - Agents](https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/agents.mdx)
- [AG-UI Protocol - Architecture](https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/architecture.mdx)
- [AG-UI Protocol - Events](https://github.com/ag-ui-protocol/ag-ui/blob/main/docs/concepts/events.mdx)

## Installation

```bash
npm install @ag-ui/core
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │ Official AG-UI  │    │   Mastra Agent  │
│                 │◄──►│   Events        │◄──►│                 │
│ • AgUIChatUI    │    │   (SSE Stream)  │    │ • Romanian Tutor│
│ • Event Handler │    │                 │    │ • State Mgmt    │
│ • State Display │    │ • RUN_STARTED   │    │ • Tool Calls    │
│ • Tool Results  │    │ • TEXT_MESSAGE  │    │ • Memory        │
│                 │    │ • TOOL_CALL     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Components

### 1. **Official AG-UI Types** (`@ag-ui/core`)

The package provides official event types and schemas:

```typescript
import { EventType } from '@ag-ui/core';

// Available Event Types:
EventType.RUN_STARTED
EventType.RUN_FINISHED
EventType.RUN_ERROR
EventType.TEXT_MESSAGE_START
EventType.TEXT_MESSAGE_CONTENT
EventType.TEXT_MESSAGE_END
EventType.TOOL_CALL_START
EventType.TOOL_CALL_END
EventType.STATE_SNAPSHOT
EventType.STATE_DELTA
EventType.THINKING_START
EventType.THINKING_END
// ... and more
```

### 2. **Romanian AG-UI Encoder** (`src/lib/ag-ui/encoder.ts`)

Handles Server-Sent Events encoding using official AG-UI types:

```typescript
import { EventType } from '@ag-ui/core';

export class RomanianAgUIEncoder {
  constructor(sessionId: string, agentId: string = 'romanian-tutor') {
    this.sessionId = sessionId;
    this.agentId = agentId;
  }

  private createEvent(type: string, data: any): string {
    const event = {
      type,
      data,
      metadata: {
        agentId: this.agentId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
    };
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  createLifecycleEvent(type: typeof EventType.RUN_STARTED | typeof EventType.RUN_FINISHED, data?: any): string {
    return this.createEvent(type, data ?? {});
  }

  createTextMessageEvent(
    type: typeof EventType.TEXT_MESSAGE_START | typeof EventType.TEXT_MESSAGE_CONTENT | typeof EventType.TEXT_MESSAGE_END,
    content: string,
    messageId?: string
  ): string {
    const messageData = {
      id: messageId ?? crypto.randomUUID(),
      content,
      role: 'assistant',
    };
    return this.createEvent(type, messageData);
  }

  // Romanian learning specific events
  createPronunciationEvent(text: string, score: number, feedback: string, suggestions: string[], audioUrl?: string): string
  createGrammarEvent(originalText: string, hasErrors: boolean, corrections: string[], improvedText: string, explanation?: string): string
  createSpeechEvent(text: string, voice: string, audioUrl: string): string
  createCulturalNoteEvent(phrase: string, context: string, usage: string, examples: string[]): string
}
```

### 3. **Romanian Tutor Agent** (`src/lib/ag-ui/romanian-agent.ts`)

Mastra agent implementing official AG-UI protocol:

```typescript
import { EventType } from '@ag-ui/core';
import { RomanianAgUIEncoder } from './encoder';

export class RomanianTutorAgent {
  private eventEncoder: RomanianAgUIEncoder;
  private state: RomanianAgentState;

  constructor(sessionId?: string) {
    this.sessionId = sessionId ?? crypto.randomUUID();
    this.eventEncoder = new RomanianAgUIEncoder(this.sessionId, 'romanian-tutor');
  }

  async *generateResponse(userMessage: string, conversationHistory: Array<{ role: string; content: string; timestamp: Date }>) {
    // Emit RUN_STARTED event using official AG-UI
    yield this.eventEncoder.createLifecycleEvent(EventType.RUN_STARTED);

    // Emit thinking status
    yield this.eventEncoder.createThinkingEvent('Analyzing your Romanian message...');

    // Update and emit state
    yield this.eventEncoder.createStateEvent(this.state);

    // Stream response content
    const messageId = crypto.randomUUID();
    yield this.eventEncoder.createTextMessageEvent(EventType.TEXT_MESSAGE_START, '', messageId);
    
    const response = await this.generateContextualResponse(userMessage, analysis);
    const words = response.split(' ');
    
    for (const word of words) {
      yield this.eventEncoder.createTextMessageEvent(EventType.TEXT_MESSAGE_CONTENT, word + ' ', messageId);
      await new Promise(resolve => setTimeout(resolve, 50)); // Streaming delay
    }
    
    yield this.eventEncoder.createTextMessageEvent(EventType.TEXT_MESSAGE_END, '', messageId);

    // Execute tools if needed
    yield* this.executeToolsIfNeeded(userMessage, analysis);

    // Emit RUN_FINISHED event
    yield this.eventEncoder.createLifecycleEvent(EventType.RUN_FINISHED);
  }
}
```

### 4. **API Route** (`src/app/api/copilotkit-agui/route.ts`)

AG-UI protocol endpoint with Server-Sent Events:

```typescript
import { RomanianTutorAgent } from '~/lib/ag-ui/romanian-agent';

export async function POST(req: NextRequest): Promise<Response> {
  const agent = new RomanianTutorAgent(sessionId);

  const stream = new ReadableStream({
    async start(controller) {
      const responseGenerator = await agent.processMessage(message, conversationHistory);
      
      for await (const event of responseGenerator) {
        controller.enqueue(new TextEncoder().encode(event));
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 5. **React Hook** (`src/hooks/useAgUIAgent.ts`)

Frontend AG-UI event handling with official types:

```typescript
import { EventType } from '@ag-ui/core';

export function useAgUIAgent() {
  const handleAgUIEvent = useCallback((event) => {
    switch (event.type) {
      case EventType.RUN_STARTED:
        setIsLoading(true);
        break;
      case EventType.RUN_FINISHED:
        setIsLoading(false);
        completeStreamingMessage();
        break;
      case EventType.TEXT_MESSAGE_START:
        setStreamingMessage({ id: event.data.id, content: '', isComplete: false });
        break;
      case EventType.TEXT_MESSAGE_CONTENT:
        setStreamingMessage(prev => prev ? { ...prev, content: prev.content + event.data.content } : null);
        break;
      case EventType.TEXT_MESSAGE_END:
        completeStreamingMessage();
        break;
      case EventType.TOOL_CALL_END:
        handleToolResult(event.data);
        break;
      case EventType.STATE_SNAPSHOT:
        setAgentState(prev => ({ ...prev, ...event.data.state }));
        break;
      case EventType.THINKING_START:
        console.log(`Agent thinking: ${event.data.message}`);
        break;
      case EventType.RUN_ERROR:
        setError(event.data.error);
        setIsLoading(false);
        break;
    }
  }, [streamingMessage]);
}
```

## Official AG-UI Event Types Available

The `@ag-ui/core` package provides these official event types:

### **Lifecycle Events**
- `EventType.RUN_STARTED` - Agent begins processing
- `EventType.RUN_FINISHED` - Agent completes processing  
- `EventType.RUN_ERROR` - Agent encounters error
- `EventType.STEP_STARTED` - Workflow step begins
- `EventType.STEP_FINISHED` - Workflow step completes

### **Message Events**
- `EventType.TEXT_MESSAGE_START` - Begin streaming response
- `EventType.TEXT_MESSAGE_CONTENT` - Stream response content
- `EventType.TEXT_MESSAGE_END` - Complete message
- `EventType.TEXT_MESSAGE_CHUNK` - Message chunk
- `EventType.MESSAGES_SNAPSHOT` - Full message history

### **Tool Events**
- `EventType.TOOL_CALL_START` - Tool execution begins
- `EventType.TOOL_CALL_ARGS` - Tool arguments
- `EventType.TOOL_CALL_END` - Tool execution completes
- `EventType.TOOL_CALL_RESULT` - Tool result
- `EventType.TOOL_CALL_CHUNK` - Tool output chunk

### **Thinking Events**
- `EventType.THINKING_START` - Agent starts thinking
- `EventType.THINKING_END` - Agent stops thinking
- `EventType.THINKING_TEXT_MESSAGE_START` - Thinking message start
- `EventType.THINKING_TEXT_MESSAGE_CONTENT` - Thinking content
- `EventType.THINKING_TEXT_MESSAGE_END` - Thinking message end

### **State Events**
- `EventType.STATE_SNAPSHOT` - Full state snapshot
- `EventType.STATE_DELTA` - Incremental state changes

### **Custom Events**
- `EventType.RAW` - Raw event data
- `EventType.CUSTOM` - Custom event type

## Romanian Learning Event Flow

### **1. Lifecycle Events**
```
User sends message
  ↓
RUN_STARTED → Agent begins processing
  ↓
THINKING_START → "Analyzing your Romanian message..."
  ↓
[Processing and tool execution]
  ↓
RUN_FINISHED → Agent completes processing
```

### **2. Message Streaming**
```
TEXT_MESSAGE_START → Begin streaming response
  ↓
TEXT_MESSAGE_CONTENT → "Foarte" (word by word)
  ↓
TEXT_MESSAGE_CONTENT → "bine!"
  ↓
TEXT_MESSAGE_END → Complete message
```

### **3. Tool Execution**
```
TOOL_CALL_START → "assess-pronunciation"
  ↓
[Azure Speech Services integration]
  ↓
TOOL_CALL_END → { score: 85, feedback: "Good pronunciation!", suggestions: [...] }
```

### **4. State Management**
```
STATE_SNAPSHOT → Full agent state (conversation start)
  ↓
STATE_DELTA → Incremental updates (new words learned, scores, etc.)
```

## Benefits of Official AG-UI Package

### **1. Standards Compliance**
- ✅ Official AG-UI protocol implementation
- ✅ Standardized event types and schemas
- ✅ Future-proof with protocol updates
- ✅ Interoperability with other AG-UI tools

### **2. Type Safety**
- ✅ Official TypeScript definitions
- ✅ Compile-time event type checking
- ✅ IntelliSense support
- ✅ Reduced runtime errors

### **3. Protocol Features**
- ✅ Complete event type coverage
- ✅ Thinking events for UX feedback
- ✅ Error handling events
- ✅ State management events
- ✅ Tool execution tracking

### **4. Romanian Learning Features**

#### **Pronunciation Assessment**
- **Events**: `TOOL_CALL_START` → `TOOL_CALL_END`
- **Data**: Score (0-100), feedback, suggestions, practice words
- **Integration**: Azure Speech Services
- **UI**: Real-time score display, progress tracking

#### **Grammar Checking**
- **Events**: `TOOL_CALL_START` → `TOOL_CALL_END`
- **Data**: Error detection, corrections, explanations
- **Integration**: Romanian grammar API (future)
- **UI**: Error highlighting, correction suggestions

#### **Speech Generation**
- **Events**: `TOOL_CALL_START` → `TOOL_CALL_END`
- **Data**: Audio URL, voice settings, pronunciation guide
- **Integration**: Azure Speech Services
- **UI**: Audio player, pronunciation practice

#### **Cultural Notes**
- **Events**: `TEXT_MESSAGE_CONTENT` with cultural metadata
- **Data**: Phrase context, usage examples, cultural significance
- **Integration**: Built-in knowledge base
- **UI**: Contextual information cards

## Usage Examples

### **Basic Agent Interaction**
```typescript
import { mastra } from './lib/mastra';

const agent = mastra.getAgent('romanianTutor');
const agUIAgent = new RomanianTutorAgent('session-123');

// Stream response with official AG-UI events
for await (const event of agUIAgent.processMessage("Bună ziua!", [])) {
  console.log('AG-UI Event:', event);
  // Each event follows official AG-UI protocol format
}
```

### **Event Handling in Frontend**
```typescript
const { sendMessage, messages, streamingMessage, isLoading, error } = useAgUIAgent();

// All events use official AG-UI types
await sendMessage("Can you check my pronunciation of 'mulțumesc'?");
// Automatically handles: RUN_STARTED → THINKING_START → TOOL_CALL_START → TOOL_CALL_END → RUN_FINISHED
```

## Migration from Custom to Official AG-UI

### **Before (Custom Implementation)**
```typescript
// Custom event types
export enum EventType {
  RUN_STARTED = 'RUN_STARTED',
  AGENT_THINKING = 'AGENT_THINKING', // Non-standard
  // ...
}
```

### **After (Official Package)**
```typescript
// Official AG-UI types
import { EventType } from '@ag-ui/core';

// Standard events
EventType.RUN_STARTED
EventType.THINKING_START // Official thinking event
// ...
```

### **Key Changes Made**
1. ✅ **Package**: Now using `@ag-ui/core@0.0.35`
2. ✅ **Event Types**: Using official `EventType` enum
3. ✅ **Event Structure**: Following official AG-UI format
4. ✅ **Thinking Events**: Using `THINKING_START` instead of custom `AGENT_THINKING`
5. ✅ **Error Events**: Using `RUN_ERROR` instead of custom `AGENT_ERROR`
6. ✅ **Type Safety**: Official TypeScript definitions

## Future Enhancements

### **1. Advanced AG-UI Features**
- **Multi-agent** coordination using official protocol
- **Human-in-the-loop** workflows with standard events
- **Complex state** synchronization across agents

### **2. Romanian Learning Extensions**
- **Conversation practice** scenarios with step events
- **Reading comprehension** exercises using tool calls
- **Writing assistance** with real-time feedback

### **3. Protocol Extensions**
- **Custom events** for Romanian-specific features
- **Tool result** streaming for large responses
- **State delta** optimization for performance

---

The official AG-UI protocol integration provides a robust, standards-compliant foundation for building sophisticated AI-powered Romanian language learning experiences with real-time communication, comprehensive state management, and seamless tool integration. 