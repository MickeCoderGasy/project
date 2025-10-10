import React, { useState, useEffect, useRef, useCallback } from 'react'; // Ajout de useRef
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
} from 'react-native';
import NavigationHeader from '@/components/NavigationHeader';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import {
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Info,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase'; // <-- Importez l'instance centralisée

// --- Configuration Supabase et Webhook depuis les variables d'environnement ---
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const ENV_MAESTRO_WEBHOOK_URL = process.env.EXPO_PUBLIC_WEBHOOK_URL!;

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

// --- Constantes pour les options de sélection ---
const MAJOR_PAIRS: ForexPair[] = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD' , 'XAU/USD'];
const TRADING_STYLES: TradingStyle[] = ['intraday', 'swing'];
const RISK_LEVELS: RiskLevel[] = ['basse', 'moyenne', 'Haut'];
const GAIN_LEVELS: GainLevel[] = ['min', 'moyen', 'Max'];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Composant Section Déroulante (CollapsibleSection) ---
const CollapsibleSection = ({ title, children, icon: Icon, style }: any) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };
  return (
    <BlurView intensity={20} tint="dark" style={[styles.collapsibleContainer, style]}>
      <TouchableOpacity onPress={toggleExpand} style={styles.collapsibleHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {Icon && <Icon size={18} color="#94A3B8" style={{ marginRight: 10 }} />}
          <Text style={styles.collapsibleTitle}>{title}</Text>
        </View>
        {isExpanded ? <ChevronUp size={20} color="#60A5FA" /> : <ChevronDown size={20} color="#94A3B8" />}
      </TouchableOpacity>
      {isExpanded && <View style={styles.collapsibleContent}>{children}</View>}
    </BlurView>
  );
};

// --- Composant pour afficher une ligne clé-valeur ---
const KeyValueItem = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.kvRow}>
    <Text style={styles.kvLabel}>{label}</Text>
    <Text style={styles.kvValue}>{String(value)}</Text>
  </View>
);

// --- Composant utilitaire pour la sélection ---
const SelectionSection = ({ title, options, selectedValue, onSelect }: any) => (
  <View style={styles.section}>
    <Text style={styles.label}>{title}</Text>
    <View style={styles.tagContainer}>
      {options.map((option: string) => (
        <TouchableOpacity key={option} style={[styles.tag, selectedValue === option && styles.tagSelected]} onPress={() => onSelect(option)}>
          <Text style={[styles.tagText, selectedValue === option && styles.tagTextSelected]}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

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

  // --- NOUVEAUX ÉTATS POUR LA CONFIGURATION DU WEBHOOK ---
  const [customWebhookUrl, setCustomWebhookUrl] = useState(ENV_MAESTRO_WEBHOOK_URL);
  const [useCustomWebhookUrl, setUseCustomWebhookUrl] = useState(false);

  // --- Refs pour gérer le Realtime et le Polling ---
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRetryCountRef = useRef(0);
  const MAX_REALTIME_RETRIES = 3; // Nombre maximal de tentatives de reconnexion Realtime
  const POLLING_FREQUENCY_MS = 10000; // Fréquence de polling en ms (10 secondes)

  const resetAnalysisState = useCallback(() => {
    setIsLoading(false);
    setShowAnalysis(false);
    setJobId(null);
    setOverallStatus('pending');
    setError(null);
    setAnalysisResult(null);
    setAnalysisSteps((prevSteps) =>
      prevSteps.map((step) => ({ ...step, status: 'idle', message: 'En attente...' })),
    );
    // Nettoyer les ressources Realtime/Polling lors de la réinitialisation
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
    realtimeRetryCountRef.current = 0; // Réinitialiser le compteur de retries

    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16).replace('T', ' ');
    
    // --- Récupération de l'access_token Supabase ---
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

    // --- Payload incluant l'access_token ---
    const payload = { 
      pair, 
      style, 
      risk, 
      gain, 
      time: formattedTime,
      accessToken: accessToken, // <-- Ajout de l'access_token ici pour n8n
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
      // Mettre à jour la première étape à loading puisque la requête a été envoyée
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

  // --- Fonction pour vérifier le statut de la tâche via polling ---
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
      // Ne pas arrêter le polling immédiatement, l'erreur pourrait être temporaire
      setError(`Erreur de récupération du statut (polling): ${dbError.message || 'Inconnu'}`);
      return;
    }

    if (data) {
      const newRecord = data as any;
      setOverallStatus(newRecord.overall_status);
      setError(newRecord.error_message); // Mettre à jour l'erreur si n8n en a envoyé une

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
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        // S'assurer que le canal Realtime est aussi nettoyé si jamais il était actif
        if (realtimeChannelRef.current) {
          supabase.removeChannel(realtimeChannelRef.current);
          realtimeChannelRef.current = null;
        }
      } else if (newRecord.overall_status === 'failed') {
        console.log('Polling: Job failed!');
        setIsLoading(false);
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
  }, [jobId, supabase]); // Dépend de jobId et supabase

  // --- Fonction pour démarrer le polling ---
  const startPolling = useCallback(async () => {
    // Nettoyer toute instance Realtime si le polling prend le relais
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
    // Effectuer une vérification immédiate avant de démarrer l'intervalle
    await checkJobStatus();
    if (overallStatus !== 'completed' && overallStatus !== 'failed') { // Vérifier l'état après la vérification immédiate
      pollingIntervalRef.current = setInterval(checkJobStatus, POLLING_FREQUENCY_MS);
      console.log(`Polling started for jobId: ${jobId} every ${POLLING_FREQUENCY_MS / 1000}s`);
    } else {
      console.log('Job already finished during initial polling check, no need to start interval.');
    }
  }, [jobId, checkJobStatus, overallStatus]); // overallStatus est une dépendance ici pour la vérification initiale

  // --- Fonction pour configurer le canal Realtime ---
  const setupRealtimeChannel = useCallback(() => {
    if (!jobId) return;

    // S'assurer qu'un ancien canal est nettoyé avant d'en créer un nouveau
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
            if (realtimeChannelRef.current) {
              supabase.removeChannel(realtimeChannelRef.current);
              realtimeChannelRef.current = null;
            }
            // S'assurer que le polling est arrêté si Realtime réussit et termine le job
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (newRecord.overall_status === 'failed') {
            console.log('Realtime: Job failed!');
            setIsLoading(false);
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
            realtimeRetryCountRef.current = 0; // Réinitialiser le compteur de retries sur succès
            if (realtimeRetryTimeoutRef.current) {
              clearTimeout(realtimeRetryTimeoutRef.current);
              realtimeRetryTimeoutRef.current = null;
            }
            // Si le polling était actif, l'arrêter car Realtime fonctionne
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
        } else if (status === 'CHANNEL_ERROR') {
            const errorDetails = err ? (err.message || JSON.stringify(err)) : 'Objet erreur non défini ou vide';
            console.error(`Error SUBSCRIBING to channel job_updates_${jobId}:`, errorDetails);

            if (realtimeRetryCountRef.current < MAX_REALTIME_RETRIES) {
              realtimeRetryCountRef.current++;
              const delay = Math.pow(2, realtimeRetryCountRef.current) * 1000; // Backoff exponentiel
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
              startPolling(); // Démarrer le polling comme solution de repli
            }
        }
    });
  }, [jobId, supabase, startPolling]); // Dépend de jobId, supabase et startPolling

  useEffect(() => {
    if (!jobId) {
      // Si jobId est null, s'assurer que tout est nettoyé
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

    // Lors du montage ou changement de jobId
    // D'abord, vérifier l'état actuel du job via polling au cas où n8n l'aurait déjà terminé
    // avant que Realtime ne se connecte ou si Realtime échoue
    checkJobStatus().then(() => {
      // Seulement démarrer Realtime/Polling si le job n'est pas déjà terminé/échoué
      if (overallStatus !== 'completed' && overallStatus !== 'failed') {
        setupRealtimeChannel();
      } else {
        console.log('Job already completed/failed on initial check, skipping Realtime/polling setup.');
        // Assurez-vous que le Realtime/Polling est nettoyé même si la vérification initiale a trouvé le job terminé
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

    // Fonction de nettoyage pour le démontage ou le changement de jobId
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
      realtimeRetryCountRef.current = 0; // Réinitialiser le compteur de retries pour la prochaine fois
    };
  }, [jobId, supabase, checkJobStatus, setupRealtimeChannel, overallStatus]); // overallStatus est une dépendance pour la vérification initiale

  const renderLoadingAnimation = () => (
    <View style={styles.fullScreenContainer}>
      <View style={styles.loadingFixedHeader}>
        <LottieView
          source={require('../assets/animations/welcome.json')}
          autoPlay
          loop={true}
          style={styles.lottieAnimation}
        />
        <Text style={styles.headerSubtitle}>
          {overallStatus === 'failed' ? 'Analyse échouée' : 'Analyse en cours...'}
        </Text>
        {jobId && <Text style={styles.jobIdText}>ID de la tâche: {jobId}</Text>}
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity style={styles.cancelButton} onPress={resetAnalysisState}>
          <Text style={styles.cancelButtonText}>Annuler l'Analyse</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.progressListContentContainer} style={styles.progressListScrollView}>
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
  );

  const renderConfiguration = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Configuration de l'Analyse</Text>
      <Text style={styles.headerSubtitle}>Définissez les critères pour l'analyse de l'IA.</Text>

      <CollapsibleSection title="Configuration Webhook" icon={Settings} style={styles.webhookConfigSection}>
        <View style={styles.webhookInputContainer}>
          <TextInput
            style={[styles.webhookInput, !useCustomWebhookUrl && styles.webhookInputDisabled]}
            value={customWebhookUrl}
            onChangeText={setCustomWebhookUrl}
            placeholder="Entrez l'URL du webhook..."
            editable={useCustomWebhookUrl}
            placeholderTextColor="#64748B"
          />
          <TouchableOpacity onPress={() => setUseCustomWebhookUrl(!useCustomWebhookUrl)} style={styles.webhookToggle}>
            {useCustomWebhookUrl ? <ToggleRight size={24} color="#60A5FA" /> : <ToggleLeft size={24} color="#94A3B8" />}
            <Text style={styles.webhookToggleText}>{useCustomWebhookUrl ? 'Custom' : 'Env Var'}</Text>
          </TouchableOpacity>
        </View>
        {!useCustomWebhookUrl && (
          <Text style={styles.webhookInfoText}>Utilise l'URL définie dans les variables d'environnement.</Text>
        )}
      </CollapsibleSection>

      <SelectionSection title="Paire de Devises" options={MAJOR_PAIRS} selectedValue={pair} onSelect={setPair} />
      <SelectionSection title="Style de Trading" options={TRADING_STYLES} selectedValue={style} onSelect={setStyle} />
      <SelectionSection title="Niveau de Risque" options={RISK_LEVELS} selectedValue={risk} onSelect={setRisk} />
      <SelectionSection title="Objectif de Gain" options={GAIN_LEVELS} selectedValue={gain} onSelect={setGain} />
      <TouchableOpacity style={styles.actionButton} onPress={handleStartAnalysis} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Lancer l'Analyse</Text>}
      </TouchableOpacity>
      {error && !showAnalysis && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );

  const renderAnalysis = () => {
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }
    if (!analysisResult) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.headerSubtitle}>Aucun résultat à afficher.</Text>
        </View>
      );
    }

    if (!analysisResult.signals || analysisResult.signals.length === 0) {
      const noSignal = analysisResult.no_signal_analysis;
      const marketAlerts = analysisResult.market_alerts;

      return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerTitle}>Analyse Sans Signal</Text>
          <Text style={styles.headerSubtitle}>
            L'IA n'a pas trouvé de configuration de trading à haute probabilité pour le moment.
          </Text>

          {noSignal && noSignal.reasons_if_no_signal && noSignal.reasons_if_no_signal.length > 0 && (
            <CollapsibleSection title="Raisons de l'absence de signal" icon={Info}>
              {noSignal.reasons_if_no_signal.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
              <KeyValueItem label="Prochaine Évaluation" value={noSignal.next_evaluation} />
            </CollapsibleSection>
          )}

          {analysisResult.signal_metadata && (
             <CollapsibleSection title="Métadonnées de l'Analyse" icon={Info}>
                <KeyValueItem label="Généré le" value={analysisResult.signal_metadata.generated_at} />
                <KeyValueItem label="Version Agent" value={analysisResult.signal_metadata.agent_version} />
                <KeyValueItem label="Session" value={analysisResult.signal_metadata.market_session} />
            </CollapsibleSection>
          )}

          {analysisResult.market_validation && (
            <CollapsibleSection title="Validation du Marché" icon={ShieldCheck}>
              <KeyValueItem label="Alignement Price Action" value={analysisResult.market_validation.price_action_alignment} />
              <KeyValueItem label="Score de Confluence" value={`${analysisResult.market_validation.overall_confluence_score} / 100`} />
              <KeyValueItem label="Qualité du Timing" value={`${analysisResult.market_validation.timing_quality}`} />
            </CollapsibleSection>
          )}

          {marketAlerts && (
            <CollapsibleSection title="Alertes Marché" icon={AlertTriangle}>
              <Text style={styles.subHeader}>Actualités à fort impact (24h)</Text>
              {marketAlerts.high_impact_news_next_24h.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
              <Text style={styles.subHeader}>Niveaux techniques à surveiller</Text>
              {marketAlerts.technical_levels_to_watch.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </CollapsibleSection>
          )}
        </ScrollView>
      );
    }

    const signal = analysisResult.signals[0];

    return (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.headerTitle}>Résultat de l'Analyse</Text>
        <Text style={styles.headerSubtitle}>Signal pour {signal.signal_id.replace(/_/g, ' ')}</Text>

        <CollapsibleSection title="Métadonnées du Signal" icon={Info}>
          <KeyValueItem label="Généré le" value={analysisResult.signal_metadata.generated_at} />
          <KeyValueItem label="Version Agent" value={analysisResult.signal_metadata.agent_version} />
          <KeyValueItem label="Session" value={analysisResult.signal_metadata.market_session} />
        </CollapsibleSection>

        <CollapsibleSection title="Validation du Marché" icon={ShieldCheck}>
          <KeyValueItem label="Alignement Price Action" value={analysisResult.market_validation.price_action_alignment} />
          <KeyValueItem label="Score de Confluence" value={`${analysisResult.market_validation.overall_confluence_score} / 100`} />
          <KeyValueItem label="Qualité du Timing" value={`${analysisResult.market_validation.timing_quality}`} />
        </CollapsibleSection>

        <CollapsibleSection title="Signal Principal" icon={TrendingUp}>
          <View style={styles.signalMainInfo}>
            <Text style={[styles.signalType, signal.signal === 'SELL' ? styles.sellSignal : styles.buySignal]}>
              {signal.signal}
            </Text>
            <Text style={styles.signalConfidence}>{signal.confidence}</Text>
          </View>
          <KeyValueItem label="Prix d'entrée" value={signal.entry_details.entry_price} />
          <KeyValueItem label="Méthode d'entrée" value={signal.entry_details.entry_method} />
          <KeyValueItem label="Slippage Max" value={signal.entry_details.max_slippage} />
          <KeyValueItem label="Stop Loss" value={signal.risk_management.stop_loss} />
          <KeyValueItem label="Take Profit 1" value={signal.risk_management.take_profit_1} />
          <KeyValueItem label="Take Profit 2" value={signal.risk_management.take_profit_2} />
          <KeyValueItem label="Take Profit 3" value={signal.risk_management.take_profit_3} />
          <KeyValueItem label="Ratio R/R" value={signal.risk_management.risk_reward_ratio} />
          <KeyValueItem label="Time Frame Exécution" value={signal.entry_details.execution_timeframe} />

          {signal.entry_conditions && (
            <CollapsibleSection title="Conditions d'Entrée" icon={Info} style={styles.nestedCollapsible}>
              {signal.entry_conditions.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>• {item}</Text>
              ))}
            </CollapsibleSection>
          )}

          {signal.invalidation_rules && (
            <CollapsibleSection title="Règles d'Invalidation" icon={AlertTriangle} style={styles.nestedCollapsible}>
              {signal.invalidation_rules.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>• {item}</Text>
              ))}
            </CollapsibleSection>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Alertes Marché" icon={AlertTriangle}>
          <Text style={styles.subHeader}>Actualités à fort impact (24h)</Text>
          {analysisResult.market_alerts.high_impact_news_next_24h.map((item: string, index: number) => (
            <Text key={index} style={styles.listItem}>• {item}</Text>
          ))}
          <Text style={styles.subHeader}>Niveaux techniques à surveiller</Text>
          {analysisResult.market_alerts.technical_levels_to_watch.map((item: string, index: number) => (
            <Text key={index} style={styles.listItem}>• {item}</Text>
          ))}
        </CollapsibleSection>

        {signal.performance_metrics && (
          <CollapsibleSection title="Métriques de Performance" icon={TrendingUp}>
            <KeyValueItem label="Pips Gain Min" value={signal.performance_metrics.pips_gain_min} />
            <KeyValueItem label="Pips Gain Max" value={signal.performance_metrics.pips_gain_max} />
            <KeyValueItem label="Pips Risque" value={signal.performance_metrics.pips_risk} />
            <KeyValueItem label="Probabilité de Gain" value={signal.performance_metrics.win_probability_estimated} />
            <KeyValueItem label="Valeur Attendue" value={signal.performance_metrics.expected_value} />
          </CollapsibleSection>
        )}

        {signal.validation_checks && (
          <CollapsibleSection title="Vérifications de Validation" icon={ShieldCheck}>
            <Text style={styles.subHeader}>Confluence Price Action</Text>
            {signal.validation_checks.price_action_confluence.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
            <Text style={styles.subHeader}>Confluence SMC</Text>
            {signal.validation_checks.smc_confluence.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
            <Text style={styles.subHeader}>Indicateurs Techniques</Text>
            {signal.validation_checks.technical_indicators.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
            <Text style={styles.subHeader}>Facteurs de Timing</Text>
            {signal.validation_checks.timing_factors.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>• {item}</Text>
            ))}
          </CollapsibleSection>
        )}

        {signal.market_context && (
          <CollapsibleSection title="Contexte du Marché" icon={Info}>
            <KeyValueItem label="Alignement Tendance" value={signal.market_context.trend_alignment} />
            <KeyValueItem label="Volatilité" value={signal.market_context.volatility_environment} />
            <KeyValueItem label="Risque News (4h)" value={signal.market_context.news_risk_next_4h} />
            <KeyValueItem label="Caractéristiques Session" value={signal.market_context.session_characteristics} />
          </CollapsibleSection>
        )}

        {signal.execution_plan && (
          <CollapsibleSection title="Plan d'Exécution" icon={TrendingUp}>
            <KeyValueItem label="Fenêtre d'entrée optimale" value={signal.execution_plan.optimal_entry_window} />
            <Text style={styles.subHeader}>Prise de Profits Partielle</Text>
            <KeyValueItem label="TP1 Exit" value={signal.execution_plan.partial_profit_taking.tp1_exit} />
            <KeyValueItem label="TP2 Exit" value={signal.execution_plan.partial_profit_taking.tp2_exit} />
            <KeyValueItem label="TP3 Exit" value={signal.execution_plan.partial_profit_taking.tp3_exit} />
            <KeyValueItem label="Stop Suiveur" value={signal.execution_plan.trailing_stop} />
            <KeyValueItem label="Monitoring Position" value={signal.execution_plan.position_monitoring} />
          </CollapsibleSection>
        )}

        {signal.supporting_analysis && (
          <CollapsibleSection title="Analyse Détaillée" icon={Info}>
            <Text style={styles.subHeader}>Résumé Price Action</Text>
            <Text style={styles.listItem}>{signal.supporting_analysis.price_action_summary}</Text>
            <Text style={styles.subHeader}>Résumé Technique</Text>
            <Text style={styles.listItem}>{signal.supporting_analysis.technical_summary}</Text>
            <Text style={styles.subHeader}>Résumé SMC</Text>
            <Text style={styles.listItem}>{signal.supporting_analysis.smc_summary}</Text>
            <Text style={styles.subHeader}>Évaluation du Risque</Text>
            <Text style={styles.listItem}>{signal.supporting_analysis.risk_assessment}</Text>
            <Text style={styles.subHeader}>Scénarios Alternatifs</Text>
            <Text style={styles.listItem}>{signal.supporting_analysis.alternative_scenarios}</Text>
          </CollapsibleSection>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
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
        {isLoading ? renderLoadingAnimation() : showAnalysis ? renderAnalysis() : renderConfiguration()}
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
  kvRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  kvLabel: { color: '#94A3B8', fontSize: 14 },
  kvValue: { color: 'white', fontSize: 14, fontWeight: '600' },
  lottieAnimation: { width: 100, height: 100 },
  
  fullScreenContainer: { flex: 1, backgroundColor: '#0F172A' },
  loadingFixedHeader: { alignItems: 'center', padding: 20, paddingBottom: 10, width: '100%' },
  progressListScrollView: { flex: 1, width: '100%' },
  progressListContentContainer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  progressItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressIconWrapper: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  progressTextContent: { flex: 1 },
  progressText: { color: '#E2E8F0', fontSize: 15 },
  progressTextError: { color: '#F87171', fontWeight: 'bold' },
  progressMessage: { fontSize: 12, marginTop: 2, color: '#94A3B8' },
  progressSuccessMessage: { color: '#34D399' },
  progressErrorMessage: { color: '#F87171' },
  jobIdText: { color: '#CBD5E1', fontSize: 12, marginTop: 10, marginBottom: 20 },
  
  signalMainInfo: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, marginBottom: 10 },
  signalType: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 10 },
  sellSignal: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171' },
  buySignal: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399' },
  signalConfidence: { fontSize: 18, color: '#FBBF24', fontWeight: '700' },
  subHeader: { fontSize: 15, fontWeight: 'bold', color: '#E2E8F0', marginTop: 10, marginBottom: 5 },
  listItem: { color: '#CBD5E1', fontSize: 14, paddingLeft: 8, marginBottom: 4 },
  nestedCollapsible: { marginTop: 10, backgroundColor: 'rgba(30, 41, 59, 0.7)', borderColor: 'rgba(255, 255, 255, 0.05)' },

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
});
