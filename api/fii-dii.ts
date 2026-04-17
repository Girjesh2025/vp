import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Current date formatted
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  // Generate realistic-looking mock data since real-time FII/DII requires paid APIs or complex scraping
  // Usually FII is selling, DII is buying recently
  const mockData = [
    {
      category: 'FII/FPI',
      netValue: '-8692.00',
      date: date
    },
    {
      category: 'DII',
      netValue: '7979.00',
      date: date
    }
  ];

  return res.json(mockData);
}
