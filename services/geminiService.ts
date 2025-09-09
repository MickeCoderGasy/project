import { GEMINI_API_KEY } from '@env';

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

class GeminiService {
  private apiKey: string = GEMINI_API_KEY || '';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    if (!this.apiKey) {
      console.warn('Gemini API key not found. Please set it in your .env file.');
    }
  }


  async generateContent(prompt: string, conversationHistory: GeminiMessage[] = []): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const messages: GeminiMessage[] = [
      ...conversationHistory,
      {
        role: 'user',
        parts: [{ text: this.formatTradingPrompt(prompt) }]
      }
    ];

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();
      
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid response format from Gemini API');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  private formatTradingPrompt(userPrompt: string): string {
    const systemContext = `
You are an expert AI trading assistant with deep knowledge of financial markets, technical analysis, and investment strategies. 

Your role is to:
- Provide accurate market analysis and insights
- Offer trading recommendations with proper risk management
- Explain complex financial concepts in simple terms
- Always emphasize the importance of proper risk management
- Never provide financial advice as investment recommendations (always include disclaimers)

Guidelines:
- Keep responses concise but informative
- Include specific price targets, stop losses, and risk levels when relevant
- Focus on education and analysis rather than guarantees
- Always remind users that trading involves risk

User Query: ${userPrompt}

Please provide a helpful, educational response about this trading-related topic.
`;
    return systemContext;
  }

  async analyzeStock(symbol: string, timeframe: string = '1D'): Promise<any> {
    const prompt = `
    Provide a comprehensive analysis for ${symbol} stock including:
    1. Current technical analysis (support, resistance, trend)
    2. Fundamental analysis summary
    3. Risk assessment
    4. Trading recommendation with entry/exit points
    5. Time horizon for the trade
    
    Format your response to include specific metrics and actionable insights.
    `;

    const response = await this.generateContent(prompt);
    
    // Parse the response and return structured data
    return {
      symbol,
      analysis: response,
      recommendation: this.extractRecommendation(response),
      targetPrice: this.extractTargetPrice(response),
      stopLoss: this.extractStopLoss(response),
      confidence: Math.floor(Math.random() * 30) + 70, // Simulated confidence score
      timestamp: new Date().toISOString()
    };
  }

  private extractRecommendation(text: string): 'BUY' | 'SELL' | 'HOLD' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('buy') || lowerText.includes('bullish')) return 'BUY';
    if (lowerText.includes('sell') || lowerText.includes('bearish')) return 'SELL';
    return 'HOLD';
  }

  private extractTargetPrice(text: string): number | null {
    const priceMatch = text.match(/target.*?\$?(\d+\.?\d*)/i);
    return priceMatch ? parseFloat(priceMatch[1]) : null;
  }

  private extractStopLoss(text: string): number | null {
    const stopMatch = text.match(/stop.*?loss.*?\$?(\d+\.?\d*)/i);
    return stopMatch ? parseFloat(stopMatch[1]) : null;
  }
}

export default new GeminiService();