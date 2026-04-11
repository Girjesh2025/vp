const { NseIndia } = require("stock-nse-india");
const nseIndia = new NseIndia();
nseIndia.getIndexOptionChain("NIFTY").then(data => console.log(data.filtered.data.slice(0,2))).catch(e => console.error(e));
