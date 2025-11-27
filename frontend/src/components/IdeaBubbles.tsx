import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
import { Dialog, DialogContent } from "./ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Textarea } from "./ui/textarea";
import { Slider } from "./ui/slider";

interface Idea {
  id: string;
  content: string;
  position: { x: number; y: number };
  size: number;
  intensity: number;
  velocity: { x: number; y: number };
  inStorage: boolean;
  aiSummary?: string;
}

export function IdeaBubbles() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [intensityValue, setIntensityValue] = useState(5);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [intensityMode, setIntensityMode] = useState(false);
  const [storageHovered, setStorageHovered] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const storageButtonRef = useRef<HTMLButtonElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    // Always show sample ideas for fresh start - every page load
    // Check sessionStorage first (current session only)
    const sessionIdeas = sessionStorage.getItem("sessionIdeas");
    
    if (sessionIdeas) {
      try {
        const loadedIdeas = JSON.parse(sessionIdeas);
        if (loadedIdeas && loadedIdeas.length > 0) {
          setIdeas(
            loadedIdeas.map((idea: Idea) => ({
              ...idea,
              velocity: idea.velocity || {
                x: (Math.random() - 0.5) * 0.3,
                y: (Math.random() - 0.5) * 0.3,
              },
              inStorage: idea.inStorage || false,
            }))
          );
          return;
        }
      } catch (err) {
        console.error('Failed to parse session ideas:', err);
      }
    }
    
    // Always show sample ideas for fresh start
    const saved = localStorage.getItem("ideas");
    const hasInitialized = localStorage.getItem("ideasInitialized");
    
    // If no saved data or user cleared everything, show sample ideas
    if (!saved || !hasInitialized || (saved && JSON.parse(saved).length === 0)) {
      const sampleIdeas: Idea[] = [
        {
          id: "sample-1",
          content: "AI in education",
          position: { x: 200, y: 150 },
          size: 140,
          intensity: 8,
          velocity: { x: 0.1, y: 0.15 },
          inStorage: false,
        },
        {
          id: "sample-2",
          content: "Teaching experience in rural areas",
          position: { x: 700, y: 200 },
          size: 180,
          intensity: 9,
          velocity: { x: -0.12, y: 0.08 },
          inStorage: false,
        },
        {
          id: "sample-3",
          content: "Building learning tools",
          position: { x: 300, y: 500 },
          size: 150,
          intensity: 7,
          velocity: { x: 0.08, y: -0.1 },
          inStorage: false,
        },
      ];
      setIdeas(sampleIdeas);
      localStorage.setItem("ideas", JSON.stringify(sampleIdeas));
      localStorage.setItem("ideasInitialized", "true");
    } else if (saved) {
      const loadedIdeas = JSON.parse(saved);
      setIdeas(
        loadedIdeas.map((idea: Idea) => ({
          ...idea,
          velocity: idea.velocity || {
            x: (Math.random() - 0.5) * 0.3,
            y: (Math.random() - 0.5) * 0.3,
          },
          inStorage: idea.inStorage || false,
        }))
      );
    }
  }, []);

  // Animate bubbles floating
  useEffect(() => {
    const animate = () => {
      setIdeas((prevIdeas) =>
        prevIdeas.map((idea) => {
          if (idea.inStorage || !containerRef.current) return idea;

          const containerWidth = containerRef.current.clientWidth;
          const containerHeight = containerRef.current.clientHeight;

          let newX = idea.position.x + idea.velocity.x;
          let newY = idea.position.y + idea.velocity.y;
          let newVelX = idea.velocity.x;
          let newVelY = idea.velocity.y;

          // Bounce off edges
          if (newX <= 0 || newX + idea.size >= containerWidth) {
            newVelX = -newVelX;
            newX = Math.max(0, Math.min(newX, containerWidth - idea.size));
          }
          if (newY <= 0 || newY + idea.size >= containerHeight) {
            newVelY = -newVelY;
            newY = Math.max(0, Math.min(newY, containerHeight - idea.size));
          }

          return {
            ...idea,
            position: { x: newX, y: newY },
            velocity: { x: newVelX, y: newVelY },
          };
        })
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const saveIdeas = (newIdeas: Idea[]) => {
    setIdeas(newIdeas);
    // Save to both sessionStorage (for this session) and localStorage
    sessionStorage.setItem("sessionIdeas", JSON.stringify(newIdeas));
    localStorage.setItem("ideas", JSON.stringify(newIdeas));
  };

  const addIdea = () => {
    if (!inputValue.trim()) return;

    const activeIdeas = ideas.filter((i) => !i.inStorage);
    const scaleFactor = Math.max(0.4, 1 - activeIdeas.length * 0.06);
    const baseSize = 120 * scaleFactor;
    const variationSize = (Math.random() * 60 + 20) * scaleFactor;

    const newIdea: Idea = {
      id: Date.now().toString(),
      content: inputValue,
      position: {
        x: Math.random() * 400 + 300,
        y: Math.random() * 400 + 200,
      },
      size: baseSize + variationSize,
      intensity: intensityValue,
      velocity: {
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
      },
      inStorage: false,
    };

    saveIdeas([...ideas, newIdea]);
    setInputValue("");
    setIntensityValue(5);
    setIsDialogOpen(false);
  };

  const updateIdea = () => {
    if (!editingIdea || !inputValue.trim()) return;

    const updated = ideas.map((idea) =>
      idea.id === editingIdea.id
        ? { ...idea, content: inputValue, intensity: intensityValue }
        : idea
    );
    saveIdeas(updated);
    setEditingIdea(null);
    setInputValue("");
    setIntensityValue(5);
    setIsDialogOpen(false);
  };

  const deleteIdea = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const filtered = ideas.filter((idea) => idea.id !== id);
    saveIdeas(filtered);
  };

  const openEditDialog = (idea: Idea, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIdea(idea);
    setInputValue(idea.content);
    setIntensityValue(idea.intensity);
    setIsDialogOpen(true);
  };

  const openAddDialog = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".idea-bubble")) return;
    if ((e.target as HTMLElement).closest("button")) return;

    setEditingIdea(null);
    setInputValue("");
    setIntensityValue(5);
    setIsDialogOpen(true);
  };

  const handleDragStart = (idea: Idea) => {
    setDraggingId(idea.id);
  };

  const handleDragEnd = (idea: Idea, event: any, info: any) => {
    setDraggingId(null);
    
    const x = idea.position.x + info.offset.x;
    const y = idea.position.y + info.offset.y;

    // Check if dropped on storage button
    if (storageButtonRef.current && !idea.inStorage) {
      const buttonRect = storageButtonRef.current.getBoundingClientRect();
      const bubbleRect = {
        left: x,
        top: y,
        right: x + getDisplaySize(idea),
        bottom: y + getDisplaySize(idea),
      };

        // Must touch the BOX button to store (no expansion)
        const dropZoneExpansion = 0;
      const expandedButtonRect = {
        left: buttonRect.left - dropZoneExpansion,
        right: buttonRect.right + dropZoneExpansion,
        top: buttonRect.top - dropZoneExpansion,
        bottom: buttonRect.bottom + dropZoneExpansion,
      };

      const isOverButton =
        bubbleRect.right > expandedButtonRect.left &&
        bubbleRect.left < expandedButtonRect.right &&
        bubbleRect.bottom > expandedButtonRect.top &&
        bubbleRect.top < expandedButtonRect.bottom;

      if (isOverButton) {
        // Move to storage
        const updated = ideas.map((i) =>
          i.id === idea.id
            ? {
                ...i,
                inStorage: true,
                velocity: { x: 0, y: 0 },
              }
            : i
        );
        saveIdeas(updated);
        return;
      }
    }

    // Just update position
    const updated = ideas.map((i) =>
      i.id === idea.id ? { ...i, position: { x, y } } : i
    );
    saveIdeas(updated);
  };

  const moveOutOfStorage = (idea: Idea) => {
    const containerWidth = containerRef.current?.clientWidth || 1000;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const updated = ideas.map((i) =>
      i.id === idea.id
        ? {
            ...i,
            inStorage: false,
            position: {
              x: Math.random() * (containerWidth - 200) + 100,
              y: Math.random() * (containerHeight - 200) + 100,
            },
            velocity: {
              x: (Math.random() - 0.5) * 0.3,
              y: (Math.random() - 0.5) * 0.3,
            },
          }
        : i
    );
    saveIdeas(updated);
  };

  const getDisplaySize = (idea: Idea) => {
    if (intensityMode) {
      return 80 + (idea.intensity / 10) * 160;
    }

    // Fixed size - no scaling based on quantity
    // Keep original size to ensure content is always readable
    return idea.size;
  };

  const activeIdeas = ideas.filter((i) => !i.inStorage);
  const storedIdeas = ideas.filter((i) => i.inStorage);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-background cursor-crosshair"
      onClick={openAddDialog}
    >
      <AnimatePresence>
        {activeIdeas.map((idea) => {
          const displaySize = getDisplaySize(idea);
          return (
            <motion.div
              key={idea.id}
              className="absolute idea-bubble cursor-move select-none"
              style={{
                left: idea.position.x,
                top: idea.position.y,
                width: displaySize,
                height: displaySize,
                zIndex: draggingId === idea.id ? 100 : 10,
              }}
              drag
              dragMomentum={false}
              dragElastic={0}
              onDragStart={() => handleDragStart(idea)}
              onDragEnd={(event, info) => handleDragEnd(idea, event, info)}
              onDrag={() => {
                if (storageButtonRef.current && draggingId === idea.id) {
                  const buttonRect = storageButtonRef.current.getBoundingClientRect();
                  const isNear =
                    Math.abs(buttonRect.left - idea.position.x) < 350 &&
                    Math.abs(buttonRect.top - idea.position.y) < 350;
                  setStorageHovered(isNear);
                }
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: 1,
                scale: hoveredId === idea.id ? 1.05 : 1,
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{
                scale: {
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                },
                opacity: {
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              onDoubleClick={(e) => openEditDialog(idea, e)}
              onMouseEnter={() => setHoveredId(idea.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <motion.div
                className="relative w-full h-full rounded-full border border-border bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center shadow-sm p-6"
                animate={{
                  boxShadow:
                    hoveredId === idea.id
                      ? "0 8px 24px rgba(0,0,0,0.08)"
                      : "0 2px 8px rgba(0,0,0,0.04)",
                }}
                transition={{ duration: 0.3 }}
              >
                {/* AI Summary Badge - Outside the bubble */}
                {idea.aiSummary && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-3 py-1 rounded whitespace-nowrap">
                    {idea.aiSummary}
                  </div>
                )}

                {/* 内容显示 - 固定大小，始终可读 */}
                <p
                  className="text-foreground text-center leading-tight overflow-hidden"
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.4",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    maxWidth: "85%",
                    fontWeight: 500,
                  }}
                >
                  {idea.content}
                </p>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full transition-all duration-300 ${
                        i < idea.intensity ? "bg-foreground" : "bg-border"
                      }`}
                    />
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredId === idea.id ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={(e) => deleteIdea(idea.id, e)}
                  className="absolute -top-3 -right-3 w-8 h-8 border border-border bg-background hover:border-foreground hover:bg-foreground hover:text-background flex items-center justify-center text-sm transition-all duration-300"
                  style={{
                    pointerEvents: hoveredId === idea.id ? "auto" : "none",
                  }}
                >
                  ×
                </motion.button>
              </motion.div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {activeIdeas.length === 0 && storedIdeas.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-muted-light text-sm uppercase tracking-wider">
            Click anywhere to begin
          </p>
        </div>
      )}

      {/* Storage button - top left below ComChatX */}
      <motion.button
        ref={storageButtonRef}
        initial={{ opacity: 0, y: -20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          borderColor: storageHovered || (draggingId && !ideas.find(i => i.id === draggingId)?.inStorage) ? "#0A0A0A" : "#E5E5E5",
          backgroundColor: storageHovered || (draggingId && !ideas.find(i => i.id === draggingId)?.inStorage) ? "#0A0A0A" : "#FAFAFA",
          color: storageHovered || (draggingId && !ideas.find(i => i.id === draggingId)?.inStorage) ? "#FAFAFA" : "#737373",
        }}
        transition={{ delay: 0.5, duration: 0.3 }}
        onClick={(e) => {
          e.stopPropagation();
          setIsStorageOpen(true);
        }}
        onMouseEnter={() => setStorageHovered(true)}
        onMouseLeave={() => setStorageHovered(false)}
        className="fixed top-[26px] left-16 text-xs uppercase tracking-wider px-6 py-3 border transition-all duration-300 pointer-events-auto relative z-40"
      >
        Box
        {storedIdeas.length > 0 && (
          <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center text-[10px]">
            {storedIdeas.length}
          </span>
        )}
      </motion.button>

      {/* Free Mode button - bottom left */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        onClick={(e) => {
          e.stopPropagation();
          setIntensityMode(!intensityMode);
        }}
        className={`fixed bottom-16 left-16 text-xs uppercase tracking-wider px-6 py-3 border transition-all duration-300 pointer-events-auto ${
          intensityMode
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background text-muted hover:border-foreground"
        }`}
      >
        {intensityMode ? "Intensity Mode" : "Free Mode"}
      </motion.button>

      {/* Storage Sheet */}
      <Sheet open={isStorageOpen} onOpenChange={setIsStorageOpen}>
        <SheetContent 
          side="left"
          className="w-full sm:max-w-md border-border bg-background"
          onClick={(e) => e.stopPropagation()}
        >
          <SheetHeader>
            <SheetTitle className="text-xl tracking-tight uppercase">
              Box
            </SheetTitle>
          </SheetHeader>

          <div className="mt-8 space-y-2">
            {storedIdeas.length === 0 ? (
              <p className="text-muted text-sm text-center py-12">
                No ideas in box
              </p>
            ) : (
              storedIdeas.map((idea) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group border border-border bg-background/50 p-4 hover:border-foreground transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed text-foreground mb-2">
                        {idea.content}
                      </p>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1 h-1 rounded-full ${
                              i < idea.intensity
                                ? "bg-foreground"
                                : "bg-border"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          moveOutOfStorage(idea);
                          setIsStorageOpen(false);
                        }}
                        className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors whitespace-nowrap"
                      >
                        Move Out
                      </button>
                      <button
                        onClick={() => {
                          setEditingIdea(idea);
                          setInputValue(idea.content);
                          setIntensityValue(idea.intensity);
                          setIsStorageOpen(false);
                          setIsDialogOpen(true);
                        }}
                        className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteIdea(idea.id)}
                        className="text-xs uppercase tracking-wider text-muted hover:text-foreground transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="max-w-lg border-border bg-background p-12"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
            <Textarea
              placeholder="Enter your thought..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="min-h-32 text-base leading-relaxed border-none focus:ring-0 p-0 resize-none bg-transparent"
              autoFocus
            />

            <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
              <label className="text-xs uppercase tracking-wider text-muted-light">
                Intensity — {intensityValue}
              </label>
              <Slider
                value={[intensityValue]}
                onValueChange={(value) => setIntensityValue(value[0])}
                min={0}
                max={10}
                step={1}
                className="w-full"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div
            className="flex justify-end gap-4 mt-8 pt-8 border-t border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDialogOpen(false);
              }}
              className="text-sm uppercase tracking-wider text-muted hover:text-foreground transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                editingIdea ? updateIdea() : addIdea();
              }}
              className="text-sm uppercase tracking-wider px-8 py-3 bg-foreground text-background hover:bg-muted transition-all duration-300"
            >
              {editingIdea ? "Update" : "Add"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
