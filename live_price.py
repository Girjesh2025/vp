from dhanhq import dhanhq
import time

# Credentials
CLIENT_ID = "YOUR_CLIENT_ID"
TOKEN = "YOUR_TOKEN"

def check_prices():
    print("Starting price check...")
    
    try:
        # Connect
        dhan = dhanhq(
            client_id=CLIENT_ID,
            access_token=TOKEN
        )
        print("Connected!")
        
        # Get single price check
        nifty = dhan.get_ltp("NIFTY")
        print(f"\nNIFTY: {nifty}")
        
        banknifty = dhan.get_ltp("BANKNIFTY")
        print(f"BANKNIFTY: {banknifty}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_prices() 