import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const html = `
  <!DOCTYPE html>
  <html>
  <body>
  <div id="tv_chart"></div>
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script type="text/javascript">
    new TradingView.widget({
      "autosize": true,
      "symbol": "NSE:NIFTY",
      "interval": "D",
      "container_id": "tv_chart"
    });
  </script>
  </body>
  </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  // Wait for iframe
  await page.waitForSelector('iframe');
  const iframe = await page.$('iframe');
  const frame = await iframe.contentFrame();
  
  // Wait for the symbol title element
  try {
    await frame.waitForSelector('.symbol-title', { timeout: 5000 });
    const title = await frame.$eval('.symbol-title', el => el.textContent);
    console.log('Symbol for NSE:NIFTY is:', title);
  } catch(e) {
    console.log('Timeout or error:', e.message);
  }
  
  // Test NSE:NIFTY50
  const html2 = html.replace('NSE:NIFTY', 'BSE:SENSEX');
  await page.setContent(html2, { waitUntil: 'networkidle0' });
  await page.waitForSelector('iframe');
  const iframe2 = await page.$('iframe');
  const frame2 = await iframe2.contentFrame();
  try {
    await frame2.waitForSelector('.symbol-title', { timeout: 5000 });
    const title2 = await frame2.$eval('.symbol-title', el => el.textContent);
    console.log('Symbol for BSE:SENSEX is:', title2);
  } catch(e) {
    console.log('Error BSE:SENSEX:', e.message);
  }
  
  await browser.close();
})();
