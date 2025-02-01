from dhanhq import dhanhq
import time
import logging
from typing import Dict

# Your credentials
CLIENT_ID = "1100543236"
TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"

def main():
    print("Starting test...")
    time.sleep(1)  # Add delay
    
    try:
        print("\nConnecting to broker...")
        dhan = dhanhq(
            client_id=CLIENT_ID,
            access_token=TOKEN
        )
        print("✅ Connected!")
        time.sleep(1)
        
        print("\nGetting profile...")
        profile = dhan.get_profile()
        print(f"Profile: {profile}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")

def execute_trade(self, trade_setup: Dict) -> bool:
    try:
        # Check margin first
        required_margin = trade_setup['quantity'] * trade_setup['entry_price']
        if not self.check_margin_for_trade(required_margin):
            logging.warning(f"Insufficient margin for trade: Required ₹{required_margin:,.2f}")
            return False
            
        # Rest of your trade execution code
        ...

if __name__ == "__main__":
    main() 