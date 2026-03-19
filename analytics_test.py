import requests
import sys

def test_analytics_periods():
    """Test analytics with different time periods"""
    base_url = "http://localhost:5000/api"
    
    # Use the test user credentials from the previous test
    test_email = "test_1773384124@pratyahara.com"
    test_password = "TestPass123!"
    
    # Login to get token
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": test_email,
        "password": test_password
    })
    
    if login_response.status_code != 200:
        print("❌ Failed to login for analytics test")
        return False
    
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test different time periods
    periods = [7, 14, 30]
    
    print("🔍 Testing Analytics with Different Time Periods")
    print("=" * 50)
    
    all_passed = True
    
    for days in periods:
        print(f"\n📊 Testing {days}-day analytics...")
        
        response = requests.get(
            f"{base_url}/analytics/summary?days={days}",
            headers=headers
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {days}-day analytics: Status {response.status_code}")
            print(f"   Period: {data.get('period_days')} days")
            print(f"   Total moods: {data.get('total_moods')}")
            print(f"   Total journals: {data.get('total_journals')}")
            print(f"   Current streak: {data.get('current_streak')}")
            print(f"   Average intensity: {data.get('average_intensity')}")
        else:
            print(f"❌ {days}-day analytics failed: Status {response.status_code}")
            all_passed = False
    
    return all_passed

if __name__ == "__main__":
    success = test_analytics_periods()
    sys.exit(0 if success else 1)