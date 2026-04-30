const fetch = require('node-fetch');

async function check() {
  const r = await fetch('http://localhost:3001/api/stock/%5ENSEI');
  console.log(await r.json());
}
check();