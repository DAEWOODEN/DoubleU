import { useState, useCallback, useEffect } from 'react';
import { api, ChatMessage } from '../services/api';

export function useAIChat(conversationId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load chat history
  useEffect(() => {
    if (conversationId) {
      loadHistory();
    }
  }, [conversationId]);

  const loadHistory = async () => {
    if (!conversationId) return;
    
    // Always start fresh for each new visitor - use sessionStorage only
    // Check sessionStorage for current session data only
    const sessionKey = `session_messages_${conversationId}`;
    const sessionMessages = sessionStorage.getItem(sessionKey);
    
    if (sessionMessages) {
      try {
        const messages = JSON.parse(sessionMessages);
        // Only load if there are actual messages
        if (messages && messages.length > 0) {
          setMessages(messages);
          return;
        }
    } catch (err) {
        console.error('Failed to parse session messages:', err);
      }
    }
    
    // Always start with empty messages for fresh start
    // Don't load from backend - each user starts fresh
    setMessages([]);
  };

  const sendMessage = useCallback(
    async (content: string, useStreaming = true) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => {
        const newMessages = [...prev, userMessage];
        // Save to sessionStorage for this session
        if (conversationId) {
          const sessionKey = `session_messages_${conversationId}`;
          sessionStorage.setItem(sessionKey, JSON.stringify(newMessages));
        }
        return newMessages;
      });
      setError(null);

      if (useStreaming) {
        setIsStreaming(true);
        setStreamingContent('');
        let fullContent = '';

        try {
          await api.streamMessage(
            content,
            conversationId,
            (chunk) => {
              fullContent += chunk;
              setStreamingContent(fullContent);
            }
          );

          // Save the complete streamed message
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: fullContent,
            timestamp: new Date().toISOString(),
          };

          setMessages((prev) => {
            const newMessages = [...prev, assistantMessage];
            // Save to sessionStorage for this session
            if (conversationId) {
              const sessionKey = `session_messages_${conversationId}`;
              sessionStorage.setItem(sessionKey, JSON.stringify(newMessages));
            }
            return newMessages;
          });
          setStreamingContent('');
        } catch (err) {
          setError('Failed to get AI response');
          console.error(err);
        } finally {
          setIsStreaming(false);
        }
      } else {
        setIsLoading(true);

        try {
          const response = await api.sendMessage(content, conversationId);
          setMessages((prev) => {
            const newMessages = [...prev, response];
            // Save to sessionStorage for this session
            if (conversationId) {
              const sessionKey = `session_messages_${conversationId}`;
              sessionStorage.setItem(sessionKey, JSON.stringify(newMessages));
            }
            return newMessages;
          });
        } catch (err) {
          setError('Failed to get AI response');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [conversationId, streamingContent]
  );

  const requestSocraticQuestion = useCallback(async (recentIdeas: string[]) => {
    try {
      console.log('Requesting socratic question with:', { recentIdeas, messageCount: messages.length });
      const question = await api.requestSocraticQuestion({
        recentIdeas,
        conversationHistory: messages,
      });

      // Ensure we have a valid question (API now handles fallback, but double-check)
      const defaultQuestions = [
        "What's a moment from the past week that stuck with you?",
        "Tell me about something that surprised you recently.",
        "What's been on your mind lately?",
        "Can you share a recent experience that felt meaningful?",
      ];
      const finalQuestion = question && question.trim() 
        ? question.trim() 
        : defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: finalQuestion,
        timestamp: new Date().toISOString(),
        agentType: 'guide',
      };

      setMessages((prev) => {
        // Always add the question - append to existing messages if any
        const newMessages = [...prev, assistantMessage];
        // Save to sessionStorage for this session
        if (conversationId) {
          const sessionKey = `session_messages_${conversationId}`;
          sessionStorage.setItem(sessionKey, JSON.stringify(newMessages));
        }
        return newMessages;
      });
      console.log('Initiative Communication question displayed:', finalQuestion);
    } catch (err) {
      console.error('Failed to get Socratic question:', err);
      // Show diverse fallback message if API fails
      const fallbackQuestions = [
        "What's a moment from the past week that stuck with you?",
        "Tell me about something that surprised you recently.",
        "What's been on your mind lately?",
        "Can you share a recent experience that felt meaningful?",
        "What caught your attention in the past few days?",
        "What's something that made you pause and think this week?",
        "Can you describe a moment that felt significant to you?",
      ];
      const fallbackMessage: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)],
        timestamp: new Date().toISOString(),
        agentType: 'guide',
      };
      setMessages((prev) => {
        // Always add fallback question
        const newMessages = [...prev, fallbackMessage];
        // Save to sessionStorage for this session
        if (conversationId) {
          const sessionKey = `session_messages_${conversationId}`;
          sessionStorage.setItem(sessionKey, JSON.stringify(newMessages));
        }
        return newMessages;
      });
    }
  }, [messages, conversationId]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
    // Clear sessionStorage for this conversation
    if (conversationId) {
      const sessionKey = `session_messages_${conversationId}`;
      sessionStorage.removeItem(sessionKey);
    }
  }, [conversationId]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    error,
    sendMessage,
    requestSocraticQuestion,
    clearChat,
  };
}
