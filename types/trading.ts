export interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  pe?: number;
  timestamp: Date;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'HOLD';
  price: number;
  targetPrice?: number;
  stopLoss?: number;
  confidence: number;
  timeframe: string;
  reasoning: string[];
  createdAt: Date;
}

export interface Portfolio {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  positions: Position[];
  cash: number;
}

export interface Position {
  symbol: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  relatedSymbols: string[];
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  type: 'bullish' | 'bearish' | 'warning' | 'neutral';
  confidence: number;
  symbols: string[];
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  analysis?: TradingAnalysis;
}

export interface TradingAnalysis {
  symbol?: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  targetPrice?: number;
  stopLoss?: number;
  timeframe: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  keyFactors: string[];
  technicalIndicators?: {
    rsi?: number;
    macd?: number;
    sma50?: number;
    sma200?: number;
  };
}