const fetch = require('node-fetch');
async function test() {
  const url = `http://localhost:3001/api/historical/^CNXIT?range=18mo&interval=1mo`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Quotes object exists:", !!data.chart);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
test();
