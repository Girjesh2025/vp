from dhanhq import dhanhq
print("1. Starting test...")

# Your Dhan credentials here
CLIENT_ID = "1100543236"
TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"

try:
    # Connect to broker
    dhan = dhanhq(
        client_id=CLIENT_ID,
        access_token=TOKEN
    )
    print("2. Connected to broker!")
    
    # Test price data
    nifty = dhan.get_ltp("NIFTY")
    print(f"3. NIFTY price: {nifty}")
    
except Exception as e:
    print(f"Error: {e}") 