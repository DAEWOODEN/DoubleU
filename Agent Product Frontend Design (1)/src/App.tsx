import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { HeroSection } from './components/HeroSection';
import { FeaturesCarousel } from './components/FeaturesCarousel';
import { ProcessSection } from './components/ProcessSection';
import { CTASection } from './components/CTASection';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="tracking-tight font-[Homemade_Apple] font-bold text-[32px] text-center not-italic">ComChatX</div>
          <button className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-800 transition-colors">
            Sign up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection scrollProgress={smoothProgress} />

      {/* Feature Sections */}
      <FeaturesCarousel scrollProgress={smoothProgress} />

      {/* Process Visualization */}
      <ProcessSection scrollProgress={smoothProgress} />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center text-gray-400 text-sm">
          ComChatX — Your story, guided by conversation.
        </div>
      </footer>
    </div>
  );
}