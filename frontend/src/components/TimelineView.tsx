import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { api, NarrativeEvent, RoadmapStep } from "../services/api";
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
  const [roadmap, setRoadmap] = useState<RoadmapStep[]>([]);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: "",
    title: "",
    description: "",
    category: "experience" as TimelineEvent["category"],
    impact: 3,
  });

  useEffect(() => {
    // Load events logic (existing)
    const sessionEvents = sessionStorage.getItem("sessionTimelineEvents");
    
    if (sessionEvents) {
      try {
        const loadedEvents = JSON.parse(sessionEvents);
        if (loadedEvents && loadedEvents.length > 0) {
          setEvents(loadedEvents);
        }
      } catch (err) {
        console.error('Failed to parse session events:', err);
      }
    } else {
      const saved = localStorage.getItem("timelineEvents");
      const hasInitialized = localStorage.getItem("timelineInitialized");
      
      if (!saved || (!hasInitialized && (!saved || JSON.parse(saved).length === 0)) ||
          (saved && JSON.parse(saved).length === 0 && !hasInitialized)) {
        const initialEvents: TimelineEvent[] = [
          {
            id: "sample-1",
            date: "Sep 2023",
            title: "Teaching in Rural Villages",
            description: "Three months in Guizhou, witnessing educational inequality firsthand",
            category: "experience",
            impact: 5,
            expanded: true,
          },
          // ... keep initial event count smaller for split view
          {
            id: "sample-2",
            date: "Oct 2023",
            title: "The Critical Insight",
            description: "Recognized the need for personalized learning guidance",
            category: "insight",
            impact: 5,
            expanded: true,
          }
        ];
        setEvents(initialEvents);
        sessionStorage.setItem("sessionTimelineEvents", JSON.stringify(initialEvents));
        localStorage.setItem("timelineEvents", JSON.stringify(initialEvents));
      }
    }

    // Load Roadmap
    const loadRoadmap = async () => {
      const profileStr = localStorage.getItem("userProfile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile.targetUniversities && profile.targetMajor) {
          setIsRoadmapLoading(true);
          try {
            // Check cache first to avoid repeated API calls
            const cachedRoadmap = localStorage.getItem("cachedRoadmap");
            if (cachedRoadmap) {
               setRoadmap(JSON.parse(cachedRoadmap));
               setIsRoadmapLoading(false);
               // Background refresh if needed? No, static is fine for session
               return; 
            }

            const data = await api.getRoadmap(profile.targetUniversities, profile.targetMajor);
            if (data.steps) {
              setRoadmap(data.steps);
              localStorage.setItem("cachedRoadmap", JSON.stringify(data.steps));
            }
          } catch (e) {
            console.error("Failed to load roadmap:", e);
          } finally {
            setIsRoadmapLoading(false);
          }
        }
      }
    };
    loadRoadmap();
  }, []);

  const saveEvents = (newEvents: TimelineEvent[]) => {
    setEvents(newEvents);
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
        event.id === editingEvent.id ? { ...event, ...formData } : event
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
      case "experience": return "◆";
      case "insight": return "◇";
      case "achievement": return "●";
      case "reflection": return "○";
      default: return "●";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "experience": return "text-blue-400";
      case "insight": return "text-purple-400";
      case "achievement": return "text-emerald-400";
      case "reflection": return "text-amber-400";
      default: return "text-foreground";
    }
  };

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col sm:flex-row">
      {/* Left Column: Personal Narrative */}
      <div className="flex-1 h-full overflow-y-auto border-r border-border/50">
        <div className="p-8 sm:p-12 max-w-2xl mx-auto">
          <div className="mb-16 flex items-end justify-between">
            <div>
              <h2 className="text-3xl sm:text-4xl tracking-tight mb-2">My Narrative</h2>
              <p className="text-muted text-sm">Your journey of self-discovery</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={openAddDialog}
                className="text-xs uppercase tracking-wider px-4 py-2 border border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
              >
                Add Event
              </button>
            </div>
          </div>

          <div className="relative pl-4 border-l border-border/30 space-y-12">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-background ${getCategoryColor(event.category)} bg-current`} />
                
                <div className="pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-light">
                      {event.date}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openEditDialog(event)} className="hover:text-foreground text-muted/50 hover:text-muted transition-colors" title="Edit">✎</button>
                      <button onClick={() => handleDelete(event.id)} className="hover:text-red-400 text-muted/50 hover:text-muted transition-colors text-lg leading-none" title="Delete">×</button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-medium mb-2 group cursor-pointer" onClick={() => toggleExpand(event.id)}>
                    {event.title}
                  </h3>
                  
                  <AnimatePresence>
                    {event.expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                      >
                        <p className="text-sm text-muted leading-relaxed mb-3">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs uppercase tracking-wider ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                          <span className="text-border">•</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < event.impact ? "bg-foreground" : "bg-border/30"}`} />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Target Path */}
      <div className="flex-1 h-full overflow-y-auto bg-background/50">
        <div className="p-8 sm:p-12 max-w-2xl mx-auto">
          <div className="mb-16">
            <h2 className="text-3xl sm:text-4xl tracking-tight mb-2">Target Path</h2>
            <p className="text-muted text-sm">Application requirements & steps</p>
          </div>

          {isRoadmapLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roadmap.length > 0 ? (
            <div className="space-y-8">
              {roadmap.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-6 border border-border/50 hover:border-foreground/30 rounded-lg transition-colors bg-background/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/10 text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium">{step.title}</h3>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-muted/10 text-muted-foreground">
                          {step.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted">
              <p>Complete your profile to generate a target path.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border border-border p-8 max-w-lg w-full">
          {/* Dialog content reused from previous implementation but simplified/styled if needed */}
          <h3 className="text-2xl mb-6">{editingEvent ? "Edit Event" : "Add Event"}</h3>
          <div className="space-y-4">
            <Input 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
              placeholder="Date (e.g. Sep 2023)"
            />
            <Input 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Event Title"
            />
            <Textarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Description"
              className="min-h-[100px]"
            />
            <div className="grid grid-cols-2 gap-4">
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as any})}
                className="w-full px-3 py-2 bg-background border border-border rounded-md"
              >
                <option value="experience">Experience</option>
                <option value="insight">Insight</option>
                <option value="achievement">Achievement</option>
                <option value="reflection">Reflection</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">Impact:</span>
                <input 
                  type="number" 
                  min="1" 
                  max="5" 
                  value={formData.impact}
                  onChange={e => setFormData({...formData, impact: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsDialogOpen(false)} className="px-4 py-2 text-sm hover:text-foreground text-muted">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-foreground text-background text-sm rounded-md hover:opacity-90">Save</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
