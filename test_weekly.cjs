const fetch = require('node-fetch');

async function test() {
  const symbol = "RELIANCE.NS";
  
  // 1. Weekly
  const wUrl = `http://localhost:3001/api/historical/${symbol}?range=1y&interval=1wk`;
  const wRes = await fetch(wUrl);
  const wData = await wRes.json();
  const wCloses = wData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
  console.log(`Weekly bars for ${symbol}: ${wCloses.length}`);

  // 2. Daily
  const dUrl = `http://localhost:3001/api/historical/${symbol}?range=2y&interval=1d`;
  const dRes = await fetch(dUrl);
  const dData = await dRes.json();
  const dCloses = dData?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
  console.log(`Daily bars for ${symbol}: ${dCloses.length}`);
  
  if (dCloses.length >= 200) {
    const validD = dCloses.filter(c => typeof c === 'number' && c > 0);
    const dma200 = validD.slice(-200).reduce((a, b) => a + b, 0) / 200;
    console.log(`DMA200 for ${symbol}: ${dma200.toFixed(2)}`);
    console.log(`Current price: ${validD[validD.length - 1]}`);
    console.log(`isAboveDma: ${validD[validD.length - 1] > dma200}`);
  }
}
test();