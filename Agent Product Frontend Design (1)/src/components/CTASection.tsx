import { motion } from 'motion/react';

export function CTASection() {
  return (
    <section className="min-h-screen flex items-center justify-center py-32 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-3xl mx-auto text-center space-y-12"
      >
        <div className="space-y-6">
          <h2 className="text-5xl tracking-tight">
            Start your story
          </h2>
          
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Your ideas stay private,your story permits polish.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <a 
            href="https://www.comchatx.icu/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-black text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-colors text-lg"
          >
            Let's start
          </a>
          
          <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-full hover:border-gray-400 transition-colors text-lg">
            Learn more
          </button>
        </div>

        <div className="pt-12 space-y-2 text-sm text-gray-400">
          <p></p>
        </div>
      </motion.div>
    </section>
  );
}