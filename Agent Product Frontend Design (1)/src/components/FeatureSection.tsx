import { motion, MotionValue, useTransform } from 'motion/react';
import { useRef } from 'react';

interface FeatureSectionProps {
  scrollProgress: MotionValue<number>;
  title: string;
  description: string;
  index: number;
}

export function FeatureSection({ scrollProgress, title, description, index }: FeatureSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Calculate scroll range for this section
  const start = 0.2 + (index * 0.15);
  const end = start + 0.15;
  
  const opacity = useTransform(scrollProgress, [start - 0.05, start, end, end + 0.05], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [start - 0.05, start, end], [100, 0, -50]);
  const scale = useTransform(scrollProgress, [start, end], [0.95, 1]);

  return (
    <section ref={sectionRef} className="min-h-screen flex items-center justify-center py-32 px-6">
      <motion.div
        style={{ opacity, y, scale }}
        className="max-w-4xl mx-auto text-center space-y-6"
      >
        {/* Abstract visual element */}
        <div className="mb-12 flex justify-center">
          {index === 2 ? (
            // Narrative Tree - Simple line art
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
          ) : (
            <AbstractVisual index={index} />
          )}
        </div>

        <h2 className="text-4xl tracking-tight max-w-2xl mx-auto">
          {title}
        </h2>
        
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          {description}
        </p>

        {/* Page indicator */}
        <div className="flex gap-2 justify-center pt-12">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === index ? 'bg-black' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function AbstractVisual({ index }: { index: number }) {
  const visuals = [
    // Ideas - Circles/spheres
    <svg key="ideas" width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
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
    </svg>,
    
    // Dialogue - Wave/conversation pattern
    <svg key="dialogue" width="300" height="200" viewBox="0 0 300 200" className="mx-auto">
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
  ];

  return visuals[index];
}