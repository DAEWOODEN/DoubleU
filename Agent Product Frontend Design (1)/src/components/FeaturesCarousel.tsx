import { motion, MotionValue, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';

interface Feature {
  title: string;
  description: string;
  visual: React.ReactNode;
}

interface FeaturesCarouselProps {
  scrollProgress: MotionValue<number>;
}

export function FeaturesCarousel({ scrollProgress }: FeaturesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout>();

  const features: Feature[] = [
    {
      title: "Ideas flow naturally",
      description: "Capture thoughts as they come.",
      visual: (
        <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
          <motion.circle
            cx="100"
            cy="100"
            r="60"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.circle
            cx="70"
            cy="80"
            r="40"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-gray-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.2, ease: "easeInOut" }}
          />
          <motion.circle
            cx="130"
            cy="90"
            r="35"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.4, ease: "easeInOut" }}
          />
          <circle cx="100" cy="100" r="2" fill="currentColor" className="text-black" />
        </svg>
      )
    },
    {
      title: "Conversations that dig deeper",
      description: "Questions equal to explorations.",
      visual: (
        <svg width="300" height="200" viewBox="0 0 300 200" className="mx-auto">
          <motion.path
            d="M 50 100 Q 100 50, 150 100 T 250 100"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M 50 120 Q 100 170, 150 120 T 250 120"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            className="text-gray-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.3, ease: "easeInOut" }}
          />
          <circle cx="150" cy="110" r="2" fill="currentColor" className="text-black" />
        </svg>
      )
    },
    {
      title: "Stories that resonate",
      description: "Comprehensive and vivid personal narrative.",
      visual: (
        <svg width="200" height="240" viewBox="0 0 200 240" className="mx-auto">
          {/* Main trunk */}
          <motion.line
            x1="100"
            y1="220"
            x2="100"
            y2="120"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
          
          {/* Lower left branch */}
          <motion.line
            x1="100"
            y1="140"
            x2="60"
            y2="120"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
          />
          
          {/* Lower right branch */}
          <motion.line
            x1="100"
            y1="140"
            x2="140"
            y2="120"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeInOut" }}
          />
          
          {/* Middle left branch */}
          <motion.line
            x1="100"
            y1="90"
            x2="50"
            y2="60"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
          />
          
          {/* Middle right branch */}
          <motion.line
            x1="100"
            y1="90"
            x2="150"
            y2="60"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-400"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeInOut" }}
          />
          
          {/* Top left branch */}
          <motion.line
            x1="100"
            y1="50"
            x2="70"
            y2="30"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.7, ease: "easeInOut" }}
          />
          
          {/* Top right branch */}
          <motion.line
            x1="100"
            y1="50"
            x2="130"
            y2="30"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-300"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7, delay: 0.8, ease: "easeInOut" }}
          />
          
          {/* Secondary branches - left */}
          <motion.line
            x1="50"
            y1="60"
            x2="35"
            y2="50"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-200"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.9, ease: "easeInOut" }}
          />
          
          {/* Secondary branches - right */}
          <motion.line
            x1="150"
            y1="60"
            x2="165"
            y2="50"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gray-200"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 1, ease: "easeInOut" }}
          />
          
          {/* Center point */}
          <circle cx="100" cy="100" r="1.5" fill="currentColor" className="text-black" />
        </svg>
      )
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % features.length);
      }, 5000); // Change slide every 5 seconds
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [features.length]);

  // Reset auto-play when user interacts
  const resetAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
    autoPlayRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % features.length);
    }, 5000);
  };

  // Handle dot click
  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    resetAutoPlay();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center justify-center py-32 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto text-center w-full">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2 }
            }}
            className="space-y-6"
          >
            {/* Abstract visual element */}
            <div className="mb-12 flex justify-center">
              {features[currentIndex].visual}
            </div>

            <h2 className="text-4xl tracking-tight max-w-2xl mx-auto">
              {features[currentIndex].title}
            </h2>
            
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              {features[currentIndex].description}
            </p>

            {/* Page indicator */}
            <div className="flex gap-2 justify-center pt-12">
              {features.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDotClick(i)}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                    i === currentIndex ? 'bg-black' : 'bg-gray-200'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}