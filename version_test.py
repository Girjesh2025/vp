from dhanhq import dhanhq
import dhanhq as dh

print("1. Checking dhanhq version...")
print(f"Version: {dh.__version__}")

print("\n2. Available methods:")
dhan = dhanhq(
    client_id="1100543236",
    access_token="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiJ9.eyJpc3MiOiJkaGFuIiwicGFydG5lcklkIjoiIiwiZXhwIjoxNzM3ODYyNjY1LCJ0b2tlbkNvbnN1bWVyVHlwZSI6IlNFTEYiLCJ3ZWJob29rVXJsIjoiIiwiZGhhbkNsaWVudElkIjoiMTEwMDU0MzIzNiJ9.jL6NOBX5wejGxoLzYrekBbGyI1i9NlQ1yfaDFS3hsAkSzBa5EHoVRK6Nfu6FCxxqog99PNyNVVhUtS6kRvsmrA"
)

# Print all available methods
print("\nAvailable methods:")
for method in dir(dhan):
    if not method.startswith('_'):
        print(method) 