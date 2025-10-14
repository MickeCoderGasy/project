import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  UIManager,
  Platform,
  TextInput,
  LayoutAnimation,
  Animated,
} from 'react-native';
import NavigationHeader from '@/components/NavigationHeader';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import {
  ToggleLeft,
  ToggleRight,
  Info, // Keep Info if used elsewhere in this file, otherwise remove
  ShieldCheck, // Keep ShieldCheck if used elsewhere in this file, otherwise remove
  TrendingUp, // Keep TrendingUp if used elsewhere in this file, otherwise remove
  AlertTriangle, // Keep AlertTriangle if used elsewhere in this file, otherwise remove
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  ChevronDown, // Keep for local CollapsibleSection
  ChevronUp,    // Keep for local CollapsibleSection
  ArrowLeft,    // Pour le bouton de retour
} from 'lucide-react-native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import AnalysisResultDisplay from '@/components/AnalysisResultDisplay'; // Import the new component

// --- Configuration Supabase et Webhook depuis les variables d'environnement ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const ENV_MAESTRO_WEBHOOK_URL = process.env.EXPO_PUBLIC_WEBHOOK_URL!;
const ENV_GET_JOB_RESULT_WEBHOOK_URL = process.env.EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL;
//const ENV_GET_JOB_RESULT_WEBHOOK_URL = "https://n8n.qubextai.tech/webhook/result";
const ENV_TEST_SIGNAL_ID = process.env.EXPO_PUBLIC_TEST_SIGNAL_ID; // ID de test pour le streaming

// Vérification de la présence des variables d'environnement pour éviter les erreurs
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ENV_MAESTRO_WEBHOOK_URL) {
  throw new Error("Les variables d'environnement Supabase ou Webhook ne sont pas définies. Vérifiez votre fichier .env et redémarrez le serveur de développement.");
}

// --- Types pour la clarté ---
type TradingStyle = 'intraday' | 'swing';
type RiskLevel = 'basse' | 'moyenne' | 'Haut';
type GainLevel = 'min' | 'moyen' | 'Max';
type ForexPair = 'EUR/USD' | 'USD/JPY' | 'GBP/USD' | 'USD/CHF' | 'AUD/USD' | 'USD/CAD' | 'NZD/USD' | 'XAU/USD';
type StepStatus = 'idle' | 'pending' | 'loading' | 'completed' | 'failed';

// --- Type pour une étape d'analyse (statique) ---
type AnalysisStep = {
  id: string;
  label: string;
  status: StepStatus;
  message: string;
};

// --- Type pour les messages streaming du Signal Agent ---
type StreamingMessage = {
  id: string;
  content: string;
  timestamp: number;
  type: 'info' | 'analysis' | 'signal' | 'warning' | 'success';
};

// --- Constantes pour les options de sélection ---
const MAJOR_PAIRS: ForexPair[] = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD' , 'XAU/USD'];
const TRADING_STYLES: TradingStyle[] = ['intraday', 'swing'];
const RISK_LEVELS: RiskLevel[] = ['basse', 'moyenne', 'Haut'];
const GAIN_LEVELS: GainLevel[] = ['min', 'moyen', 'Max'];

// --- Messages prédéfinis du Signal Agent pour l'animation typewriter ---
const SIGNAL_AGENT_MESSAGES: StreamingMessage[] = [
  {
    id: '1',
    content: "🔍 Initialisation de l'analyse de marché...",
    timestamp: Date.now(),
    type: 'info'
  },
  {
    id: '2', 
    content: "📊 Récupération des données OHLC en temps réel...",
    timestamp: Date.now(),
    type: 'info'
  },
  {
    id: '3',
    content: "📈 Analyse de la structure de prix et des niveaux clés...",
    timestamp: Date.now(),
    type: 'analysis'
  },
  {
    id: '4',
    content: "🎯 Évaluation des zones de confluence SMC...",
    timestamp: Date.now(),
    type: 'analysis'
  },
  {
    id: '5',
    content: "⚡ Calcul des indicateurs techniques (RSI, MACD, SMA)...",
    timestamp: Date.now(),
    type: 'analysis'
  },
  {
    id: '6',
    content: "🌍 Analyse du contexte fondamental et des événements économiques...",
    timestamp: Date.now(),
    type: 'analysis'
  },
  {
    id: '7',
    content: "🧠 Évaluation de la confluence multi-dimensionnelle...",
    timestamp: Date.now(),
    type: 'analysis'
  },
  {
    id: '8',
    content: "⚖️ Calcul du score de confluence (objectif: ≥70/100)...",
    timestamp: Date.now(),
    type: 'analysis'
  },
  {
    id: '9',
    content: "🎲 Génération des signaux de trading avec gestion du risque...",
    timestamp: Date.now(),
    type: 'signal'
  },
  {
    id: '10',
    content: "✅ Validation finale et optimisation des paramètres...",
    timestamp: Date.now(),
    type: 'success'
  }
];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Composant Section Déroulante (CollapsibleSection) - KEPT LOCALLY FOR CONFIGURATION ONLY ---
// This version is simpler as it doesn't need to be as flexible as the one in AnalysisResultDisplay
const CollapsibleSection = ({ title, children, icon: Icon, style }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { colors } = useTheme(); // Use theme colors here

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };
  return (
    <BlurView intensity={20} tint="dark" style={[styles.collapsibleContainer, style]}>
      <TouchableOpacity onPress={toggleExpand} style={styles.collapsibleHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {Icon && <Icon size={18} color="#94A3B8" style={{ marginRight: 10 }} />}
          <Text style={[styles.collapsibleTitle, { color: colors.text }]}>{title}</Text>
        </View>
        {isExpanded ? <ChevronUp size={20} color={colors.primary} /> : <ChevronDown size={20} color={colors.textMuted} />}
      </TouchableOpacity>
      {isExpanded && <View style={styles.collapsibleContent}>{children}</View>}
    </BlurView>
  );
};

// --- Composant utilitaire pour la sélection ---
const SelectionSection = ({ title, options, selectedValue, onSelect }: any) => {
  const { colors } = useTheme(); // Use theme colors here
  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
      <View style={styles.tagContainer}>
        {options.map((option: string) => (
          <TouchableOpacity key={option} style={[styles.tag, selectedValue === option && styles.tagSelected, { borderColor: colors.border }]} onPress={() => onSelect(option)}>
            <Text style={[styles.tagText, selectedValue === option && styles.tagTextSelected, { color: selectedValue === option ? 'white' : colors.text }]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// --- Composant principal de l'écran Analyse ---
export default function AnalyseScreen() {
  const { colors, effectiveTheme } = useTheme();

  const [pair, setPair] = useState<ForexPair>('EUR/USD');
  const [style, setStyle] = useState<TradingStyle>('intraday');
  const [risk, setRisk] = useState<RiskLevel>('moyenne');
  const [gain, setGain] = useState<GainLevel>('moyen');

  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'in_progress' | 'completed' | 'failed'>('pending');
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    { id: 'security_check', label: 'Vérification de sécurité', status: 'idle', message: 'En attente...' },
    { id: 'get_ohlc', label: 'Récupération des données OHLC', status: 'idle', message: 'En attente...' },
    { id: 'price_action_analysis', label: 'Analyse Price Action', status: 'idle', message: 'En attente...' },
    { id: 'indicator_calculation', label: 'Calcul des Indicateurs', status: 'idle', message: 'En attente...' },
    { id: 'signal_generation', label: 'Génération du Signal', status: 'idle', message: 'En attente...' },
    { id: 'final_processing', label: 'Traitement final', status: 'idle', message: 'En attente...' },
  ]);

  const [customWebhookUrl, setCustomWebhookUrl] = useState(ENV_MAESTRO_WEBHOOK_URL);
  const [useCustomWebhookUrl, setUseCustomWebhookUrl] = useState(false);

  // --- États pour le streaming typewriter ---
  const [streamingMessages, setStreamingMessages] = useState<StreamingMessage[]>([]);
  const [currentTypingMessage, setCurrentTypingMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  // --- États pour l'interprétation streamée du signal ---
  const [isStreamingInterpretation, setIsStreamingInterpretation] = useState(false);
  const [interpretationText, setInterpretationText] = useState<string>('');
  const [interpretationComplete, setInterpretationComplete] = useState(false);
  const [showInterpretation, setShowInterpretation] = useState(false);
  
  // --- Pas besoin d'état pour testSignalId, on utilise directement ENV_TEST_SIGNAL_ID ---

  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const realtimeRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeRetryCountRef = useRef(0);
  const typewriterTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_REALTIME_RETRIES = 3;
  const POLLING_FREQUENCY_MS = 10000;

  // --- Fonctions pour l'animation typewriter ---
  const startTypewriterAnimation = useCallback(() => {
    setStreamingMessages([]);
    setCurrentTypingMessage('');
    setIsTyping(true);
    setCurrentMessageIndex(0);
    
    // Démarrer l'animation typewriter
    const typeNextMessage = (index: number) => {
      if (index >= SIGNAL_AGENT_MESSAGES.length) {
        setIsTyping(false);
        return;
      }
      
      const message = SIGNAL_AGENT_MESSAGES[index];
      let charIndex = 0;
      setCurrentTypingMessage('');
      
      const typeChar = () => {
        if (charIndex < message.content.length) {
          setCurrentTypingMessage(message.content.substring(0, charIndex + 1));
          charIndex++;
          typewriterTimeoutRef.current = setTimeout(typeChar, 30 + Math.random() * 20); // Vitesse variable
        } else {
          // Message terminé, l'ajouter à la liste
          setStreamingMessages(prev => [...prev, message]);
          
          // Attendre un peu avant le message suivant
          typewriterTimeoutRef.current = setTimeout(() => {
            setCurrentMessageIndex(index + 1);
            typeNextMessage(index + 1);
          }, 800 + Math.random() * 1200); // Délai variable entre messages
        }
      };
      
      typeChar();
    };
    
    // Démarrer avec un petit délai
    typewriterTimeoutRef.current = setTimeout(() => typeNextMessage(0), 1000);
  }, []);

  const stopTypewriterAnimation = useCallback(() => {
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    setIsTyping(false);
  }, []);

  // --- Fonction pour générer une interprétation à partir des données JSON ---
  const generateInterpretationFromData = (data: any): string => {
    try {
      // Extraire les données du premier élément de pinData (données de test n8n)
      const signalData = data.pinData?.['Get a row']?.[0] || data;
      
      const {
        pair,
        signal_metadata,
        market_validation,
        signals,
        no_signal_analysis,
        fundamental_context,
        market_alerts
      } = signalData;

      let interpretation = `# 🤖 Analyse de Qubext pour ${pair}\n\n`;
      
      // Métadonnées
      if (signal_metadata) {
        interpretation += `**Session de marché:** ${signal_metadata.market_session}\n`;
        interpretation += `**Fraîcheur des données:** ${signal_metadata.data_freshness}\n\n`;
      }

      // Score de confluence
      if (market_validation) {
        const score = market_validation.overall_confluence_score;
        const threshold = market_validation.minimum_threshold;
        
        interpretation += `## 📊 Score de Confluence: ${score}/100\n`;
        interpretation += `**Seuil minimum:** ${threshold}/100\n\n`;
        
        if (score >= threshold) {
          interpretation += `✅ **Le score dépasse le seuil de sécurité!**\n\n`;
        } else {
          interpretation += `⚠️ **Le score est en dessous du seuil de sécurité de ${threshold}.**\n\n`;
        }

        // Détails du score
        if (market_validation.score_breakdown) {
          interpretation += `### Détails du Score:\n`;
          interpretation += `- Price Action: ${market_validation.score_breakdown.price_action}/25\n`;
          interpretation += `- SMC: ${market_validation.score_breakdown.smc}/25\n`;
          interpretation += `- Indicateurs: ${market_validation.score_breakdown.indicators}/20\n`;
          interpretation += `- Timing: ${market_validation.score_breakdown.timing}/15\n`;
          interpretation += `- Contexte Marché: ${market_validation.score_breakdown.market_context}/15\n\n`;
        }
      }

      // Signaux détectés ou absence de signal
      if (signals && signals.length > 0) {
        interpretation += `## 🎯 Signal Détecté!\n\n`;
        signals.forEach((signal: any) => {
          interpretation += `### ${signal.signal} - Confiance: ${signal.confidence}\n\n`;
          
          if (signal.entry_details) {
            interpretation += `**Point d'Entrée:** ${signal.entry_details.entry_price}\n`;
          }
          
          if (signal.risk_management) {
            interpretation += `**Stop Loss:** ${signal.risk_management.stop_loss}\n`;
            interpretation += `**Take Profit 1:** ${signal.risk_management.take_profit_1}\n`;
            interpretation += `**Ratio R/R:** ${signal.risk_management.risk_reward_ratio}\n\n`;
          }

          if (signal.supporting_analysis?.fundamental_summary) {
            interpretation += `${signal.supporting_analysis.fundamental_summary}\n\n`;
          }
        });
      } else if (no_signal_analysis) {
        interpretation += `## 🛡️ Aucun Signal Recommandé\n\n`;
        interpretation += `**Ma priorité est de protéger ton capital.**\n\n`;
        
        if (no_signal_analysis.reasons_if_no_signal) {
          interpretation += `### Pourquoi je reste prudent:\n\n`;
          no_signal_analysis.reasons_if_no_signal.forEach((reason: string, index: number) => {
            interpretation += `${index + 1}. ${reason}\n\n`;
          });
        }
        
        if (no_signal_analysis.next_evaluation) {
          interpretation += `### 🔍 Prochaines Étapes:\n\n`;
          interpretation += `${no_signal_analysis.next_evaluation}\n\n`;
        }
      }

      // Contexte fondamental
      if (fundamental_context) {
        interpretation += `## 🌍 Contexte Fondamental\n\n`;
        interpretation += `**Sentiment général:** ${fundamental_context.sentiment_general}\n`;
        interpretation += `**Tendance dominante:** ${fundamental_context.tendance_dominante}\n\n`;
        
        if (fundamental_context.recommended_caution) {
          interpretation += `⚠️ **Attention:** ${fundamental_context.recommended_caution}\n\n`;
        }

        if (fundamental_context.evenements_critiques_48h) {
          interpretation += `### 📅 Événements à Surveiller (48h):\n\n`;
          fundamental_context.evenements_critiques_48h.forEach((event: any) => {
            const impactEmoji = event.impact === 'HIGH' ? '🔴' : event.impact === 'MEDIUM' ? '🟡' : '🟢';
            interpretation += `${impactEmoji} **${event.event}** (${event.currency})\n`;
            interpretation += `   ${new Date(event.datetime).toLocaleString('fr-FR')}\n`;
            interpretation += `   _${event.implication_signal}_\n\n`;
          });
        }
      }

      // Niveaux techniques à surveiller
      if (market_alerts?.technical_levels_to_watch) {
        interpretation += `## 🎯 Niveaux Techniques à Surveiller\n\n`;
        market_alerts.technical_levels_to_watch.forEach((level: string) => {
          interpretation += `- ${level}\n`;
        });
        interpretation += `\n`;
      }

      interpretation += `---\n\n`;
      interpretation += `💡 **Rappel:** Ne pas trader est parfois la meilleure décision. Je te tiendrai informé dès qu'une opportunité solide se présentera.\n`;

      return interpretation;
    } catch (error) {
      console.error('Erreur lors de la génération de l\'interprétation:', error);
      return 'Erreur lors de l\'interprétation des données du signal.';
    }
  };

  // --- Fonction pour streamer l'interprétation du signal après l'analyse ---
  const streamSignalInterpretation = useCallback(async (signalId: string) => {
    console.log(`🎯 Démarrage du streaming de l'interprétation pour signal_id: ${signalId}`);
    
    // Vérifier que l'URL du webhook est définie
    if (!ENV_GET_JOB_RESULT_WEBHOOK_URL) {
      console.warn('⚠️ URL du webhook Get Job Result non définie. Streaming d\'interprétation désactivé.');
      return;
    }
    
    setIsStreamingInterpretation(true);
    setInterpretationText('');
    setInterpretationComplete(false);
    setShowInterpretation(true);

    try {
      console.log(`📡 Appel du webhook: ${ENV_GET_JOB_RESULT_WEBHOOK_URL}`);
      
      const response = await fetch(ENV_GET_JOB_RESULT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal_id: signalId }),
      });

      console.log(`📊 Réponse du serveur: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Erreur HTTP ${response.status}: ${errorText}`);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Le webhook n\'est pas accessible'}`);
      }

      // Vérifier si le streaming est supporté
      if (!response.body) {
        console.warn('⚠️ Le streaming n\'est pas supporté, tentative de lecture simple...');
        const text = await response.text();
        
        // Tenter de parser le JSON pour extraire les données utiles
        try {
          const jsonData = JSON.parse(text);
          console.log('📦 Données reçues:', jsonData);
          
          // Extraire les informations du signal pour générer une interprétation
          const interpretedText = generateInterpretationFromData(jsonData);
          setInterpretationText(interpretedText);
        } catch (e) {
          // Si ce n'est pas du JSON, afficher le texte brut
          console.log('📝 Texte brut reçu (pas JSON)');
          setInterpretationText(text);
        }
        
        setIsStreamingInterpretation(false);
        setInterpretationComplete(true);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Streaming de l\'interprétation terminé');
          setIsStreamingInterpretation(false);
          setInterpretationComplete(true);
          break;
        }

        // Décoder le chunk reçu
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        
        // Mettre à jour l'interface avec le texte accumulé
        setInterpretationText(accumulatedText);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors du streaming de l\'interprétation:', error);
      setIsStreamingInterpretation(false);
      
      // Message d'erreur plus détaillé selon le type d'erreur
      let errorMessage = 'Erreur lors de la récupération de l\'interprétation.';
      
      if (error.message.includes('404')) {
        errorMessage = '❌ Le webhook d\'interprétation n\'est pas accessible (404). Vérifiez que le workflow "Get Job Result" est bien activé et que l\'URL est correcte.';
      } else if (error.message.includes('Network')) {
        errorMessage = '❌ Erreur réseau. Vérifiez votre connexion internet et l\'URL du webhook.';
      } else {
        errorMessage = `❌ ${error.message}`;
      }
      
      setInterpretationText(errorMessage);
      setShowInterpretation(true);
    }
  }, []);

  // --- Fonction pour tester le streaming directement ---
  const handleTestStreaming = useCallback(async () => {
    if (!ENV_TEST_SIGNAL_ID || ENV_TEST_SIGNAL_ID.trim() === '') {
      alert('❌ Aucun signal_id de test défini dans .env\n\nAjoutez EXPO_PUBLIC_TEST_SIGNAL_ID dans votre fichier .env');
      return;
    }
    
    if (!ENV_GET_JOB_RESULT_WEBHOOK_URL) {
      alert('❌ L\'URL du webhook Get Job Result n\'est pas définie.\n\nAjoutez EXPO_PUBLIC_GET_JOB_RESULT_WEBHOOK_URL dans votre fichier .env');
      return;
    }
    
    console.log(`🧪 Test du streaming avec signal_id depuis .env: ${ENV_TEST_SIGNAL_ID}`);
    
    // Réinitialiser l'état de l'interprétation
    setInterpretationText('');
    setInterpretationComplete(false);
    setIsStreamingInterpretation(false);
    
    // Basculer vers l'affichage des résultats
    setShowAnalysis(true);
    
    // Démarrer le streaming de test
    await streamSignalInterpretation(ENV_TEST_SIGNAL_ID);
  }, [streamSignalInterpretation]);

  const resetAnalysisState = useCallback(() => {
    setIsLoading(false);
    setShowAnalysis(false);
    setJobId(null);
    setOverallStatus('pending');
    setError(null);
    setAnalysisResult(null);
    setStreamingMessages([]);
    setCurrentTypingMessage('');
    setIsTyping(false);
    setCurrentMessageIndex(0);
    setIsStreamingInterpretation(false);
    setInterpretationText('');
    setInterpretationComplete(false);
    setShowInterpretation(false);
    setAnalysisSteps((prevSteps) =>
      prevSteps.map((step) => ({ ...step, status: 'idle', message: 'En attente...' })),
    );
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (realtimeRetryTimeoutRef.current) {
      clearTimeout(realtimeRetryTimeoutRef.current);
      realtimeRetryTimeoutRef.current = null;
    }
    if (typewriterTimeoutRef.current) {
      clearTimeout(typewriterTimeoutRef.current);
      typewriterTimeoutRef.current = null;
    }
    realtimeRetryCountRef.current = 0;
  }, []);

  const handleStartAnalysis = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setShowAnalysis(false);
    setJobId(null);
    setOverallStatus('in_progress');
    setAnalysisSteps((prevSteps) =>
      prevSteps.map((step) => ({ ...step, status: 'pending', message: 'Démarrage...' })),
    );
    realtimeRetryCountRef.current = 0;
    
    // Démarrer l'animation typewriter du Signal Agent
    startTypewriterAnimation();

    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16).replace('T', ' ');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let accessToken: string | null = null;

    if (sessionError) {
      const errorMessage = `Erreur lors de la récupération de la session: ${sessionError.message}`;
      setError(errorMessage);
      setIsLoading(false);
      setOverallStatus('failed');
      setAnalysisSteps((prevSteps) => prevSteps.map(step => 
        step.id === 'security_check' ? { ...step, status: 'failed', message: errorMessage } : step
      ));
      return;
    }

    if (sessionData && sessionData.session) {
      accessToken = sessionData.session.access_token;
    } else {
      const errorMessage = "Vous devez être connecté pour lancer une analyse.";
      setError(errorMessage);
      setIsLoading(false);
      setOverallStatus('failed');
      setAnalysisSteps((prevSteps) => prevSteps.map(step => 
        step.id === 'security_check' ? { ...step, status: 'failed', message: errorMessage } : step
      ));
      return;
    }

    const payload = { 
      pair, 
      style, 
      risk, 
      gain, 
      time: formattedTime,
      accessToken: accessToken,
    };
    
    const maestroWebhookUrl = useCustomWebhookUrl ? customWebhookUrl : ENV_MAESTRO_WEBHOOK_URL;
    
    if (!maestroWebhookUrl) {
      const errorMessage = "L'URL du webhook n'est pas définie.";
      setError(errorMessage);
      setIsLoading(false);
      setOverallStatus('failed');
      setAnalysisSteps((prevSteps) => prevSteps.map(step => 
        step.id === 'security_check' ? { ...step, status: 'failed', message: errorMessage } : step
      ));
      return;
    }

    try {
      const response = await fetch(maestroWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Réponse du serveur non valide'}`);
      }

      const initialResponse = await response.json();
      const receivedJobId = initialResponse.jobId;

      if (!receivedJobId) {
        throw new Error("Le serveur n'a pas renvoyé de jobId.");
      }

      setJobId(receivedJobId);
      setAnalysisSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === 'security_check' ? { ...step, status: 'loading', message: 'Envoi de la demande...' } : step
        )
      );
    } catch (e: any) {
      console.error("Erreur lors du démarrage de l'analyse:", e);
      const errorMessage = e.message || 'Une erreur de communication est survenue.';
      setError(errorMessage);
      setIsLoading(false);
      setOverallStatus('failed');
      setAnalysisSteps((prevSteps) => prevSteps.map(step => 
        step.id === 'security_check' ? { ...step, status: 'failed', message: errorMessage } : step
      ));
    }
  };

  const checkJobStatus = useCallback(async () => {
    if (!jobId) return;

    console.log(`Polling status for jobId: ${jobId}`);
    const { data, error: dbError } = await supabase
      .from('workflow_jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (dbError) {
      console.error('Error fetching job status via polling:', dbError);
      setError(`Erreur de récupération du statut (polling): ${dbError.message || 'Inconnu'}`);
      return;
    }

    if (data) {
      const newRecord = data as any;
      setOverallStatus(newRecord.overall_status);
      setError(newRecord.error_message);

      if (newRecord.steps_status) {
        setAnalysisSteps((prevSteps) =>
          prevSteps.map((step) => {
            const n8nStepStatus = newRecord.steps_status[step.id];
            return n8nStepStatus
              ? { ...step, status: n8nStepStatus.status, message: n8nStepStatus.message || step.message }
              : step;
          }),
        );
      }

      if (newRecord.overall_status === 'completed') {
        console.log('Polling: Job completed!', newRecord.final_result);
        setAnalysisResult(newRecord.final_result);
        setShowAnalysis(true);
        setIsLoading(false);
        stopTypewriterAnimation(); // Arrêter l'animation typewriter
        
        // Démarrer le streaming de l'interprétation avec le job_id
        if (jobId) {
          console.log('🎯 Démarrage du streaming de l\'interprétation pour jobId:', jobId);
          streamSignalInterpretation(jobId);
        }
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      } else if (newRecord.overall_status === 'failed') {
        console.log('Polling: Job failed!');
        setIsLoading(false);
        stopTypewriterAnimation(); // Arrêter l'animation typewriter
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      }
    }
  }, [jobId, supabase]);

  const startPolling = useCallback(async () => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    if (realtimeRetryTimeoutRef.current) {
      clearTimeout(realtimeRetryTimeoutRef.current);
      realtimeRetryTimeoutRef.current = null;
    }

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    await checkJobStatus();
    if (overallStatus !== 'completed' && overallStatus !== 'failed') {
      pollingIntervalRef.current = setInterval(checkJobStatus, POLLING_FREQUENCY_MS);
      console.log(`Polling started for jobId: ${jobId} every ${POLLING_FREQUENCY_MS / 1000}s`);
    } else {
      console.log('Job already finished during initial polling check, no need to start interval.');
    }
  }, [jobId, checkJobStatus, overallStatus]);

  const setupRealtimeChannel = useCallback(() => {
    if (!jobId) return;

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }
    if (realtimeRetryTimeoutRef.current) {
      clearTimeout(realtimeRetryTimeoutRef.current);
      realtimeRetryTimeoutRef.current = null;
    }

    console.log(`Attempting to subscribe to Realtime channel for job_updates_${jobId}`);
    realtimeChannelRef.current = supabase
      .channel(`job_updates_${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workflow_jobs',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          setOverallStatus(newRecord.overall_status);
          setError(newRecord.error_message);

          if (newRecord.steps_status) {
            setAnalysisSteps((prevSteps) =>
              prevSteps.map((step) => {
                const n8nStepStatus = newRecord.steps_status[step.id];
                return n8nStepStatus
                  ? { ...step, status: n8nStepStatus.status, message: n8nStepStatus.message || step.message }
                  : step;
              }),
            );
          }

          if (newRecord.overall_status === 'completed') {
            console.log('Realtime: Job completed!', newRecord.final_result);
            setAnalysisResult(newRecord.final_result);
            setShowAnalysis(true);
            setIsLoading(false);
            stopTypewriterAnimation(); // Arrêter l'animation typewriter
            
            // Démarrer le streaming de l'interprétation avec le job_id
            if (jobId) {
              console.log('🎯 Démarrage du streaming de l\'interprétation pour jobId:', jobId);
              streamSignalInterpretation(jobId);
            }
            
            if (realtimeChannelRef.current) {
              supabase.removeChannel(realtimeChannelRef.current);
              realtimeChannelRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (newRecord.overall_status === 'failed') {
            console.log('Realtime: Job failed!');
            setIsLoading(false);
            stopTypewriterAnimation(); // Arrêter l'animation typewriter
            if (realtimeChannelRef.current) {
              supabase.removeChannel(realtimeChannelRef.current);
              realtimeChannelRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
            console.log(`Successfully SUBSCRIBED to channel job_updates_${jobId}`);
            realtimeRetryCountRef.current = 0;
            if (realtimeRetryTimeoutRef.current) {
              clearTimeout(realtimeRetryTimeoutRef.current);
              realtimeRetryTimeoutRef.current = null;
            }
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
        } else if (status === 'CHANNEL_ERROR') {
            const errorDetails = err ? (err.message || JSON.stringify(err)) : 'Objet erreur non défini ou vide';
            console.error(`Error SUBSCRIBING to channel job_updates_${jobId}:`, errorDetails);

            if (realtimeRetryCountRef.current < MAX_REALTIME_RETRIES) {
              realtimeRetryCountRef.current++;
              const delay = Math.pow(2, realtimeRetryCountRef.current) * 1000;
              console.log(`Retrying Realtime subscription in ${delay / 1000} seconds. Attempt ${realtimeRetryCountRef.current}/${MAX_REALTIME_RETRIES}`);
              realtimeRetryTimeoutRef.current = setTimeout(setupRealtimeChannel, delay);
              setAnalysisSteps((prevSteps) => prevSteps.map(step =>
                step.id === 'security_check' ? { ...step, status: 'loading', message: `Problème Realtime. Tentative de reconnexion (${realtimeRetryCountRef.current}/${MAX_REALTIME_RETRIES})...` } : step
              ));
            } else {
              console.warn('Max Realtime retries reached. Falling back to polling.');
              const errorMessage = `Erreur d'abonnement Realtime persistante. Bascule sur la vérification périodique.`;
              setError(errorMessage);
              setAnalysisSteps((prevSteps) => prevSteps.map(step =>
                step.id === 'security_check' ? { ...step, status: 'loading', message: errorMessage } : step
              ));
              startPolling();
            }
        }
    });
  }, [jobId, supabase, startPolling]);

  useEffect(() => {
    if (!jobId) {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (realtimeRetryTimeoutRef.current) {
        clearTimeout(realtimeRetryTimeoutRef.current);
        realtimeRetryTimeoutRef.current = null;
      }
      realtimeRetryCountRef.current = 0;
      return;
    }

    checkJobStatus().then(() => {
      if (overallStatus !== 'completed' && overallStatus !== 'failed') {
        setupRealtimeChannel();
      } else {
        console.log('Job already completed/failed on initial check, skipping Realtime/polling setup.');
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    });

    return () => {
      console.log(`Cleaning up for jobId: ${jobId}`);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (realtimeRetryTimeoutRef.current) {
        clearTimeout(realtimeRetryTimeoutRef.current);
        realtimeRetryTimeoutRef.current = null;
      }
      realtimeRetryCountRef.current = 0;
    };
  }, [jobId, supabase, checkJobStatus, setupRealtimeChannel, overallStatus]);

  const renderLoadingAnimation = () => (
    <ScrollView 
      style={styles.fullScreenContainer}
      contentContainerStyle={styles.fullScreenContentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec informations de l'analyse */}
      <View style={styles.loadingHeader}>
        <View style={styles.loadingHeaderContent}>
          <Text style={styles.loadingTitle}>
            {overallStatus === 'failed' ? '❌ Analyse échouée' : '🤖 Signal Agent en action...'}
          </Text>
          {jobId && <Text style={styles.jobIdText}>ID de la tâche: {jobId}</Text>}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={resetAnalysisState}>
          <Text style={styles.cancelButtonText}>Annuler l'Analyse</Text>
        </TouchableOpacity>
      </View>
      
      {/* Section des messages typewriter du Signal Agent */}
      <View style={styles.typewriterContainer}>
        <Text style={styles.typewriterTitle}>🤖 Signal Agent</Text>
        <ScrollView 
          style={styles.typewriterScrollView}
          contentContainerStyle={styles.typewriterContentContainer}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {streamingMessages.map((message) => (
            <View key={message.id} style={[styles.typewriterMessage, styles[`typewriterMessage_${message.type}`]]}>
              <Text style={[styles.typewriterMessageText, styles[`typewriterMessageText_${message.type}`]]}>
                {message.content}
              </Text>
            </View>
          ))}
          {isTyping && currentTypingMessage && (
            <View style={styles.typewriterMessage}>
              <Text style={styles.typewriterMessageText}>
                {currentTypingMessage}
                <Text style={styles.typewriterCursor}>|</Text>
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Section des étapes d'analyse */}
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>📋 Étapes d'Analyse</Text>
        <ScrollView 
          contentContainerStyle={styles.progressListContentContainer} 
          style={styles.progressListScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          {analysisSteps.map((step) => (
            <View key={step.id} style={styles.progressItem}>
              <View style={styles.progressIconWrapper}>
                {step.status === 'loading' && <ActivityIndicator size="small" color="#60A5FA" />}
                {step.status === 'completed' && <CheckCircle size={18} color="#34D399" />}
                {step.status === 'failed' && <XCircle size={18} color="#F87171" />}
                {(step.status === 'idle' || step.status === 'pending') && <Clock size={18} color="#94A3B8" />}
              </View>
              <View style={styles.progressTextContent}>
                <Text style={[styles.progressText, step.status === 'failed' && styles.progressTextError]}>
                  {step.label}
                </Text>
                {step.message && (
                  <Text style={[styles.progressMessage, step.status === 'failed' ? styles.progressErrorMessage : styles.progressSuccessMessage]}>
                    {step.message}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );

  const renderConfiguration = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Configuration de l'Analyse</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Définissez les critères pour l'analyse de l'IA.</Text>

      <CollapsibleSection title="Configuration Webhook" icon={Settings} style={styles.webhookConfigSection}>
        <View style={styles.webhookInputContainer}>
          <TextInput
            style={[styles.webhookInput, !useCustomWebhookUrl && styles.webhookInputDisabled, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
            value={customWebhookUrl}
            onChangeText={setCustomWebhookUrl}
            placeholder="Entrez l'URL du webhook..."
            editable={useCustomWebhookUrl}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity onPress={() => setUseCustomWebhookUrl(!useCustomWebhookUrl)} style={[styles.webhookToggle, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
            {useCustomWebhookUrl ? <ToggleRight size={24} color={colors.primary} /> : <ToggleLeft size={24} color={colors.textMuted} />}
            <Text style={[styles.webhookToggleText, { color: colors.text }]}>{useCustomWebhookUrl ? 'Custom' : 'Env Var'}</Text>
          </TouchableOpacity>
        </View>
        {!useCustomWebhookUrl && (
          <Text style={[styles.webhookInfoText, { color: colors.textMuted }]}>Utilise l'URL définie dans les variables d'environnement.</Text>
        )}
        
        {/* Section de test du streaming */}
        {ENV_TEST_SIGNAL_ID && (
          <View style={styles.testStreamingSection}>
            <Text style={[styles.testStreamingTitle, { color: colors.text }]}>🧪 Test du Streaming d'Interprétation</Text>
            <Text style={[styles.testStreamingSubtitle, { color: colors.textMuted }]}>
              Testez rapidement le webhook avec le signal_id configuré dans .env
            </Text>
            
            <View style={styles.testStreamingInfoBox}>
              <Text style={[styles.testStreamingInfoLabel, { color: colors.textMuted }]}>Signal ID de test :</Text>
              <Text style={[styles.testStreamingInfoValue, { color: '#10B981' }]}>{ENV_TEST_SIGNAL_ID}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.testStreamingButton, { backgroundColor: '#10B981' }]} 
              onPress={handleTestStreaming}
              disabled={isStreamingInterpretation}
            >
              {isStreamingInterpretation ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.testStreamingButtonText}>🧪 Lancer le Test</Text>
              )}
            </TouchableOpacity>
            
            {!ENV_GET_JOB_RESULT_WEBHOOK_URL && (
              <Text style={[styles.testStreamingWarning, { color: '#F59E0B' }]}>
                ⚠️ URL du webhook Get Job Result non définie dans .env
              </Text>
            )}
          </View>
        )}
      </CollapsibleSection>

      <SelectionSection title="Paire de Devises" options={MAJOR_PAIRS} selectedValue={pair} onSelect={setPair} />
      <SelectionSection title="Style de Trading" options={TRADING_STYLES} selectedValue={style} onSelect={setStyle} />
      <SelectionSection title="Niveau de Risque" options={RISK_LEVELS} selectedValue={risk} onSelect={setRisk} />
      <SelectionSection title="Objectif de Gain" options={GAIN_LEVELS} selectedValue={gain} onSelect={setGain} />
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleStartAnalysis} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={[styles.actionButtonText, { color: 'white' }]}>Lancer l'Analyse</Text>}
      </TouchableOpacity>
      {error && !showAnalysis && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </ScrollView>
  );

  // --- Rendu de l'interprétation streamée ---
  const renderInterpretation = () => (
    <View style={styles.interpretationContainer}>
      <View style={styles.interpretationHeader}>
        <Text style={styles.interpretationTitle}>🤖 Qubext - Interprétation du Signal</Text>
        {isStreamingInterpretation && (
          <View style={styles.streamingIndicator}>
            <ActivityIndicator size="small" color="#60A5FA" />
            <Text style={styles.streamingText}>Streaming en cours...</Text>
          </View>
        )}
      </View>
      <ScrollView 
        style={styles.interpretationScrollView}
        contentContainerStyle={styles.interpretationContentContainer}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.interpretationText}>
          {interpretationText}
          {isStreamingInterpretation && <Text style={styles.interpretationCursor}>▋</Text>}
        </Text>
        {interpretationComplete && (
          <View style={styles.interpretationCompleteIndicator}>
            <CheckCircle size={20} color="#34D399" />
            <Text style={styles.interpretationCompleteText}>Interprétation complète</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // --- Bouton de retour à l'écran de configuration ---
  const renderBackButton = () => (
    <TouchableOpacity 
      style={[styles.backButton, { backgroundColor: colors.primary }]} 
      onPress={() => {
        setShowAnalysis(false);
        setShowInterpretation(false);
        setInterpretationText('');
        setInterpretationComplete(false);
        setIsStreamingInterpretation(false);
      }}
    >
      <ArrowLeft size={20} color="white" />
      <Text style={styles.backButtonText}>Retour à la Configuration</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NavigationHeader
        title="Analyse de Marché"
        subtitle={isLoading ? "Statut de l'Analyse" : showAnalysis ? "Résultats de l'IA" : 'Configuration manuelle'}
        rightComponent={
          (analysisResult || error) && !isLoading && (
            <TouchableOpacity style={styles.toggleButton} onPress={() => setShowAnalysis(!showAnalysis)}>
              <BlurView intensity={40} tint={effectiveTheme} style={[styles.toggleButtonInner, { borderColor: colors.border }]}>
                {showAnalysis ? <ToggleRight size={20} color={colors.primary} /> : <ToggleLeft size={20} color={colors.textMuted} />}
                <Text style={[styles.toggleText, { color: colors.text }]}>{showAnalysis ? 'Config' : 'Résultat'}</Text>
              </BlurView>
            </TouchableOpacity>
          )
        }
      />
      <BreadcrumbNavigation items={[{ label: 'Analysis', isActive: true }]} />
      <View style={{ flex: 1 }}>
        {isLoading ? (
          renderLoadingAnimation()
        ) : showAnalysis ? (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            {renderBackButton()}
            {showInterpretation && renderInterpretation()}
            <AnalysisResultDisplay analysisResult={analysisResult} />
          </ScrollView>
        ) : (
          renderConfiguration()
        )}
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scrollContent: { padding: 20, paddingBottom: 120 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: '#94A3B8', textAlign: 'center', marginBottom: 30 },
  section: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#E2E8F0', marginBottom: 12 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: '#334155', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1, borderColor: '#475569' },
  tagSelected: { backgroundColor: '#4F46E5', borderColor: '#60A5FA' },
  tagText: { color: '#E2E8F0', fontWeight: '600' },
  tagTextSelected: { color: 'white' },
  actionButton: { backgroundColor: '#60A5FA', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#F87171', fontWeight: 'bold', textAlign: 'center', marginTop: 15, fontSize: 16 },
  toggleButton: { borderRadius: 16, overflow: 'hidden' },
  toggleButtonInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1 },
  toggleText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  collapsibleContainer: { borderRadius: 16, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  collapsibleTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  collapsibleContent: { paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', paddingTop: 12 },
  // --- Styles pour le nouveau layout avec scroll ---
  fullScreenContainer: { 
    flex: 1, 
    backgroundColor: '#0F172A' 
  },
  fullScreenContentContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Espace pour éviter que le contenu soit caché par la barre de navigation
  },
  loadingHeader: {
    backgroundColor: '#1E293B',
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
  },
  loadingHeaderContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E2E8F0',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressListScrollView: { 
    maxHeight: 200, // Hauteur limitée pour les étapes
    width: '100%' 
  },
  progressListContentContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 10, 
    paddingBottom: 20 
  },
  progressItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressIconWrapper: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  progressTextContent: { flex: 1 },
  progressText: { color: '#E2E8F0', fontSize: 15 },
  progressTextError: { color: '#F87171', fontWeight: 'bold' },
  progressMessage: { fontSize: 12, marginTop: 2, color: '#94A3B8' },
  progressSuccessMessage: { color: '#34D399' },
  progressErrorMessage: { color: '#F87171' },
  jobIdText: { color: '#CBD5E1', fontSize: 12, marginTop: 10, marginBottom: 20 },
  
  webhookConfigSection: { marginBottom: 20 },
  webhookInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  webhookInput: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: 'white',
    fontSize: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  webhookInputDisabled: {
    opacity: 0.6,
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  webhookToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  webhookToggleText: { color: 'white', marginLeft: 5, fontSize: 12, fontWeight: '600' },
  webhookInfoText: { color: '#94A3B8', fontSize: 12, marginTop: 5, paddingHorizontal: 5 },
  
  // --- Styles pour la section de test du streaming ---
  testStreamingSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  testStreamingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
    marginBottom: 5,
  },
  testStreamingSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    lineHeight: 18,
  },
  testStreamingInfoBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testStreamingInfoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testStreamingInfoValue: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  testStreamingButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  testStreamingButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  testStreamingWarning: {
    fontSize: 11,
    color: '#F59E0B',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#F87171',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    width: '80%',
    alignSelf: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // --- Styles pour l'animation typewriter ---
  typewriterContainer: {
    backgroundColor: '#1E293B',
    margin: 20,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    minHeight: 300, // Hauteur minimale pour le conteneur
  },
  typewriterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60A5FA',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  typewriterScrollView: {
    maxHeight: 300, // Hauteur maximale pour permettre le scroll
    paddingHorizontal: 16,
  },
  typewriterContentContainer: {
    paddingVertical: 16,
    paddingBottom: 20,
  },
  typewriterMessage: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#60A5FA',
  },
  typewriterMessage_info: {
    borderLeftColor: '#60A5FA',
    backgroundColor: '#1E3A8A',
  },
  typewriterMessage_analysis: {
    borderLeftColor: '#F59E0B',
    backgroundColor: '#451A03',
  },
  typewriterMessage_signal: {
    borderLeftColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  typewriterMessage_warning: {
    borderLeftColor: '#EF4444',
    backgroundColor: '#7F1D1D',
  },
  typewriterMessage_success: {
    borderLeftColor: '#34D399',
    backgroundColor: '#064E3B',
  },
  typewriterMessageText: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  typewriterMessageText_info: {
    color: '#93C5FD',
  },
  typewriterMessageText_analysis: {
    color: '#FCD34D',
  },
  typewriterMessageText_signal: {
    color: '#6EE7B7',
  },
  typewriterMessageText_warning: {
    color: '#FCA5A5',
  },
  typewriterMessageText_success: {
    color: '#6EE7B7',
  },
  typewriterCursor: {
    color: '#60A5FA',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepsContainer: {
    backgroundColor: '#1E293B',
    margin: 20,
    marginTop: 0,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    minHeight: 200,
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#94A3B8',
    textAlign: 'center',
    padding: 12,
    backgroundColor: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // --- Styles pour l'interprétation streamée ---
  interpretationContainer: {
    backgroundColor: '#1E293B',
    margin: 20,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#60A5FA',
    overflow: 'hidden',
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  interpretationHeader: {
    backgroundColor: '#334155',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  interpretationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60A5FA',
    textAlign: 'center',
    marginBottom: 8,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  streamingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  interpretationScrollView: {
    maxHeight: 400,
  },
  interpretationContentContainer: {
    padding: 20,
  },
  interpretationText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#E2E8F0',
    textAlign: 'justify',
  },
  interpretationCursor: {
    color: '#60A5FA',
    fontWeight: 'bold',
    fontSize: 20,
    marginLeft: 2,
  },
  interpretationCompleteIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  interpretationCompleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34D399',
  },
  
  // --- Styles pour le bouton de retour ---
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    padding: 14,
    margin: 20,
    marginBottom: 10,
    shadowColor: '#60A5FA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
