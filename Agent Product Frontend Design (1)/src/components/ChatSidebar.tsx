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
  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    requestSocraticQuestion,
  } = useAIChat('main-conversation');

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      requestSocraticQuestion(recentIdeas);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    const message = input.trim();
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
              <div>
                <h2 className="text-xl tracking-tight">Dialogue</h2>
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
                Request Socratic Question
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
