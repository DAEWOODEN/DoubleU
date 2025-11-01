// Mock data and helpers for development when backend is not available

export const MOCK_RESPONSES = {
  socraticQuestions: [
    "What experiences have shaped your perspective most profoundly?",
    "Can you describe a moment when you realized the importance of your chosen field?",
    "How do you envision using your skills to create meaningful change?",
    "What challenges have you faced that revealed your core values?",
    "Tell me about a time when failure taught you something valuable.",
    "What connects your past experiences to your future aspirations?",
    "How has your background influenced your approach to problem-solving?",
    "What does success mean to you beyond academic or professional achievement?",
  ],
  
  conversationResponses: [
    "That's a fascinating perspective. Can you elaborate on what drew you to that realization?",
    "I sense there's a deeper meaning here. What was going through your mind at that moment?",
    "This connects beautifully with what you mentioned earlier. How do you see these experiences shaping your future?",
    "It sounds like this was a pivotal moment. What did you learn about yourself?",
    "That's powerful. How has this insight influenced your decisions since then?",
    "I'm curious about the emotions you felt during that experience. Can you describe them?",
  ],

  ideaAnalysis: {
    themes: [
      "Education Technology",
      "Social Impact",
      "Personal Growth",
      "Innovation",
      "Community Building",
      "Cross-cultural Understanding",
    ],
    connections: [
      "This connects to your volunteer experience",
      "Relates to your passion for technology",
      "Builds on your teaching background",
      "Reflects your commitment to accessibility",
    ],
  },

  narrativeSuggestions: [
    {
      category: "experience",
      title: "The Turning Point",
      description: "When observation transformed into action",
    },
    {
      category: "insight",
      title: "Understanding Inequality",
      description: "Recognizing systemic challenges through direct experience",
    },
    {
      category: "achievement",
      title: "First User Feedback",
      description: "The moment when impact became tangible",
    },
  ],
};

export function getRandomSocraticQuestion(): string {
  return MOCK_RESPONSES.socraticQuestions[
    Math.floor(Math.random() * MOCK_RESPONSES.socraticQuestions.length)
  ];
}

export function getRandomResponse(): string {
  return MOCK_RESPONSES.conversationResponses[
    Math.floor(Math.random() * MOCK_RESPONSES.conversationResponses.length)
  ];
}

export function simulateTypingDelay(text: string): Promise<void> {
  const wordsPerMinute = 300;
  const words = text.split(' ').length;
  const milliseconds = (words / wordsPerMinute) * 60 * 1000;
  return new Promise(resolve => setTimeout(resolve, Math.min(milliseconds, 2000)));
}

export function chunkText(text: string, chunkSize: number = 10): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  
  return chunks;
}
