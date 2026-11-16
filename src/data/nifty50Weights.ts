/**
 * NIFTY 50 constituent weights as of the close of 2026-10-30.
 *
 * Source:
 *  - constituents: niftyindices.com ind_nifty50list.csv (50 stocks)
 *  - top-10 weights and sector totals: NSE Indexogram factsheet dated October 30, 2026
 *  - the remaining weight of each sector is split by Yahoo free-float market cap
 * Checked against real daily Nifty moves 2026-11-02 → 11-16: model within ~1-5 pts on 9 of 10 days (worst 20 pts).
 *
 * Weights drift with prices between rebalances (index units = weight / basePrice), so they stay correct
 * until NSE changes constituents or free-float factors. Refresh this file after each rebalance
 * (semi-annual, cut-off Jan 31 / Jul 31) from the new factsheet.
 */
export const NIFTY50_WEIGHTS_ASOF = '2026-10-30';

export const NIFTY50_WEIGHTS: { symbol: string; weight: number; basePrice: number }[] = [
  { symbol: 'HDFCBANK', weight: 9.950, basePrice: 692.80 },
  { symbol: 'ICICIBANK', weight: 9.390, basePrice: 1398.00 },
  { symbol: 'RELIANCE', weight: 7.300, basePrice: 1164.90 },
  { symbol: 'BHARTIARTL', weight: 5.630, basePrice: 1973.70 },
  { symbol: 'LT', weight: 4.250, basePrice: 3871.70 },
  { symbol: 'INFY', weight: 3.920, basePrice: 1185.00 },
  { symbol: 'SBIN', weight: 3.730, basePrice: 961.85 },
  { symbol: 'AXISBANK', weight: 3.280, basePrice: 1217.00 },
  { symbol: 'KOTAKBANK', weight: 3.190, basePrice: 461.60 },
  { symbol: 'TCS', weight: 2.489, basePrice: 2502.60 },
  { symbol: 'ITC', weight: 2.418, basePrice: 265.60 },
  { symbol: 'BAJFINANCE', weight: 2.400, basePrice: 939.10 },
  { symbol: 'M&M', weight: 2.368, basePrice: 2840.30 },
  { symbol: 'ETERNAL', weight: 2.344, basePrice: 343.65 },
  { symbol: 'TITAN', weight: 1.580, basePrice: 4436.50 },
  { symbol: 'HINDUNILVR', weight: 1.555, basePrice: 1864.60 },
  { symbol: 'SUNPHARMA', weight: 1.530, basePrice: 1777.70 },
  { symbol: 'HCLTECH', weight: 1.456, basePrice: 1428.10 },
  { symbol: 'ADANIPORTS', weight: 1.451, basePrice: 1850.00 },
  { symbol: 'NTPC', weight: 1.378, basePrice: 316.25 },
  { symbol: 'SHRIRAMFIN', weight: 1.334, basePrice: 823.15 },
  { symbol: 'MARUTI', weight: 1.312, basePrice: 11397.00 },
  { symbol: 'TATASTEEL', weight: 1.287, basePrice: 167.60 },
  { symbol: 'ULTRACEMCO', weight: 1.247, basePrice: 11045.00 },
  { symbol: 'BSE', weight: 1.247, basePrice: 3510.40 },
  { symbol: 'BEL', weight: 1.240, basePrice: 369.90 },
  { symbol: 'HINDALCO', weight: 1.192, basePrice: 884.70 },
  { symbol: 'POWERGRID', weight: 1.152, basePrice: 265.00 },
  { symbol: 'ASIANPAINT', weight: 1.120, basePrice: 2320.00 },
  { symbol: 'BAJAJ-AUTO', weight: 1.101, basePrice: 10350.00 },
  { symbol: 'JSWSTEEL', weight: 1.062, basePrice: 1246.00 },
  { symbol: 'GRASIM', weight: 1.033, basePrice: 2981.40 },
  { symbol: 'EICHERMOT', weight: 0.961, basePrice: 7220.00 },
  { symbol: 'INDIGO', weight: 0.939, basePrice: 4877.60 },
  { symbol: 'TRENT', weight: 0.936, basePrice: 3017.30 },
  { symbol: 'TECHM', weight: 0.935, basePrice: 1790.80 },
  { symbol: 'ADANIENT', weight: 0.909, basePrice: 2579.40 },
  { symbol: 'BAJAJFINSV', weight: 0.880, basePrice: 1667.60 },
  { symbol: 'COALINDIA', weight: 0.878, basePrice: 389.00 },
  { symbol: 'APOLLOHOSP', weight: 0.872, basePrice: 8448.00 },
  { symbol: 'DRREDDY', weight: 0.841, basePrice: 1352.00 },
  { symbol: 'ONGC', weight: 0.822, basePrice: 225.39 },
  { symbol: 'CIPLA', weight: 0.814, basePrice: 1378.90 },
  { symbol: 'NESTLEIND', weight: 0.770, basePrice: 1167.00 },
  { symbol: 'SBILIFE', weight: 0.629, basePrice: 1658.60 },
  { symbol: 'MAXHEALTH', weight: 0.624, basePrice: 860.00 },
  { symbol: 'TATACONSUM', weight: 0.617, basePrice: 1025.90 },
  { symbol: 'JIOFIN', weight: 0.608, basePrice: 204.50 },
  { symbol: 'TMPV', weight: 0.538, basePrice: 265.40 },
  { symbol: 'HDFCLIFE', weight: 0.492, basePrice: 524.90 },
];
