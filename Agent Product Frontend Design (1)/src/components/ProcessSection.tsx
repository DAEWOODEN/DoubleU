import { motion, MotionValue, useTransform } from 'motion/react';

interface ProcessSectionProps {
  scrollProgress: MotionValue<number>;
}

export function ProcessSection({ scrollProgress }: ProcessSectionProps) {
  const opacity = useTransform(scrollProgress, [0.65, 0.7, 0.85, 0.9], [0, 1, 1, 0]);
  const scale = useTransform(scrollProgress, [0.65, 0.7], [0.9, 1]);

  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-6">
      <motion.div
        style={{ opacity, scale }}
        className="max-w-5xl mx-auto text-center"
      >
        {/* Flow Diagram */}
        <div className="mb-16">
          <FlowDiagram />
        </div>

        <h2 className="text-4xl tracking-tight mb-6">
          From scattered thoughts to polished essays
        </h2>
        
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Honors your authentic voice while crafting narratives that readers remember.
        </p>
      </motion.div>
    </section>
  );
}

function FlowDiagram() {
  return (
    <svg width="1000" height="300" viewBox="0 0 1000 300" className="mx-auto max-w-full h-auto">
      {/* Connection lines */}
      <motion.path
        d="M 150 150 Q 225 150, 300 150"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        fill="none"
        className="text-gray-300"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M 400 150 Q 500 150, 550 150"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        fill="none"
        className="text-gray-300"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
      />
      <motion.path
        d="M 650 150 Q 750 150, 800 150"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="4 4"
        fill="none"
        className="text-gray-300"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.5, ease: "easeInOut" }}
      />

      {/* Node 1 - IDEAS */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <circle cx="100" cy="150" r="50" stroke="currentColor" strokeWidth="0.5" fill="white" className="text-gray-300" />
        <text x="100" y="155" textAnchor="middle" className="text-xs fill-gray-600">IDEAS</text>
      </motion.g>

      {/* Node 2 - DIALOGUE */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <circle cx="350" cy="150" r="50" stroke="currentColor" strokeWidth="0.5" fill="white" className="text-gray-400" />
        <text x="350" y="155" textAnchor="middle" className="text-xs fill-gray-600">DIALOGUE</text>
      </motion.g>

      {/* Node 3 - NARRATIVE */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.6 }}
      >
        <circle cx="600" cy="150" r="50" stroke="currentColor" strokeWidth="0.5" fill="white" className="text-gray-400" />
        <text x="600" y="155" textAnchor="middle" className="text-xs fill-gray-600">NARRATIVE</text>
      </motion.g>

      {/* Node 4 - ESSAY */}
      <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
      >
        <circle cx="850" cy="150" r="50" stroke="currentColor" strokeWidth="0.5" fill="white" className="text-black" />
        <text x="850" y="155" textAnchor="middle" className="text-xs fill-gray-900">ESSAY</text>
      </motion.g>

      {/* Central dot */}
      <motion.circle
        cx="500"
        cy="150"
        r="3"
        fill="currentColor"
        className="text-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      />
    </svg>
  );
}