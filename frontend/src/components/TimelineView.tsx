import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { api, NarrativeEvent } from "../services/api";
import { toast } from "sonner@2.0.3";

interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: "experience" | "insight" | "achievement" | "reflection";
  impact: number;
  expanded: boolean;
  sourceIdeas?: string[];
  aiGenerated?: boolean;
}

export function TimelineView() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<NarrativeEvent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    description: "",
    category: "experience" as TimelineEvent["category"],
    impact: 3,
  });

  useEffect(() => {
    // Always show sample events on load - fresh start for each visitor
    // Check sessionStorage first (current session), then fallback to sample
    const sessionEvents = sessionStorage.getItem("sessionTimelineEvents");
    
    if (sessionEvents) {
      try {
        const loadedEvents = JSON.parse(sessionEvents);
        if (loadedEvents && loadedEvents.length > 0) {
          setEvents(loadedEvents);
          return; // Exit early if session data exists
        }
      } catch (err) {
        console.error('Failed to parse session events:', err);
      }
    }
    
    // Always show sample events for fresh start
    const saved = localStorage.getItem("timelineEvents");
    const hasInitialized = localStorage.getItem("timelineInitialized");
    
    // If no saved data or user cleared everything, show sample events
    if (!saved || (!hasInitialized && (!saved || JSON.parse(saved).length === 0)) ||
        (saved && JSON.parse(saved).length === 0 && !hasInitialized)) {
      const initialEvents: TimelineEvent[] = [
        {
          id: "sample-1",
          date: "Sep 2023",
          title: "Teaching in Rural Villages",
          description:
            "Three months in Guizhou, witnessing educational inequality firsthand",
          category: "experience",
          impact: 5,
          expanded: true,
        },
        {
          id: "sample-2",
          date: "Oct 2023",
          title: "The Critical Insight",
          description:
            "Recognized the need for personalized learning guidance in remote areas",
          category: "insight",
          impact: 5,
          expanded: true,
        },
        {
          id: "sample-3",
          date: "Nov 2023",
          title: "Development Begins",
          description: "Started building an AI-powered learning assistant",
          category: "achievement",
          impact: 4,
          expanded: true,
        },
        {
          id: "sample-4",
          date: "Feb 2024",
          title: "Launch",
          description: "Product released to first hundred students",
          category: "achievement",
          impact: 4,
          expanded: true,
        },
        {
          id: "sample-5",
          date: "May 2024",
          title: "Reaching Scale",
          description:
            "Over 500 active users, collecting meaningful feedback",
          category: "achievement",
          impact: 3,
          expanded: true,
        },
        {
          id: "sample-6",
          date: "Aug 2024",
          title: "Understanding Impact",
          description: "Technology as a force for connection and change",
          category: "reflection",
          impact: 5,
          expanded: true,
        },
      ];
      setEvents(initialEvents);
      // Save to both sessionStorage and localStorage
      sessionStorage.setItem("sessionTimelineEvents", JSON.stringify(initialEvents));
      localStorage.setItem("timelineEvents", JSON.stringify(initialEvents));
    }
  }, []);

  const saveEvents = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents);
    // Save to both sessionStorage (for this session) and localStorage
    sessionStorage.setItem("sessionTimelineEvents", JSON.stringify(newEvents));
    localStorage.setItem("timelineEvents", JSON.stringify(newEvents));
  };

  const toggleExpand = (id: string) => {
    const updated = events.map((event) =>
      event.id === id ? { ...event, expanded: !event.expanded } : event
    );
    saveEvents(updated);
  };

  const openEditDialog = (event: TimelineEvent) => {
    setEditingEvent(event);
    setFormData({
      date: event.date,
      title: event.title,
      description: event.description,
      category: event.category,
      impact: event.impact,
    });
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingEvent(null);
    setFormData({
      date: "",
      title: "",
      description: "",
      category: "experience",
      impact: 3,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.date.trim()) return;

    if (editingEvent) {
      const updated = events.map((event) =>
        event.id === editingEvent.id
          ? { ...event, ...formData }
          : event
      );
      saveEvents(updated);
    } else {
      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        ...formData,
        expanded: true,
      };
      saveEvents([...events, newEvent]);
    }

    setIsDialogOpen(false);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    const filtered = events.filter((event) => event.id !== id);
    saveEvents(filtered);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "experience":
        return "◆";
      case "insight":
        return "◇";
      case "achievement":
        return "●";
      case "reflection":
        return "○";
      default:
        return "●";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "experience":
        return "opacity-100";
      case "insight":
        return "opacity-80";
      case "achievement":
        return "opacity-90";
      case "reflection":
        return "opacity-70";
      default:
        return "opacity-100";
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="max-w-5xl mx-auto px-16 py-24">
        <div className="mb-32 flex items-end justify-between">
          <div>
            <h2 className="text-5xl tracking-tight mb-4">Your Narrative</h2>
            <p className="text-muted text-base">
              A journey of self-discovery and growth
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={async () => {
                setIsGenerating(true);
                try {
                  const data = await api.getNarrativeSuggestions();
                  setSuggestions(data.suggestedEvents);
                  setShowSuggestions(true);
                  
                  // Dark theme toast
                  toast(
                    <div className="space-y-3">
                      <p className="font-semibold text-base">AI Narrative Suggestions</p>
                      {data.missingAspects && data.missingAspects.length > 0 && (
                        <div>
                          <p className="text-xs uppercase tracking-wider opacity-70 mb-2">
                            Missing Aspects
                          </p>
                          <div className="space-y-1">
                            {data.missingAspects.map((aspect: string, idx: number) => (
                              <p key={idx} className="text-sm">• {aspect}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-sm opacity-70">
                        Generated {data.suggestedEvents.length} suggestions
                      </p>
                    </div>,
                    {
                      duration: 8000,
                      style: {
                        background: '#0A0A0A',
                        color: '#FAFAFA',
                        border: '1px solid #262626',
                        padding: '20px',
                      }
                    }
                  );
                } catch (err) {
                  console.error("Failed to get suggestions:", err);
                  toast.error("Failed to generate suggestions");
                } finally {
                  setIsGenerating(false);
                }
              }}
              disabled={isGenerating}
              className="text-sm uppercase tracking-wider px-8 py-3 border border-border hover:border-foreground text-muted hover:text-foreground transition-all duration-300 disabled:opacity-30"
            >
              {isGenerating ? "Generating..." : "Suggestions"}
            </button>
            <button
              onClick={openAddDialog}
              className="text-sm uppercase tracking-wider px-8 py-3 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
            >
              Add Event
            </button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

          <div className="space-y-32">
            {events.map((event, index) => {
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="relative"
                >
                  <div className="grid grid-cols-2 gap-16 items-center">
                    <div className={`${isLeft ? "text-right" : "opacity-0"}`}>
                      {isLeft && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: index * 0.15 + 0.2,
                            duration: 0.6,
                          }}
                          className="pr-8"
                        >
                          <div className="inline-block text-left max-w-md">
                            <div className="flex items-center justify-end gap-3 mb-3">
                              <span className="text-xs uppercase tracking-wider text-muted-light">
                                {event.date}
                              </span>
                              <span
                                className={`text-lg ${getCategoryColor(
                                  event.category
                                )}`}
                              >
                                {getCategoryIcon(event.category)}
                              </span>
                            </div>

                            <div className="flex items-center justify-end gap-3 mb-3">
                              <button
                                onClick={() => toggleExpand(event.id)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                {event.expanded ? "−" : "+"}
                              </button>
                              <button
                                onClick={() => openEditDialog(event)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                ×
                              </button>
                            </div>

                            <h3 className="text-2xl tracking-tight mb-3">
                              {event.title}
                            </h3>

                            <AnimatePresence>
                              {event.expanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <p className="text-[15px] leading-relaxed text-muted">
                                    {event.description}
                                  </p>

                                  <div className="mt-4 flex gap-1 justify-end">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 border ${
                                          i < event.impact
                                            ? "bg-foreground border-foreground"
                                            : "bg-transparent border-border"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <div className={`${!isLeft ? "text-left" : "opacity-0"}`}>
                      {!isLeft && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            delay: index * 0.15 + 0.2,
                            duration: 0.6,
                          }}
                          className="pl-8"
                        >
                          <div className="inline-block max-w-md">
                            <div className="flex items-center gap-3 mb-3">
                              <span
                                className={`text-lg ${getCategoryColor(
                                  event.category
                                )}`}
                              >
                                {getCategoryIcon(event.category)}
                              </span>
                              <span className="text-xs uppercase tracking-wider text-muted-light">
                                {event.date}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                              <button
                                onClick={() => toggleExpand(event.id)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                {event.expanded ? "−" : "+"}
                              </button>
                              <button
                                onClick={() => openEditDialog(event)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                ✎
                              </button>
                              <button
                                onClick={() => handleDelete(event.id)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                ×
                              </button>
                            </div>

                            <h3 className="text-2xl tracking-tight mb-3">
                              {event.title}
                            </h3>

                            <AnimatePresence>
                              {event.expanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <p className="text-[15px] leading-relaxed text-muted">
                                    {event.description}
                                  </p>

                                  <div className="mt-4 flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-2 h-2 border ${
                                          i < event.impact
                                            ? "bg-foreground border-foreground"
                                            : "bg-transparent border-border"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.15 + 0.1,
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className="w-4 h-4 border-2 border-foreground bg-background rotate-45" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-32 pt-16 border-t border-border"
        >
          <div className="flex gap-12 justify-center text-xs uppercase tracking-wider text-muted-light">
            <div className="flex items-center gap-2">
              <span className="text-base">◆</span>
              <span>Experience</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">◇</span>
              <span>Insight</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">●</span>
              <span>Achievement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">○</span>
              <span>Reflection</span>
            </div>
          </div>
        </motion.div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border border-border p-12 max-w-lg w-full space-y-8">
          <h3 className="text-2xl tracking-tight">
            {editingEvent ? "Edit Event" : "Add Event"}
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Date
              </label>
              <Input
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                placeholder="Sep 2023"
                  className="w-full px-4 py-3 border border-border bg-transparent focus:border-foreground outline-none transition-colors"
              />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as TimelineEvent["category"],
                    })
                  }
                  className="w-full px-4 py-3 border border-border bg-transparent focus:border-foreground outline-none transition-colors"
                >
                  <option value="experience">Experience</option>
                  <option value="insight">Insight</option>
                  <option value="achievement">Achievement</option>
                  <option value="reflection">Reflection</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Event title"
                className="w-full px-4 py-3 border border-border bg-transparent focus:border-foreground outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what happened..."
                className="min-h-32 w-full px-4 py-3 border border-border bg-transparent focus:border-foreground outline-none transition-colors resize-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Impact Level — {formData.impact}
              </label>
              <div className="flex gap-3 justify-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setFormData({ ...formData, impact: i + 1 })
                    }
                    className={`w-10 h-10 border-2 transition-all duration-300 ${
                      i < formData.impact
                        ? "bg-foreground border-foreground"
                        : "bg-transparent border-border hover:border-foreground"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-sm text-muted-light">
                <span>Low Impact</span>
                <span>High Impact</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t border-border">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
              disabled={!formData.title.trim() || !formData.date.trim()}
              className="text-sm uppercase tracking-wider px-8 py-3 bg-foreground text-background hover:bg-muted disabled:opacity-30 transition-all duration-300"
              >
                {editingEvent ? "Update" : "Add"}
              </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
