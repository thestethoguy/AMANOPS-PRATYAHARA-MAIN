import requests
import sys
import json
from datetime import datetime
import time

class PratyaharaAPITester:
    def __init__(self, base_url="http://localhost:5000/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_email = f"test_{int(time.time())}@pratyahara.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "../",  # Go back to root
            200
        )
        return success

    def test_register(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": self.test_email, "password": self.test_password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {self.test_email}")
            return True
        return False

    def test_login(self):
        """Test user login"""
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.test_email, "password": self.test_password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Logged in user: {self.test_email}")
            return True
        return False

    def test_mood_creation(self):
        """Test mood entry creation"""
        success, response = self.run_test(
            "Create Mood Entry",
            "POST",
            "moods",
            200,
            data={
                "mood_type": "happy",
                "intensity": 8,
                "note": "Feeling great today!"
            }
        )
        return success, response.get('id') if success else None

    def test_mood_history(self):
        """Test mood history retrieval"""
        success, response = self.run_test(
            "Get Mood History",
            "GET",
            "moods/history",
            200
        )
        return success

    def test_journal_creation(self):
        """Test journal entry creation"""
        success, response = self.run_test(
            "Create Journal Entry",
            "POST",
            "journal",
            200,
            data={
                "content": "Today was a wonderful day for meditation and mindfulness practice.",
                "mood_tag": "grateful"
            }
        )
        return success, response.get('id') if success else None

    def test_journal_retrieval(self):
        """Test journal entries retrieval"""
        success, response = self.run_test(
            "Get Journal Entries",
            "GET",
            "journal",
            200
        )
        return success

    def test_streak_get(self):
        """Test streak retrieval"""
        success, response = self.run_test(
            "Get User Streak",
            "GET",
            "streak",
            200
        )
        return success

    def test_streak_update(self):
        """Test streak update"""
        success, response = self.run_test(
            "Update User Streak",
            "POST",
            "streak/update",
            200
        )
        return success

    def test_chat(self):
        """Test AI chat functionality"""
        print(f"\n🔍 Testing AI Chat (may take 10-15 seconds)...")
        success, response = self.run_test(
            "AI Chat Message",
            "POST",
            "chat",
            200,
            data={"message": "Hello, I'm feeling a bit stressed. Can you help me with a quick breathing exercise?"}
        )
        
        if success and 'reply' in response:
            print(f"   AI Response: {response['reply'][:100]}...")
            return True
        return False

    def test_chat_history(self):
        """Test chat history retrieval"""
        success, response = self.run_test(
            "Get Chat History",
            "GET",
            "chat/history",
            200
        )
        return success

    def test_analytics(self):
        """Test analytics summary"""
        success, response = self.run_test(
            "Get Analytics Summary",
            "GET",
            "analytics/summary?days=7",
            200
        )
        return success

    def test_media_audio(self):
        """Test audio media retrieval"""
        success, response = self.run_test(
            "Get Audio Media",
            "GET",
            "media/audio",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} audio items")
            return True
        return False

    def test_media_videos(self):
        """Test video media retrieval"""
        success, response = self.run_test(
            "Get Video Media",
            "GET",
            "media/videos",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} video items")
            return True
        return False

    def test_webauthn_register_challenge(self):
        """Test WebAuthn registration challenge"""
        success, response = self.run_test(
            "WebAuthn Register Challenge",
            "POST",
            "auth/webauthn/register-challenge",
            200,
            data={"email": self.test_email}
        )
        return success

def main():
    print("🚀 Starting PRATYAHARA API Tests")
    print("=" * 50)
    
    tester = PratyaharaAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Mood Creation", tester.test_mood_creation),
        ("Mood History", tester.test_mood_history),
        ("Journal Creation", tester.test_journal_creation),
        ("Journal Retrieval", tester.test_journal_retrieval),
        ("Streak Get", tester.test_streak_get),
        ("Streak Update", tester.test_streak_update),
        ("AI Chat", tester.test_chat),
        ("Chat History", tester.test_chat_history),
        ("Analytics", tester.test_analytics),
        ("Audio Media", tester.test_media_audio),
        ("Video Media", tester.test_media_videos),
        ("WebAuthn Challenge", tester.test_webauthn_register_challenge)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            if isinstance(result, tuple):
                success = result[0]
            else:
                success = result
                
            if not success:
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed Tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    print(f"\n📧 Test user created: {tester.test_email}")
    print(f"🔑 Password: {tester.test_password}")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())