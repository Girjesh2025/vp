import { fetchStockPrice } from './src/utils/priceApi.ts';

async function test() {
  const data = await fetchStockPrice('RELIANCE.NS');
  console.log(data);
}

test();
