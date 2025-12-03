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
    const saved = localStorage.getItem("timelineEvents");
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      const initialEvents: TimelineEvent[] = [
        {
          id: "1",
          date: "Sep 2023",
          title: "Teaching in Rural Villages",
          description:
            "Three months in Guizhou, witnessing educational inequality firsthand",
          category: "experience",
          impact: 5,
          expanded: true,
        },
        {
          id: "2",
          date: "Oct 2023",
          title: "The Critical Insight",
          description:
            "Recognized the need for personalized learning guidance in remote areas",
          category: "insight",
          impact: 5,
          expanded: true,
        },
        {
          id: "3",
          date: "Nov 2023",
          title: "Development Begins",
          description: "Started building an AI-powered learning assistant",
          category: "achievement",
          impact: 4,
          expanded: true,
        },
        {
          id: "4",
          date: "Feb 2024",
          title: "Launch",
          description: "Product released to first hundred students",
          category: "achievement",
          impact: 4,
          expanded: true,
        },
        {
          id: "5",
          date: "May 2024",
          title: "Reaching Scale",
          description:
            "Over 500 active users, collecting meaningful feedback",
          category: "achievement",
          impact: 3,
          expanded: true,
        },
        {
          id: "6",
          date: "Aug 2024",
          title: "Understanding Impact",
          description: "Technology as a force for connection and change",
          category: "reflection",
          impact: 5,
          expanded: true,
        },
      ];
      setEvents(initialEvents);
      localStorage.setItem("timelineEvents", JSON.stringify(initialEvents));
    }
  }, []);

  const saveEvents = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents);
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
                  toast.success(`Generated ${data.suggestedEvents.length} AI suggestions`);
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

                            <div className="flex items-center justify-end gap-2 mb-3">
                              <button
                                onClick={() => toggleExpand(event.id)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                {event.expanded ? "Collapse" : "Expand"}
                              </button>
                              <button
                                onClick={() => openEditDialog(event)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                Edit
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

                            <div className="flex items-center gap-2 mb-3">
                              <button
                                onClick={() => toggleExpand(event.id)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                {event.expanded ? "Collapse" : "Expand"}
                              </button>
                              <button
                                onClick={() => openEditDialog(event)}
                                className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                              >
                                Edit
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
        <DialogContent className="max-w-lg border-border bg-background p-12">
          <div className="space-y-6">
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
                className="border-border focus:border-foreground"
              />
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
                className="border-border focus:border-foreground"
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
                className="min-h-24 border-border focus:border-foreground resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Category
              </label>
              <div className="flex gap-2">
                {(["experience", "insight", "achievement", "reflection"] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() =>
                        setFormData({ ...formData, category: cat })
                      }
                      className={`text-xs uppercase tracking-wider px-4 py-2 border transition-all duration-300 ${
                        formData.category === cat
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted hover:border-foreground"
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Impact — {formData.impact}
              </label>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setFormData({ ...formData, impact: i + 1 })
                    }
                    className={`w-8 h-8 border transition-all duration-300 ${
                      i < formData.impact
                        ? "bg-foreground border-foreground"
                        : "bg-transparent border-border"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8 pt-8 border-t border-border">
            {editingEvent && (
              <button
                onClick={() => {
                  handleDelete(editingEvent.id);
                  setIsDialogOpen(false);
                }}
                className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors"
              >
                Delete
              </button>
            )}
            <div className="flex gap-4 ml-auto">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-sm uppercase tracking-wider px-8 py-3 bg-foreground text-background hover:bg-muted transition-all duration-300"
              >
                {editingEvent ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
