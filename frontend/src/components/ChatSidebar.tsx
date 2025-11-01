import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Textarea } from "./ui/textarea";
import { useAIChat } from "../hooks/useAIChat";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  recentIdeas?: string[];
}

export function ChatSidebar({ isOpen, onClose, recentIdeas = [] }: ChatSidebarProps) {
  const [conversationId, setConversationId] = useState('main-conversation');
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [conversationList, setConversationList] = useState<string[]>([]);

  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    requestSocraticQuestion,
  } = useAIChat(conversationId);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load conversation list with titles
  useEffect(() => {
    const saved = localStorage.getItem("conversationList");
    if (saved) {
      setConversationList(JSON.parse(saved));
    } else {
      setConversationList(['main-conversation']);
      localStorage.setItem("conversationList", JSON.stringify(['main-conversation']));
    }
  }, []);

  // Generate conversation title from messages
  const getConversationTitle = (convId: string): string => {
    if (convId === 'main-conversation') return 'Main';
    
    // Check if this is the current conversation with loaded messages
    if (convId === conversationId && messages.length > 0) {
      const firstUserMsg = messages.find((m: any) => m.role === 'user');
      if (firstUserMsg && firstUserMsg.content) {
        return firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
      }
    }
    
    // Try to get from localStorage as fallback
    const storageKey = `conv_title_${convId}`;
    const savedTitle = localStorage.getItem(storageKey);
    if (savedTitle) {
      return savedTitle;
    }
    
    // Format timestamp nicely
    const timestamp = convId.replace('conv-', '');
    const date = new Date(parseInt(timestamp));
    if (!isNaN(date.getTime())) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `Chat ${hours}:${minutes}`;
    }
    
    // Fallback
    return 'Conversation';
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Initialize with welcome message - only on first open and truly empty
  useEffect(() => {
    // Don't auto-request if conversation just switched
    const shouldRequest = messages.length === 0 && isOpen;
    if (shouldRequest) {
      // Small delay to prevent double-requesting
      const timer = setTimeout(() => {
        if (messages.length === 0) {
          requestSocraticQuestion(recentIdeas);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    const message = input.trim();
    
    // Save first message as conversation title
    if (messages.length === 0 && conversationId !== 'main-conversation') {
      const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
      localStorage.setItem(`conv_title_${conversationId}`, title);
    }
    
    setInput("");
    await sendMessage(message, true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRequestQuestion = () => {
    requestSocraticQuestion(recentIdeas);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="bg-background border-l border-border flex flex-col overflow-hidden w-full h-full"
        >
            <div className="h-24 border-b border-border flex items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <h2 className="text-xl tracking-tight">Dialogue</h2>
                <div className="relative">
                  <button
                    onClick={() => setShowConversationMenu(!showConversationMenu)}
                    className="text-xs uppercase tracking-wider px-3 py-1 border border-border hover:border-foreground transition-colors"
                  >
                    Conversations
                  </button>
                  
                  {showConversationMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-background border border-border p-4 min-w-[200px] space-y-2 z-50">
                      <button
                        onClick={() => {
                          const newId = `conv-${Date.now()}`;
                          setConversationId(newId);
                          const updated = [...conversationList, newId];
                          setConversationList(updated);
                          localStorage.setItem("conversationList", JSON.stringify(updated));
                          setShowConversationMenu(false);
                        }}
                        className="w-full text-xs uppercase tracking-wider px-3 py-2 border border-border hover:bg-foreground hover:text-background transition-all"
                      >
                        + New Conversation
                      </button>
                      <div className="border-t border-border pt-2 space-y-1 max-h-64 overflow-y-auto">
                        {conversationList.map((convId) => (
                          <button
                            key={convId}
                            onClick={() => {
                              setConversationId(convId);
                              setShowConversationMenu(false);
                            }}
                            className={`w-full text-left text-xs px-3 py-2 hover:bg-muted/20 transition-colors rounded ${
                              convId === conversationId ? 'text-foreground font-medium bg-muted/10' : 'text-muted'
                            }`}
                            title={getConversationTitle(convId)}
                          >
                            <div className="truncate">
                              {getConversationTitle(convId)}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-8 py-8 space-y-8"
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] ${
                      message.role === "user"
                        ? "bg-foreground text-background"
                        : "bg-background border border-border"
                    } p-6 leading-relaxed`}
                  >
                    {message.role === "assistant" && message.agentType && (
                      <p className="text-xs uppercase tracking-wider text-muted-light mb-2">
                        {message.agentType === 'guide' && 'Socratic Guide'}
                        {message.agentType === 'collector' && 'Idea Collector'}
                        {message.agentType === 'analyzer' && 'Deep Analyzer'}
                        {message.agentType === 'query' && 'Query Agent'}
                      </p>
                    )}
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    {message.relatedIdeas && message.relatedIdeas.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <p className="text-xs uppercase tracking-wider text-muted-light mb-2">
                          Related Ideas
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {message.relatedIdeas.map((ideaId, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-background border border-border"
                            >
                              #{ideaId.slice(0, 4)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isStreaming && streamingContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] bg-background border border-border p-6 leading-relaxed">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-1.5 h-1.5 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <p className="text-xs uppercase tracking-wider text-muted-light">
                        AI Thinking...
                      </p>
                    </div>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {streamingContent}
                    </p>
                  </div>
                </motion.div>
              )}

              {isLoading && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] bg-background border border-border p-6">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-1.5 h-1.5 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-1.5 h-1.5 bg-foreground rounded-full"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                      <p className="text-xs uppercase tracking-wider text-muted-light">
                        Multi-Agent Processing...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="border-t border-border p-6 space-y-3">
              <button
                onClick={handleRequestQuestion}
                disabled={isLoading || isStreaming}
                className="w-full text-xs uppercase tracking-wider py-2 border border-border hover:border-foreground text-muted hover:text-foreground transition-all duration-300 disabled:opacity-30"
              >
                Initiative Communication
              </button>

              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Share your thoughts..."
                  disabled={isLoading || isStreaming}
                  className="min-h-24 pr-16 text-[15px] leading-relaxed resize-none border-border focus:border-foreground"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isStreaming}
                  className="absolute bottom-3 right-3 w-10 h-10 bg-foreground text-background hover:bg-muted disabled:bg-border disabled:text-muted-light transition-all duration-300 flex items-center justify-center"
                >
                  →
                </button>
              </div>

              <p className="text-xs text-muted-light text-center">
                {isStreaming ? 'Streaming response...' : isLoading ? 'Processing with Multi-Agent system...' : 'Press Enter to send, Shift+Enter for new line'}
              </p>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
