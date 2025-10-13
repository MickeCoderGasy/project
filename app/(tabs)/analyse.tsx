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
} from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import AnalysisResultDisplay from '@/components/AnalysisResultDisplay'; // Import the new component

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
            <Text style={[styles.tagText, selectedValue === option && styles.tagTextSelected, { color: selectedValue === option ? colors.textOnPrimary : colors.text }]}>{option}</Text>
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

  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeRetryCountRef = useRef(0);
  const MAX_REALTIME_RETRIES = 3;
  const POLLING_FREQUENCY_MS = 10000;

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
    realtimeRetryCountRef.current = 0;

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
      </CollapsibleSection>

      <SelectionSection title="Paire de Devises" options={MAJOR_PAIRS} selectedValue={pair} onSelect={setPair} />
      <SelectionSection title="Style de Trading" options={TRADING_STYLES} selectedValue={style} onSelect={setStyle} />
      <SelectionSection title="Niveau de Risque" options={RISK_LEVELS} selectedValue={risk} onSelect={setRisk} />
      <SelectionSection title="Objectif de Gain" options={GAIN_LEVELS} selectedValue={gain} onSelect={setGain} />
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handleStartAnalysis} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>Lancer l'Analyse</Text>}
      </TouchableOpacity>
      {error && !showAnalysis && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </ScrollView>
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
        {isLoading ? renderLoadingAnimation() : showAnalysis ? <AnalysisResultDisplay analysisResult={analysisResult} /> : renderConfiguration()}
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
