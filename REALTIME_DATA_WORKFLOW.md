# Workflow pour l'intégration de données de marché en temps réel avec Gemini

Ce document décrit un workflow et une solution pour récupérer des données de marché quasi en temps réel et les fournir à l'API Gemini pour enrichir ses analyses.

## 1. Objectif

Permettre à l'application de fournir des analyses Gemini basées sur les données de marché les plus récentes disponibles, améliorant ainsi la pertinence et la précision des recommandations.

## 2. Architecture Proposée

### Composants Clés :
1.  **Source de Données de Marché :** Une API financière tierce fournissant des données en temps réel ou quasi en temps réel (cours des actions, volumes, indicateurs techniques, etc.).
2.  **Service de Récupération de Données (Backend ou Frontend) :** Un module responsable de l'appel à l'API financière et de la mise en forme des données.
3.  **Intégration Gemini :** Modification du `GeminiService` existant pour inclure ces données récentes dans le prompt envoyé à Gemini.

## 3. Workflow Détaillé

### Étape 1 : Choix et Configuration de l'API Financière

*   **Choix de l'API :** Sélectionner une API financière fiable. Exemples :
    *   **Alpha Vantage :** Offre des données historiques et en temps réel (avec des limites pour le temps réel gratuit).
    *   **Finnhub :** Données en temps réel via WebSocket (nécessite une clé API).
    *   **Twelve Data :** Données en temps réel et historiques.
    *   *(Note : La plupart des API de données en temps réel nécessitent une clé API et peuvent avoir des limites de requêtes ou des coûts associés.)*
*   **Configuration :** Obtenir une clé API et la stocker de manière sécurisée (par exemple, dans les variables d'environnement de votre backend ou via `@env` pour Expo, en étant conscient des risques de l'exposer côté client).

### Étape 2 : Récupération des Données de Marché

*   **Fréquence :** Définir une fréquence de récupération appropriée (ex: toutes les 5-15 secondes pour des données quasi en temps réel, ou à la demande avant une requête Gemini).
*   **Implémentation (Exemple Frontend avec Polling) :**
    *   Créer une nouvelle fonction (ex: `fetchRealtimeStockData(symbol: string)`) qui appelle l'API financière.
    *   Utiliser `setInterval` ou un mécanisme similaire pour rafraîchir les données à intervalles réguliers si un affichage continu est nécessaire, ou simplement appeler cette fonction avant d'envoyer une requête à Gemini.
    *   Stocker les données récupérées dans un état local ou un store global de l'application.

    ```typescript
    // Exemple simplifié dans un nouveau service ou un hook
    import { FINANCIAL_API_KEY } from '@env'; // Assurez-vous d'avoir cette variable d'environnement

    interface StockData {
      price: number;
      volume: number;
      // ... autres données pertinentes
    }

    class FinancialDataService {
      private apiKey: string = FINANCIAL_API_KEY || '';
      private baseUrl = 'https://api.example-financial.com'; // Remplacez par l'URL de votre API

      async fetchRealtimeStockData(symbol: string): Promise<StockData | null> {
        if (!this.apiKey) {
          console.warn('Financial API key not found.');
          return null;
        }
        try {
          const response = await fetch(`${this.baseUrl}/quote?symbol=${symbol}&apikey=${this.apiKey}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          // Mapper la réponse de l'API à votre interface StockData
          return {
            price: data.price,
            volume: data.volume,
            // ...
          };
        } catch (error) {
          console.error('Error fetching real-time data:', error);
          return null;
        }
      }
    }

    export const financialDataService = new FinancialDataService();
    ```

### Étape 3 : Pré-traitement et Formatage des Données

*   **Nettoyage :** Assurer que les données sont propres et cohérentes.
*   **Agrégation :** Si nécessaire, agréger plusieurs points de données (ex: moyenne mobile, RSI) avant de les envoyer à Gemini.
*   **Formatage :** Convertir les données brutes en un format textuel clair et concis que Gemini peut facilement interpréter dans le prompt.

    ```typescript
    // Exemple de formatage pour le prompt Gemini
    function formatDataForGemini(symbol: string, data: StockData): string {
      return `Current market data for ${symbol}: Price = ${data.price}, Volume = ${data.volume}.`;
      // Ajoutez d'autres points de données pertinents ici
    }
    ```

### Étape 4 : Intégration avec GeminiService

*   **Modification du Prompt :** Modifier la méthode `analyzeStock` ou `generateContent` dans `GeminiService` pour accepter les données de marché formatées et les inclure dans le `systemContext` ou directement dans le `userPrompt`.

    ```typescript
    // services/geminiService.ts (modification)
    // ... (imports existants)
    // import { financialDataService } from '../path/to/FinancialDataService'; // Importer le nouveau service

    class GeminiService {
      // ... (propriétés et constructeur existants)

      async analyzeStock(symbol: string): Promise<any> {
        // 1. Récupérer les données de marché en temps réel
        const realtimeData = await financialDataService.fetchRealtimeStockData(symbol);
        let realtimeDataPrompt = '';
        if (realtimeData) {
          realtimeDataPrompt = `Here is the latest market data for ${symbol}: Price = ${realtimeData.price}, Volume = ${realtimeData.volume}. `;
          // Ajoutez d'autres données si nécessaire
        } else {
          realtimeDataPrompt = `Could not retrieve real-time data for ${symbol}. Analyzing based on available knowledge. `;
        }

        const prompt = `
        You are an expert financial analyst AI. Your task is to provide a detailed, data-driven analysis of a stock based on its ticker symbol.
        ${realtimeDataPrompt} // Intégrer les données ici

        Analyze the stock for the symbol: "${symbol}"

        Respond exclusively with a single, minified JSON object. Do not include any text, pleasantries, or markdown formatting before or after the JSON object.
        // ... (reste du prompt existant)
        `;

        const responseText = await this.generateContent(prompt);
        // ... (reste de la logique d'analyse)
      }

      // ... (autres méthodes existantes)
    }
    ```

### Étape 5 : Gestion des Erreurs et Affichage

*   **Erreurs d'API Financière :** Gérer les cas où la récupération des données de marché échoue (ex: afficher un message à l'utilisateur, continuer l'analyse Gemini sans les données en temps réel si possible).
*   **Affichage :** Présenter clairement à l'utilisateur que l'analyse est basée sur des données "quasi en temps réel" et, si possible, indiquer l'heure de la dernière mise à jour des données.

## 4. Considérations Importantes

*   **Coût et Limites d'API :** Les API financières en temps réel peuvent être coûteuses ou avoir des limites strictes. Planifiez votre utilisation en conséquence.
*   **Latence :** Même avec des API "en temps réel", il y aura toujours une certaine latence.
*   **Complexité du Prompt :** L'ajout de trop de données brutes au prompt peut rendre l'analyse de Gemini moins efficace ou plus coûteuse. Il est crucial de pré-traiter et de résumer les données de manière intelligente.
*   **Backend vs. Frontend :** Pour une solution plus robuste, sécurisée et pour gérer des volumes de données plus importants, il est souvent préférable de mettre en place un service backend dédié à la récupération et au pré-traitement des données de marché. Cela permet également de masquer la clé API financière.
*   **Disclaimer :** Toujours rappeler aux utilisateurs que les analyses sont générées par une IA et ne constituent pas des conseils financiers.
