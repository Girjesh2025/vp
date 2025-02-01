from dhanhq import dhanhq
import logging
import time
from datetime import datetime

# Enhanced logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BrokerTest:
    def __init__(self):
        self.client_id = "YOUR_CLIENT_ID"
        self.access_token = "YOUR_ACCESS_TOKEN"
        self.broker = None
        
    def connect(self):
        try:
            self.broker = dhanhq(
                client_id=self.client_id,
                access_token=self.access_token
            )
            logger.info("✅ Broker connected")
            return True
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            return False

    def test_market_data(self):
        try:
            # Test NIFTY
            nifty = self.broker.get_ltp("NIFTY")
            logger.info(f"NIFTY LTP: {nifty}")
            
            # Test BANKNIFTY
            banknifty = self.broker.get_ltp("BANKNIFTY")
            logger.info(f"BANKNIFTY LTP: {banknifty}")
            
            return True
        except Exception as e:
            logger.error(f"❌ Market data error: {e}")
            return False

    def test_account(self):
        try:
            # Get account details
            holdings = self.broker.get_holdings()
            logger.info(f"Holdings: {holdings}")
            
            # Get positions
            positions = self.broker.get_positions()
            logger.info(f"Positions: {positions}")
            
            return True
        except Exception as e:
            logger.error(f"❌ Account error: {e}")
            return False

    def run_tests(self):
        logger.info("🚀 Starting broker tests...")
        
        tests = [
            ("Connection", self.connect),
            ("Market Data", self.test_market_data),
            ("Account Info", self.test_account)
        ]
        
        results = []
        for test_name, test_func in tests:
            logger.info(f"\nRunning {test_name} test...")
            try:
                result = test_func()
                status = "✅ Passed" if result else "❌ Failed"
                results.append((test_name, status))
            except Exception as e:
                logger.error(f"Test error: {e}")
                results.append((test_name, "❌ Error"))
            
            # Add delay between tests
            time.sleep(1)
        
        # Print summary
        logger.info("\n=== Test Summary ===")
        for name, status in results:
            logger.info(f"{name}: {status}")

if __name__ == "__main__":
    tester = BrokerTest()
    tester.run_tests() 