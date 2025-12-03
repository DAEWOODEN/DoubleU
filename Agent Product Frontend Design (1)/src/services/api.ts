// API Service Layer for ComChatX Backend
// Connects to FastAPI Multi-Agent System

// Configure your backend URL here
const API_BASE_URL = 'http://localhost:8000';

// Types matching backend schema
export interface UserProfile {
  id?: string;
  targetUniversities: string;
  targetMajor: string;
  name: string;
  mbti: string;
  skill: string;
  hobby: string;
}

export interface Idea {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: number;
  intensity: number;
  velocity: { x: number; y: number };
  inStorage: boolean;
  aiAnalysis?: {
    category: string;
    themes: string[];
    connections: string[];
    suggestions: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentType?: 'collector' | 'analyzer' | 'guide' | 'query';
  relatedIdeas?: string[];
}

export interface NarrativeEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'experience' | 'insight' | 'achievement' | 'reflection';
  impact: number;
  expanded: boolean;
  sourceIdeas?: string[];
  aiGenerated?: boolean;
}

export interface Essay {
  id: string;
  university: string;
  version: number;
  content: string;
  status: 'draft' | 'reviewing' | 'completed';
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  feedback?: string;
}

class APIService {
  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (err) {
      // If backend is not available, fail gracefully
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timeout - backend may be unavailable');
      }
      throw err;
    }
  }

  // User Profile Management
  async saveProfile(profile: UserProfile) {
    try {
      return await this.request('/api/profile', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    } catch (err) {
      console.warn('Backend unavailable, profile saved locally only');
      return null;
    }
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      return await this.request('/api/profile');
    } catch {
      return null;
    }
  }

  // Ideas Management with AI Analysis
  async syncIdeas(ideas: Idea[]) {
    return this.request('/api/ideas/sync', {
      method: 'POST',
      body: JSON.stringify({ ideas }),
    });
  }

  async analyzeIdea(ideaId: string, content: string) {
    return this.request('/api/ideas/analyze', {
      method: 'POST',
      body: JSON.stringify({ ideaId, content }),
    });
  }

  async getIdeaConnections(ideaId: string): Promise<string[]> {
    return this.request(`/api/ideas/${ideaId}/connections`);
  }

  async getIdeasSummary(): Promise<{
    totalIdeas: number;
    mainThemes: string[];
    suggestedNarratives: NarrativeEvent[];
  }> {
    return this.request('/api/ideas/summary');
  }

  // Chat with Multi-Agent System
  async sendMessage(
    message: string,
    conversationId?: string
  ): Promise<ChatMessage> {
    try {
      return await this.request('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock response');
      // Return mock message
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "That's a thought-provoking question. Could you elaborate on what specific aspects intrigue you the most? What connections do you see between this and your other experiences?",
        timestamp: new Date().toISOString(),
        agentType: 'guide',
      };
    }
  }

  async streamMessage(
    message: string,
    conversationId?: string,
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, conversationId }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Stream failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              onChunk?.(parsed.content);
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.warn('Backend streaming unavailable, using mock response');
      // Mock streaming response
      const mockResponses = [
        "That's an interesting perspective. ",
        "Can you tell me more about what led you to that realization? ",
        "What specific moment or experience made this clear to you?",
      ];
      const fullResponse = mockResponses.join('');
      
      // Simulate streaming with delays
      for (let i = 0; i < fullResponse.length; i += 3) {
        await new Promise(resolve => setTimeout(resolve, 30));
        onChunk?.(fullResponse.slice(i, i + 3));
      }
    }
  }

  async getChatHistory(conversationId: string): Promise<ChatMessage[]> {
    try {
      return await this.request(`/api/chat/history/${conversationId}`);
    } catch {
      return [];
    }
  }

  async requestSocraticQuestion(context: {
    recentIdeas: string[];
    conversationHistory: ChatMessage[];
  }): Promise<string> {
    try {
      return await this.request('/api/chat/socratic', {
        method: 'POST',
        body: JSON.stringify(context),
      });
    } catch (err) {
      console.warn('Backend unavailable, using mock Socratic question');
      const mockQuestions = [
        "Welcome! I'm here to help you explore your thoughts and experiences. What's been on your mind lately that you'd like to discuss?",
        "I notice you've been thinking about several interesting topics. Which one feels most important to you right now, and why?",
        "That's fascinating. What do you think drew you to this particular interest? Can you trace back to when you first became aware of it?",
        "How does this connect to your broader goals and aspirations? What does pursuing this mean to you personally?",
      ];
      return mockQuestions[Math.min(context.conversationHistory.length, mockQuestions.length - 1)];
    }
  }

  // Narrative Generation
  async generateNarrative(options: {
    useIdeas: boolean;
    useConversations: boolean;
    targetLength?: number;
  }): Promise<NarrativeEvent[]> {
    return this.request('/api/narrative/generate', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async saveNarrative(events: NarrativeEvent[]) {
    return this.request('/api/narrative/save', {
      method: 'POST',
      body: JSON.stringify({ events }),
    });
  }

  async getNarrativeSuggestions(): Promise<{
    suggestedEvents: NarrativeEvent[];
    missingAspects: string[];
  }> {
    return this.request('/api/narrative/suggestions');
  }

  // Essay Generation and Management
  async generateEssay(params: {
    university: string;
    wordLimit: number;
    useNarrative: boolean;
    useIdeas: boolean;
    useConversations: boolean;
  }): Promise<Essay> {
    return this.request('/api/essay/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async streamEssay(
    params: {
      university: string;
      wordLimit: number;
      useNarrative: boolean;
      useIdeas: boolean;
      useConversations: boolean;
    },
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/essay/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      onChunk?.(chunk);
    }
  }

  async saveEssay(essay: Essay) {
    return this.request('/api/essay/save', {
      method: 'POST',
      body: JSON.stringify(essay),
    });
  }

  async getEssayFeedback(essayId: string): Promise<{
    overallScore: number;
    strengths: string[];
    improvements: string[];
    suggestions: string;
  }> {
    return this.request(`/api/essay/${essayId}/feedback`);
  }

  async listEssays(): Promise<Essay[]> {
    return this.request('/api/essay/list');
  }

  // Cross-View Intelligence
  async getInsights(): Promise<{
    ideaThemes: { theme: string; count: number }[];
    growthTrajectory: string;
    essayReadiness: number;
    nextSteps: string[];
  }> {
    return this.request('/api/insights');
  }

  async getRelationshipMap(): Promise<{
    nodes: Array<{
      id: string;
      type: 'idea' | 'conversation' | 'narrative' | 'essay';
      label: string;
    }>;
    edges: Array<{
      source: string;
      target: string;
      strength: number;
    }>;
  }> {
    return this.request('/api/insights/relationships');
  }
}

export const api = new APIService();
