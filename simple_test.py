from dhanhq import dhanhq

# Your credentials
CLIENT_ID = "1100543236"
TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"

print("1. Starting test...")

try:
    # Connect to broker
    dhan = dhanhq(
        client_id=CLIENT_ID,
        access_token=TOKEN
    )
    print("2. Connected to Dhan!")
    
    # Get market data
    print("\n3. Fetching market data...")
    
    # NIFTY data
    nifty_data = dhan.get_quote("NSE", "NIFTY 50")
    print(f"NIFTY: {nifty_data}")
    
    # BANKNIFTY data
    banknifty_data = dhan.get_quote("NSE", "NIFTY BANK")
    print(f"BANKNIFTY: {banknifty_data}")
    
    # Check holdings
    print("\n4. Checking holdings...")
    holdings = dhan.get_holdings()
    print(f"Holdings: {holdings}")
    
except Exception as e:
    print(f"\nError: {str(e)}")
    print(f"Error type: {type(e)}")

print("\n5. Test complete!") 