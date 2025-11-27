import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface ProfileData {
  targetUniversities: string;
  targetMajor: string;
  name: string;
  mbti: string;
  skill: string;
  hobby: string;
}

interface ProfileSetupProps {
  onComplete: (data: ProfileData) => void;
}

export function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<ProfileData>({
    targetUniversities: "",
    targetMajor: "",
    name: "",
    mbti: "",
    skill: "",
    hobby: "",
  });
  // Add local input value state to ensure clean input for each question
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
      id: "name",
      label: "Name",
      placeholder: "",
      type: "input" as const,
    },
    {
      id: "mbti",
      label: "MBTI",
      placeholder: "",
      type: "input" as const,
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
  ];

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  // Reset input value when step changes
  useEffect(() => {
    // Get the saved value for current question, or start with empty
    const savedValue = profile[currentQuestion.id as keyof ProfileData];
    setCurrentInputValue(savedValue || "");
  }, [step, currentQuestion.id]);

  const handleNext = () => {
    // Save current input value to profile before moving to next step
    if (currentInputValue.trim().length > 0) {
      setProfile({
        ...profile,
        [currentQuestion.id]: currentInputValue.trim(),
      });
    }
    
    if (step < questions.length - 1) {
      setStep(step + 1);
      // Clear input for next question - useEffect will handle this
    } else {
      console.log("Completing profile setup with:", profile);
      onComplete(profile);
    }
  };

  const handleBack = () => {
    // Save current input value before going back
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
    // Also update profile in real-time
    setProfile({
      ...profile,
      [currentQuestion.id]: value,
    });
  };

  const canProceed = currentInputValue.trim().length > 0;

  return (
    <div className="h-full flex items-center justify-center bg-background p-16">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mb-16">
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
            <h2 className="text-3xl mb-12">{currentQuestion.label}</h2>

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
