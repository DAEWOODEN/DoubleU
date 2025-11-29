import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Input } from "./ui/input";

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

interface ProfileSetupProps {
  onComplete: (data: ProfileData) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    targetUniversities: "",
    targetMajor: "",
    name: "Student", // Default value as we don't ask for it anymore
    mbti: "", // Default value
    skill: "",
    hobby: "",
    idol: "",
    currentStatus: "",
    budget: "",
  });
  
  const [currentInputValue, setCurrentInputValue] = useState("");

  const questions = [
    {
      id: "targetUniversities",
      label: "Target Universities",
      placeholder: "Stanford, MIT, Harvard...",
      type: "input" as const,
    },
    {
      id: "targetMajor",
      label: "Target Major",
      placeholder: "Computer Science, Biology, Economics...",
      type: "input" as const,
    },
    {
      id: "idol",
      label: "Your Idol",
      placeholder: "Who inspires you?",
      type: "input" as const,
    },
    {
      id: "currentStatus",
      label: "Your Current Status",
      placeholder: "",
      type: "select" as const,
      options: [
        "High school student",
        "Undergraduate student",
        "Undergraduate graduate",
        "Graduate student",
        "On job / Gap"
      ]
    },
    {
      id: "skill",
      label: "Skill",
      placeholder: "One thing you excel at most",
      type: "input" as const,
    },
    {
      id: "hobby",
      label: "Hobby",
      placeholder: "One thing you love most",
      type: "input" as const,
    },
    {
      id: "budget",
      label: "Your Budget",
      placeholder: "Maximum amount to be spent",
      type: "input" as const,
    },
  ];

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  // Reset input value when step changes
  useEffect(() => {
    const savedValue = profile[currentQuestion.id as keyof ProfileData];
    setCurrentInputValue(savedValue || "");
  }, [step, currentQuestion.id]);

  const handleNext = () => {
    if (currentInputValue.trim().length > 0) {
      const updatedProfile = {
        ...profile,
        [currentQuestion.id]: currentInputValue.trim(),
      };
      setProfile(updatedProfile);
      
      if (step < questions.length - 1) {
        setStep(step + 1);
      } else {
        console.log("Completing profile setup with:", updatedProfile);
        onComplete(updatedProfile);
      }
    }
  };

  const handleBack = () => {
    if (currentInputValue.trim().length > 0) {
      setProfile({
        ...profile,
        [currentQuestion.id]: currentInputValue.trim(),
      });
    }
    
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const updateProfile = (value: string) => {
    setCurrentInputValue(value);
    setProfile({
      ...profile,
      [currentQuestion.id]: value,
    });
  };

  const canProceed = currentInputValue.trim().length > 0;

  return (
    <div className="h-full flex items-center justify-center bg-background p-4 sm:p-16">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-12 sm:mb-16">
            <div className="h-px bg-border mb-4">
              <motion.div
                className="h-full bg-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-light">
              {step + 1} of {questions.length}
            </p>
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-3xl sm:text-4xl mb-8 sm:mb-12">{currentQuestion.label}</h2>

            {currentQuestion.type === "select" ? (
              <div className="grid gap-3">
                {currentQuestion.options?.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      updateProfile(option);
                      // Optional: Auto-advance on selection
                      // setTimeout(handleNext, 200); 
                    }}
                    className={`text-left px-6 py-4 border transition-all duration-300 text-lg
                      ${currentInputValue === option 
                        ? "border-foreground bg-foreground text-background" 
                        : "border-border hover:border-foreground/50 text-muted hover:text-foreground"
                      }
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <Input
                key={currentQuestion.id}
                value={currentInputValue}
                onChange={(e) => updateProfile(e.target.value)}
                placeholder={currentQuestion.placeholder}
                className="text-lg py-6 border-border focus:border-foreground bg-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canProceed) {
                    handleNext();
                  }
                }}
              />
            )}
          </motion.div>

          <div className="flex justify-between items-center mt-16">
            <button
              onClick={handleBack}
              disabled={step === 0}
              className="text-sm uppercase tracking-wider text-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors duration-300"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="text-sm uppercase tracking-wider px-12 py-4 bg-foreground text-background hover:bg-muted disabled:bg-border disabled:text-muted-light transition-all duration-300"
            >
              {step === questions.length - 1 ? "Begin" : "Next"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
