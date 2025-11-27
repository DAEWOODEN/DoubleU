"""
Multi-Agent System Core Implementation
Using AutoGen framework for agent orchestration
"""

import json
import asyncio
from typing import List, Dict, Any, Optional, AsyncGenerator
from datetime import datetime
from loguru import logger

from autogen import ConversableAgent, GroupChat, GroupChatManager
from config import settings
from llm_clients import get_deepseek_client, get_minimax_client
from .prompts import (
    GLOBAL_AGENT_PROMPT,
    COLLECTOR_AGENT_PROMPT,
    ANALYZER_AGENT_PROMPT,
    GUIDE_AGENT_PROMPT,
    QUERY_AGENT_PROMPT,
    NARRATOR_AGENT_PROMPT,
    WRITER_AGENT_PROMPT,
    AUDIT_AGENT_PROMPT,
    get_major_agent_prompt,
)


class MultiAgentSystem:
    """
    Central Multi-Agent System for ComChatX
    Orchestrates Global Agent and all SubAgents
    """
    
    def __init__(self):
        self.deepseek_client = get_deepseek_client()
        self.minimax_client = get_minimax_client()
        
        # Agent state
        self.agents: Dict[str, Any] = {}
        self.conversation_context: Dict[str, Any] = {}  # Store recent conversation history for context
        self.user_profile: Dict[str, Any] = {}
        self.ideas_buffer: List[Dict] = []
        self.analysis_reports: List[Dict] = []
        # Dynamic Major Agents - dynamically created when major field is detected
        self.major_agents: Dict[str, Dict[str, Any]] = {}  # {major_name: {prompt, created_at, usage_count}}
        
        # Initialize agents
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize all core agents"""
        # We'll use a simpler approach instead of full AutoGen
        # Due to complexity of AutoGen setup, we'll create a custom orchestration
        logger.info("Initializing Multi-Agent System...")
        
        self.agents = {
            "global": {"name": "Global Supervisor", "prompt": GLOBAL_AGENT_PROMPT},
            "collector": {"name": "Collector", "prompt": COLLECTOR_AGENT_PROMPT},
            "analyzer": {"name": "Analyzer", "prompt": ANALYZER_AGENT_PROMPT},
            "guide": {"name": "Guide", "prompt": GUIDE_AGENT_PROMPT},
            "query": {"name": "Query", "prompt": QUERY_AGENT_PROMPT},
            "narrator": {"name": "Narrator", "prompt": NARRATOR_AGENT_PROMPT},
            "writer": {"name": "Writer", "prompt": WRITER_AGENT_PROMPT},
            "audit": {"name": "Audit", "prompt": AUDIT_AGENT_PROMPT},
        }
        
        logger.info(f" Initialized {len(self.agents)} core agents")
    
    async def process_user_message(
        self,
        message: str,
        conversation_id: str,
        user_context: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """
        Process user message through Multi-Agent system
        Returns assistant response with metadata
        """
        try:
            # Update conversation context for variety
            if conversation_id not in self.conversation_context:
                self.conversation_context[conversation_id] = {"recent_messages": []}
            
            # Store recent messages for context (max 5)
            recent_messages = self.conversation_context[conversation_id].get("recent_messages", [])
            recent_messages.append({"role": "user", "content": message})
            if len(recent_messages) > 5:
                recent_messages = recent_messages[-5:]
            self.conversation_context[conversation_id]["recent_messages"] = recent_messages
            
            # Step 1: Collector - Extract and categorize information
            # Pass user_profile to collector for context-aware collection
            profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
            collected_data = await self._run_collector(message, profile_data if profile_data else None)
            
            # Step 2: Update context
            if user_context:
                self.user_profile.update(user_context)
            
            # Step 3: Determine response strategy
            # Check if we need analysis
            self.ideas_buffer.append(collected_data)
            
            should_analyze = len(self.ideas_buffer) >= 5
            
            if should_analyze:
                # Run analyzer with profile context
                profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
                analysis = await self._run_analyzer(self.ideas_buffer, profile_data if profile_data else None)
                self.analysis_reports.append(analysis)
                
                # Generate guided questions based on analysis
                response = await self._run_guide(analysis)
                agent_type = "guide"
            else:
                # Normal conversational response from Global Agent
                response = await self._run_global_agent(message, conversation_id)
                agent_type = "guide"
            
            # Store assistant response in context
            recent_messages = self.conversation_context[conversation_id].get("recent_messages", [])
            recent_messages.append({"role": "assistant", "content": response})
            if len(recent_messages) > 5:
                recent_messages = recent_messages[-5:]
            self.conversation_context[conversation_id]["recent_messages"] = recent_messages
            
            return {
                "content": response,
                "agent_type": agent_type,
                "collected_data": collected_data,
                "analysis_triggered": should_analyze,
            }
            
        except Exception as e:
            logger.error(f"Error in process_user_message: {e}", exc_info=True)
            return {
                "content": "I apologize, but I encountered an error. Could you rephrase that?",
                "agent_type": "system",
                "error": str(e),
            }
    
    async def stream_user_message(
        self,
        message: str,
        conversation_id: str,
        user_context: Dict[str, Any] = None,
    ) -> AsyncGenerator[str, None]:
        """
        Stream response from Multi-Agent system with enhanced context
        """
        try:
            # Update conversation context for variety
            if conversation_id not in self.conversation_context:
                self.conversation_context[conversation_id] = {"recent_messages": []}
            
            # Store recent messages for context (max 5)
            recent_messages = self.conversation_context[conversation_id].get("recent_messages", [])
            recent_messages.append({"role": "user", "content": message})
            if len(recent_messages) > 5:
                recent_messages = recent_messages[-5:]
            self.conversation_context[conversation_id]["recent_messages"] = recent_messages
            
            # Update user context if provided
            if user_context:
                self.user_profile.update(user_context)
            
            # Quick collection in background (non-blocking for stream)
            profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
            # Don't await collector for streaming - do it in background
            asyncio.create_task(self._run_collector(message, profile_data if profile_data else None))
            
            # Stream response from Global Agent
            full_response = ""
            async for chunk in self._stream_global_agent(message, conversation_id):
                full_response += chunk
                yield chunk
            
            # Store assistant response in context after streaming completes
            if full_response:
                recent_messages = self.conversation_context[conversation_id].get("recent_messages", [])
                recent_messages.append({"role": "assistant", "content": full_response})
                if len(recent_messages) > 5:
                    recent_messages = recent_messages[-5:]
                self.conversation_context[conversation_id]["recent_messages"] = recent_messages
                
        except Exception as e:
            logger.error(f"Error in stream_user_message: {e}")
            # Even error messages should be varied
            fallbacks = [
                "I apologize, but I encountered an error processing your message.",
                "Hmm, something went wrong there. Could you try rephrasing?",
                "I'm having a bit of trouble with that. Let's try again?",
                "Oops, that didn't process correctly. Can you share that again?",
            ]
            import random
            import time
            random.seed(int(time.time() * 1000) % 10000)
            yield random.choice(fallbacks)
    
    async def request_socratic_question(
        self,
        recent_ideas: List[str],
        conversation_history: List[Dict],
    ) -> str:
        """
        Initiative Communication - AI proactively engages based on user context
        Uses actual LLM to generate intelligent, context-aware questions
        """
        try:
            conversation_length = len(conversation_history)
            
            # Build context from recent conversation
            recent_context = ""
            if conversation_history and len(conversation_history) > 0:
                recent_messages = conversation_history[-3:]  # Last 3 messages
                recent_context = "\n".join([
                    f"{msg.get('role', 'user')}: {msg.get('content', '')[:150]}..."
                    for msg in recent_messages
                ])
            
            # Build context from recent ideas
            ideas_context = ""
            if recent_ideas and len(recent_ideas) > 0:
                ideas_context = "Recent user ideas: " + ", ".join(recent_ideas[:5])
            
            # Build context from user profile - natural narrative format
            profile_context = ""
            profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
            if profile_data:
                # Build a natural narrative about the user instead of listing fields
                profile_parts = []
                if profile_data.get('targetMajor') and profile_data.get('targetMajor', '').strip():
                    major = profile_data.get('targetMajor', '').strip()
                    profile_parts.append(f"interested in {major}")
                if profile_data.get('skill') and profile_data.get('skill', '').strip():
                    skill = profile_data.get('skill', '').strip()
                    profile_parts.append(f"excel at {skill}")
                if profile_data.get('hobby') and profile_data.get('hobby', '').strip():
                    hobby = profile_data.get('hobby', '').strip()
                    profile_parts.append(f"enjoys {hobby}")
                
                if profile_parts:
                    profile_context = f"""Background context: The user is {', '.join(profile_parts)}. Use this understanding naturally in your questions, but DO NOT directly mention field names or use phrases like "interest in [Major]". Instead, integrate this knowledge organically into the conversation - ask about experiences related to these interests in a natural, conversational way."""
            
            # Determine conversation stage
            if conversation_length < 3:
                stage = "initial_exploration"
                instruction = "Start with a warm, open-ended question that invites the user to share a recent meaningful experience. Be specific and relatable."
            elif conversation_length < 8:
                stage = "deepening"
                instruction = "Based on what the user shared, ask about specific details, feelings, or moments. Help them explore the significance of their experience."
            elif conversation_length < 15:
                stage = "connecting"
                instruction = "Help the user connect their experiences. Ask how different moments relate, or what patterns they notice in their journey."
            else:
                stage = "future_oriented"
                instruction = "Guide the user to reflect on how their experiences shape their future goals and aspirations."
            
            # Enhanced prompt for variety and uniqueness
            import random
            import time
            seed = int(time.time()) % 10000
            
            # Vary the prompt style to encourage different responses
            style_variations = [
                "Generate ONE natural, conversational question (max 25 words)",
                "Create ONE warm, engaging question (max 25 words)",
                "Craft ONE thoughtful, inviting question (max 25 words)",
                "Formulate ONE genuine, curious question (max 25 words)",
            ]
            prompt_start = random.choice(style_variations)
            
            prompt = f"""{prompt_start} that:
- Is UNIQUE and different from previous questions
- Invites sharing a recent experience
- Feels like a friend asking, not an interview
- Avoids mentioning field names or labels
- Focuses on feelings or moments
- Uses different phrasing than before (avoid repetition)

{instruction}

Context: {recent_context[:100] if recent_context else "Beginning of conversation"} {ideas_context[:50] if ideas_context else ""}

IMPORTANT: Make this question DIFFERENT and UNIQUE. Vary your wording. Avoid repetitive phrases.
Question:"""

            messages = [
                {"role": "system", "content": "You are a warm, conversational friend asking thoughtful questions."},
                {"role": "user", "content": prompt}
            ]
            
            # Use shorter timeout and fewer tokens for faster response
            try:
                # Increase temperature for more variety and randomness
                # Add randomness seed based on timestamp to ensure variety
                import random
                import time
                random_seed = int(time.time()) % 10000
                
                # Use even higher temperature for maximum variety in questions
                temperature = random.uniform(1.2, 1.4)  # Higher temperature for more creativity
                
                response = await asyncio.wait_for(
                    self.deepseek_client.chat_completion(
                        messages=messages,
                        temperature=temperature,  # Higher temperature for maximum variety
                        max_tokens=100,  # Increased to allow more creative questions
                    ),
                    timeout=10.0  # 10 second timeout - faster fallback
                )
                question = response["choices"][0]["message"]["content"].strip()
                # Clean up any quotation marks
                question = question.strip('"\'').strip()
                
                # Validate response
                if not question or len(question) < 10:
                    raise ValueError("Invalid response from LLM")
                    
                return question
                
            except (asyncio.TimeoutError, Exception) as e:
                logger.warning(f"Initiative Communication error ({type(e).__name__}), using fallback: {e}")
                # Diverse fallback questions based on conversation stage - ensure variety
                import random
                random.seed(int(time.time() * 1000) % 10000)
                
                if conversation_length < 3:
                    fallbacks = [
                        "What's a moment from the past week that stuck with you?",
                        "Tell me about something that surprised you recently.",
                        "What's been on your mind lately?",
                        "Can you share a recent experience that felt meaningful?",
                        "What caught your attention in the past few days?",
                    ]
                    return random.choice(fallbacks)
                elif conversation_length < 8:
                    fallbacks = [
                        "That's interesting. What details stood out to you most?",
                        "I'm curious - what made that experience significant for you?",
                        "Can you describe what that moment felt like?",
                        "What thoughts came to mind during that experience?",
                        "How did that make you feel at the time?",
                    ]
                    return random.choice(fallbacks)
                else:
                    fallbacks = [
                        "How do you see these experiences connecting to your future?",
                        "What patterns do you notice across these moments?",
                        "How have these experiences shaped who you are?",
                        "What do these experiences tell you about your values?",
                        "How do these moments connect to your goals?",
                    ]
                    return random.choice(fallbacks)
            
        except Exception as e:
            logger.error(f"Error in Initiative Communication: {e}")
            # Diverse fallback question pool
            import random
            import time
            random.seed(int(time.time() * 1000) % 10000)
            fallbacks = [
                "What's a moment from the past week that stuck with you?",
                "Tell me about something that surprised you recently.",
                "What's been on your mind lately?",
                "Can you share a recent experience that felt meaningful?",
                "What caught your attention in the past few days?",
            ]
            return random.choice(fallbacks)
    
    async def generate_narrative(
        self,
        ideas: List[Dict],
        timeline_events: List[Dict],
    ) -> Dict[str, Any]:
        """
        Generate narrative framework from ideas using Narrator Agent
        """
        try:
            narrative = await self._run_narrator(ideas, timeline_events)
            return narrative
        except Exception as e:
            logger.error(f"Error generating narrative: {e}")
            raise
    
    async def generate_essay(
        self,
        university: str,
        major: str,
        word_limit: int,
        narrative: Dict,
        key_ideas: List[Dict],
        conversations: List[Dict] = None,
        style: str = "storytelling",
    ) -> str:
        """
        Generate essay using Writer Agent
        """
        try:
            essay = await self._run_writer(
                university=university,
                major=major,
                word_limit=word_limit,
                narrative=narrative,
                key_ideas=key_ideas,
                conversations=conversations or [],
                style=style,
            )
            return essay
        except Exception as e:
            logger.error(f"Error generating essay: {e}")
            raise
    
    async def stream_essay(
        self,
        university: str,
        major: str,
        word_limit: int,
        narrative: Dict,
        key_ideas: List[Dict],
        conversations: List[Dict] = None,
        style: str = "storytelling",
    ) -> AsyncGenerator[str, None]:
        """
        Stream essay generation
        """
        try:
            async for chunk in self._stream_writer(
                university=university,
                major=major,
                word_limit=word_limit,
                narrative=narrative,
                key_ideas=key_ideas,
                conversations=conversations or [],
                style=style,
            ):
                yield chunk
        except Exception as e:
            logger.error(f"Error streaming essay: {e}")
            yield f"\n\n[Error: {str(e)}]"
    
    async def audit_essay(
        self,
        essay_content: str,
        university: str,
        word_limit: int,
        major: str = None,
    ) -> Dict[str, Any]:
        """
        Audit essay using Audit Agent with optional Major Agent review
        """
        try:
            # If major not provided, try to detect from user profile
            if not major:
                profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
                if profile_data and profile_data.get("targetMajor"):
                    major = profile_data.get("targetMajor")
            
            feedback = await self._run_audit(essay_content, university, word_limit, major=major)
            return feedback
        except Exception as e:
            logger.error(f"Error auditing essay: {e}")
            raise
    
    # Internal agent execution methods
    
    async def _run_collector(self, user_input: str, user_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run Collector SubAgent"""
        try:
            # Format user profile for prompt
            profile_context = ""
            if user_profile:
                profile_context = json.dumps(user_profile, ensure_ascii=False, indent=2)
            else:
                profile_context = "No profile information available"
            
            prompt = COLLECTOR_AGENT_PROMPT.format(
                user_input=user_input,
                user_profile=profile_context
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Extract and categorize information from: {user_input}"}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=500,
            )
            
            content = response["choices"][0]["message"]["content"]
            
            # Try to parse as JSON, fallback to text
            try:
                return json.loads(content)
            except:
                return {
                    "raw_content": user_input,
                    "extracted_info": content,
                    "timestamp": datetime.utcnow().isoformat(),
                    "profile_used": user_profile is not None,
                }
                
        except Exception as e:
            logger.error(f"Collector error: {e}")
            return {"raw_content": user_input, "error": str(e)}
    
    def _detect_major_from_text(self, text: str, user_profile: Dict[str, Any] = None) -> Optional[str]:
        """Detect major field from text using simple keyword matching"""
        if not text:
            return None
        
        # Common majors keywords
        major_keywords = {
            "computer science": "Computer Science",
            "cs": "Computer Science",
            "software engineering": "Software Engineering",
            "biology": "Biology",
            "chemistry": "Chemistry",
            "physics": "Physics",
            "mathematics": "Mathematics",
            "math": "Mathematics",
            "economics": "Economics",
            "business": "Business",
            "engineering": "Engineering",
            "psychology": "Psychology",
            "political science": "Political Science",
            "international relations": "International Relations",
            "literature": "Literature",
            "history": "History",
            "philosophy": "Philosophy",
        }
        
        text_lower = text.lower()
        for keyword, major_name in major_keywords.items():
            if keyword in text_lower:
                return major_name
        
        # Fallback to user profile
        if user_profile and user_profile.get("targetMajor"):
            return user_profile.get("targetMajor")
        
        return None
    
    async def _create_major_agent_if_needed(self, major: str, user_profile: Dict[str, Any] = None):
        """Create Major SubAgent dynamically if it doesn't exist"""
        if not major or not major.strip():
            return
        
        major_name = major.strip()
        
        # Check if Major Agent already exists
        if major_name in self.major_agents:
            # Update usage count
            self.major_agents[major_name]["usage_count"] = self.major_agents[major_name].get("usage_count", 0) + 1
            logger.info(f"Major Agent '{major_name}' already exists, usage count: {self.major_agents[major_name]['usage_count']}")
            return
        
        # Create new Major Agent
        logger.info(f"Creating new Major SubAgent for: {major_name}")
        
        # Build background context
        background = ""
        if user_profile:
            profile_parts = []
            if user_profile.get("targetMajor"):
                profile_parts.append(f"Target major: {user_profile.get('targetMajor')}")
            if user_profile.get("skill"):
                profile_parts.append(f"Skills: {user_profile.get('skill')}")
            if user_profile.get("hobby"):
                profile_parts.append(f"Hobbies: {user_profile.get('hobby')}")
            background = "; ".join(profile_parts) if profile_parts else "No specific background information"
        else:
            # Use self.user_profile if available
            profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
            if profile_data:
                profile_parts = []
                if profile_data.get("targetMajor"):
                    profile_parts.append(f"Target major: {profile_data.get('targetMajor')}")
                if profile_data.get("skill"):
                    profile_parts.append(f"Skills: {profile_data.get('skill')}")
                if profile_data.get("hobby"):
                    profile_parts.append(f"Hobbies: {profile_data.get('hobby')}")
                background = "; ".join(profile_parts) if profile_parts else "No specific background information"
            else:
                background = "No profile information available"
        
        # Create Major Agent entry
        self.major_agents[major_name] = {
            "major": major_name,
            "prompt_template": get_major_agent_prompt,
            "background": background,
            "created_at": datetime.utcnow().isoformat(),
            "usage_count": 1,
        }
        
        logger.info(f"Successfully created Major SubAgent for '{major_name}'")
    
    async def _run_analyzer(self, ideas: List[Dict], user_profile: Dict[str, Any] = None) -> Dict[str, Any]:
        """Run Analyzer SubAgent"""
        try:
            ideas_text = json.dumps(ideas, ensure_ascii=False, indent=2)
            
            # Format user profile for prompt
            profile_context = ""
            if user_profile:
                profile_context = json.dumps(user_profile, ensure_ascii=False, indent=2)
            else:
                profile_context = "No profile information available"
            
            prompt = ANALYZER_AGENT_PROMPT.format(
                ideas=ideas_text,
                ideas_count=len(ideas),
                user_profile=profile_context
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Analyze these ideas and provide insights based on the user profile."}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.5,
            )
            
            content = response["choices"][0]["message"]["content"]
            
            try:
                return json.loads(content)
            except:
                return {
                    "analysis": content,
                    "ideas_analyzed": len(ideas),
                    "timestamp": datetime.utcnow().isoformat(),
                    "profile_used": user_profile is not None,
                }
                
        except Exception as e:
            logger.error(f"Analyzer error: {e}")
            return {"error": str(e)}
    
    async def _run_guide(self, analysis_report: Dict) -> str:
        """Run Guide SubAgent"""
        try:
            analysis_text = json.dumps(analysis_report, ensure_ascii=False, indent=2)
            missing = analysis_report.get("missing_categories", [])
            
            prompt = GUIDE_AGENT_PROMPT.format(
                analysis_report=analysis_text,
                missing_categories=", ".join(missing),
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Generate thoughtful guiding questions."}
            ]
            
            # Use higher temperature for maximum variety and creativity
            import random
            import time
            random.seed(int(time.time() * 1000) % 10000)
            temperature = random.uniform(1.1, 1.3)  # Random temperature for variety
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=temperature,  # Higher temperature for more variety and creativity
            )
            
            return response["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Guide error: {e}")
            return "What aspects of your experience would you like to explore further?"
    
    async def _run_global_agent(self, message: str, conversation_id: str) -> str:
        """Run Global Supervisor Agent with enhanced personality and variety"""
        try:
            import random
            import time
            
            # Build context
            workflow_state = "conversation"
            
            # Format user profile naturally for prompt
            profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
            if profile_data:
                # Build natural narrative instead of raw JSON
                profile_parts = []
                if profile_data.get('targetMajor') and profile_data.get('targetMajor', '').strip():
                    profile_parts.append(f"interested in {profile_data.get('targetMajor', '').strip()}")
                if profile_data.get('skill') and profile_data.get('skill', '').strip():
                    profile_parts.append(f"skilled in {profile_data.get('skill', '').strip()}")
                if profile_data.get('hobby') and profile_data.get('hobby', '').strip():
                    profile_parts.append(f"enjoys {profile_data.get('hobby', '').strip()}")
                
                if profile_parts:
                    user_summary = f"The user is {', '.join(profile_parts)}."
                else:
                    user_summary = "No profile information available."
            else:
                user_summary = "No profile information available."
            
            # Build recent conversation context for variety
            recent_context = ""
            if hasattr(self, 'conversation_context') and conversation_id in self.conversation_context:
                recent_messages = self.conversation_context[conversation_id].get('recent_messages', [])
                if recent_messages:
                    # Get last 2-3 messages to provide context
                    recent_context = "\n".join([
                        f"{msg.get('role', 'user')}: {msg.get('content', '')[:100]}..."
                        for msg in recent_messages[-3:]
                    ])
            
            # Generate random seed for variety
            random_seed = int(time.time() * 1000) % 10000
            random.seed(random_seed)
            
            # Add dynamic personality variations
            personality_modes = [
                "Be more playful and energetic in this response.",
                "Be more contemplative and reflective in this response.",
                "Show more curiosity and genuine interest in this response.",
                "Be more supportive and warm in this response.",
                "Be more analytical and insightful in this response.",
            ]
            personality_note = random.choice(personality_modes)
            
            system_prompt = GLOBAL_AGENT_PROMPT.format(
                workflow_state=workflow_state,
                user_profile=user_summary,
                ideas_count=len(self.ideas_buffer),
                conversation_length=0,
                recent_context=recent_context[:200] if recent_context else "Beginning of conversation",
            )
            
            # Add critical instructions with emphasis on variety
            system_prompt += f"""

CRITICAL INSTRUCTIONS (MUST FOLLOW):
- When responding, DO NOT mention field names like "Target Major", "Target Universities", or use placeholder syntax
- DO NOT say things like "interest in [Major]" or "pursuing [Field]"
- Instead, naturally understand the user's interests and ask about related experiences organically
- Focus on experiences, moments, and feelings - not academic labels
- Make conversations feel natural and human, not like filling out a form
- Integrate profile understanding seamlessly without explicitly mentioning field names
- {personality_note}
- This response MUST be different from previous ones - use completely different phrasing, structure, and style
- Vary your tone and approach - never be formulaic or repetitive"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            # Use higher temperature for maximum variety and creativity
            # Temperature 1.2-1.3 provides much more randomness while staying coherent
            temperature = random.uniform(1.15, 1.3)  # Random temperature between 1.15-1.3 for variety
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=temperature,  # Higher temperature for more variety and creativity
                max_tokens=800,  # Allow more tokens for richer, more varied responses
            )
            
            return response["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Global agent error: {e}")
            # Even fallback responses should be varied
            fallbacks = [
                "I'm intrigued by what you're sharing. Could you tell me more about that?",
                "That's really interesting. What stands out to you most about this?",
                "I'd love to understand this better. Can you elaborate?",
                "That sounds significant. How did that experience feel?",
                "Oh, that's fascinating! Can you share more details?",
            ]
            import random
            import time
            random.seed(int(time.time() * 1000) % 10000)
            return random.choice(fallbacks)
    
    async def _stream_global_agent(
        self,
        message: str,
        conversation_id: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from Global Agent with enhanced personality and variety"""
        try:
            import random
            import time
            
            workflow_state = "conversation"
            
            # Format user profile naturally for prompt
            profile_data = self.user_profile.get("profile", {}) if self.user_profile else {}
            if profile_data:
                # Build natural narrative instead of raw JSON
                profile_parts = []
                if profile_data.get('targetMajor') and profile_data.get('targetMajor', '').strip():
                    profile_parts.append(f"interested in {profile_data.get('targetMajor', '').strip()}")
                if profile_data.get('skill') and profile_data.get('skill', '').strip():
                    profile_parts.append(f"skilled in {profile_data.get('skill', '').strip()}")
                if profile_data.get('hobby') and profile_data.get('hobby', '').strip():
                    profile_parts.append(f"enjoys {profile_data.get('hobby', '').strip()}")
                
                if profile_parts:
                    user_summary = f"The user is {', '.join(profile_parts)}."
                else:
                    user_summary = "No profile information available."
            else:
                user_summary = "No profile information available."
            
            # Build recent conversation context for variety
            recent_context = ""
            if hasattr(self, 'conversation_context') and conversation_id in self.conversation_context:
                recent_messages = self.conversation_context[conversation_id].get('recent_messages', [])
                if recent_messages:
                    recent_context = "\n".join([
                        f"{msg.get('role', 'user')}: {msg.get('content', '')[:100]}..."
                        for msg in recent_messages[-3:]
                    ])
            
            # Generate random seed for variety
            random_seed = int(time.time() * 1000) % 10000
            random.seed(random_seed)
            
            # Add dynamic personality variations
            personality_modes = [
                "Be more playful and energetic in this response.",
                "Be more contemplative and reflective in this response.",
                "Show more curiosity and genuine interest in this response.",
                "Be more supportive and warm in this response.",
                "Be more analytical and insightful in this response.",
            ]
            personality_note = random.choice(personality_modes)
            
            system_prompt = GLOBAL_AGENT_PROMPT.format(
                workflow_state=workflow_state,
                user_profile=user_summary,
                ideas_count=len(self.ideas_buffer),
                conversation_length=0,
                recent_context=recent_context[:200] if recent_context else "Beginning of conversation",
            )
            
            # Add critical instructions with emphasis on variety
            system_prompt += f"""

CRITICAL INSTRUCTIONS (MUST FOLLOW):
- When responding, DO NOT mention field names like "Target Major", "Target Universities", or use placeholder syntax
- DO NOT say things like "interest in [Major]" or "pursuing [Field]"
- Instead, naturally understand the user's interests and ask about related experiences organically
- Focus on experiences, moments, and feelings - not academic labels
- Make conversations feel natural and human, not like filling out a form
- Integrate profile understanding seamlessly without explicitly mentioning field names
- {personality_note}
- This response MUST be different from previous ones - use completely different phrasing, structure, and style
- Vary your tone and approach - never be formulaic or repetitive"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            # Use higher temperature for maximum variety in streaming responses
            temperature = random.uniform(1.15, 1.3)  # Random temperature between 1.15-1.3 for variety
            
            stream = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=temperature,  # Higher temperature for more variety and creativity
                max_tokens=800,  # Allow more tokens for richer responses
                stream=True,
            )
            
            async for chunk in stream:
                yield chunk
                
        except Exception as e:
            logger.error(f"Stream global agent error: {e}")
            # Even error messages should be varied
            fallbacks = [
                "I'm processing that... ",
                "Let me think about that... ",
                "That's interesting... ",
                "I see... ",
            ]
            import random
            import time
            random.seed(int(time.time() * 1000) % 10000)
            yield random.choice(fallbacks)
    
    async def _generate_welcome_question(self) -> str:
        """Generate initial welcome question"""
        welcome_questions = [
            "Welcome! I'm here to help you explore your experiences and craft an outstanding personal statement. What's been on your mind lately regarding your college applications?",
            "Hi! I'd love to learn about your journey. What experiences or moments have shaped who you are today?",
            "Hello! Let's start by exploring what makes you unique. What are you most passionate about?",
        ]
        return welcome_questions[0]
    
    async def _run_narrator(
        self,
        ideas: List[Dict],
        timeline_events: List[Dict]
    ) -> Dict[str, Any]:
        """Run Narrator SubAgent"""
        try:
            ideas_text = json.dumps(ideas, ensure_ascii=False, indent=2)
            timeline_text = json.dumps(timeline_events, ensure_ascii=False, indent=2)
            
            prompt = NARRATOR_AGENT_PROMPT.format(
                ideas=ideas_text,
                timeline_events=timeline_text,
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Generate a comprehensive narrative framework."}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.6,
                max_tokens=2000,
            )
            
            content = response["choices"][0]["message"]["content"]
            
            try:
                return json.loads(content)
            except:
                return {
                    "narrative_text": content,
                    "generated_at": datetime.utcnow().isoformat(),
                }
                
        except Exception as e:
            logger.error(f"Narrator error: {e}")
            raise
    
    async def _run_writer(
        self,
        university: str,
        major: str,
        word_limit: int,
        narrative: Dict,
        key_ideas: List[Dict],
        conversations: List[Dict],
        style: str,
    ) -> str:
        """Run Writer SubAgent with full context integration"""
        try:
            # Prepare comprehensive context
            narrative_text = json.dumps(narrative, ensure_ascii=False, indent=2)
            ideas_text = json.dumps(key_ideas, ensure_ascii=False, indent=2)
            
            # Extract key insights from conversations
            conversation_summary = ""
            if conversations:
                conv_preview = conversations[:5]  # Recent 5 messages
                conversation_summary = "\n".join([
                    f"{msg['role']}: {msg['content'][:200]}..."
                    for msg in conv_preview
                ])
            
            # Build comprehensive context for Writer
            context_builder = f"""
目标大学: {university}
申请专业: {major}
字数限制: {word_limit}字

=== 用户的核心想法 (Ideas) ===
{ideas_text}

=== 叙事框架 (Narrative Framework) ===
{narrative_text}

=== 对话中的重要信息 (Conversation Insights) ===
{conversation_summary if conversation_summary else "暂无对话历史"}
"""
            
            prompt = WRITER_AGENT_PROMPT.format(
                university=university,
                word_limit=word_limit,
                style=style,
                narrative=narrative_text,
                key_ideas=ideas_text,
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"""Write a {word_limit}-word personal statement for {university}'s {major} program based on this authentic information:

{context_builder}

ABSOLUTE CRITICAL REQUIREMENTS:
1. Use ONLY the user's actual experiences - NO FABRICATION WHATSOEVER
   - NEVER invent experiences, events, or details
   - NEVER add specific events that weren't mentioned
   - If information is limited, work with what is provided

2. If user provides limited specific experiences:
   - Expand through deep reflection and introspection
   - Write about thoughts, feelings, insights, and analysis
   - Explore values, beliefs, and personal philosophy
   - Connect experiences to future aspirations
   - Show depth of thinking, not quantity of events
   - DO NOT create fake experiences to fill space

3. When you have specific examples, use them authentically
4. Demonstrate understanding and passion for {major}
5. Write in first person, maintain authentic voice
6. Write entirely in English

Remember: Better to write shorter with authentic reflection than longer with fabricated experiences.

Begin writing:"""}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=word_limit * 3,
            )
            
            return response["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Writer error: {e}")
            raise
    
    async def _stream_writer(
        self,
        university: str,
        major: str,
        word_limit: int,
        narrative: Dict,
        key_ideas: List[Dict],
        conversations: List[Dict],
        style: str,
    ) -> AsyncGenerator[str, None]:
        """Stream Writer SubAgent output with full context"""
        try:
            narrative_text = json.dumps(narrative, ensure_ascii=False, indent=2)
            ideas_text = json.dumps(key_ideas, ensure_ascii=False, indent=2)
            
            # Extract key insights from conversations
            conversation_summary = ""
            if conversations:
                conv_preview = conversations[:5]
                conversation_summary = "\n".join([
                    f"{msg['role']}: {msg['content'][:200]}..."
                    for msg in conv_preview
                ])
            
            context_builder = f"""
目标大学: {university}
申请专业: {major}
字数限制: {word_limit}字

=== 用户的核心想法 ===
{ideas_text}

=== 叙事框架 ===
{narrative_text}

=== 对话精华 ===
{conversation_summary if conversation_summary else "暂无"}
"""
            
            prompt = WRITER_AGENT_PROMPT.format(
                university=university,
                word_limit=word_limit,
                style=style,
                narrative=narrative_text,
                key_ideas=ideas_text,
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"""Write a {word_limit}-word personal statement for {university}'s {major} program.

{context_builder}

ABSOLUTE CRITICAL REQUIREMENTS:
1. Use ONLY the user's actual experiences - NO FABRICATION
   - NEVER invent experiences, events, or details
   - If information is limited, expand through reflection, not fabrication

2. If user provides limited experiences:
   - Write about thoughts, reflections, insights, values
   - Show depth of thinking, not invented events
   - DO NOT create fake experiences

3. When you have authentic examples, use them with specific details
4. Show uniqueness through authentic voice and reflection
5. Write in English

Begin writing:"""}
            ]
            
            stream = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=word_limit * 2,
                stream=True,
            )
            
            async for chunk in stream:
                yield chunk
                
        except Exception as e:
            logger.error(f"Stream writer error: {e}")
            raise
    
    async def _run_audit(
        self,
        essay_content: str,
        university: str,
        word_limit: int,
        major: str = None,
    ) -> Dict[str, Any]:
        """Run Audit SubAgent with optional Major Agent review"""
        try:
            prompt = AUDIT_AGENT_PROMPT.format(
                essay_content=essay_content,
                university=university,
                word_limit=word_limit,
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Provide comprehensive feedback on this essay."}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.4,
                max_tokens=1500,
            )
            
            content = response["choices"][0]["message"]["content"]
            
            try:
                audit_result = json.loads(content)
            except:
                audit_result = {
                    "overall_score": 75,
                    "feedback_text": content,
                    "strengths": ["Well-written", "Engaging"],
                    "improvements": ["Could be more specific"],
                    "suggestions": content,
                }
            
            # If major is specified and Major Agent exists, run Major Agent review
            if major and major.strip() and major.strip() in self.major_agents:
                try:
                    major_review = await self._run_major_agent(
                        major=major.strip(),
                        essay_content=essay_content,
                        user_profile=self.user_profile.get("profile", {}) if self.user_profile else {}
                    )
                    
                    # Merge Major Agent review into audit result
                    if "major_review" not in audit_result:
                        audit_result["major_review"] = major_review
                    else:
                        # Update existing major review
                        audit_result["major_review"] = major_review
                    
                    logger.info(f"Major Agent review completed for {major}")
                except Exception as e:
                    logger.warning(f"Major Agent review failed: {e}, continuing with basic audit")
            
            return audit_result
                
        except Exception as e:
            logger.error(f"Audit error: {e}")
            raise
    
    async def _run_major_agent(
        self,
        major: str,
        essay_content: str,
        user_profile: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Run dynamic Major SubAgent for domain-specific review"""
        try:
            if major not in self.major_agents:
                logger.warning(f"Major Agent for '{major}' does not exist, skipping review")
                return {}
            
            major_agent_info = self.major_agents[major]
            
            # Build background context
            background = major_agent_info.get("background", "")
            if user_profile:
                profile_parts = []
                if user_profile.get("targetMajor"):
                    profile_parts.append(f"Target major: {user_profile.get('targetMajor')}")
                if user_profile.get("skill"):
                    profile_parts.append(f"Skills: {user_profile.get('skill')}")
                if user_profile.get("hobby"):
                    profile_parts.append(f"Hobbies: {user_profile.get('hobby')}")
                if profile_parts:
                    background = "; ".join(profile_parts)
            
            # Get prompt template function
            prompt_template_func = major_agent_info.get("prompt_template", get_major_agent_prompt)
            
            # Generate prompt
            prompt = prompt_template_func(
                major=major,
                background=background or "No specific background information",
                content=essay_content
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"""Review this {major}-related content in the essay and provide expert feedback:

{essay_content[:2000]}...""" if len(essay_content) > 2000 else essay_content}
            ]
            
            # Use lower temperature for more accurate technical review
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.5,  # Lower temperature for accurate technical review
                max_tokens=2000,
            )
            
            content = response["choices"][0]["message"]["content"]
            
            # Try to parse as JSON
            try:
                major_review = json.loads(content)
                # Update usage count
                self.major_agents[major]["usage_count"] = self.major_agents[major].get("usage_count", 0) + 1
                return major_review
            except:
                # Return as text if JSON parsing fails
                return {
                    "review_text": content,
                    "major": major,
                    "format": "text"
                }
                
        except Exception as e:
            logger.error(f"Major Agent error for {major}: {e}")
            return {"error": str(e)}


# Global agent system instance
_agent_system: Optional[MultiAgentSystem] = None


def get_agent_system() -> MultiAgentSystem:
    """Get or create Multi-Agent system singleton"""
    global _agent_system
    if _agent_system is None:
        _agent_system = MultiAgentSystem()
    return _agent_system

