const yahooFinanceLib = require('yahoo-finance2').default;
console.log(typeof yahooFinanceLib);
try {
  const yf = new yahooFinanceLib();
  console.log("Success");
} catch(e) {
  console.error(e);
}