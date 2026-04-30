import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const testSymbol = async (sym) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <body>
    <div id="tv_chart" style="width: 800px; height: 600px;"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
    <script type="text/javascript">
      new TradingView.widget({
        "autosize": true,
        "symbol": "${sym}",
        "interval": "D",
        "container_id": "tv_chart"
      });
    </script>
    </body>
    </html>
    `;
    
    await page.goto('about:blank');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    const iframe = await page.$('iframe');
    const frame = await iframe.contentFrame();
    try {
      const text = await frame.content();
      if (text.includes('Apple Inc')) {
        console.log(sym, '=> FAILED (Contains Apple)');
      } else if (text.includes('This symbol doesn')) {
        console.log(sym, '=> FAILED (Does not exist)');
      } else {
        console.log(sym, '=> SUCCESS');
      }
    } catch(e) {
      console.log(sym, '=> Error:', e.message);
    }
  };
  
  await testSymbol('INDEX:NIFTY');
  await testSymbol('INDEX:NIFTY50');
  await testSymbol('INDEX:BANKNIFTY');
  await testSymbol('NIFTY50');
  await testSymbol('BANKNIFTY');
  
  await browser.close();
})();
