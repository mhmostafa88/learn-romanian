# Learn Romanian - AI-Powered Language Learning App

A modern full-stack application for learning Romanian through AI conversations, speech recognition, and pronunciation assessment.

## 🎯 Project Overview

This is a personal Romanian language learning application designed to help improve conversational skills through:
- **AI Chatbot Conversations** in Romanian
- **Text-to-Speech** for pronunciation reference
- **Speech Recognition** for voice input
- **Pronunciation Assessment** with scoring

## 🚀 Tech Stack

### Core Framework
- **Next.js 14** with App Router (Server Components, Server Actions)
- **TypeScript** for end-to-end type safety
- **Tailwind CSS** for styling

### Backend & API
- **tRPC** for type-safe API layer
- **Server Actions** for form handling and mutations

### AI & Speech Services
- **OpenAI GPT-4** for Romanian conversation AI
- **Azure Speech Services** for text-to-speech and pronunciation assessment
- **Web Speech API** as fallback for speech recognition

### Development Tools
- **T3 Stack** configuration (simplified)
- **ESLint** and **Prettier** for code quality

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   tRPC API      │    │   External      │
│                 │    │                 │    │   Services      │
│ • Chat UI       │◄──►│ • Chat Router   │◄──►│ • OpenAI API    │
│ • Speech Input  │    │ • Speech Router │    │ • Azure Speech  │
│ • Pronunciation │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎪 Features Breakdown

### Phase 1: Core Chat Interface ✅ **COMPLETED**
- [x] Project setup with T3 stack
- [x] Basic chat UI with message history
- [x] OpenAI integration for Romanian tutor
- [x] Real-time message streaming
- [x] Basic text-to-speech for bot responses ✅ **COMPLETED**

### Phase 2: Speech Features ✅ **COMPLETED**
- [ ] Speech recognition for user input ← **NEXT PHASE**
- [ ] Voice input button and controls ← **NEXT PHASE**
- [x] Azure Speech Services integration ✅ **COMPLETED**
- [x] Pronunciation assessment with scoring ✅ **COMPLETED**
- [x] Audio playback controls ✅ **COMPLETED**

### Phase 3: Enhanced AI Features
- [ ] Grammar correction suggestions
- [ ] Conversation topic suggestions
- [ ] Better error handling and fallbacks

## 📁 Project Structure

```
learn-romanian/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── chat/
│   │   └── api/
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── chat/               # Chat-specific components
│   │   └── speech/             # Speech-related components
│   ├── server/                 # tRPC server configuration
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   │   ├── chat.ts
│   │   │   │   └── speech.ts
│   │   │   └── root.ts
│   ├── lib/                    # Utility functions
│   │   ├── utils.ts
│   │   ├── openai.ts
│   │   └── azure-speech.ts
│   ├── types/                  # TypeScript type definitions
│   │   ├── chat.ts
│   │   └── speech.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── assets/
└── docs/
    ├── setup.md
    ├── api.md
    └── deployment.md
```

## 🛠️ Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Basic chat functionality working

**Tasks**:
1. **Project Setup**
   - Initialize T3 stack
   - Set up environment variables
   - Basic UI layout

2. **Chat Infrastructure**
   - tRPC router for chat operations
   - OpenAI integration
   - Basic chat UI components
   - In-memory conversation state

3. **Romanian Tutor AI**
   - OpenAI prompt engineering
   - Conversation context management
   - Error handling and fallbacks

**Success Criteria**:
- ✅ Can send messages to Romanian AI tutor
- ✅ Receives contextual responses in Romanian
- ✅ Current conversation maintained in session
- ✅ Clean, responsive chat interface

### Phase 2: Speech Integration (Week 2) 🚀 **CURRENT FOCUS**
**Goal**: Full speech capabilities

**Tasks**:
1. **Azure Speech Setup** ✅ **COMPLETED**
   - Azure Speech Services configuration
   - Environment setup and API keys
   - Text-to-speech implementation ← **NEXT**

2. **Speech Recognition**
   - Voice input controls
   - Real-time speech-to-text
   - Romanian language optimization
   - Error handling for speech failures

3. **Pronunciation Assessment**
   - Azure pronunciation assessment API
   - Scoring display and feedback
   - Word-level pronunciation breakdown

**Success Criteria**:
- [x] Bot messages can be played as speech ✅ **COMPLETED**
- [ ] User can input messages via voice ← **NEXT PHASE**
- [x] Pronunciation scoring works accurately ✅ **COMPLETED**
- [x] Intuitive speech controls ✅ **COMPLETED**

## 🎙️ Pronunciation Assessment - Detailed Plan

### Overview
Implement Azure Speech Services pronunciation assessment to help users improve their Romanian pronunciation through:
- **Real-time pronunciation scoring** (0-100 scale)
- **Word-level feedback** with specific problem areas
- **Visual feedback** showing pronunciation quality
- **Practice mode** for specific phrases/words

### User Experience Flow
1. **Practice Trigger**: User sees "Practice Pronunciation" button next to bot messages
2. **Recording Phase**: User clicks button → microphone activates → user speaks → recording stops
3. **Assessment Phase**: Audio sent to Azure → pronunciation analysis → results returned
4. **Feedback Display**: Scores, word-level feedback, and improvement suggestions shown

### Technical Implementation

#### 1. Frontend Components
```typescript
// New components to create:
- PronunciationAssessment.tsx    // Main container component
- RecordingButton.tsx           // Microphone recording control
- AssessmentResults.tsx         // Display scores and feedback
- WordLevelFeedback.tsx         // Individual word analysis
```

#### 2. Speech Recording
```typescript
// Features needed:
- MediaRecorder API integration
- Real-time recording visualization
- Audio format: WAV, 16kHz, mono
- Maximum recording duration: 30 seconds
- Recording state management (idle/recording/processing)
```

#### 3. Azure Speech Assessment API
```typescript
// API integration:
- Pronunciation assessment endpoint
- Romanian language configuration (ro-RO)
- Reference text comparison
- Assessment modes: pronunciation + fluency
- Error handling for API failures
```

#### 4. Assessment Scoring System
```typescript
// Scoring metrics from Azure:
interface PronunciationAssessment {
  accuracyScore: number;      // 0-100: Overall pronunciation accuracy
  fluencyScore: number;       // 0-100: Speech fluency
  completenessScore: number;  // 0-100: How much of reference text was spoken
  pronScore: number;          // 0-100: Overall pronunciation score
  words: WordAssessment[];    // Word-level breakdown
}

interface WordAssessment {
  word: string;
  accuracyScore: number;
  errorType?: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation';
  syllables?: SyllableAssessment[];
}
```

#### 5. UI/UX Design
```typescript
// Visual feedback approach:
- Score display: Circular progress indicators (0-100)
- Color coding: Red (0-60), Yellow (60-80), Green (80-100)
- Word highlighting: Color-code words based on accuracy
- Improvement tips: Contextual suggestions based on error types
- Practice again: Easy retry mechanism
```

### Implementation Steps

#### Step 1: Recording Infrastructure
- [ ] Set up MediaRecorder API
- [ ] Create recording button component
- [ ] Add recording state management
- [ ] Implement audio format conversion

#### Step 2: Azure Integration
- [ ] Extend speech.ts router for pronunciation assessment
- [ ] Configure Azure SDK for assessment API
- [ ] Handle Romanian language specifics
- [ ] Add error handling and fallbacks

#### Step 3: Results Display
- [ ] Create assessment results UI components
- [ ] Implement score visualization
- [ ] Add word-level feedback display
- [ ] Create improvement suggestions logic

#### Step 4: Integration & Polish
- [ ] Integrate with existing chat interface
- [ ] Add pronunciation button to bot messages
- [ ] Implement loading states and animations
- [ ] Add accessibility features (keyboard navigation)

### Technical Considerations

#### Audio Quality Requirements
```typescript
// Recording specifications:
- Sample Rate: 16kHz (required by Azure)
- Channels: Mono (required by Azure)
- Format: WAV or FLAC (best quality)
- Bit Depth: 16-bit
- Duration: 1-30 seconds per assessment
```

#### Error Handling Scenarios
```typescript
// Handle these cases:
- Microphone permission denied
- No audio detected during recording
- Azure API rate limiting
- Network connectivity issues
- Unsupported browser/device
- Audio format conversion failures
```

#### Performance Optimizations
```typescript
// Optimization strategies:
- Debounce recording requests
- Cache audio for retry scenarios
- Implement request timeouts
- Progressive loading of results
- Optimize audio file sizes
```

### Data Flow Architecture
```
User Speech → MediaRecorder → WAV Blob → 
tRPC Router → Azure Speech API → 
Assessment Results → React State → UI Display
```

### Success Metrics
- [ ] **Recording Quality**: Clear audio capture with minimal noise
- [ ] **Assessment Accuracy**: Reliable pronunciation scoring
- [ ] **Response Time**: < 3 seconds from recording to results
- [ ] **User Experience**: Intuitive recording and feedback interface
- [ ] **Error Resilience**: Graceful handling of common failure scenarios

### Future Enhancements (Post-MVP)
- Phoneme-level feedback for advanced users
- Progress tracking across practice sessions
- Difficulty-adjusted scoring
- Custom word/phrase practice lists
- Voice comparison with native speakers

### Phase 3: Enhanced AI Features (Week 3)
**Goal**: Better conversation experience

**Tasks**:
1. **AI Improvements**
   - Grammar correction suggestions
   - Conversation topic suggestions
   - Better context understanding

2. **Error Handling**
   - Robust API error handling
   - Fallback mechanisms for speech services
   - Better user feedback

3. **UI Polish**
   - Loading states and animations
   - Better speech controls UX
   - Responsive design improvements

**Success Criteria**:
- ✅ AI provides helpful corrections
- ✅ Multiple conversation topics available
- ✅ Robust error handling
- ✅ Polished user experience

## 🔧 Environment Setup

### Required API Keys
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Azure Speech Services
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region
```

### Prerequisites
- Node.js 18+
- npm or pnpm
- OpenAI API account
- Azure Speech Services account

## 🎓 Learning Objectives

### New Paradigms You'll Master
1. **Server Components**: Server-side rendering with component-level data fetching
2. **Server Actions**: Form handling and mutations without API routes
3. **tRPC**: Type-safe client-server communication
4. **Streaming UI**: Progressive enhancement and loading states
5. **AI API Integration**: Modern patterns for AI service integration

### Transferable Skills
- Modern Next.js patterns (highly job-relevant)
- TypeScript best practices
- AI API integration patterns
- Speech API integration
- Stateful client-side architecture

## 🤔 Database Decision

**Your Question: "What will the database be used for?"**

Great question! With your simplified requirements, we actually **don't need a database at all**. Here's why:

### Original Database Use Cases (Now Removed):
- ❌ **Conversation History**: You don't want persistence between sessions
- ❌ **Progress Tracking**: You don't want learning analytics  
- ❌ **User Authentication**: Single-user, local-only app
- ❌ **Vocabulary Management**: No practice exercises needed
- ❌ **Learning Analytics**: Not required

### What We'll Use Instead:
- **React State**: Current conversation kept in component state
- **Session Storage**: Temporary data during current session (optional)
- **Direct API Calls**: OpenAI and Azure Speech APIs called directly
- **No Persistence**: Fresh start each session

### Simplified Architecture Benefits:
- ✅ **Faster Setup**: No database configuration needed
- ✅ **Simpler Stack**: Fewer moving parts to learn
- ✅ **Focus on Core Features**: More time for AI/Speech integration
- ✅ **No Data Management**: No migrations, schemas, or ORM complexity

This makes our tech stack even more focused on the new paradigms you want to learn!

## 🚦 Getting Started

### Quick Start
```bash
# 1. Create the project (simplified, no auth/database)
npm create t3-app@latest learn-romanian -- --tailwind --trpc

# 2. Navigate to project
cd learn-romanian

# 3. Install additional dependencies
npm install microsoft-cognitiveservices-speech-sdk openai

# 4. Set up environment variables
cp .env.example .env.local
# Fill in your API keys

# 5. Start development server
npm run dev
```

### Development Workflow
1. **Start with tests** - Define expected behavior
2. **Build incrementally** - One feature at a time
3. **Test frequently** - Both unit and integration tests
4. **Iterate based on usage** - Adjust features based on your learning experience

## 📚 Resources & References

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [tRPC](https://trpc.io/docs)
- [Azure Speech Services](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [OpenAI API](https://platform.openai.com/docs)

### Learning Resources
- [T3 Stack Tutorial](https://create.t3.gg/)
- [Server Components Deep Dive](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Romanian Language Reference](https://ro.wikipedia.org/wiki/Limba_română)

## 🎯 Success Metrics

### Technical Goals
- [ ] 100% TypeScript coverage
- [ ] Fast API response times
- [ ] 95%+ speech recognition accuracy
- [ ] Zero runtime type errors
- [ ] Smooth voice interaction UX

### Learning Goals
- [ ] Comfortable with Server Components
- [ ] Proficient with tRPC patterns
- [ ] Understanding of real-time architectures
- [ ] Experience with AI API integration

### Personal Goals
- [ ] Daily Romanian conversation practice
- [ ] Improved pronunciation through feedback
- [ ] Natural conversation flow
- [ ] Consistent learning habit formation

---

## 🎉 Implementation Summary

### ✅ Completed Features

#### Phase 1: Core Chat Interface
- **Project Setup**: T3 stack with Next.js 14, TypeScript, Tailwind CSS
- **Chat System**: Real-time chat with OpenAI Romanian tutor
- **Text-to-Speech**: Azure Speech Services integration with Romanian voices

#### Phase 2: Pronunciation Assessment System  
- **Recording Infrastructure**: 
  - MediaRecorder API integration with proper audio formatting
  - Real-time recording controls with visual feedback
  - Auto-stop at configurable duration limits
  - Cross-browser compatible audio recording

- **Azure Speech Assessment API**:
  - Pronunciation assessment with Romanian language support
  - Word-level accuracy scoring and error detection
  - Syllable-level feedback for detailed analysis
  - Comprehensive error handling and fallbacks

- **Smart UI Components**:
  - `RecordingButton`: Full-featured recording control with state management
  - `PronunciationAssessment`: Complete assessment workflow container
  - Integrated pronunciation button in chat messages
  - Real-time score visualization with color-coded feedback

- **Assessment Features**:
  - Overall pronunciation scoring (0-100 scale)
  - Individual word accuracy analysis
  - Fluency and completeness metrics
  - Actionable improvement suggestions
  - Visual feedback with color-coded results

### 🎯 Current State
Your Romanian learning app now features:
- ✅ **AI Conversation**: Chat with Romanian tutor AI
- ✅ **Text-to-Speech**: Listen to Romanian pronunciation 
- ✅ **Pronunciation Assessment**: Practice and get scored feedback
- ✅ **Real-time Feedback**: Immediate pronunciation scoring
- ✅ **Word-level Analysis**: Detailed breakdown of pronunciation accuracy

### 🚀 Next Steps (Optional)
- **Voice Input**: Add speech-to-text for voice-based conversation
- **Grammar Correction**: AI-powered grammar suggestions
- **Progress Tracking**: Save and track pronunciation improvement
- **Conversation Topics**: Structured learning scenarios

**Your pronunciation assessment system is now live and ready for Romanian language practice!** 🎙️🇷🇴 