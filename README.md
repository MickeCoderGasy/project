# Qubext📈

Qubext is a mobile trading application built with React Native and Expo, featuring an AI-powered trading assistant powered by the Gemini API. It provides a modern, intuitive interface for tracking your portfolio, getting market insights, and chatting with an AI for detailed trading analysis.



## ✨ Key Features

- **Dashboard:** A comprehensive overview of your portfolio, including total value, daily change, and a watchlist of key stocks.
- **AI Insights:** Get AI-curated insights on market opportunities, potential risks, and portfolio optimization strategies.
- **AI Trading Assistant:** An interactive chat interface to get real-time trading analysis, ask questions about the market, and get recommendations on stocks.
- **Detailed Analysis:** The AI assistant can provide in-depth analysis, including technical and fundamental analysis, risk assessment, and trading recommendations with entry and exit points.
- **Modern UI:** A sleek, modern interface with blur effects and linear gradients for a premium user experience.

## 🚀 Tech Stack

- **Frontend:** [React Native](https://reactnative.dev/), [Expo](https://expo.dev/)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI:** [Google Gemini API](https://ai.google.dev/)
- **UI Components:**
  - [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native) for icons
  - [Expo Blur](https://docs.expo.dev/versions/latest/sdk/blur-view/) for blur effects
  - [Expo Linear Gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) for gradients

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or newer)
- [Expo Go](https://expo.dev/go) app on your mobile device or an Android/iOS simulator.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/TradApp.git
    cd TradApp
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your Gemini API Key:**
    - Open `services/geminiService.ts`.
    - Replace the empty string for `apiKey` with your actual Gemini API key.
    ```typescript
    // services/geminiService.ts
    class GeminiService {
      private apiKey: string = 'YOUR_GEMINI_API_KEY'; // 👈 Add your key here
      // ...
    }
    ```

### Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    ```

2.  **Run on your device:**
    - Scan the QR code with the Expo Go app on your iOS or Android device.
    - Or, run in a simulator by pressing `i` for iOS or `a` for Android in the terminal.

## 📂 Project Structure

```
.
├── app/                # Expo Router pages and layouts
│   ├── (tabs)/         # Tab navigation layout and screens
│   │   ├── _layout.tsx
│   │   ├── chat.tsx    # AI Chat screen
│   │   └── index.tsx   # Dashboard screen
│   └── _layout.tsx     # Root layout
├── assets/             # Static assets (images, fonts)
├── components/         # Reusable components
├── constants/          # App constants (colors, styles)
├── services/           # Services for external APIs (Gemini)
│   └── geminiService.ts
├── types/              # TypeScript type definitions
└── ...
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
