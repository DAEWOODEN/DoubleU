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
    
    try {
      const history = await api.getChatHistory(conversationId);
      // Only load if there's actual history, otherwise start fresh
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      // Start with empty messages on error
      setMessages([]);
    }
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

      setMessages((prev) => [...prev, userMessage]);
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

          setMessages((prev) => [...prev, assistantMessage]);
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
          setMessages((prev) => [...prev, response]);
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
      const question = await api.requestSocraticQuestion({
        recentIdeas,
        conversationHistory: messages,
      });

      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: question,
        timestamp: new Date().toISOString(),
        agentType: 'guide',
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Failed to get Socratic question:', err);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
  }, []);

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
