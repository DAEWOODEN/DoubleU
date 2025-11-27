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
    <nav className="fixed top-0 left-0 right-0 h-16 sm:h-24 border-b border-border bg-background/95 backdrop-blur-sm z-50 flex items-center justify-between px-4 sm:px-16">
      <h1 className="text-lg sm:text-2xl tracking-tight" style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, letterSpacing: '-0.03em' }}>
        ComChat<span style={{ fontWeight: 600 }}>X</span>
      </h1>

      <div className="absolute left-1/2 -translate-x-1/2 hidden sm:flex items-center gap-8 lg:gap-12">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "text-xs sm:text-sm tracking-wider transition-all duration-300 uppercase relative pb-1",
              currentView === item.id
                ? "text-foreground"
                : "text-muted-light hover:text-muted"
            )}
          >
            {item.label}
            {currentView === item.id && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Mobile navigation menu */}
      <div className="absolute left-1/2 -translate-x-1/2 sm:hidden flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={cn(
              "text-xs px-2 py-1 rounded transition-all duration-300 uppercase",
              currentView === item.id
                ? "text-foreground bg-muted/30"
                : "text-muted-light"
            )}
          >
            {item.label.split(' ')[0]}
          </button>
        ))}
      </div>

      <button
        onClick={onToggleChat}
        className={cn(
          "text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 px-3 sm:px-6 py-1 sm:py-2 border",
          isChatOpen
            ? "border-foreground text-foreground"
            : "border-border text-muted hover:border-muted"
        )}
      >
        <span className="sm:inline">Chat</span>
        <span className="sm:hidden">💬</span>
      </button>
    </nav>
  );
}
