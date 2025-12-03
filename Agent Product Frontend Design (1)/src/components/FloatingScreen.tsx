import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface FloatingScreenProps {
  children: ReactNode;
  rotation: number;
  scale: number;
  zIndex: number;
}

export function FloatingScreen({ children, rotation, scale, zIndex }: FloatingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      style={{
        transform: `perspective(1200px) rotateY(${rotation}deg) scale(${scale})`,
        zIndex,
      }}
      className="relative"
    >
      {/* Screen Container with 3D effect */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-white border border-gray-200">
        {/* Curved screen effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none z-10"
          style={{
            background: rotation !== 0 
              ? `linear-gradient(${rotation > 0 ? '90' : '270'}deg, rgba(255,255,255,0.3) 0%, transparent 50%)`
              : 'transparent'
          }}
        />
        
        {/* Content */}
        <div className="relative aspect-[4/5] w-full">
          {children}
        </div>
        
        {/* Subtle reflection at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
      </div>

      {/* Floating shadow */}
      <div 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/10 rounded-full blur-2xl"
        style={{
          transform: `translateX(-50%) scale(${scale})`,
        }}
      />
    </motion.div>
  );
}
