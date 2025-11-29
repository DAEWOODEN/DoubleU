import { useState, useEffect } from "react";
import { Resizable } from "re-resizable";
import { TopNavigation } from "./components/TopNavigation";
import { ProfileSetup } from "./components/ProfileSetup";
import { IdeaBubbles } from "./components/IdeaBubbles";
import { ChatSidebar } from "./components/ChatSidebar";
import { DocumentWorkspace } from "./components/DocumentWorkspace";
import { TimelineView } from "./components/TimelineView";
import { InsightsPanel } from "./components/InsightsPanel";
import { Toaster } from "./components/ui/sonner";
import { api } from "./services/api";

type ViewMode = "ideas" | "document" | "timeline";

interface ProfileData {
  targetUniversities: string;
  targetMajor: string;
  name: string;
  mbti: string;
  skill: string;
  hobby: string;
  idol: string;
  currentStatus: string;
  budget: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>("ideas");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [recentIdeas, setRecentIdeas] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Every page load = fresh start for each visitor
    // Clear all previous user data on load (including essays on refresh)
    console.log('Page loaded - resetting for fresh start');
    
    // Clear all user data from localStorage
    localStorage.clear();
    
    // Clear all sessionStorage (including essays - fresh start on page refresh)
    sessionStorage.clear();
    
    // Always start with profile setup for new visitors
    // Force reset state to ensure ProfileSetup renders
    setProfileComplete(false);

    // Listen for insights panel close event
    const handleCloseInsights = () => {
      setShowInsights(false);
    };
    window.addEventListener('closeInsights', handleCloseInsights);
    
    return () => {
      window.removeEventListener('closeInsights', handleCloseInsights);
    };
  }, []);

  // loadProfile function removed to prevent auto-loading of previous session data
  
  const handleProfileComplete = async (data: ProfileData) => {
    console.log("Profile data received:", data);
    localStorage.setItem("userProfile", JSON.stringify(data));
    
    // Try to save to backend, but don't block on failure
    try {
      await api.saveProfile(data);
      console.log("Profile saved to backend successfully");
    } catch (err) {
      console.error("Failed to save profile to backend:", err);
      // Continue anyway - local storage is saved
    }
    
    setProfileComplete(true);
  };

  if (!profileComplete) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-background">
        <ProfileSetup onComplete={handleProfileComplete} />
        <Toaster />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case "ideas":
        return <IdeaBubbles />;
      case "document":
        return <DocumentWorkspace />;
      case "timeline":
        return <TimelineView />;
      default:
        return <IdeaBubbles />;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      <TopNavigation
        currentView={currentView}
        onViewChange={setCurrentView}
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden mt-16 sm:mt-24 relative">
        {!isChatOpen ? (
          <main className="w-full overflow-hidden relative">
            {renderView()}
            
            {/* AI Insights Panel - shows on all views */}
            {showInsights && currentView !== "ideas" && <InsightsPanel />}
          </main>
        ) : (
          <>
            {/* Mobile: Full-screen chat */}
            <div className="sm:hidden w-full">
              <ChatSidebar 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)}
                recentIdeas={recentIdeas}
              />
            </div>

            {/* Desktop: Resizable split view */}
            <div className="hidden sm:flex w-full h-full">
              <Resizable
                defaultSize={{
                  width: '50%',
                  height: '100%',
                }}
                minWidth="30%"
                maxWidth="70%"
                enable={{
                  top: false,
                  right: true,
                  bottom: false,
                  left: false,
                  topRight: false,
                  bottomRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }}
                handleStyles={{
                  right: {
                    width: '8px',
                    right: '-4px',
                    backgroundColor: 'transparent',
                    zIndex: 10,
                  },
                }}
                handleComponent={{
                  right: (
                    <div className="w-full h-full flex items-center justify-center cursor-col-resize group">
                      <div className="w-px h-full bg-border group-hover:bg-foreground transition-colors" />
                    </div>
                  ),
                }}
                className="overflow-hidden relative"
              >
                <div className="w-full h-full overflow-hidden relative">
                  {renderView()}
                  
                  {/* AI Insights Panel - shows on all views */}
                  {showInsights && currentView !== "ideas" && <InsightsPanel />}
                </div>
              </Resizable>
              
              <div className="flex-1 overflow-hidden relative" style={{ marginTop: '-1px', height: 'calc(100% + 1px)' }}>
                <ChatSidebar 
                  isOpen={isChatOpen} 
                  onClose={() => setIsChatOpen(false)}
                  recentIdeas={recentIdeas}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* 设置按钮 - 左下角 */}
      <button
        onClick={() => setShowSettings(true)}
        className="fixed left-4 bottom-4 sm:left-8 sm:bottom-8 w-10 h-10 flex items-center justify-center hover:opacity-70 transition-opacity duration-300 z-[100] bg-background/80 backdrop-blur-sm border border-border/50 rounded shadow-lg"
        title="Settings"
        style={{ position: 'fixed', left: '1rem', bottom: '1rem' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-foreground">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 设置面板 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="bg-background border border-border p-6 sm:p-12 max-w-md w-full space-y-6 sm:space-y-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl tracking-tight">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 hover:text-muted transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Display Options
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInsights}
                    onChange={(e) => setShowInsights(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show Insights Panel</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChatOpen}
                    onChange={(e) => setIsChatOpen(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Show Dialogue Panel</span>
                </label>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Profile Management
                </label>
                <button
                  onClick={() => {
                    if (confirm('Edit your profile? This will restart the setup process.')) {
                      setProfileComplete(false);
                      setShowSettings(false);
                    }
                  }}
                  className="w-full text-sm uppercase tracking-wider px-6 py-3 border border-border hover:border-foreground transition-all duration-300"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    const profile = localStorage.getItem("userProfile");
                    if (profile) {
                      const data = JSON.parse(profile);
                      const info = `Name: ${data.name}\nUniversities: ${data.targetUniversities}\nMajor: ${data.targetMajor}\nStatus: ${data.currentStatus}\nIdol: ${data.idol}\nSkill: ${data.skill}\nHobby: ${data.hobby}\nBudget: ${data.budget}`;
                      alert(info);
                    }
                  }}
                  className="w-full text-sm uppercase tracking-wider px-6 py-3 border border-border hover:border-foreground transition-all duration-300"
                >
                  View Profile
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  Data Management
                </label>
                <button
                  onClick={() => {
                    const ideas = localStorage.getItem("ideas");
                    if (ideas) {
                      const count = JSON.parse(ideas).length;
                      alert(`Total Ideas: ${count}`);
                    }
                  }}
                  className="w-full text-sm uppercase tracking-wider px-6 py-3 border border-border hover:border-foreground transition-all duration-300"
                >
                  View Statistics
                </button>
                <button
                  onClick={() => {
                    if (confirm('Export all ideas as JSON?')) {
                      const ideas = localStorage.getItem("ideas");
                      if (ideas) {
                        const blob = new Blob([ideas], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'comchatx-ideas.json';
                        a.click();
                      }
                    }
                  }}
                  className="w-full text-sm uppercase tracking-wider px-6 py-3 border border-border hover:border-foreground transition-all duration-300"
                >
                  Export Ideas
                </button>
                <button
                  onClick={() => {
                    if (confirm('Clear all data including ideas, conversations, timeline, and essays? This will reset everything to initial state. This action cannot be undone.')) {
                      // Clear localStorage but preserve initialization flags
                      localStorage.removeItem("ideas");
                      localStorage.removeItem("timelineEvents");
                      localStorage.removeItem("conversationList");
                      localStorage.removeItem("conversations");
                      // Clear conversation titles
                      Object.keys(localStorage).forEach(key => {
                        if (key.startsWith("conv_title_")) {
                          localStorage.removeItem(key);
                        }
                        if (key.startsWith("conv_messages_")) {
                          localStorage.removeItem(key);
                        }
                      });
                      
                      // Remove initialization flags so sample data shows again
                      localStorage.removeItem("ideasInitialized");
                      localStorage.removeItem("timelineInitialized");
                      
                      // Reload to refresh and show sample data
                      window.location.reload();
                    }
                  }}
                  className="w-full text-sm uppercase tracking-wider px-6 py-3 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
                >
                  Clear All Data
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-wider text-muted-light">
                  About
                </label>
                <div className="text-sm text-muted space-y-1">
                  <p>ComChatX v1.1</p>
                  <p>AI-Powered Personal Statement Platform</p>
                  <p className="text-xs text-muted-light mt-2">
                    Powered by DoubleU
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-border">
              <button
                onClick={() => setShowSettings(false)}
                className="text-sm uppercase tracking-wider px-8 py-3 bg-foreground text-background hover:bg-muted transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  );
}
