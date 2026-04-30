import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const testSymbol = async (sym) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <body>
    <div id="tv_chart"></div>
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
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.waitForSelector('iframe');
    const iframe = await page.$('iframe');
    const frame = await iframe.contentFrame();
    
    try {
      const text = await frame.content();
      if (text.includes('Apple Inc')) console.log(sym, '=> FAILED (Contains Apple)');
      else console.log(sym, '=> SUCCESS');
      
      const title = await frame.$eval('a[title="See more on TradingView"]', el => el.textContent).catch(() => 'unknown');
      console.log('Title:', title);
    } catch(e) {
      console.log('Error:', e.message);
    }
  };
  
  await testSymbol('BSE:SENSEX');
  await testSymbol('NSE:NIFTY');
  await testSymbol('BSE:NIFTY50');
  
  await browser.close();
})();
