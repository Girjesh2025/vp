from dhanhq import dhanhq
import time
from datetime import datetime

# Your credentials
CLIENT_ID = "YOUR_CLIENT_ID"
TOKEN = "YOUR_TOKEN"

def monitor_prices():
    print("\n=== Live Price Monitor ===")
    
    try:
        # Connect to broker
        broker = dhanhq(
            client_id=CLIENT_ID,
            access_token=TOKEN
        )
        print("✅ Connected to broker")
        
        # Monitor prices continuously
        while True:
            try:
                # Get current time
                current_time = datetime.now().strftime("%H:%M:%S")
                
                # Get NIFTY price
                nifty = broker.get_ltp("NIFTY")
                
                # Get BANKNIFTY price
                banknifty = broker.get_ltp("BANKNIFTY")
                
                # Clear screen (optional)
                print("\033c", end="")
                
                # Print prices
                print(f"\n=== {current_time} ===")
                print(f"NIFTY: {nifty}")
                print(f"BANKNIFTY: {banknifty}")
                
                # Wait 1 second
                time.sleep(1)
                
            except KeyboardInterrupt:
                print("\n⚠️ Monitoring stopped")
                break
            except Exception as e:
                print(f"Error getting prices: {e}")
                time.sleep(1)
                
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    monitor_prices()