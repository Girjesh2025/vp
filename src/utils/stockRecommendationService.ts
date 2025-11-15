import { StockInfo, topIndianStocks } from '../data/topIndianStocks';
import { fetchStockPrice } from './priceApi';

export interface StockRecommendation {
  stock: StockInfo;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  aiScore: number; // 0-100
  confidence: number; // 0-100
  currentPrice: number;
  targetPrice: number;
  stopLoss: number;
  expectedReturn: number;
  timeHorizon: string;
  reasons: string[];
  risks: string[];
  catalysts: string[];
  technicalAnalysis: {
    trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    support: number;
    resistance: number;
    momentum: 'STRONG' | 'MODERATE' | 'WEAK';
  };
  fundamentalAnalysis: {
    valuation: 'UNDERVALUED' | 'FAIRLY_VALUED' | 'OVERVALUED';
    growth: 'HIGH' | 'MODERATE' | 'LOW';
    quality: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    financial_health: 'STRONG' | 'STABLE' | 'WEAK';
  };
  marketSentiment: {
    institutional: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    retail: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    analyst: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  };
  lastUpdated: Date;
}

export class StockRecommendationService {
  private marketConditions = {
    volatility: 'MODERATE' as 'LOW' | 'MODERATE' | 'HIGH',
    trend: 'BULLISH' as 'BULLISH' | 'BEARISH' | 'SIDEWAYS',
    sentiment: 'OPTIMISTIC' as 'OPTIMISTIC' | 'NEUTRAL' | 'PESSIMISTIC'
  };

  private calculateAIScore(stock: StockInfo): number {
    let score = 0;
    
    // Fundamental Analysis (40% weight)
    const fundamentalWeight = 0.4;
    score += stock.fundamentalScore * fundamentalWeight;
    
    // Technical Analysis (30% weight)
    const technicalWeight = 0.3;
    score += stock.technicalScore * technicalWeight;
    
    // Risk Assessment (20% weight)
    const riskWeight = 0.2;
    const riskScore = stock.riskLevel === 'LOW' ? 90 : stock.riskLevel === 'MEDIUM' ? 70 : 50;
    score += riskScore * riskWeight;
    
    // Market Conditions (10% weight)
    const marketWeight = 0.1;
    const marketScore = this.getMarketConditionScore(stock);
    score += marketScore * marketWeight;
    
    return Math.round(score);
  }

  private getMarketConditionScore(stock: StockInfo): number {
    let score = 70; // Base score
    
    // Adjust based on sector performance in current market
    const sectorMultipliers: { [key: string]: number } = {
      'Information Technology': 1.2,
      'Banking & Financial Services': 1.1,
      'Pharmaceuticals': 1.15,
      'FMCG': 1.05,
      'Telecom': 1.0,
      'Oil & Gas': 0.9,
      'Automobiles': 0.95,
      'Metals & Mining': 0.85
    };
    
    const multiplier = sectorMultipliers[stock.sector] || 1.0;
    score *= multiplier;
    
    return Math.min(100, Math.max(0, score));
  }

  private generateRecommendation(aiScore: number, stock: StockInfo): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    if (aiScore >= 85) return 'STRONG_BUY';
    if (aiScore >= 75) return 'BUY';
    if (aiScore >= 60) return 'HOLD';
    if (aiScore >= 45) return 'SELL';
    return 'STRONG_SELL';
  }

  private async calculateTargetPrice(stock: StockInfo, aiScore: number): Promise<{ currentPrice: number; targetPrice: number }> {
    try {
      // Fetch real current price
      const priceData = await fetchStockPrice(stock.symbol);
      
      if (!priceData || priceData.price === null || priceData.price === undefined) {
        throw new Error('Invalid price data received');
      }
      
      const currentPrice = priceData.price;
      
      // Calculate target based on AI score and fundamentals
      let targetMultiplier = 1.0;
      
      if (aiScore >= 85) targetMultiplier = 1.25; // 25% upside
      else if (aiScore >= 75) targetMultiplier = 1.15; // 15% upside
      else if (aiScore >= 60) targetMultiplier = 1.05; // 5% upside
      else if (aiScore >= 45) targetMultiplier = 0.95; // 5% downside
      else targetMultiplier = 0.85; // 15% downside
      
      const targetPrice = Math.round(currentPrice * targetMultiplier);
      
      return { currentPrice, targetPrice };
    } catch (error) {
      console.error(`Error fetching price for ${stock.symbol}:`, error);
      // Fallback to estimated price if real price fetch fails
      const estimatedPrice = Math.random() * 2000 + 100;
      let targetMultiplier = 1.0;
      
      if (aiScore >= 85) targetMultiplier = 1.25;
      else if (aiScore >= 75) targetMultiplier = 1.15;
      else if (aiScore >= 60) targetMultiplier = 1.05;
      else if (aiScore >= 45) targetMultiplier = 0.95;
      else targetMultiplier = 0.85;
      
      return { 
        currentPrice: estimatedPrice, 
        targetPrice: Math.round(estimatedPrice * targetMultiplier) 
      };
    }
  }

  private generateReasons(stock: StockInfo, aiScore: number): string[] {
    const reasons: string[] = [];
    
    if (stock.fundamentalScore >= 80) {
      reasons.push('Strong fundamental metrics with consistent growth');
    }
    
    if (stock.technicalScore >= 75) {
      reasons.push('Positive technical indicators showing bullish momentum');
    }
    
    if (stock.riskLevel === 'LOW') {
      reasons.push('Low risk profile suitable for conservative investors');
    }
    
    if (stock.dividend && stock.dividend > 2) {
      reasons.push(`Attractive dividend yield of ${stock.dividend}%`);
    }
    
    if (stock.pe && stock.pe < 20) {
      reasons.push('Trading at reasonable valuation multiples');
    }
    
    // Sector-specific reasons
    switch (stock.sector) {
      case 'Information Technology':
        reasons.push('Benefiting from digital transformation trends');
        break;
      case 'Banking & Financial Services':
        reasons.push('Strong credit growth and improving asset quality');
        break;
      case 'Pharmaceuticals':
        reasons.push('Defensive sector with steady demand');
        break;
      case 'FMCG':
        reasons.push('Stable demand and strong brand portfolio');
        break;
    }
    
    return reasons.slice(0, 4); // Limit to 4 reasons
  }

  private generateRisks(stock: StockInfo): string[] {
    const risks: string[] = [];
    
    if (stock.riskLevel === 'HIGH') {
      risks.push('High volatility and cyclical nature of business');
    }
    
    if (stock.beta && stock.beta > 1.3) {
      risks.push('High beta indicates sensitivity to market movements');
    }
    
    if (stock.pe && stock.pe > 40) {
      risks.push('High valuation multiples may limit upside potential');
    }
    
    // Sector-specific risks
    switch (stock.sector) {
      case 'Oil & Gas':
        risks.push('Commodity price volatility and regulatory changes');
        break;
      case 'Banking & Financial Services':
        risks.push('Interest rate sensitivity and credit risk');
        break;
      case 'Automobiles':
        risks.push('Cyclical demand and raw material cost inflation');
        break;
      case 'Metals & Mining':
        risks.push('Global commodity cycles and environmental regulations');
        break;
    }
    
    risks.push('General market and economic risks');
    
    return risks.slice(0, 3); // Limit to 3 risks
  }

  private generateCatalysts(stock: StockInfo): string[] {
    const catalysts: string[] = [];
    
    // Sector-specific catalysts
    switch (stock.sector) {
      case 'Information Technology':
        catalysts.push('AI and cloud adoption acceleration');
        catalysts.push('Digital transformation initiatives');
        break;
      case 'Banking & Financial Services':
        catalysts.push('Economic recovery and credit growth');
        catalysts.push('Digital banking expansion');
        break;
      case 'Pharmaceuticals':
        catalysts.push('New drug approvals and launches');
        catalysts.push('Export market expansion');
        break;
      case 'FMCG':
        catalysts.push('Rural demand recovery');
        catalysts.push('Premium product portfolio expansion');
        break;
      case 'Telecom':
        catalysts.push('5G rollout and monetization');
        catalysts.push('ARPU improvement initiatives');
        break;
    }
    
    if (stock.fundamentalScore >= 85) {
      catalysts.push('Strong execution track record');
    }
    
    return catalysts.slice(0, 3); // Limit to 3 catalysts
  }

  public async generateStockRecommendation(stock: StockInfo): Promise<StockRecommendation> {
    const aiScore = this.calculateAIScore(stock);
    const recommendation = this.generateRecommendation(aiScore, stock);
    const { currentPrice, targetPrice } = await this.calculateTargetPrice(stock, aiScore);
    
    return {
      stock,
      recommendation,
      aiScore,
      confidence: Math.min(95, aiScore + Math.random() * 10),
      currentPrice,
      targetPrice,
      stopLoss: Math.round(currentPrice * 0.9), // 10% stop loss
      expectedReturn: Math.round(((targetPrice - currentPrice) / currentPrice) * 100),
      timeHorizon: stock.investmentHorizon === 'LONG_TERM' ? '12-18 months' : 
                   stock.investmentHorizon === 'MEDIUM_TERM' ? '6-12 months' : '3-6 months',
      reasons: this.generateReasons(stock, aiScore),
      risks: this.generateRisks(stock),
      catalysts: this.generateCatalysts(stock),
      technicalAnalysis: {
        trend: aiScore >= 70 ? 'BULLISH' : aiScore >= 50 ? 'NEUTRAL' : 'BEARISH',
        support: Math.round(currentPrice * 0.95),
        resistance: Math.round(currentPrice * 1.1),
        momentum: stock.technicalScore >= 80 ? 'STRONG' : 
                 stock.technicalScore >= 60 ? 'MODERATE' : 'WEAK'
      },
      fundamentalAnalysis: {
        valuation: stock.pe && stock.pe < 20 ? 'UNDERVALUED' : 
                  stock.pe && stock.pe > 35 ? 'OVERVALUED' : 'FAIRLY_VALUED',
        growth: stock.fundamentalScore >= 85 ? 'HIGH' : 
               stock.fundamentalScore >= 70 ? 'MODERATE' : 'LOW',
        quality: stock.fundamentalScore >= 90 ? 'EXCELLENT' :
                stock.fundamentalScore >= 80 ? 'GOOD' :
                stock.fundamentalScore >= 60 ? 'AVERAGE' : 'POOR',
        financial_health: stock.riskLevel === 'LOW' ? 'STRONG' :
                         stock.riskLevel === 'MEDIUM' ? 'STABLE' : 'WEAK'
      },
      marketSentiment: {
        institutional: aiScore >= 75 ? 'POSITIVE' : aiScore >= 55 ? 'NEUTRAL' : 'NEGATIVE',
        retail: aiScore >= 70 ? 'POSITIVE' : aiScore >= 50 ? 'NEUTRAL' : 'NEGATIVE',
        analyst: aiScore >= 80 ? 'POSITIVE' : aiScore >= 60 ? 'NEUTRAL' : 'NEGATIVE'
      },
      lastUpdated: new Date()
    };
  }

  public async getTopRecommendations(count: number = 10): Promise<StockRecommendation[]> {
    const recommendations = await Promise.all(
      topIndianStocks.map(stock => this.generateStockRecommendation(stock))
    );
    return recommendations
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, count);
  }

  public async getRecommendationsByRisk(riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<StockRecommendation[]> {
    const filteredStocks = topIndianStocks.filter(stock => stock.riskLevel === riskLevel);
    const recommendations = await Promise.all(
      filteredStocks.map(stock => this.generateStockRecommendation(stock))
    );
    return recommendations.sort((a, b) => b.aiScore - a.aiScore);
  }

  public async getRecommendationsBySector(sector: string): Promise<StockRecommendation[]> {
    const filteredStocks = topIndianStocks.filter(stock => stock.sector === sector);
    const recommendations = await Promise.all(
      filteredStocks.map(stock => this.generateStockRecommendation(stock))
    );
    return recommendations.sort((a, b) => b.aiScore - a.aiScore);
  }

  public async getBuyRecommendations(): Promise<StockRecommendation[]> {
    const topRecs = await this.getTopRecommendations(20);
    return topRecs.filter(rec => rec.recommendation === 'STRONG_BUY' || rec.recommendation === 'BUY');
  }

  public updateMarketConditions(conditions: {
    volatility?: 'LOW' | 'MODERATE' | 'HIGH';
    trend?: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    sentiment?: 'OPTIMISTIC' | 'NEUTRAL' | 'PESSIMISTIC';
  }) {
    this.marketConditions = { ...this.marketConditions, ...conditions };
  }
}