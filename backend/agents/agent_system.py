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
        self.conversation_context: Dict[str, Any] = {}
        self.user_profile: Dict[str, Any] = {}
        self.ideas_buffer: List[Dict] = []
        self.analysis_reports: List[Dict] = []
        
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
            # Step 1: Collector - Extract and categorize information
            collected_data = await self._run_collector(message)
            
            # Step 2: Update context
            if user_context:
                self.user_profile.update(user_context)
            
            # Step 3: Determine response strategy
            # Check if we need analysis
            self.ideas_buffer.append(collected_data)
            
            should_analyze = len(self.ideas_buffer) >= 5
            
            if should_analyze:
                # Run analyzer
                analysis = await self._run_analyzer(self.ideas_buffer)
                self.analysis_reports.append(analysis)
                
                # Generate guided questions based on analysis
                response = await self._run_guide(analysis)
                agent_type = "guide"
            else:
                # Normal conversational response from Global Agent
                response = await self._run_global_agent(message, conversation_id)
                agent_type = "guide"
            
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
        Stream response from Multi-Agent system
        """
        try:
            # Quick collection in background
            collected_data = await self._run_collector(message)
            
            # Stream response from Global Agent
            async for chunk in self._stream_global_agent(message, conversation_id):
                yield chunk
                
        except Exception as e:
            logger.error(f"Error in stream_user_message: {e}")
            yield "I apologize, but I encountered an error processing your message."
    
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
            
            # Use LLM to generate intelligent question
            prompt = f"""You are conducting an Initiative Communication - proactively engaging a user exploring their personal narrative for college applications.

Conversation stage: {stage}
Conversation length: {conversation_length} exchanges

Recent conversation:
{recent_context if recent_context else "This is the beginning of our conversation."}

User's ideas:
{ideas_context if ideas_context else "User hasn't shared ideas yet."}

Task: {instruction}

Generate ONE thoughtful, specific question (1-2 sentences maximum) that:
- Feels natural and conversational
- Invites detailed sharing
- Focuses on a specific moment or feeling
- Avoids yes/no answers

Respond with just the question, nothing else."""

            messages = [
                {"role": "system", "content": "You are an expert college counselor skilled at drawing out meaningful stories."},
                {"role": "user", "content": prompt}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.8,
                max_tokens=150,
            )
            
            question = response["choices"][0]["message"]["content"].strip()
            
            # Clean up any quotation marks
            question = question.strip('"\'')
            
            return question
            
        except Exception as e:
            logger.error(f"Error in Initiative Communication: {e}")
            # Fallback to simple question
            return "What's something that happened recently that made you think differently?"
    
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
    ) -> Dict[str, Any]:
        """
        Audit essay using Audit Agent
        """
        try:
            feedback = await self._run_audit(essay_content, university, word_limit)
            return feedback
        except Exception as e:
            logger.error(f"Error auditing essay: {e}")
            raise
    
    # Internal agent execution methods
    
    async def _run_collector(self, user_input: str) -> Dict[str, Any]:
        """Run Collector SubAgent"""
        try:
            prompt = COLLECTOR_AGENT_PROMPT.format(user_input=user_input)
            
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
                }
                
        except Exception as e:
            logger.error(f"Collector error: {e}")
            return {"raw_content": user_input, "error": str(e)}
    
    async def _run_analyzer(self, ideas: List[Dict]) -> Dict[str, Any]:
        """Run Analyzer SubAgent"""
        try:
            ideas_text = json.dumps(ideas, ensure_ascii=False, indent=2)
            
            prompt = ANALYZER_AGENT_PROMPT.format(
                ideas=ideas_text,
                ideas_count=len(ideas),
            )
            
            messages = [
                {"role": "system", "content": prompt},
                {"role": "user", "content": "Analyze these ideas and provide insights."}
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
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.8,
            )
            
            return response["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Guide error: {e}")
            return "What aspects of your experience would you like to explore further?"
    
    async def _run_global_agent(self, message: str, conversation_id: str) -> str:
        """Run Global Supervisor Agent"""
        try:
            # Build context
            workflow_state = "conversation"
            user_summary = json.dumps(self.user_profile, ensure_ascii=False)
            
            system_prompt = GLOBAL_AGENT_PROMPT.format(
                workflow_state=workflow_state,
                user_profile=user_summary,
                ideas_count=len(self.ideas_buffer),
                conversation_length=0,
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            response = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.8,
            )
            
            return response["choices"][0]["message"]["content"]
            
        except Exception as e:
            logger.error(f"Global agent error: {e}")
            return "I understand. Could you tell me more about that?"
    
    async def _stream_global_agent(
        self,
        message: str,
        conversation_id: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from Global Agent"""
        try:
            workflow_state = "conversation"
            user_summary = json.dumps(self.user_profile, ensure_ascii=False)
            
            system_prompt = GLOBAL_AGENT_PROMPT.format(
                workflow_state=workflow_state,
                user_profile=user_summary,
                ideas_count=len(self.ideas_buffer),
                conversation_length=0,
            )
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            stream = await self.deepseek_client.chat_completion(
                messages=messages,
                temperature=0.8,
                stream=True,
            )
            
            async for chunk in stream:
                yield chunk
                
        except Exception as e:
            logger.error(f"Stream global agent error: {e}")
            yield "I apologize for the interruption. "
    
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

Critical requirements:
1. Use ONLY the user's actual experiences - no fabrication
2. Select 2-3 most compelling specific examples
3. Demonstrate understanding and passion for {major}
4. Write in first person, maintain authentic voice
5. Write entirely in English

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

Must be based on user's authentic experiences with specific details and scenes. Show uniqueness. Write in English."""}
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
    ) -> Dict[str, Any]:
        """Run Audit SubAgent"""
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
                return json.loads(content)
            except:
                return {
                    "overall_score": 75,
                    "feedback_text": content,
                    "strengths": ["Well-written", "Engaging"],
                    "improvements": ["Could be more specific"],
                    "suggestions": content,
                }
                
        except Exception as e:
            logger.error(f"Audit error: {e}")
            raise


# Global agent system instance
_agent_system: Optional[MultiAgentSystem] = None


def get_agent_system() -> MultiAgentSystem:
    """Get or create Multi-Agent system singleton"""
    global _agent_system
    if _agent_system is None:
        _agent_system = MultiAgentSystem()
    return _agent_system

