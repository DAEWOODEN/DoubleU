import { cn } from "./ui/utils";

type ViewMode = "ideas" | "document" | "timeline" | "settings";

interface TopNavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
}

export function TopNavigation({
  currentView,
  onViewChange,
  isChatOpen,
  onToggleChat,
}: TopNavigationProps) {
  const navItems = [
    { id: "ideas" as ViewMode, label: "Ideas" },
    { id: "document" as ViewMode, label: "Personal Statement" },
    { id: "timeline" as ViewMode, label: "Narrative" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-24 border-b border-border bg-background/80 backdrop-blur-sm z-50 flex items-center justify-between px-16">
      <h1 className="text-2xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, letterSpacing: '-0.03em' }}>
        ComChat<span style={{ fontWeight: 600 }}>X</span>
      </h1>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-12">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "text-sm tracking-wider transition-all duration-300 uppercase relative",
              currentView === item.id
                ? "text-foreground"
                : "text-muted-light hover:text-muted"
            )}
          >
            {item.label}
            {currentView === item.id && (
              <span className="absolute -bottom-1 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={onToggleChat}
        className={cn(
          "text-sm uppercase tracking-wider transition-all duration-300 px-6 py-2 border",
          isChatOpen
            ? "border-foreground text-foreground"
            : "border-border text-muted hover:border-muted"
        )}
      >
        Chat
      </button>
    </nav>
  );
}
