from dhanhq import dhanhq

# Your credentials
CLIENT_ID = "1100543236"
TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"

print("1. Starting method check...")

try:
    # Create instance
    dhan = dhanhq(
        client_id=CLIENT_ID,
        access_token=TOKEN
    )
    print("2. Connected!")
    
    # List all available methods
    print("\n3. Available methods:")
    methods = [method for method in dir(dhan) if not method.startswith('_')]
    for method in methods:
        print(f"- {method}")
        
except Exception as e:
    print(f"\nError: {e}")

print("\n4. Check complete!") 