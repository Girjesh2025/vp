from dhanhq import dhanhq
import time
from datetime import datetime

# Your credentials (already working)
CLIENT_ID = "1100543236"  # Your existing ID
TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"          # Your existing token

def test_market_data():
    try:
        print(f"\n=== Market Test {datetime.now().strftime('%H:%M:%S')} ===")
        
        # Connect (this part works)
        dhan = dhanhq(
            client_id=CLIENT_ID,
            access_token=TOKEN
        )
        print("1. ✅ Connected to broker")
        
        # Test different data types
        print("\n2. Testing Market Data:")
        
        # NIFTY spot
        nifty = dhan.get_ltp("NIFTY")
        print(f"NIFTY: {nifty}")
        
        # BANKNIFTY spot
        banknifty = dhan.get_ltp("BANKNIFTY")
        print(f"BANKNIFTY: {banknifty}")
        
        # Get positions (if any)
        print("\n3. Checking Positions:")
        positions = dhan.get_positions()
        print(f"Current Positions: {positions}")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    test_market_data() 