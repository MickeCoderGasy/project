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
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

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
            maxOutputTokens: 50000,
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
        // Check for safety-related blocks
        if (data.promptFeedback) {
          console.error('Prompt was blocked due to safety settings:', data.promptFeedback);
          throw new Error(`Request blocked. Reason: ${data.promptFeedback.blockReason}`);
        }
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

  async analyzeStock(symbol: string): Promise<any> {
    const prompt = `
    You are an expert financial analyst AI. Your task is to provide a detailed, data-driven analysis of a stock based on its ticker symbol.

    Analyze the stock for the symbol: "${symbol}"

    Respond exclusively with a single, minified JSON object. Do not include any text, pleasantries, or markdown formatting before or after the JSON object.

    The JSON object must follow this exact structure:
    {
      "symbol": "TICKER",
      "recommendation": "BUY" | "SELL" | "HOLD",
      "confidence": <number between 1 and 100>,
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "timeframe": "<string, e.g., '1-3 Months', '6-12 Months'>",
      "targetPrice": <number>,
      "stopLoss": <number>,
      "analysis": "<string, a concise summary of the overall analysis>",
      "keyFactors": [
        "<string, a key bullish or bearish factor>",
        "<string, another key factor>",
        "<string, a third key factor>"
      ]
    }

    Instructions for generating the values:
    - "recommendation": Base this on a holistic view of technical and fundamental indicators.
    - "confidence": Quantify your certainty based on market volatility, indicator strength, and earnings certainty.
    - "riskLevel": Assess the risk based on the stock's volatility, sector risks, and market conditions.
    - "analysis": Write a brief, professional summary explaining the reasoning behind your recommendation.
    - "keyFactors": List the three most critical data points influencing your decision.

    If the provided symbol does not appear to be a valid stock ticker, return a JSON object with an "error" key, like this:
    { "error": "Invalid stock symbol provided." }
    `;

    const responseText = await this.generateContent(prompt);
    
    try {
      const parsedResponse = JSON.parse(responseText);
      if (parsedResponse.error) {
        throw new Error(parsedResponse.error);
      }
      // The service now returns the full, structured object
      return parsedResponse;
    } catch (error) {
      console.error('Failed to parse Gemini JSON response:', error);
      throw new Error('The AI response was not in the expected format.');
    }
  }

  // The old extraction helper functions are no longer needed and are removed.
}

export default new GeminiService();