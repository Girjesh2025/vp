export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
  marketCap: number; // in crores
  pe?: number;
  pb?: number;
  dividend?: number;
  beta?: number;
  description: string;
  fundamentalScore: number; // 0-100
  technicalScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
}

export const topIndianStocks: StockInfo[] = [
  // Large Cap - Technology
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services',
    sector: 'Information Technology',
    exchange: 'NSE',
    marketCap: 1200000,
    pe: 28.5,
    pb: 12.8,
    dividend: 1.2,
    beta: 0.8,
    description: 'Leading IT services company with strong global presence and digital transformation capabilities',
    fundamentalScore: 92,
    technicalScore: 78,
    riskLevel: 'LOW',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'INFY',
    name: 'Infosys Limited',
    sector: 'Information Technology',
    exchange: 'NSE',
    marketCap: 650000,
    pe: 24.2,
    pb: 8.5,
    dividend: 2.1,
    beta: 0.9,
    description: 'Global leader in consulting, technology and outsourcing with strong digital capabilities',
    fundamentalScore: 88,
    technicalScore: 82,
    riskLevel: 'LOW',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'WIPRO',
    name: 'Wipro Limited',
    sector: 'Information Technology',
    exchange: 'NSE',
    marketCap: 280000,
    pe: 22.1,
    pb: 4.2,
    dividend: 1.8,
    beta: 1.1,
    description: 'IT services and consulting company with focus on digital transformation',
    fundamentalScore: 75,
    technicalScore: 68,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'MEDIUM_TERM'
  },

  // Large Cap - Banking & Financial Services
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Limited',
    sector: 'Banking & Financial Services',
    exchange: 'NSE',
    marketCap: 850000,
    pe: 18.5,
    pb: 2.8,
    dividend: 1.5,
    beta: 1.2,
    description: 'Leading private sector bank with strong retail and corporate banking franchise',
    fundamentalScore: 90,
    technicalScore: 85,
    riskLevel: 'LOW',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Limited',
    sector: 'Banking & Financial Services',
    exchange: 'NSE',
    marketCap: 720000,
    pe: 16.2,
    pb: 2.1,
    dividend: 2.0,
    beta: 1.3,
    description: 'Second largest private sector bank with strong digital banking capabilities',
    fundamentalScore: 85,
    technicalScore: 79,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    sector: 'Banking & Financial Services',
    exchange: 'NSE',
    marketCap: 450000,
    pe: 12.8,
    pb: 1.2,
    dividend: 3.2,
    beta: 1.4,
    description: 'Largest public sector bank with extensive branch network and government backing',
    fundamentalScore: 72,
    technicalScore: 65,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'MEDIUM_TERM'
  },
  {
    symbol: 'KOTAKBANK',
    name: 'Kotak Mahindra Bank',
    sector: 'Banking & Financial Services',
    exchange: 'NSE',
    marketCap: 380000,
    pe: 20.5,
    pb: 2.5,
    dividend: 1.2,
    beta: 1.1,
    description: 'Premium private bank with strong wealth management and investment banking',
    fundamentalScore: 82,
    technicalScore: 74,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },

  // Large Cap - Oil & Gas
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Limited',
    sector: 'Oil & Gas',
    exchange: 'NSE',
    marketCap: 1500000,
    pe: 24.8,
    pb: 2.2,
    dividend: 0.8,
    beta: 1.0,
    description: 'Diversified conglomerate with interests in petrochemicals, oil refining, and telecom',
    fundamentalScore: 88,
    technicalScore: 81,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'ONGC',
    name: 'Oil and Natural Gas Corporation',
    sector: 'Oil & Gas',
    exchange: 'NSE',
    marketCap: 320000,
    pe: 8.5,
    pb: 0.8,
    dividend: 5.2,
    beta: 1.3,
    description: 'Largest oil and gas exploration company in India with government backing',
    fundamentalScore: 68,
    technicalScore: 58,
    riskLevel: 'HIGH',
    investmentHorizon: 'SHORT_TERM'
  },

  // Large Cap - FMCG
  {
    symbol: 'HINDUNILVR',
    name: 'Hindustan Unilever Limited',
    sector: 'FMCG',
    exchange: 'NSE',
    marketCap: 520000,
    pe: 58.2,
    pb: 12.5,
    dividend: 1.8,
    beta: 0.6,
    description: 'Leading FMCG company with strong brand portfolio and rural penetration',
    fundamentalScore: 85,
    technicalScore: 72,
    riskLevel: 'LOW',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'ITC',
    name: 'ITC Limited',
    sector: 'FMCG',
    exchange: 'NSE',
    marketCap: 380000,
    pe: 28.5,
    pb: 4.2,
    dividend: 4.5,
    beta: 0.8,
    description: 'Diversified conglomerate with strong presence in cigarettes, FMCG, and hotels',
    fundamentalScore: 78,
    technicalScore: 65,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'MEDIUM_TERM'
  },

  // Large Cap - Telecom
  {
    symbol: 'BHARTIARTL',
    name: 'Bharti Airtel Limited',
    sector: 'Telecom',
    exchange: 'NSE',
    marketCap: 450000,
    pe: 32.1,
    pb: 3.8,
    dividend: 1.2,
    beta: 1.2,
    description: 'Leading telecom operator with strong 4G/5G network and African operations',
    fundamentalScore: 80,
    technicalScore: 76,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },

  // Large Cap - Pharmaceuticals
  {
    symbol: 'SUNPHARMA',
    name: 'Sun Pharmaceutical Industries',
    sector: 'Pharmaceuticals',
    exchange: 'NSE',
    marketCap: 220000,
    pe: 28.5,
    pb: 3.2,
    dividend: 1.5,
    beta: 0.9,
    description: 'Largest pharmaceutical company in India with strong global presence',
    fundamentalScore: 82,
    technicalScore: 70,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'DRREDDY',
    name: 'Dr. Reddys Laboratories',
    sector: 'Pharmaceuticals',
    exchange: 'NSE',
    marketCap: 95000,
    pe: 18.2,
    pb: 2.8,
    dividend: 1.8,
    beta: 1.0,
    description: 'Global pharmaceutical company with strong R&D capabilities and US market presence',
    fundamentalScore: 78,
    technicalScore: 68,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'MEDIUM_TERM'
  },

  // Large Cap - Automobiles
  {
    symbol: 'MARUTI',
    name: 'Maruti Suzuki India Limited',
    sector: 'Automobiles',
    exchange: 'NSE',
    marketCap: 320000,
    pe: 25.8,
    pb: 3.5,
    dividend: 2.2,
    beta: 1.1,
    description: 'Leading passenger car manufacturer with strong market share and dealer network',
    fundamentalScore: 85,
    technicalScore: 73,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Limited',
    sector: 'Automobiles',
    exchange: 'NSE',
    marketCap: 180000,
    pe: 15.2,
    pb: 1.8,
    dividend: 0.0,
    beta: 1.5,
    description: 'Automotive manufacturer with presence in passenger and commercial vehicles',
    fundamentalScore: 65,
    technicalScore: 62,
    riskLevel: 'HIGH',
    investmentHorizon: 'SHORT_TERM'
  },

  // Large Cap - Metals & Mining
  {
    symbol: 'TATASTEEL',
    name: 'Tata Steel Limited',
    sector: 'Metals & Mining',
    exchange: 'NSE',
    marketCap: 150000,
    pe: 45.2,
    pb: 1.2,
    dividend: 2.8,
    beta: 1.6,
    description: 'Integrated steel producer with operations in India and Europe',
    fundamentalScore: 70,
    technicalScore: 58,
    riskLevel: 'HIGH',
    investmentHorizon: 'SHORT_TERM'
  },
  {
    symbol: 'HINDALCO',
    name: 'Hindalco Industries Limited',
    sector: 'Metals & Mining',
    exchange: 'NSE',
    marketCap: 95000,
    pe: 12.5,
    pb: 1.5,
    dividend: 1.8,
    beta: 1.4,
    description: 'Leading aluminum and copper producer with integrated operations',
    fundamentalScore: 72,
    technicalScore: 65,
    riskLevel: 'HIGH',
    investmentHorizon: 'MEDIUM_TERM'
  },

  // Mid Cap - High Growth Potential
  {
    symbol: 'BAJFINANCE',
    name: 'Bajaj Finance Limited',
    sector: 'Financial Services',
    exchange: 'NSE',
    marketCap: 420000,
    pe: 28.5,
    pb: 6.2,
    dividend: 1.0,
    beta: 1.3,
    description: 'Leading NBFC with strong consumer finance and digital lending capabilities',
    fundamentalScore: 88,
    technicalScore: 82,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'HCLTECH',
    name: 'HCL Technologies Limited',
    sector: 'Information Technology',
    exchange: 'NSE',
    marketCap: 380000,
    pe: 22.8,
    pb: 5.2,
    dividend: 2.5,
    beta: 1.0,
    description: 'IT services company with strong engineering and R&D services',
    fundamentalScore: 82,
    technicalScore: 75,
    riskLevel: 'MEDIUM',
    investmentHorizon: 'LONG_TERM'
  },
  {
    symbol: 'ASIANPAINT',
    name: 'Asian Paints Limited',
    sector: 'Paints & Coatings',
    exchange: 'NSE',
    marketCap: 280000,
    pe: 52.5,
    pb: 8.5,
    dividend: 1.5,
    beta: 0.8,
    description: 'Leading paint manufacturer with strong brand and distribution network',
    fundamentalScore: 88,
    technicalScore: 78,
    riskLevel: 'LOW',
    investmentHorizon: 'LONG_TERM'
  }
];

export const getSectorStocks = (sector: string): StockInfo[] => {
  return topIndianStocks.filter(stock => stock.sector === sector);
};

export const getTopStocksBySector = (): { [key: string]: StockInfo[] } => {
  const sectors: { [key: string]: StockInfo[] } = {};
  
  topIndianStocks.forEach(stock => {
    if (!sectors[stock.sector]) {
      sectors[stock.sector] = [];
    }
    sectors[stock.sector].push(stock);
  });
  
  // Sort stocks within each sector by fundamental score
  Object.keys(sectors).forEach(sector => {
    sectors[sector].sort((a, b) => b.fundamentalScore - a.fundamentalScore);
  });
  
  return sectors;
};

export const getTopRecommendations = (count: number = 10): StockInfo[] => {
  return topIndianStocks
    .sort((a, b) => (b.fundamentalScore + b.technicalScore) - (a.fundamentalScore + a.technicalScore))
    .slice(0, count);
};

export const getStocksByRiskLevel = (riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): StockInfo[] => {
  return topIndianStocks.filter(stock => stock.riskLevel === riskLevel);
};

export const getStocksByInvestmentHorizon = (horizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM'): StockInfo[] => {
  return topIndianStocks.filter(stock => stock.investmentHorizon === horizon);
};