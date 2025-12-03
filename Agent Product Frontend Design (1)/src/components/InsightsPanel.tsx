import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { api } from "../services/api";

export function InsightsPanel() {
  const [insights, setInsights] = useState<{
    ideaThemes: { theme: string; count: number }[];
    growthTrajectory: string;
    essayReadiness: number;
    nextSteps: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setIsLoading(true);
    try {
      const data = await api.getInsights();
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
      // Mock data for demo
      setInsights({
        ideaThemes: [
          { theme: "Education Technology", count: 5 },
          { theme: "Social Impact", count: 3 },
          { theme: "Personal Growth", count: 4 },
        ],
        growthTrajectory:
          "Your journey shows a clear progression from observation to action, with strong themes of using technology for social good.",
        essayReadiness: 75,
        nextSteps: [
          "Add more specific examples from your dialogue history",
          "Develop the narrative arc in your timeline",
          "Consider adding reflection on failures or challenges",
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed bottom-8 right-8 w-80 bg-background border border-border p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 bg-foreground rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-foreground rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-foreground rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Analyzing...
          </p>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-8 right-8 w-96 max-w-[calc(100%-4rem)] bg-background/95 backdrop-blur-sm border border-border shadow-lg overflow-hidden z-30"
    >
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="text-sm uppercase tracking-wider">AI Insights</h3>
        <button
          onClick={() => {
            const event = new CustomEvent('closeInsights');
            window.dispatchEvent(event);
          }}
          className="w-8 h-8 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300 flex items-center justify-center text-lg"
        >
          ×
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
        {/* Essay Readiness */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-muted-light">
              Essay Readiness
            </p>
            <p className="text-xl">{insights.essayReadiness}%</p>
          </div>
          <div className="w-full h-2 bg-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${insights.essayReadiness}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-foreground"
            />
          </div>
        </div>

        {/* Main Themes */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-light">
            Main Themes
          </p>
          <div className="space-y-2">
            {insights.ideaThemes.map((theme, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm">{theme.theme}</span>
                <span className="text-xs text-muted-light">{theme.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Trajectory */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-light">
            Growth Trajectory
          </p>
          <p className="text-sm leading-relaxed text-muted">
            {insights.growthTrajectory}
          </p>
        </div>

        {/* Next Steps */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-light">
            Suggested Next Steps
          </p>
          <ul className="space-y-2">
            {insights.nextSteps.map((step, idx) => (
              <li key={idx} className="text-sm leading-relaxed flex gap-2">
                <span className="text-muted-light">•</span>
                <span className="text-muted">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={loadInsights}
          className="w-full text-xs uppercase tracking-wider py-2 border border-border hover:border-foreground hover:bg-foreground hover:text-background transition-all duration-300"
        >
          Refresh Analysis
        </button>
      </div>
    </motion.div>
  );
}
