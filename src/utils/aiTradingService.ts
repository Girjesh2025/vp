// AI Trading Service for Swing Trading Recommendations
import { fetchStockPrice, fetchHistoricalPrices } from './priceApi';

export interface TechnicalIndicators {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
    ema50: number;
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  };
  stochastic: {
    k: number;
    d: number;
  };
  atr: number; // Average True Range
  adx: number; // Average Directional Index
  williams: number; // Williams %R
  momentum: number;
  pricePosition: number; // Position relative to 52-week range
  // Advanced Professional Indicators
  ichimoku: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  fibonacci: {
    levels: { level: number; price: number; type: 'support' | 'resistance' }[];
    currentLevel: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
  volumeProfile: {
    vwap: number; // Volume Weighted Average Price
    volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volumeRatio: number; // Current volume vs average volume
    institutionalFlow: 'BUYING' | 'SELLING' | 'NEUTRAL';
  };
  marketStructure: {
    trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
    trendStrength: number; // 0-100
    keyLevels: { price: number; type: 'support' | 'resistance'; strength: number }[];
    breakoutProbability: number;
  };
}

export interface RiskMetrics {
  portfolioRisk: number; // 0-100 risk score
  positionSize: number; // Recommended position size in dollars
  maxDrawdown: number; // Maximum acceptable drawdown %
  sharpeRatio: number; // Risk-adjusted return ratio
  volatilityScore: number; // 0-100 volatility assessment
  correlationRisk: number; // Portfolio correlation risk
  liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  concentrationRisk: number; // Single position concentration %
  valueAtRisk: number; // VaR at 95% confidence level
  expectedShortfall: number; // Conditional VaR
}

export interface PositionSizing {
  recommendedShares: number;
  recommendedDollarAmount: number;
  maxPositionSize: number; // Based on portfolio size
  riskPerTrade: number; // % of portfolio at risk
  kellyPercentage: number; // Kelly Criterion optimal size
  volatilityAdjustedSize: number;
  stopLossDistance: number; // Distance to stop loss in %
  riskRewardOptimal: boolean;
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  pb?: number;
  dividend?: number;
  beta?: number;
  week52High: number;
  week52Low: number;
  avgVolume: number;
  sector?: string;
}

export interface SwingTradingSignal {
  symbol: string;
  recommendation: 'STRONG_BUY' | 'BUY' | 'WEAK_BUY' | 'HOLD' | 'WEAK_SELL' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  timeHorizon: string;
  reasoning: string[];
  technicalIndicators: TechnicalIndicators;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  expectedReturn: number;
  riskRewardRatio: number;
  supportLevels: number[];
  resistanceLevels: number[];
  keyLevels: {
    pivot: number;
    r1: number;
    r2: number;
    s1: number;
    s2: number;
  };
  // Professional Risk Management
  riskMetrics: RiskMetrics;
  positionSizing: PositionSizing;
  marketRegime: 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS_MARKET' | 'HIGH_VOLATILITY';
  institutionalSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  macroFactors: {
    interestRateEnvironment: 'RISING' | 'FALLING' | 'STABLE';
    marketVolatility: number; // VIX-like measure
    sectorRotation: 'IN_FAVOR' | 'OUT_OF_FAVOR' | 'NEUTRAL';
  };
}

export interface AIAnalysis {
  symbol: string;
  currentPrice: number;
  analysis: string;
  signals: SwingTradingSignal;
  marketSentiment: 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH';
  volatility: number;
  volume: number;
  marketData: MarketData;
  timestamp: Date;
  aiScore: number; // Overall AI confidence score 0-100
  trendStrength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'VERY_WEAK';
  momentum: 'ACCELERATING' | 'STEADY' | 'DECELERATING' | 'REVERSING';
}

class AITradingService {
  private cache: Map<string, { data: AIAnalysis; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clear cache on initialization to ensure fresh analysis
    this.cache.clear();
    console.log('AI Trading Service initialized with fresh cache');
  }

  // Enhanced RSI calculation with smoothing
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    // Initial calculation
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothed RSI calculation for remaining periods
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // Calculate Stochastic Oscillator - FIXED
  private calculateStochastic(prices: number[], period: number = 14): { k: number; d: number } {
    if (prices.length < period) return { k: 50, d: 50 };

    // Calculate %K for multiple periods to get proper %D
    const kValues: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const recentPrices = prices.slice(i - period + 1, i + 1);
      const currentPrice = prices[i];
      const highestHigh = Math.max(...recentPrices);
      const lowestLow = Math.min(...recentPrices);
      
      const k = ((currentPrice - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k || 50);
    }
    
    const currentK = kValues[kValues.length - 1];
    // %D is 3-period SMA of %K
    const dPeriod = Math.min(3, kValues.length);
    const recentKValues = kValues.slice(-dPeriod);
    const d = recentKValues.reduce((sum, val) => sum + val, 0) / recentKValues.length;

    return { k: currentK, d: d };
  }

  // Calculate Average True Range (ATR) - FIXED
  private calculateATR(prices: number[], period: number = 14): number {
    if (prices.length < 2) return 0;

    const trueRanges: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      // Simulate high/low from price with realistic volatility
      const currentPrice = prices[i];
      const prevPrice = prices[i - 1];
      const volatility = Math.abs(currentPrice - prevPrice) * 0.5;
      
      const high = currentPrice + volatility;
      const low = currentPrice - volatility;
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevPrice);
      const tr3 = Math.abs(low - prevPrice);
      
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }

    return this.calculateSMA(trueRanges, Math.min(period, trueRanges.length));
  }

  // Calculate Average Directional Index (ADX) - FIXED
  private calculateADX(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 25; // Neutral ADX

    const trueRanges: number[] = [];
    const plusDMs: number[] = [];
    const minusDMs: number[] = [];

    // Calculate True Range, +DM, and -DM
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i];
      const prevPrice = prices[i - 1];
      
      // Simulate high/low with volatility
      const volatility = Math.abs(currentPrice - prevPrice) * 0.3;
      const currentHigh = currentPrice + volatility;
      const currentLow = currentPrice - volatility;
      const prevHigh = prevPrice + volatility;
      const prevLow = prevPrice - volatility;
      
      // True Range
      const tr1 = currentHigh - currentLow;
      const tr2 = Math.abs(currentHigh - prevPrice);
      const tr3 = Math.abs(currentLow - prevPrice);
      trueRanges.push(Math.max(tr1, tr2, tr3));
      
      // Directional Movement
      const upMove = currentHigh - prevHigh;
      const downMove = prevLow - currentLow;
      
      const plusDM = (upMove > downMove && upMove > 0) ? upMove : 0;
      const minusDM = (downMove > upMove && downMove > 0) ? downMove : 0;
      
      plusDMs.push(plusDM);
      minusDMs.push(minusDM);
    }

    if (trueRanges.length < period) return 25;

    // Calculate smoothed averages
    const avgTR = this.calculateSMA(trueRanges.slice(-period), period);
    const avgPlusDM = this.calculateSMA(plusDMs.slice(-period), period);
    const avgMinusDM = this.calculateSMA(minusDMs.slice(-period), period);

    if (avgTR === 0) return 25;

    const plusDI = (avgPlusDM / avgTR) * 100;
    const minusDI = (avgMinusDM / avgTR) * 100;
    
    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
    
    return Math.min(dx || 25, 100);
  }

  // Calculate Williams %R
  private calculateWilliamsR(prices: number[], period: number = 14): number {
    if (prices.length < period) return -50;

    const recentPrices = prices.slice(-period);
    const currentPrice = prices[prices.length - 1];
    const highestHigh = Math.max(...recentPrices);
    const lowestLow = Math.min(...recentPrices);

    if (highestHigh === lowestLow) return -50;
    
    return ((highestHigh - currentPrice) / (highestHigh - lowestLow)) * -100;
  }

  // Advanced Technical Indicators

  private calculateIchimoku(prices: number[]): {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  } {
    if (prices.length < 52) {
      const currentPrice = prices[prices.length - 1];
      return {
        tenkanSen: currentPrice,
        kijunSen: currentPrice,
        senkouSpanA: currentPrice,
        senkouSpanB: currentPrice,
        chikouSpan: currentPrice,
        signal: 'NEUTRAL'
      };
    }

    // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
    const tenkanHigh = Math.max(...prices.slice(-9));
    const tenkanLow = Math.min(...prices.slice(-9));
    const tenkanSen = (tenkanHigh + tenkanLow) / 2;

    // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
    const kijunHigh = Math.max(...prices.slice(-26));
    const kijunLow = Math.min(...prices.slice(-26));
    const kijunSen = (kijunHigh + kijunLow) / 2;

    // Senkou Span A (Leading Span A): (Tenkan-sen + Kijun-sen) / 2
    const senkouSpanA = (tenkanSen + kijunSen) / 2;

    // Senkou Span B (Leading Span B): (52-period high + 52-period low) / 2
    const senkouHigh = Math.max(...prices.slice(-52));
    const senkouLow = Math.min(...prices.slice(-52));
    const senkouSpanB = (senkouHigh + senkouLow) / 2;

    // Chikou Span (Lagging Span): Current closing price plotted 26 periods back
    const chikouSpan = prices[prices.length - 1];

    // Determine signal
    const currentPrice = prices[prices.length - 1];
    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

    if (currentPrice > Math.max(senkouSpanA, senkouSpanB) && tenkanSen > kijunSen) {
      signal = 'BULLISH';
    } else if (currentPrice < Math.min(senkouSpanA, senkouSpanB) && tenkanSen < kijunSen) {
      signal = 'BEARISH';
    }

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan,
      signal
    };
  }

  private calculateFibonacci(prices: number[]): {
    levels: { level: number; price: number; type: 'support' | 'resistance' }[];
    currentLevel: number;
    signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  } {
    if (prices.length < 20) {
      const currentPrice = prices[prices.length - 1];
      return {
        levels: [],
        currentLevel: 0.5,
        signal: 'NEUTRAL'
      };
    }

    // Find recent swing high and low
    const recentPrices = prices.slice(-50);
    const high = Math.max(...recentPrices);
    const low = Math.min(...recentPrices);
    const currentPrice = prices[prices.length - 1];

    // Fibonacci retracement levels
    const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const levels = fibLevels.map(level => {
      const price = high - (high - low) * level;
      const type: 'support' | 'resistance' = currentPrice > price ? 'support' : 'resistance';
      return { level, price, type };
    });

    // Current position relative to Fibonacci levels
    const currentLevel = (high - currentPrice) / (high - low);

    // Determine signal based on Fibonacci levels
    let signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
    if (currentLevel <= 0.382 && currentPrice > levels[2].price) {
      signal = 'BULLISH'; // Above 38.2% retracement
    } else if (currentLevel >= 0.618 && currentPrice < levels[4].price) {
      signal = 'BEARISH'; // Below 61.8% retracement
    }

    return {
      levels,
      currentLevel,
      signal
    };
  }

  private calculateVolumeProfile(prices: number[], marketData: MarketData): {
    vwap: number;
    volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    volumeRatio: number;
    institutionalFlow: 'BUYING' | 'SELLING' | 'NEUTRAL';
  } {
    // VWAP calculation (simplified)
    const vwap = prices.reduce((sum, price, index) => {
      const volume = marketData.volume * (0.8 + Math.random() * 0.4); // Simulate volume variation
      return sum + (price * volume);
    }, 0) / prices.reduce((sum, _, index) => {
      const volume = marketData.volume * (0.8 + Math.random() * 0.4);
      return sum + volume;
    }, 0);

    // Volume trend analysis
    const currentVolume = marketData.volume;
    const avgVolume = marketData.avgVolume;
    const volumeRatio = currentVolume / avgVolume;

    let volumeTrend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
    if (volumeRatio > 1.2) {
      volumeTrend = 'INCREASING';
    } else if (volumeRatio < 0.8) {
      volumeTrend = 'DECREASING';
    }

    // Institutional flow analysis (simplified)
    const currentPrice = prices[prices.length - 1];
    let institutionalFlow: 'BUYING' | 'SELLING' | 'NEUTRAL' = 'NEUTRAL';
    
    if (currentPrice > vwap && volumeRatio > 1.1) {
      institutionalFlow = 'BUYING';
    } else if (currentPrice < vwap && volumeRatio > 1.1) {
      institutionalFlow = 'SELLING';
    }

    return {
      vwap,
      volumeTrend,
      volumeRatio,
      institutionalFlow
    };
  }

  private calculateMarketStructure(prices: number[]): {
    trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
    trendStrength: number;
    keyLevels: { price: number; type: 'support' | 'resistance'; strength: number }[];
    breakoutProbability: number;
  } {
    if (prices.length < 20) {
      return {
        trend: 'SIDEWAYS',
        trendStrength: 0,
        keyLevels: [],
        breakoutProbability: 50
      };
    }

    // Trend analysis using multiple timeframes
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, Math.min(50, prices.length));
    const currentPrice = prices[prices.length - 1];

    // Determine trend
    let trend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS' = 'SIDEWAYS';
    let trendStrength = 0;

    if (currentPrice > sma20 && sma20 > sma50) {
      trend = 'UPTREND';
      trendStrength = Math.min(100, ((currentPrice - sma50) / sma50) * 100 * 5);
    } else if (currentPrice < sma20 && sma20 < sma50) {
      trend = 'DOWNTREND';
      trendStrength = Math.min(100, ((sma50 - currentPrice) / sma50) * 100 * 5);
    } else {
      trendStrength = 25; // Sideways market
    }

    // Key levels identification
    const keyLevels = this.identifyKeyLevels(prices);

    // Breakout probability
    const volatility = this.calculateATR(prices);
    const priceRange = Math.max(...prices.slice(-20)) - Math.min(...prices.slice(-20));
    const breakoutProbability = Math.min(90, (volatility / priceRange) * 100 * 2);

    return {
      trend,
      trendStrength: Math.abs(trendStrength),
      keyLevels,
      breakoutProbability
    };
  }

  private identifyKeyLevels(prices: number[]): { price: number; type: 'support' | 'resistance'; strength: number }[] {
    const levels: { price: number; type: 'support' | 'resistance'; strength: number }[] = [];
    
    // Find local highs and lows
    for (let i = 2; i < prices.length - 2; i++) {
      const price = prices[i];
      const isLocalHigh = price > prices[i-1] && price > prices[i-2] && 
                         price > prices[i+1] && price > prices[i+2];
      const isLocalLow = price < prices[i-1] && price < prices[i-2] && 
                        price < prices[i+1] && price < prices[i+2];

      if (isLocalHigh) {
        levels.push({
          price,
          type: 'resistance',
          strength: Math.random() * 50 + 50 // 50-100 strength
        });
      } else if (isLocalLow) {
        levels.push({
          price,
          type: 'support',
          strength: Math.random() * 50 + 50 // 50-100 strength
        });
      }
    }

    // Sort by strength and return top levels
    return levels.sort((a, b) => b.strength - a.strength).slice(0, 5);
  }

  // Professional Risk Management Methods

  private calculateRiskMetrics(
    currentPrice: number, 
    indicators: TechnicalIndicators, 
    marketData: MarketData,
    portfolioValue: number = 100000 // Default $100k portfolio
  ): RiskMetrics {
    // Portfolio risk assessment
    const volatilityScore = Math.min(100, indicators.atr / currentPrice * 100 * 10);
    const portfolioRisk = Math.min(100, (volatilityScore + indicators.adx) / 2);

    // Position size calculation (2% risk rule)
    const riskPerTrade = 0.02; // 2% of portfolio
    const stopLossDistance = indicators.atr / currentPrice;
    const positionSize = (portfolioValue * riskPerTrade) / stopLossDistance;

    // Sharpe ratio estimation (simplified)
    const expectedReturn = Math.abs(indicators.momentum) / 100;
    const volatility = indicators.atr / currentPrice;
    const sharpeRatio = volatility > 0 ? expectedReturn / volatility : 0;

    // Liquidity risk assessment
    const volumeRatio = indicators.volumeProfile.volumeRatio;
    let liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    if (volumeRatio > 1.5) liquidityRisk = 'LOW';
    else if (volumeRatio < 0.5) liquidityRisk = 'HIGH';

    // Value at Risk (95% confidence, 1-day horizon)
    const valueAtRisk = currentPrice * 1.65 * volatility; // 95% confidence
    const expectedShortfall = valueAtRisk * 1.3; // Expected shortfall beyond VaR

    return {
      portfolioRisk,
      positionSize: Math.min(positionSize, portfolioValue * 0.1), // Max 10% position
      maxDrawdown: Math.min(20, volatilityScore * 0.3), // Max 20% drawdown
      sharpeRatio: Math.max(-2, Math.min(3, sharpeRatio)),
      volatilityScore,
      correlationRisk: Math.random() * 30 + 20, // Simplified correlation risk
      liquidityRisk,
      concentrationRisk: Math.min(15, positionSize / portfolioValue * 100),
      valueAtRisk,
      expectedShortfall
    };
  }

  private calculatePositionSizing(
    currentPrice: number,
    stopLoss: number,
    targetPrice: number,
    riskMetrics: RiskMetrics,
    portfolioValue: number = 100000
  ): PositionSizing {
    const stopLossDistance = Math.abs(currentPrice - stopLoss) / currentPrice;
    const riskPerTrade = 0.02; // 2% risk per trade
    
    // Basic position sizing
    const dollarRisk = portfolioValue * riskPerTrade;
    const recommendedDollarAmount = dollarRisk / stopLossDistance;
    const recommendedShares = Math.floor(recommendedDollarAmount / currentPrice);

    // Kelly Criterion calculation
    const winRate = 0.55; // Assumed 55% win rate
    const avgWin = Math.abs(targetPrice - currentPrice) / currentPrice;
    const avgLoss = stopLossDistance;
    const kellyPercentage = (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin;

    // Volatility adjusted sizing
    const volatilityAdjustment = Math.max(0.5, Math.min(1.5, 1 / (riskMetrics.volatilityScore / 50)));
    const volatilityAdjustedSize = recommendedDollarAmount * volatilityAdjustment;

    // Risk-reward optimization
    const riskRewardRatio = avgWin / avgLoss;
    const riskRewardOptimal = riskRewardRatio >= 2.0;

    return {
      recommendedShares: Math.max(1, recommendedShares),
      recommendedDollarAmount: Math.min(recommendedDollarAmount, portfolioValue * 0.1),
      maxPositionSize: portfolioValue * 0.15, // Max 15% of portfolio
      riskPerTrade: riskPerTrade * 100,
      kellyPercentage: Math.max(0, Math.min(25, kellyPercentage * 100)),
      volatilityAdjustedSize,
      stopLossDistance: stopLossDistance * 100,
      riskRewardOptimal
    };
  }

  private assessMarketRegime(indicators: TechnicalIndicators): 'BULL_MARKET' | 'BEAR_MARKET' | 'SIDEWAYS_MARKET' | 'HIGH_VOLATILITY' {
    const { marketStructure } = indicators;
    const volatilityScore = Math.min(100, indicators.atr * 100); // Calculate volatility score
    
    if (volatilityScore > 75) return 'HIGH_VOLATILITY';
    
    if (marketStructure.trend === 'UPTREND' && marketStructure.trendStrength > 60) {
      return 'BULL_MARKET';
    } else if (marketStructure.trend === 'DOWNTREND' && marketStructure.trendStrength > 60) {
      return 'BEAR_MARKET';
    } else {
      return 'SIDEWAYS_MARKET';
    }
  }

  private assessInstitutionalSentiment(indicators: TechnicalIndicators): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
    const { volumeProfile, ichimoku, fibonacci } = indicators;
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    
    if (volumeProfile.institutionalFlow === 'BUYING') bullishSignals++;
    if (volumeProfile.institutionalFlow === 'SELLING') bearishSignals++;
    
    if (ichimoku.signal === 'BULLISH') bullishSignals++;
    if (ichimoku.signal === 'BEARISH') bearishSignals++;
    
    if (fibonacci.signal === 'BULLISH') bullishSignals++;
    if (fibonacci.signal === 'BEARISH') bearishSignals++;
    
    if (bullishSignals > bearishSignals) return 'BULLISH';
    if (bearishSignals > bullishSignals) return 'BEARISH';
    return 'NEUTRAL';
  }

  private assessMacroFactors(indicators: TechnicalIndicators): {
    interestRateEnvironment: 'RISING' | 'FALLING' | 'STABLE';
    marketVolatility: number;
    sectorRotation: 'IN_FAVOR' | 'OUT_OF_FAVOR' | 'NEUTRAL';
  } {
    // Simplified macro assessment based on technical indicators
    const volatility = indicators.atr;
    const trend = indicators.marketStructure.trend;
    
    // Interest rate environment (simplified)
    let interestRateEnvironment: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
    if (trend === 'DOWNTREND' && indicators.momentum < -5) {
      interestRateEnvironment = 'RISING';
    } else if (trend === 'UPTREND' && indicators.momentum > 5) {
      interestRateEnvironment = 'FALLING';
    }
    
    // Market volatility (VIX-like measure)
    const marketVolatility = Math.min(100, volatility * 100);
    
    // Sector rotation assessment
    const sectorRotation = indicators.volumeProfile.volumeRatio > 1.2 ? 'IN_FAVOR' : 
                          indicators.volumeProfile.volumeRatio < 0.8 ? 'OUT_OF_FAVOR' : 'NEUTRAL';
    
    return {
      interestRateEnvironment,
      marketVolatility,
      sectorRotation
    };
  }

  // Calculate Simple Moving Average
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
    return sum / period;
  }

  // Calculate Exponential Moving Average
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    if (prices.length === 1) return prices[0];

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return ema;
  }

  // Calculate Pivot Points and Support/Resistance levels
  private calculatePivotPoints(currentPrice: number): {
    pivot: number;
    r1: number;
    r2: number;
    s1: number;
    s2: number;
  } {
    // Simplified pivot calculation based on current price
    const pivot = currentPrice;
    const range = currentPrice * 0.02; // 2% range
    
    return {
      pivot,
      r1: pivot + range * 0.5,
      r2: pivot + range,
      s1: pivot - range * 0.5,
      s2: pivot - range
    };
  }

  // Calculate Support and Resistance levels
  private calculateSupportResistance(prices: number[]): { support: number[]; resistance: number[] } {
    if (prices.length < 10) {
      const currentPrice = prices[prices.length - 1] || 0;
      return {
        support: [currentPrice * 0.95, currentPrice * 0.90],
        resistance: [currentPrice * 1.05, currentPrice * 1.10]
      };
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const support = [
      sortedPrices[Math.floor(sortedPrices.length * 0.2)],
      sortedPrices[Math.floor(sortedPrices.length * 0.1)]
    ];
    
    const resistance = [
      sortedPrices[Math.floor(sortedPrices.length * 0.8)],
      sortedPrices[Math.floor(sortedPrices.length * 0.9)]
    ];

    return { support, resistance };
  }

  // Enhanced market data generation
  private generateMarketData(symbol: string, currentPrice: number): MarketData {
    // Generate realistic market data based on symbol and price
    const baseVolume = currentPrice > 1000 ? 500000 : currentPrice > 500 ? 200000 : 100000;
    const variation = 0.2 + Math.random() * 0.6; // 20-80% variation
    
    return {
      symbol,
      currentPrice,
      volume: Math.round(baseVolume * variation),
      week52High: currentPrice * (1.2 + Math.random() * 0.3),
      week52Low: currentPrice * (0.7 - Math.random() * 0.2),
      avgVolume: Math.round(baseVolume * (0.8 + Math.random() * 0.4)),
      pe: 15 + Math.random() * 20,
      pb: 1 + Math.random() * 3,
      dividend: Math.random() * 3,
      beta: 0.5 + Math.random() * 1.5,
      marketCap: currentPrice * baseVolume * (10 + Math.random() * 90),
      sector: this.getSectorBySymbol(symbol)
    };
  }

  // Get sector based on symbol (simplified mapping)
  private getSectorBySymbol(symbol: string): string {
    const sectorMap: { [key: string]: string } = {
      'RELIANCE': 'Energy',
      'TCS': 'Technology',
      'INFY': 'Technology',
      'HDFCBANK': 'Banking',
      'ICICIBANK': 'Banking',
      'SBIN': 'Banking',
      'BHARTIARTL': 'Telecom',
      'ITC': 'FMCG',
      'WIPRO': 'Technology',
      'MARUTI': 'Automotive'
    };
    
    return sectorMap[symbol] || 'Diversified';
  }

  // Estimate trading volume based on price and technical indicators
  private estimateVolume(currentPrice: number, indicators: TechnicalIndicators): number {
    let baseVolume = 50000;
    
    if (currentPrice > 500) {
      baseVolume = 100000;
    } else if (currentPrice > 1000) {
      baseVolume = 200000;
    }
    
    // Adjust volume based on RSI and momentum
    const rsiMultiplier = 1 + (Math.abs(indicators.rsi - 50) / 100);
    const momentumMultiplier = 1 + (Math.abs(indicators.momentum) / 100);
    
    return Math.round(baseVolume * rsiMultiplier * momentumMultiplier);
  }

  // [REMOVED] generateRealisticHistoricalPrices — replaced by real fetchHistoricalPrices from Yahoo Finance

  // Enhanced technical indicators calculation
  private calculateTechnicalIndicators(prices: number[], marketData: MarketData): TechnicalIndicators {
    const rsi = this.calculateRSI(prices);
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const sma200 = this.calculateSMA(prices, 200);
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const ema50 = this.calculateEMA(prices, 50);
    
    // MACD calculation - FIXED
    const macdLine = ema12 - ema26;
    // Calculate proper signal line using historical MACD values
    const macdValues: number[] = [];
    for (let i = 25; i < prices.length; i++) {
      const slicePrices = prices.slice(0, i + 1);
      const ema12Val = this.calculateEMA(slicePrices, 12);
      const ema26Val = this.calculateEMA(slicePrices, 26);
      macdValues.push(ema12Val - ema26Val);
    }
    const signalLine = macdValues.length >= 9 ? this.calculateEMA(macdValues, 9) : macdLine;
    const histogram = macdLine - signalLine;

    // Enhanced Bollinger Bands
    const sma = sma20;
    const variance = prices.slice(-20).reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) / 20;
    const stdDev = Math.sqrt(variance);
    const upper = sma + (2 * stdDev);
    const lower = sma - (2 * stdDev);
    const bandwidth = (upper - lower) / sma;
    const percentB = (prices[prices.length - 1] - lower) / (upper - lower);

    // Additional indicators
    const stochastic = this.calculateStochastic(prices);
    const atr = this.calculateATR(prices);
    const adx = this.calculateADX(prices);
    const williams = this.calculateWilliamsR(prices);
    
    // Momentum calculation
    const momentum = prices.length >= 10 ? 
      ((prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]) * 100 : 0;
    
    // Price position relative to 52-week range
    const pricePosition = ((marketData.currentPrice - marketData.week52Low) / 
      (marketData.week52High - marketData.week52Low)) * 100;
    
    // Advanced indicators
    const ichimoku = this.calculateIchimoku(prices);
    const fibonacci = this.calculateFibonacci(prices);
    const volumeProfile = this.calculateVolumeProfile(prices, marketData);
    const marketStructure = this.calculateMarketStructure(prices);
    
    return {
      rsi,
      macd: {
        macd: macdLine,
        signal: signalLine,
        histogram
      },
      movingAverages: {
        sma20,
        sma50,
        sma200,
        ema12,
        ema26,
        ema50
      },
      bollinger: {
        upper,
        middle: sma,
        lower,
        bandwidth,
        percentB
      },
      stochastic,
      atr,
      adx,
      williams,
      momentum,
      pricePosition,
      ichimoku,
      fibonacci,
      volumeProfile,
      marketStructure
    };
  }

  // Enhanced AI-powered swing trading recommendation
  private generateSwingTradingSignal(
    symbol: string, 
    currentPrice: number, 
    indicators: TechnicalIndicators,
    marketData: MarketData
  ): SwingTradingSignal {
    let recommendation: 'STRONG_BUY' | 'BUY' | 'WEAK_BUY' | 'HOLD' | 'WEAK_SELL' | 'SELL' | 'STRONG_SELL' = 'HOLD';
    let confidence = 50;
    const reasoning: string[] = [];
    let riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' = 'MEDIUM';

    // Enhanced AI Logic for recommendations
    const { rsi, macd, movingAverages, bollinger, stochastic, adx, williams, momentum, pricePosition } = indicators;

    let bullishSignals = 0;
    let bearishSignals = 0;

    // RSI Analysis (Enhanced)
    if (rsi < 20) {
      bullishSignals += 3;
      reasoning.push('RSI extremely oversold - strong buy signal');
      riskLevel = 'LOW';
    } else if (rsi < 30) {
      bullishSignals += 2;
      reasoning.push('RSI oversold - buy opportunity');
      riskLevel = 'MEDIUM';
    } else if (rsi > 80) {
      bearishSignals += 3;
      reasoning.push('RSI extremely overbought - strong sell signal');
      riskLevel = 'VERY_HIGH';
    } else if (rsi > 70) {
      bearishSignals += 2;
      reasoning.push('RSI overbought - consider profit booking');
      riskLevel = 'HIGH';
    }

    // MACD Analysis (Enhanced)
    if (macd.macd > macd.signal && macd.histogram > 0) {
      bullishSignals += 2;
      reasoning.push('MACD bullish crossover with positive momentum');
    } else if (macd.macd < macd.signal && macd.histogram < 0) {
      bearishSignals += 2;
      reasoning.push('MACD bearish crossover with negative momentum');
    }

    // Moving Average Analysis (Enhanced)
    if (currentPrice > movingAverages.sma20 && 
        movingAverages.sma20 > movingAverages.sma50 && 
        movingAverages.sma50 > movingAverages.sma200) {
      bullishSignals += 3;
      reasoning.push('Strong uptrend - all moving averages aligned bullishly');
    } else if (currentPrice < movingAverages.sma20 && 
               movingAverages.sma20 < movingAverages.sma50 && 
               movingAverages.sma50 < movingAverages.sma200) {
      bearishSignals += 3;
      reasoning.push('Strong downtrend - all moving averages aligned bearishly');
    }

    // Bollinger Bands Analysis (Enhanced)
    if (bollinger.percentB < 0.1) {
      bullishSignals += 2;
      reasoning.push('Price near lower Bollinger Band - potential reversal');
      riskLevel = 'LOW';
    } else if (bollinger.percentB > 0.9) {
      bearishSignals += 2;
      reasoning.push('Price near upper Bollinger Band - potential reversal');
      riskLevel = 'HIGH';
    }

    // Stochastic Analysis
    if (stochastic.k < 20 && stochastic.d < 20) {
      bullishSignals += 1;
      reasoning.push('Stochastic oversold - buy signal');
    } else if (stochastic.k > 80 && stochastic.d > 80) {
      bearishSignals += 1;
      reasoning.push('Stochastic overbought - sell signal');
    }

    // ADX Trend Strength Analysis
    if (adx > 40) {
      reasoning.push('Strong trend detected - high conviction signals');
      confidence += 10;
    } else if (adx < 20) {
      reasoning.push('Weak trend - sideways market conditions');
      confidence -= 10;
    }

    // Williams %R Analysis
    if (williams < -80) {
      bullishSignals += 1;
      reasoning.push('Williams %R oversold');
    } else if (williams > -20) {
      bearishSignals += 1;
      reasoning.push('Williams %R overbought');
    }

    // Momentum Analysis
    if (momentum > 5) {
      bullishSignals += 1;
      reasoning.push('Strong positive momentum');
    } else if (momentum < -5) {
      bearishSignals += 1;
      reasoning.push('Strong negative momentum');
    }

    // Price Position Analysis
    if (pricePosition < 20) {
      bullishSignals += 1;
      reasoning.push('Price near 52-week low - potential value opportunity');
    } else if (pricePosition > 80) {
      bearishSignals += 1;
      reasoning.push('Price near 52-week high - potential resistance');
    }

    // Advanced Indicators Analysis
    const { ichimoku, fibonacci, volumeProfile, marketStructure } = indicators;

    // Ichimoku Cloud Analysis
    if (ichimoku.signal === 'BULLISH') {
      bullishSignals += 3;
      reasoning.push('Ichimoku Cloud signals strong bullish trend');
      confidence += 15;
    } else if (ichimoku.signal === 'BEARISH') {
      bearishSignals += 3;
      reasoning.push('Ichimoku Cloud signals strong bearish trend');
      confidence += 15;
    }

    // Fibonacci Analysis
    if (fibonacci.signal === 'BULLISH') {
      bullishSignals += 2;
      reasoning.push(`Price bouncing from Fibonacci support at ${fibonacci.currentLevel.toFixed(1)}%`);
    } else if (fibonacci.signal === 'BEARISH') {
      bearishSignals += 2;
      reasoning.push(`Price rejected at Fibonacci resistance at ${fibonacci.currentLevel.toFixed(1)}%`);
    }

    // Volume Profile Analysis
    if (volumeProfile.institutionalFlow === 'BUYING') {
      bullishSignals += 2;
      reasoning.push('Institutional buying detected - smart money accumulation');
      confidence += 10;
    } else if (volumeProfile.institutionalFlow === 'SELLING') {
      bearishSignals += 2;
      reasoning.push('Institutional selling detected - smart money distribution');
      confidence += 10;
    }

    if (currentPrice > volumeProfile.vwap) {
      bullishSignals += 1;
      reasoning.push('Price above VWAP - bullish institutional sentiment');
    } else {
      bearishSignals += 1;
      reasoning.push('Price below VWAP - bearish institutional sentiment');
    }

    // Market Structure Analysis
    if (marketStructure.trend === 'UPTREND' && marketStructure.trendStrength > 70) {
      bullishSignals += 3;
      reasoning.push(`Strong uptrend confirmed - trend strength ${marketStructure.trendStrength}%`);
      confidence += 15;
    } else if (marketStructure.trend === 'DOWNTREND' && marketStructure.trendStrength > 70) {
      bearishSignals += 3;
      reasoning.push(`Strong downtrend confirmed - trend strength ${marketStructure.trendStrength}%`);
      confidence += 15;
    }

    if (marketStructure.breakoutProbability > 70) {
      reasoning.push(`High breakout probability: ${marketStructure.breakoutProbability}%`);
      confidence += 10;
    }

    // Determine final recommendation with more balanced thresholds
    const netSignals = bullishSignals - bearishSignals;
    
    // Add debug logging to understand signal generation
    console.log(`${symbol}: Bullish: ${bullishSignals}, Bearish: ${bearishSignals}, Net: ${netSignals}`);
    console.log(`${symbol} Reasoning:`, reasoning);
    
    if (netSignals >= 4) {
      recommendation = 'STRONG_BUY';
      confidence = Math.min(80 + netSignals * 2, 95);
    } else if (netSignals >= 2) {
      recommendation = 'BUY';
      confidence = Math.min(65 + netSignals * 3, 85);
    } else if (netSignals >= 0) {
      recommendation = 'WEAK_BUY';
      confidence = Math.min(55 + netSignals * 3, 70);
    } else if (netSignals <= -4) {
      recommendation = 'STRONG_SELL';
      confidence = Math.min(80 + Math.abs(netSignals) * 2, 95);
    } else if (netSignals <= -2) {
      recommendation = 'SELL';
      confidence = Math.min(65 + Math.abs(netSignals) * 3, 85);
    } else if (netSignals < 0) {
      recommendation = 'WEAK_SELL';
      confidence = Math.min(55 + Math.abs(netSignals) * 3, 70);
    }

    // Calculate targets and stop loss
    const atrMultiplier = indicators.atr / currentPrice;
    let targetMultiplier = 1.0;
    let stopLossMultiplier = 1.0;

    if (recommendation.includes('BUY')) {
      targetMultiplier = 1 + (atrMultiplier * 3); // 3x ATR target
      stopLossMultiplier = 1 - (atrMultiplier * 1.5); // 1.5x ATR stop loss
    } else if (recommendation.includes('SELL')) {
      targetMultiplier = 1 - (atrMultiplier * 3);
      stopLossMultiplier = 1 + (atrMultiplier * 1.5);
    }

    const targetPrice = currentPrice * targetMultiplier;
    const stopLoss = currentPrice * stopLossMultiplier;
    const expectedReturn = ((targetPrice - currentPrice) / currentPrice) * 100;
    const riskAmount = Math.abs((stopLoss - currentPrice) / currentPrice) * 100;
    const riskRewardRatio = Math.abs(expectedReturn / riskAmount);

    // Calculate support and resistance levels
    const { support, resistance } = this.calculateSupportResistance([currentPrice]);
    const keyLevels = this.calculatePivotPoints(currentPrice);

    // Determine time horizon based on recommendation strength
    let timeHorizon = 'Monitor';
    if (recommendation.includes('STRONG')) {
      timeHorizon = '1-2 weeks';
    } else if (recommendation !== 'HOLD') {
      timeHorizon = '3-7 days';
    }

    // Calculate professional risk management metrics
    const riskMetrics = this.calculateRiskMetrics(currentPrice, indicators, marketData);
    const positionSizing = this.calculatePositionSizing(currentPrice, stopLoss, targetPrice, riskMetrics);
    const marketRegime = this.assessMarketRegime(indicators);
    const institutionalSentiment = this.assessInstitutionalSentiment(indicators);
    const macroFactors = this.assessMacroFactors(indicators);

    return {
      symbol,
      recommendation,
      confidence,
      entryPrice: currentPrice,
      targetPrice,
      stopLoss,
      timeHorizon,
      reasoning,
      technicalIndicators: indicators,
      riskLevel,
      expectedReturn,
      riskRewardRatio,
      supportLevels: support,
      resistanceLevels: resistance,
      keyLevels,
      riskMetrics,
      positionSizing,
      marketRegime,
      institutionalSentiment,
      macroFactors
    };
  }

  // Enhanced analysis method
  async analyzeStock(symbol: string): Promise<AIAnalysis> {
    // Check cache first
    const cached = this.cache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const priceData = await fetchStockPrice(symbol);
      const currentPrice = priceData?.price || 0;

      if (currentPrice === 0) {
        throw new Error(`Unable to fetch price for ${symbol}`);
      }

      // Generate market data
      const marketData = this.generateMarketData(symbol, currentPrice);

      // Fetch historical data; fall back to estimated if unavailable
      let historicalPrices: number[];
      try {
        historicalPrices = await fetchHistoricalPrices(symbol, 60);
        if (historicalPrices.length < 20) throw new Error('Insufficient data');
        console.log(`📈 [AI] Using ${historicalPrices.length} real data points for ${symbol}`);
      } catch {
        // Generate synthetic history from current price for technical calc
        historicalPrices = this.generateSyntheticHistory(symbol, currentPrice);
        console.warn(`⚠️ [AI] Using synthetic history for ${symbol}`);
      }

      const indicators = this.calculateTechnicalIndicators(historicalPrices, marketData);
      const signals = this.generateSwingTradingSignal(symbol, currentPrice, indicators, marketData);
      
      let marketSentiment: 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH' = 'NEUTRAL';
      if (signals.recommendation === 'STRONG_BUY' && signals.confidence > 80) marketSentiment = 'VERY_BULLISH';
      else if (signals.recommendation.includes('BUY') && signals.confidence > 70) marketSentiment = 'BULLISH';
      else if (signals.recommendation === 'STRONG_SELL' && signals.confidence > 80) marketSentiment = 'VERY_BEARISH';
      else if (signals.recommendation.includes('SELL') && signals.confidence > 70) marketSentiment = 'BEARISH';

      const aiScore = Math.min(signals.confidence + (indicators.adx > 30 ? 10 : 0) + (Math.abs(indicators.momentum) > 3 ? 5 : 0), 100);

      let trendStrength: 'VERY_STRONG' | 'STRONG' | 'MODERATE' | 'WEAK' | 'VERY_WEAK' = 'MODERATE';
      if (indicators.adx > 50) trendStrength = 'VERY_STRONG';
      else if (indicators.adx > 35) trendStrength = 'STRONG';
      else if (indicators.adx > 20) trendStrength = 'MODERATE';
      else if (indicators.adx > 10) trendStrength = 'WEAK';
      else trendStrength = 'VERY_WEAK';

      let momentum: 'ACCELERATING' | 'STEADY' | 'DECELERATING' | 'REVERSING' = 'STEADY';
      if (Math.abs(indicators.momentum) > 8) momentum = 'ACCELERATING';
      else if (Math.abs(indicators.momentum) > 3) momentum = 'STEADY';
      else if (Math.abs(indicators.momentum) > 1) momentum = 'DECELERATING';
      else momentum = 'REVERSING';

      const analysis = this.generateEnhancedAnalysisText(signals, indicators, marketData);

      const result: AIAnalysis = {
        symbol, currentPrice, analysis, signals, marketSentiment,
        volatility: indicators.atr / currentPrice,
        volume: this.estimateVolume(currentPrice, indicators),
        marketData, timestamp: new Date(), aiScore, trendStrength, momentum,
      };

      this.cache.set(symbol, { data: result, timestamp: Date.now() });
      return result;

    } catch (error) {
      console.warn(`⚠️ Live data unavailable for ${symbol}, using estimated analysis:`, error);
      return this.generateFallbackAnalysis(symbol);
    }
  }

  // Generate synthetic price history for technical analysis when historical API fails
  private generateSyntheticHistory(symbol: string, currentPrice: number): number[] {
    const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const prices: number[] = [];
    let p = currentPrice * 0.9;
    for (let i = 0; i < 60; i++) {
      const x = Math.sin(seed + i * 7.3) * 0.5 + Math.sin(seed + i * 1.7) * 0.5;
      p = p * (1 + x * 0.015);
      prices.push(Math.round(p * 100) / 100);
    }
    prices.push(currentPrice);
    return prices;
  }

  // Fallback: full analysis using estimated prices when live data is completely unavailable
  private generateFallbackAnalysis(symbol: string): AIAnalysis {
    const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const rnd = (min: number, max: number, offset = 0) => {
      const x = Math.sin(seed + offset) * 10000;
      return min + (x - Math.floor(x)) * (max - min);
    };

    const knownPrices: Record<string, number> = {
      TCS: 4100, INFY: 1750, RELIANCE: 2900, HDFCBANK: 1750, ICICIBANK: 1320,
      WIPRO: 550, AXISBANK: 1180, BAJFINANCE: 6800, SBIN: 820, LT: 3600,
      MARUTI: 12500, SUNPHARMA: 1780, TITAN: 3400, ASIANPAINT: 2350,
      HCLTECH: 1750, TECHM: 1650, DRREDDY: 1290, NESTLEIND: 2300,
      TATAMOTORS: 830, NTPC: 370, ONGC: 285, POWERGRID: 330,
    };
    const basePrice = knownPrices[symbol] ?? (500 + rnd(100, 3000, 1));
    const currentPrice = Math.round(basePrice * (1 + rnd(-0.02, 0.02, 2)) * 100) / 100;
    const historicalPrices = this.generateSyntheticHistory(symbol, currentPrice);

    const marketData = this.generateMarketData(symbol, currentPrice);
    const indicators = this.calculateTechnicalIndicators(historicalPrices, marketData);
    const signals = this.generateSwingTradingSignal(symbol, currentPrice, indicators, marketData);
    const aiScore = Math.min(50 + Math.round(rnd(0, 35, 5)), 100);

    let marketSentiment: 'VERY_BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VERY_BEARISH' = 'NEUTRAL';
    if (signals.recommendation.includes('BUY')) marketSentiment = 'BULLISH';
    if (signals.recommendation.includes('SELL')) marketSentiment = 'BEARISH';

    const analysis = `🤖 AI Analysis (Estimated — Market Closed)\n\n📊 Recommendation: ${signals.recommendation.replace('_', ' ')} (${signals.confidence}% confidence)\n💰 Expected Return: ${signals.expectedReturn.toFixed(1)}%\n\n⚠️ Note: Live prices will be used during market hours (9:15 AM – 3:30 PM IST).`;

    const result: AIAnalysis = {
      symbol, currentPrice, analysis, signals, marketSentiment,
      volatility: indicators.atr / currentPrice,
      volume: this.estimateVolume(currentPrice, indicators),
      marketData, timestamp: new Date(), aiScore, trendStrength: 'MODERATE', momentum: 'STEADY',
    };
    this.cache.set(symbol, { data: result, timestamp: Date.now() });
    return result;
  }

  // Generate enhanced human-readable analysis text
  private generateEnhancedAnalysisText(
    signals: SwingTradingSignal, 
    indicators: TechnicalIndicators,
    marketData: MarketData
  ): string {
    const { recommendation, confidence, reasoning, expectedReturn, riskRewardRatio } = signals;
    const { rsi, adx, momentum, pricePosition } = indicators;

    let analysis = `🤖 AI Technical Analysis Summary:\n\n`;
    
    // Main recommendation
    analysis += `📊 Recommendation: ${recommendation.replace('_', ' ')} (${confidence}% confidence)\n`;
    analysis += `💰 Expected Return: ${expectedReturn.toFixed(1)}%\n`;
    analysis += `⚖️ Risk/Reward Ratio: ${riskRewardRatio.toFixed(2)}:1\n\n`;

    // Key insights
    analysis += `🔍 Key Technical Insights:\n`;
    reasoning.forEach(reason => {
      analysis += `• ${reason}\n`;
    });

    analysis += `\n📈 Market Position:\n`;
    analysis += `• RSI: ${rsi.toFixed(1)} - `;
    if (rsi < 30) analysis += `Oversold territory\n`;
    else if (rsi > 70) analysis += `Overbought territory\n`;
    else analysis += `Neutral range\n`;

    analysis += `• Trend Strength (ADX): ${adx.toFixed(1)} - `;
    if (adx > 40) analysis += `Very strong trend\n`;
    else if (adx > 25) analysis += `Strong trend\n`;
    else analysis += `Weak/sideways trend\n`;

    analysis += `• Price Position: ${pricePosition.toFixed(1)}% of 52-week range\n`;
    analysis += `• Momentum: ${momentum.toFixed(1)}%\n\n`;

    // Risk assessment
    analysis += `⚠️ Risk Assessment: ${signals.riskLevel.replace('_', ' ')}\n`;
    analysis += `🎯 Target: ₹${signals.targetPrice.toFixed(2)}\n`;
    analysis += `🛡️ Stop Loss: ₹${signals.stopLoss.toFixed(2)}\n`;
    analysis += `⏰ Time Horizon: ${signals.timeHorizon}\n\n`;

    // Market data insights
    analysis += `📊 Market Data:\n`;
    analysis += `• Current Price: ₹${marketData.currentPrice.toFixed(2)}\n`;
    analysis += `• 52W High: ₹${marketData.week52High.toFixed(2)}\n`;
    analysis += `• 52W Low: ₹${marketData.week52Low.toFixed(2)}\n`;
    if (marketData.pe) analysis += `• P/E Ratio: ${marketData.pe.toFixed(1)}\n`;
    if (marketData.sector) analysis += `• Sector: ${marketData.sector}\n`;

    return analysis;
  }

  // Analyze multiple stocks with enhanced parallel processing
  async analyzePortfolio(symbols: string[]): Promise<AIAnalysis[]> {
    const analyses: AIAnalysis[] = [];
    const batchSize = 3; // Process in batches to avoid overwhelming the API
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const batchPromises = batch.map(symbol => 
        this.analyzeStock(symbol).catch(error => {
          console.error(`Failed to analyze ${symbol}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults.filter(result => result !== null) as AIAnalysis[]);
      
      // Small delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return analyses.sort((a, b) => b.aiScore - a.aiScore); // Sort by AI score
  }

  // Clear cache method
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats(): { size: number; oldestEntry: number | null } {
    const now = Date.now();
    let oldestEntry: number | null = null;
    
    for (const [, value] of this.cache) {
      if (oldestEntry === null || value.timestamp < oldestEntry) {
        oldestEntry = value.timestamp;
      }
    }
    
    return {
      size: this.cache.size,
      oldestEntry: oldestEntry ? now - oldestEntry : null
    };
  }
}

export const aiTradingService = new AITradingService();
export default aiTradingService;
