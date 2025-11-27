// API Service Layer for ComChatX Backend
// Connects to FastAPI Multi-Agent System

// Configure your backend URL here
// Use environment variable in production, fallback to localhost for development
// When using ngrok, API requests will be proxied through Vite dev server
function getApiBaseUrl(): string {
  // Check if we're running on ngrok
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If accessing through ngrok, use relative path (will be proxied by Vite)
    if (hostname.includes('ngrok') || hostname.includes('ngrok-free')) {
      // Use empty string for relative URLs, Vite will proxy /api/* to backend
      return '';
    }
    // Check if ngrok backend URL is manually set
    const ngrokBackendUrl = localStorage.getItem('ngrok_backend_url');
    if (ngrokBackendUrl) {
      return ngrokBackendUrl;
    }
  }
  // Fallback to environment variable or localhost
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
}

const API_BASE_URL = getApiBaseUrl();

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
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for AI responses

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
        console.error('Request timeout - please check backend connection');
        throw new Error('Request timeout - backend may be unavailable');
      }
      console.error('API request error:', err);
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
      return await this.request('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      });
  }

  async streamMessage(
    message: string,
    conversationId?: string,
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for streaming

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
      console.error('Backend streaming error:', err);
      throw err;
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
    // Use shorter timeout for Initiative Communication - 12 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/socratic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const question = data.question || data;
      
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        throw new Error('Empty question received from server');
      }
      
      return question;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('Initiative Communication error:', error);
      // Return a diverse fallback question instead of throwing
      const fallbackQuestions = [
        "What's a moment from the past week that stuck with you?",
        "Tell me about something that surprised you recently.",
        "What's been on your mind lately?",
        "Can you share a recent experience that felt meaningful?",
        "What caught your attention in the past few days?",
        "What's something that made you pause and think this week?",
        "Can you describe a moment that felt significant to you?",
      ];
      return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          onChunk?.(chunk);
        }
      }
      
      // Decode any remaining data
      const finalChunk = decoder.decode();
      if (finalChunk) {
        onChunk?.(finalChunk);
      }
    } finally {
      reader.releaseLock();
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

  async deleteEssay(essayId: string): Promise<void> {
    return this.request(`/api/essay/${essayId}`, {
      method: 'DELETE',
    });
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
