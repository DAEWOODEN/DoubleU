"""
Simple API Test Script
Test core endpoints to verify the system is working
"""

import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000"


async def test_health():
    """Test health check endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/health")
        print("✅ Health Check:", response.json())


async def test_profile():
    """Test profile creation"""
    async with httpx.AsyncClient() as client:
        profile_data = {
            "targetUniversities": "Stanford, MIT",
            "targetMajor": "Computer Science",
            "name": "Test User",
            "mbti": "INTJ",
            "skill": "Programming",
            "hobby": "Reading"
        }
        
        response = await client.post(f"{BASE_URL}/api/profile", json=profile_data)
        print("✅ Profile Created:", response.json())


async def test_chat_message():
    """Test chat message"""
    async with httpx.AsyncClient() as client:
        message_data = {
            "message": "I'm interested in AI and education.",
            "conversationId": "test-conv"
        }
        
        response = await client.post(f"{BASE_URL}/api/chat/message", json=message_data)
        result = response.json()
        print("✅ Chat Response:")
        print(f"   Role: {result.get('role')}")
        print(f"   Agent: {result.get('agentType')}")
        print(f"   Content: {result.get('content')[:100]}...")


async def test_ideas_sync():
    """Test ideas sync"""
    async with httpx.AsyncClient() as client:
        ideas_data = {
            "ideas": [
                {
                    "id": "test-idea-1",
                    "content": "I taught programming to rural students",
                    "intensity": 8,
                    "position": {"x": 100, "y": 200},
                    "size": 150,
                    "inStorage": False
                }
            ]
        }
        
        response = await client.post(f"{BASE_URL}/api/ideas/sync", json=ideas_data)
        print("✅ Ideas Synced:", response.json())


async def test_essay_generation():
    """Test essay generation (may take a while)"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        essay_data = {
            "university": "Stanford",
            "wordLimit": 300,
            "useNarrative": True,
            "useIdeas": True,
            "useConversations": True
        }
        
        print("⏳ Generating essay (this may take 30+ seconds)...")
        response = await client.post(f"{BASE_URL}/api/essay/generate", json=essay_data)
        result = response.json()
        print("✅ Essay Generated:")
        print(f"   University: {result.get('university')}")
        print(f"   Word Count: {result.get('wordCount')}")
        print(f"   Preview: {result.get('content')[:200]}...")


async def run_all_tests():
    """Run all tests"""
    print("\n🧪 Starting API Tests...\n")
    
    try:
        await test_health()
        print()
        
        await test_profile()
        print()
        
        await test_ideas_sync()
        print()
        
        await test_chat_message()
        print()
        
        # Uncomment to test essay generation (slow)
        # await test_essay_generation()
        # print()
        
        print("\n✅ All tests completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════╗
║      ComChatX API Test Suite                ║
║                                              ║
║  Make sure the backend server is running:   ║
║  python main.py                              ║
╚══════════════════════════════════════════════╝
    """)
    
    asyncio.run(run_all_tests())

