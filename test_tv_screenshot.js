import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const testSymbol = async (sym, filename) => {
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
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    // Wait for the iframe to load
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: filename });
    console.log('Saved', filename);
  };
  
  await testSymbol('NSE:NIFTY', 'test_nifty.png');
  await testSymbol('BSE:SENSEX', 'test_sensex.png');
  await testSymbol('NSE:BANKNIFTY', 'test_banknifty.png');
  await testSymbol('NIFTY', 'test_nifty_only.png');
  await testSymbol('INDEX:NIFTY', 'test_index_nifty.png');
  
  await browser.close();
})();
