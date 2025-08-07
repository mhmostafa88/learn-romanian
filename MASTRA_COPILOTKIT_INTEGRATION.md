# Mastra + CopilotKit Integration for Romanian Learning App

## Overview

This document describes the integration of **Mastra** (AI agent framework) and **CopilotKit** (React UI components) into the Romanian language learning application. This integration enhances the chat experience with advanced AI capabilities, pronunciation assessment, grammar checking, and speech generation.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CopilotKit    │    │   Next.js API   │    │   Azure Speech  │
│   Frontend      │◄──►│   Routes        │◄──►│   Services      │
│                 │    │                 │    │                 │
│ • Chat UI       │    │ • Mastra Agent  │    │ • TTS           │
│ • Actions       │    │ • Workflows     │    │ • Pronunciation │
│ • Streaming     │    │ • Tools         │    │ • Assessment    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Key Features Implemented

### 1. Enhanced Chat Interface (`CopilotChatInterface`)
- **Location**: `src/components/chat/CopilotChatInterface.tsx`
- **Features**:
  - Real-time AI chat with streaming responses
  - Romanian flag-themed UI with custom styling
  - Action-driven assistance capabilities
  - Mobile-responsive design

### 2. AI Actions & Tools
- **Location**: `src/app/api/copilotkit/route.ts`
- **Actions Available**:
  
  #### `assess-pronunciation`
  - Assesses user pronunciation of Romanian text
  - Provides scoring (0-100) and feedback
  - Integrates with existing Azure Speech Services
  - Returns practice suggestions

  #### `generate-speech`
  - Converts Romanian text to speech
  - Uses Azure Speech Services (ro-RO-AlinaNeural voice)
  - Provides audio examples for pronunciation practice

  #### `check-grammar`
  - Analyzes Romanian grammar in user text
  - Provides corrections and suggestions
  - Offers cultural context for phrases

### 3. Romanian Tutor AI Agent
- **Personality**: Patient, encouraging, culturally knowledgeable
- **Capabilities**:
  - Bilingual responses (Romanian with English translations)
  - Cultural context sharing
  - Pronunciation guidance
  - Grammar correction

### 4. Integration Layer (`CopilotSpeechIntegration`)
- **Location**: `src/lib/copilot-actions.ts`
- **Purpose**: Bridges CopilotKit actions with existing Azure Speech Services
- **Features**:
  - Type-safe integration
  - Error handling
  - Cultural context provision
  - Practice word extraction

### 5. Custom Styling
- **Location**: `src/styles/copilot-romanian.css`
- **Features**:
  - Romanian flag color scheme
  - Animated message transitions
  - Responsive design
  - Pronunciation/grammar feedback styling

## Usage Examples

### Starting a Conversation
```typescript
// The AI tutor introduces itself in Romanian with English translation
"Bună! Sunt profesorul tău de română. Cum te numești? 
(Hello! I am your Romanian teacher. What is your name?)"
```

### Pronunciation Assessment
```typescript
// User: "Can you check my pronunciation of 'mulțumesc'?"
// AI calls assess-pronunciation action
{
  score: 85,
  feedback: "Good pronunciation! Pay attention to the 'ț' sound.",
  suggestions: ["Practice the 'ț' sound", "Emphasize the first syllable"]
}
```

### Speech Generation
```typescript
// AI generates audio for pronunciation examples
// Calls generate-speech action automatically
{
  message: "🔊 Listen to the pronunciation of 'bună ziua' in Romanian:",
  audioUrl: "data:audio/wav;base64,..."
}
```

### Grammar Checking
```typescript
// User: "Check this: 'Eu sunt foarte fericit'"
// AI calls check-grammar action
{
  hasErrors: false,
  feedback: "Your Romanian text looks grammatically correct! Foarte bine!"
}
```

## Technical Implementation

### Backend API Route
```typescript
// src/app/api/copilotkit/route.ts
export async function POST(req: NextRequest): Promise<Response> {
  const copilotKit = new CopilotBackend({
    actions: [
      // Pronunciation assessment action
      // Speech generation action  
      // Grammar checking action
    ],
  });

  const openaiAdapter = new OpenAIAdapter({
    model: 'gpt-4',
    systemMessage: `Romanian tutor instructions...`,
  });

  return copilotKit.response(req, openaiAdapter);
}
```

### Frontend Integration
```typescript
// src/components/chat/CopilotChatInterface.tsx
<CopilotKit runtimeUrl="/api/copilotkit">
  <CopilotSidebar
    defaultOpen={true}
    labels={{
      title: '🇷🇴 Romanian Tutor',
      initial: 'Bună! Sunt profesorul tău de română...',
    }}
    className="copilot-sidebar-romanian"
  />
</CopilotKit>
```

## Integration Benefits

### 1. Enhanced User Experience
- **Streamlined Interface**: Single chat interface for all interactions
- **Real-time Feedback**: Instant pronunciation and grammar assessment
- **Visual Feedback**: Color-coded responses and Romanian-themed styling
- **Mobile Optimized**: Responsive design for all devices

### 2. AI-Powered Learning
- **Contextual Responses**: AI understands conversation history
- **Adaptive Teaching**: Adjusts to user's Romanian proficiency level
- **Cultural Education**: Provides cultural context for phrases
- **Practice Guidance**: Suggests specific pronunciation exercises

### 3. Seamless Tool Integration
- **Azure Speech Services**: Maintains existing pronunciation assessment
- **OpenAI GPT-4**: Advanced natural language understanding
- **Action-Driven**: AI can trigger specific learning tools automatically
- **Error Handling**: Graceful fallbacks when services are unavailable

### 4. Developer Experience
- **Type Safety**: Full TypeScript integration
- **Modular Design**: Easy to extend with new actions
- **Testing Ready**: Mock implementations for development
- **Documentation**: Comprehensive code comments

## Configuration

### Environment Variables Required
```bash
OPENAI_API_KEY=your_openai_key_here
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
```

### Dependencies Added
```json
{
  "@mastra/core": "latest",
  "@mastra/memory": "latest", 
  "@copilotkit/react-core": "latest",
  "@copilotkit/react-ui": "latest",
  "@copilotkit/backend": "latest",
  "@ai-sdk/openai": "latest"
}
```

## Future Enhancements

### 1. Advanced Mastra Features
- **Workflow Orchestration**: Multi-step learning workflows
- **Agent Memory**: Persistent user progress tracking
- **RAG Integration**: Romanian language knowledge base

### 2. Enhanced Speech Features
- **Real-time Assessment**: Live pronunciation feedback
- **Speech Recognition**: Voice input support
- **Conversation Practice**: Role-play scenarios

### 3. Learning Analytics
- **Progress Tracking**: User improvement metrics
- **Personalized Lessons**: AI-generated practice exercises
- **Achievement System**: Gamified learning experience

## Troubleshooting

### Common Issues

1. **CopilotKit Styles Not Loading**
   - Ensure `@import './copilot-romanian.css';` is in globals.css
   - Check that CSS file exists in `src/styles/`

2. **Actions Not Working**
   - Verify OPENAI_API_KEY is set
   - Check API route is accessible at `/api/copilotkit`
   - Review browser console for errors

3. **Speech Services Integration**
   - Confirm Azure Speech Services credentials
   - Test existing speech endpoints independently
   - Check network connectivity

### Performance Optimization

1. **Reduce Bundle Size**
   - Import only needed CopilotKit components
   - Use dynamic imports for heavy features

2. **Improve Response Times**
   - Cache frequently used translations
   - Optimize AI prompts for faster responses
   - Implement request debouncing

## Conclusion

The Mastra + CopilotKit integration transforms the Romanian learning app into a comprehensive AI-powered language learning platform. Users now benefit from:

- Advanced conversational AI tutoring
- Real-time pronunciation assessment
- Grammar checking and cultural context
- Seamless, beautiful user interface
- Integrated speech services

This foundation enables future enhancements and provides a scalable architecture for additional language learning features.

---

*For technical support or questions about this integration, refer to:*
- [Mastra Documentation](https://mastra.ai/docs)
- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [Azure Speech Services Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/) 