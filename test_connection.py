from dhanhq import dhanhq

def test_dhan():
    try:
        # Your credentials
        CLIENT_ID = "1100543236"
        TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"
        
        print("Connecting to Dhan...")
        dhan = dhanhq(client_id=CLIENT_ID, access_token=TOKEN)
        
        print("\nTesting get_positions()...")
        positions = dhan.get_positions()
        print(f"Positions response: {positions['status']}")
        
        print("\nTesting get_fund_limits()...")
        funds = dhan.get_fund_limits()
        print(f"Funds response: {funds['status']}")
        
        print("\nAll tests passed!")
        
    except Exception as e:
        print(f"\nError: {str(e)}")

if __name__ == "__main__":
    test_dhan() 