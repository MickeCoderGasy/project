import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  UIManager,
  Platform,
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
} from 'lucide-react-native';
import LottieView from 'lottie-react-native'; // Importation de Lottie

// Activer LayoutAnimation pour Android (si vous l'utilisez. Notez que cette API est moins stable
// que des bibliothèques comme react-native-reanimated et peut causer des crashes natifs).
// Pour une stabilité maximale, vous pourriez commenter cette ligne et la référence à LayoutAnimation.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Types pour la clarté ---
type TradingStyle = 'intraday' | 'swing';
type RiskLevel = 'basse' | 'moyenne' | 'Haut';
type GainLevel = 'min' | 'moyen' | 'Max';
type ForexPair = 'EUR/USD' | 'USD/JPY' | 'GBP/USD' | 'USD/CHF' | 'AUD/USD' | 'USD/CAD' | 'NZD/USD';

// --- Constantes pour les options de sélection ---
const MAJOR_PAIRS: ForexPair[] = [
  'EUR/USD',
  'USD/JPY',
  'GBP/USD',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
];
const TRADING_STYLES: TradingStyle[] = ['intraday', 'swing'];
const RISK_LEVELS: RiskLevel[] = ['basse', 'moyenne', 'Haut'];
const GAIN_LEVELS: GainLevel[] = ['min', 'moyen', 'Max'];

// --- Composant Section Déroulante (CollapsibleSection) ---
const CollapsibleSection = ({
  title,
  children,
  icon: Icon,
  style,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ElementType;
  style?: any; // Permet de passer des styles supplémentaires
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded); // Pas de LayoutAnimation pour plus de stabilité

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
        <TouchableOpacity
          key={option}
          style={[styles.tag, selectedValue === option && styles.tagSelected]}
          onPress={() => onSelect(option)}>
          <Text style={[styles.tagText, selectedValue === option && styles.tagTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// --- Composant principal de l'écran Analyse ---
export default function AnalyseScreen() {
  const { colors, effectiveTheme } = useTheme();

  // --- États pour la configuration de l'analyse ---
  const [pair, setPair] = useState<ForexPair>('EUR/USD');
  const [style, setStyle] = useState<TradingStyle>('intraday');
  const [risk, setRisk] = useState<RiskLevel>('moyenne');
  const [gain, setGain] = useState<GainLevel>('moyen');

  // --- États pour le workflow de la requête et de l'affichage ---
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false); // Gère l'affichage entre config et résultat

  // --- Fonction pour lancer l'analyse via le webhook ---
  const handleStartAnalysis = async () => {
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16).replace('T', ' '); // Format YYYY-MM-DD HH:mm

    const payload = { pair, style, risk, gain, time: formattedTime };
    // IMPORTANT : Remplacez '192.168.1.104' par l'adresse IP de votre machine si vous testez sur un appareil physique
    // ou par 'localhost' si vous testez sur un simulateur/émulateur et que votre serveur tourne sur la même machine.
    const webhookUrl = 'http://192.168.1.104:5678/webhook-test/maestro';

    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setShowAnalysis(false); // Revenir à la configuration si une nouvelle analyse est lancée

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Gérer les erreurs HTTP (ex: 404, 500) où la requête a abouti mais le serveur a un problème.
      if (!response.ok) {
        const errorText = await response.text(); // Tente de lire le corps même en cas d'erreur HTTP
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Réponse du serveur non valide'}`);
      }

      // Lire le corps de la réponse en texte d'abord pour une meilleure gestion des erreurs JSON
      const responseBodyText = await response.text();

      if (!responseBodyText.trim()) {
        throw new SyntaxError('Réponse vide du serveur. Le webhook n\'a pas renvoyé de données JSON.');
      }

      let result;
      try {
        result = JSON.parse(responseBodyText); // Tenter de parser le texte en JSON
      } catch (jsonParseError) {
        // En cas d'erreur de parsing, afficher les 200 premiers caractères de la réponse brute pour le débogage
        throw new SyntaxError(
          `La réponse du serveur n'est pas un JSON valide. Réponse reçue: "${responseBodyText.substring(
            0,
            200,
          )}..."`,
        );
      }

      // Vérifier si la réponse est un tableau et prendre le premier élément, ou utiliser l'objet directement
      if (Array.isArray(result) && result.length > 0) {
        setAnalysisResult(result[0]); // Prend le premier objet du tableau
      } else if (typeof result === 'object' && result !== null) {
        setAnalysisResult(result); // Si c'est un objet direct (pas un tableau)
      } else {
        throw new Error(
          'La structure de la réponse du webhook est inattendue. Un objet ou un tableau avec au moins un objet était attendu.',
        );
      }

      setShowAnalysis(true); // Afficher les résultats si tout s'est bien passé
    } catch (e: any) {
      // Log l'erreur complète pour le débogage en console
      console.error("Erreur lors de l'analyse:", e);

      if (e instanceof SyntaxError) {
        setError(e.message); // Utiliser le message spécifique que nous avons créé
      } else if (e instanceof TypeError && e.message.includes('Network request failed')) {
        setError(
          "Impossible de se connecter au serveur webhook. Vérifiez que le serveur est en cours d'exécution et accessible (adresse IP correcte ?).",
        );
      } else {
        setError(e.message || 'Une erreur de communication est survenue.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Fonction pour rendre l'animation de chargement Lottie ---
  const renderLoadingAnimation = () => (
    <View style={styles.centerContainer}>
      <LottieView
        source={require('../assets/animations/welcome.json')} // <-- Mettez le bon chemin vers VOTRE animation Lottie
        autoPlay
        loop={true} // L'animation tourne en boucle pendant le chargement
        style={styles.lottieAnimation}
      />
      <Text style={styles.headerSubtitle}>Analyse en cours...</Text>
    </View>
  );

  // --- Fonction pour rendre l'écran de configuration de l'analyse ---
  const renderConfiguration = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Configuration de l'Analyse</Text>
      <Text style={styles.headerSubtitle}>Définissez les critères pour l'analyse de l'IA.</Text>

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

  // --- Fonction pour rendre l'affichage des résultats de l'analyse ---
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

    // --- LOGIQUE SPÉCIFIQUE POUR QUAND AUCUN SIGNAL N'EST TROUVÉ ---
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

    // --- LOGIQUE POUR QUAND UN SIGNAL EST TROUVÉ ---
    const signal = analysisResult.signals[0]; // On se base sur le premier signal

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

        {/* --- SECTION SIGNAL PRINCIPAL (CONTENANT LES CONDITIONS ET RÈGLES IMBRIQUÉES) --- */}
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

          {/* --- CONDITIONS D'ENTRÉE IMBRIQUÉES --- */}
          {signal.entry_conditions && (
            <CollapsibleSection title="Conditions d'Entrée" icon={Info} style={styles.nestedCollapsible}>
              {signal.entry_conditions.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </CollapsibleSection>
          )}

          {/* --- RÈGLES D'INVALIDATION IMBRIQUÉES --- */}
          {signal.invalidation_rules && (
            <CollapsibleSection title="Règles d'Invalidation" icon={AlertTriangle} style={styles.nestedCollapsible}>
              {signal.invalidation_rules.map((item: string, index: number) => (
                <Text key={index} style={styles.listItem}>
                  • {item}
                </Text>
              ))}
            </CollapsibleSection>
          )}
        </CollapsibleSection>
        {/* --- FIN DE LA SECTION SIGNAL PRINCIPAL --- */}

        <CollapsibleSection title="Alertes Marché" icon={AlertTriangle}>
          <Text style={styles.subHeader}>Actualités à fort impact (24h)</Text>
          {analysisResult.market_alerts.high_impact_news_next_24h.map((item: string, index: number) => (
            <Text key={index} style={styles.listItem}>
              • {item}
            </Text>
          ))}
          <Text style={styles.subHeader}>Niveaux techniques à surveiller</Text>
          {analysisResult.market_alerts.technical_levels_to_watch.map((item: string, index: number) => (
            <Text key={index} style={styles.listItem}>
              • {item}
            </Text>
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
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
            <Text style={styles.subHeader}>Confluence SMC</Text>
            {signal.validation_checks.smc_confluence.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
            <Text style={styles.subHeader}>Indicateurs Techniques</Text>
            {signal.validation_checks.technical_indicators.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
            ))}
            <Text style={styles.subHeader}>Facteurs de Timing</Text>
            {signal.validation_checks.timing_factors.map((item: string, index: number) => (
              <Text key={index} style={styles.listItem}>
                • {item}
              </Text>
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
        subtitle={showAnalysis ? "Résultats de l'IA" : 'Configuration manuelle'}
        rightComponent={
          (analysisResult || error) && !isLoading && (
            <TouchableOpacity style={styles.toggleButton} onPress={() => setShowAnalysis(!showAnalysis)}>
              <BlurView
                intensity={40}
                tint={effectiveTheme}
                style={[styles.toggleButtonInner, { borderColor: colors.border }]}>
                {showAnalysis ? (
                  <ToggleRight size={20} color={colors.primary} />
                ) : (
                  <ToggleLeft size={20} color={colors.textMuted} />
                )}
                <Text style={[styles.toggleText, { color: colors.text }]}>
                  {showAnalysis ? 'Config' : 'Résultat'}
                </Text>
              </BlurView>
            </TouchableOpacity>
          )
        }
      />
      <BreadcrumbNavigation items={[{ label: 'Analysis', isActive: true }]} />
      <View style={{ flex: 1 }}>
        {isLoading
          ? renderLoadingAnimation()
          : showAnalysis
            ? renderAnalysis()
            : renderConfiguration()}
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
  tag: {
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  tagSelected: { backgroundColor: '#4F46E5', borderColor: '#60A5FA' },
  tagText: { color: '#E2E8F0', fontWeight: '600' },
  tagTextSelected: { color: 'white' },
  actionButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#F87171', fontWeight: 'bold', textAlign: 'center', marginTop: 15, fontSize: 16 },
  toggleButton: { borderRadius: 16, overflow: 'hidden' },
  toggleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleText: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
  collapsibleContainer: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  collapsibleTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  collapsibleContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 12,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  kvLabel: { color: '#94A3B8', fontSize: 14 },
  kvValue: { color: 'white', fontSize: 14, fontWeight: '600' },
  signalMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  signalType: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, paddingVertical: 5, borderRadius: 10 },
  sellSignal: { backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#F87171' },
  buySignal: { backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34D399' },
  signalConfidence: { fontSize: 18, color: '#FBBF24', fontWeight: '700' },
  subHeader: { fontSize: 15, fontWeight: 'bold', color: '#E2E8F0', marginTop: 10, marginBottom: 5 },
  listItem: { color: '#CBD5E1', fontSize: 14, paddingLeft: 8, marginBottom: 4 },
  lottieAnimation: {
    width: 250,
    height: 250,
  },
  nestedCollapsible: {
    marginTop: 10, // Un peu d'espace au-dessus
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // Fond légèrement différent pour la distinction
    borderColor: 'rgba(255, 255, 255, 0.05)', // Bordure plus légère
  },
});
