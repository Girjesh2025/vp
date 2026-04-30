const YahooFinanceLib = require('yahoo-finance2').default;
const yahooFinance = new YahooFinanceLib({ suppressNotices: ['yahooSurvey'] });

async function test() {
  try {
    const quote = await yahooFinance.quote('^NSEI');
    console.log("Yahoo ^NSEI:", quote.regularMarketPrice);
  } catch (e) {
    console.error("Yahoo error:", e.message);
  }
}
test();