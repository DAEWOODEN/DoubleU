import { motion, MotionValue, useTransform } from 'motion/react';
import { FloatingScreen } from './FloatingScreen';

interface HeroSectionProps {
  scrollProgress: MotionValue<number>;
}

export function HeroSection({ scrollProgress }: HeroSectionProps) {
  // Transform values for screens as user scrolls
  const leftScreenX = useTransform(scrollProgress, [0, 0.2], [0, -100]);
  const rightScreenX = useTransform(scrollProgress, [0, 0.2], [0, 100]);
  const centerScreenScale = useTransform(scrollProgress, [0, 0.2], [1, 0.9]);
  const heroOpacity = useTransform(scrollProgress, [0, 0.15, 0.2], [1, 0.5, 0]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-32 overflow-hidden">
      <motion.div 
        style={{ opacity: heroOpacity }}
        className="w-full max-w-7xl mx-auto px-6"
      >
        {/* Floating Screens Container */}
        <div className="relative h-[500px] mb-16">
          {/* Left Screen - IDEAS */}
          <motion.div
            style={{ x: leftScreenX }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[280px]"
          >
            <FloatingScreen
              rotation={-15}
              scale={0.85}
              zIndex={1}
            >
              <IdeasPreview />
            </FloatingScreen>
          </motion.div>

          {/* Center Screen - DIALOGUE */}
          <motion.div
            style={{ scale: centerScreenScale }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px]"
          >
            <FloatingScreen
              rotation={0}
              scale={1}
              zIndex={2}
            >
              <DialoguePreview />
            </FloatingScreen>
          </motion.div>

          {/* Right Screen - ESSAY */}
          <motion.div
            style={{ x: rightScreenX }}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-[280px]"
          >
            <FloatingScreen
              rotation={15}
              scale={0.85}
              zIndex={1}
            >
              <EssayPreview />
            </FloatingScreen>
          </motion.div>
        </div>

        {/* Hero Text */}
        <div className="text-center space-y-8 max-w-2xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-5xl tracking-tight"
          >
            Introducing ComChatX
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="text-gray-500 text-lg"
          >
            Deeper self-awareness, better self-expression
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
}

// Preview Components for each screen
function IdeasPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
      <div className="space-y-4 w-full">
        <div className="flex gap-3 flex-wrap">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="w-20 h-20 rounded-full bg-black/5 border border-black/10 flex items-center justify-center"
          >
            <div className="text-xs text-center px-2">Moving to NYC</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 }}
            className="w-20 h-20 rounded-full bg-black/5 border border-black/10 flex items-center justify-center"
          >
            <div className="text-xs text-center px-2">Chess club</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="w-20 h-20 rounded-full bg-black/5 border border-black/10 flex items-center justify-center"
          >
            <div className="text-xs text-center px-2">First code</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6 }}
            className="w-20 h-20 rounded-full bg-black/5 border border-black/10 flex items-center justify-center"
          >
            <div className="text-xs text-center px-2">AI tools</div>
          </motion.div>
        </div>
        <div className="text-xs text-gray-400 text-center">IDEAS</div>
      </div>
    </div>
  );
}

function DialoguePreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 p-8 flex flex-col justify-center">
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-black/5 rounded-2xl p-4 max-w-[80%]"
        >
          <div className="text-sm">What made that moment significant for you?</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-black text-white rounded-2xl p-4 max-w-[80%] ml-auto"
        >
          <div className="text-sm">I realized I could create something from nothing...</div>
        </motion.div>
        <div className="text-xs text-gray-400 text-center mt-6">DIALOGUE</div>
      </div>
    </div>
  );
}

function EssayPreview() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Narrative Tree - Vertical growth */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="relative flex flex-col items-center"
        >
          {/* Top branches and nodes */}
          <div className="relative mb-4">
            {/* Left branch - EXPERIENCE */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="absolute -left-24 top-0 flex flex-col items-center gap-2"
            >
              <div className="w-2.5 h-2.5 bg-gray-400 transform rotate-45"></div>
              <div className="text-[8px] text-gray-400 tracking-wider whitespace-nowrap">EXPERIENCE</div>
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="absolute -left-20 top-1 w-16 h-px bg-black/20 origin-right"
              style={{ transform: 'rotate(-25deg)' }}
            />
            
            {/* Right branch - INSIGHT */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className="absolute -right-20 top-2 flex flex-col items-center gap-2"
            >
              <div className="w-2.5 h-2.5 border border-gray-400 transform rotate-45"></div>
              <div className="text-[8px] text-gray-400 tracking-wider whitespace-nowrap">INSIGHT</div>
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              className="absolute -right-16 top-3 w-14 h-px bg-black/20 origin-left"
              style={{ transform: 'rotate(25deg)' }}
            />
          </div>

          {/* Main trunk - upper section */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="w-px h-20 bg-gradient-to-b from-black/40 to-black/30 origin-top"
          />

          {/* Middle branches and nodes */}
          <div className="relative my-2">
            {/* Left branch - ACHIEVEMENT */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute -left-28 top-0 flex flex-col items-center gap-2"
            >
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
              <div className="text-[8px] text-gray-400 tracking-wider whitespace-nowrap">ACHIEVEMENT</div>
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.4, duration: 0.4 }}
              className="absolute -left-24 top-1 w-20 h-px bg-black/20 origin-right"
              style={{ transform: 'rotate(-30deg)' }}
            />
            
            {/* Right branch - REFLECTION */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.6, duration: 0.5 }}
              className="absolute -right-24 top-2 flex flex-col items-center gap-2"
            >
              <div className="w-2.5 h-2.5 border border-gray-400 rounded-full"></div>
              <div className="text-[8px] text-gray-400 tracking-wider whitespace-nowrap">REFLECTION</div>
            </motion.div>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 1.5, duration: 0.4 }}
              className="absolute -right-20 top-3 w-18 h-px bg-black/20 origin-left"
              style={{ transform: 'rotate(30deg)' }}
            />
          </div>

          {/* Main trunk - lower section */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="w-0.5 h-16 bg-gradient-to-b from-black/30 to-black/50 origin-top"
          />

          {/* Root base */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.85, duration: 0.4 }}
            className="flex gap-1"
          >
            <div className="w-3 h-px bg-black/40" style={{ transform: 'rotate(-35deg)', transformOrigin: 'right' }}></div>
            <div className="w-3 h-px bg-black/40" style={{ transform: 'rotate(35deg)', transformOrigin: 'left' }}></div>
          </motion.div>
        </motion.div>
        
        <div className="text-xs text-gray-400 text-center mt-8">NARRATIVE</div>
      </div>
    </div>
  );
}