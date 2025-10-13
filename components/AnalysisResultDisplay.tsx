// components/AnalysisResultDisplay.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  UIManager,
  Platform,
  LayoutAnimation,
} from 'react-native';
import { BlurView } from 'expo-blur';
import {
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileText, // Added for the new summary section
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Ensure LayoutAnimation is enabled for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Reusable CollapsibleSection Component ---
const CollapsibleSection = ({ title, children, icon: Icon, style, initialExpanded = false }: any) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const { colors } = useTheme();

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

// --- Reusable KeyValueItem Component ---
const KeyValueItem = ({ label, value }: { label: string; value: any }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.kvRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.kvLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.kvValue, { color: colors.text }]}>{String(value || 'N/A')}</Text>
    </View>
  );
};

interface AnalysisResultDisplayProps {
  analysisResult: any;
  onBackPress?: () => void;
}

export default function AnalysisResultDisplay({ analysisResult, onBackPress }: AnalysisResultDisplayProps) {
  const { colors } = useTheme();

  if (!analysisResult) {
    return (
      <View style={styles.centerContainer}>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Aucun résultat à afficher.</Text>
      </View>
    );
  }

  const getNestedValue = (obj: any, path: string, defaultValue: any = 'N/A') => {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      if (current === null || typeof current !== 'object' || !current.hasOwnProperty(parts[i])) {
        return defaultValue;
      }
      current = current[parts[i]];
    }
    return current;
  };

  const hasSignals = getNestedValue(analysisResult, 'signals.length', 0) > 0;
  const signal = hasSignals ? analysisResult.signals[0] : null;

  const metadata = analysisResult.signal_metadata || analysisResult.metadata_info;
  const marketValidation = analysisResult.market_validation;
  const marketAlerts = analysisResult.market_alerts;
  const noSignalAnalysis = analysisResult.no_signal_analysis;
  const fundamentalContext = analysisResult.fundamental_context;
  
  // Define these for both signal and no-signal cases to provide summary info
  const supportingAnalysis = analysisResult.supporting_analysis || (signal ? signal.supporting_analysis : null);
  const riskWarnings = analysisResult.risk_warnings;


  return (
    <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: onBackPress ? 20 : 0 }]}>
      {onBackPress && (
        <TouchableOpacity onPress={onBackPress} style={[styles.backButton, { backgroundColor: `${colors.primary}20` }]}>
          <Text style={[styles.backButtonText, { color: colors.primary }]}>← Retour aux analyses</Text>
        </TouchableOpacity>
      )}

      {hasSignals ? (
        <>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Résultat de l'Analyse</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Signal pour {getNestedValue(signal, 'signal_id').replace(/_/g, ' ')}</Text>

          {metadata && (
            <CollapsibleSection title="Métadonnées du Signal" icon={Info} initialExpanded={true}>
              <KeyValueItem label="Généré le" value={getNestedValue(metadata, 'generated_at')} />
              <KeyValueItem label="Version Agent" value={getNestedValue(metadata, 'agent_version')} />
              <KeyValueItem label="Session" value={getNestedValue(metadata, 'market_session')} />
            </CollapsibleSection>
          )}

          {marketValidation && (
            <CollapsibleSection title="Validation du Marché" icon={ShieldCheck} initialExpanded={true}>
              <KeyValueItem label="Alignement Price Action" value={getNestedValue(marketValidation, 'price_action_alignment')} />
              <KeyValueItem label="Score de Confluence" value={`${getNestedValue(marketValidation, 'overall_confluence_score', 0)} / 100`} />
              <KeyValueItem label="Qualité du Timing" value={getNestedValue(marketValidation, 'timing_quality')} />
              {getNestedValue(marketValidation, 'fundamental_context') !== 'N/A' && (
                <KeyValueItem label="Contexte Fondamental" value={getNestedValue(marketValidation, 'fundamental_context')} />
              )}
            </CollapsibleSection>
          )}

          {fundamentalContext && (
            <CollapsibleSection title="Contexte Fondamental Détaillé" icon={Info}>
              <KeyValueItem label="Facteur Principal" value={getNestedValue(fundamentalContext, 'facteur_principal')} />
              <KeyValueItem label="Sentiment Général" value={getNestedValue(fundamentalContext, 'sentiment_general')} />
              <KeyValueItem label="Sentiment News (24h)" value={getNestedValue(fundamentalContext, 'news_sentiment_24h')} />
              <KeyValueItem label="Tendance Dominante" value={getNestedValue(fundamentalContext, 'tendance_dominante')} />
              <KeyValueItem label="Mise en garde" value={getNestedValue(fundamentalContext, 'recommended_caution')} />
              {getNestedValue(fundamentalContext, 'evenements_critiques_48h.length', 0) > 0 && (
                <View>
                  <Text style={[styles.subHeader, { color: colors.text }]}>Événements Critiques (48h)</Text>
                  {fundamentalContext.evenements_critiques_48h.map((event: any, index: number) => (
                    <View key={index} style={styles.eventItem}>
                      <Text style={[styles.listItem, { color: colors.textSecondary }]}>• **{getNestedValue(event, 'event')}** ({getNestedValue(event, 'impact')}, {getNestedValue(event, 'currency')})</Text>
                      <Text style={[styles.listItem, { color: colors.textSecondary, marginLeft: 15 }]}>  {getNestedValue(event, 'datetime')}</Text>
                      <Text style={[styles.listItem, { color: colors.textSecondary, marginLeft: 15 }]}>  Implication: {getNestedValue(event, 'implication_signal')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </CollapsibleSection>
          )}

          {signal && (
            <CollapsibleSection title="Signal Principal" icon={TrendingUp} initialExpanded={true}>
              <View style={styles.signalMainInfo}>
                <Text style={[styles.signalType, signal.signal === 'SELL' ? styles.sellSignal : styles.buySignal]}>
                  {signal.signal || 'N/A'}
                </Text>
                <Text style={[styles.signalConfidence, { color: colors.warning }]}>{signal.confidence || 'N/A'}</Text>
              </View>
              <KeyValueItem label="Prix d'entrée" value={getNestedValue(signal, 'entry_details.entry_price')} />
              <KeyValueItem label="Méthode d'entrée" value={getNestedValue(signal, 'entry_details.entry_method')} />
              <KeyValueItem label="Slippage Max" value={getNestedValue(signal, 'entry_details.max_slippage')} />
              <KeyValueItem label="Stop Loss" value={getNestedValue(signal, 'risk_management.stop_loss')} />
              <KeyValueItem label="Take Profit 1" value={getNestedValue(signal, 'risk_management.take_profit_1')} />
              <KeyValueItem label="Take Profit 2" value={getNestedValue(signal, 'risk_management.take_profit_2')} />
              <KeyValueItem label="Take Profit 3" value={getNestedValue(signal, 'risk_management.take_profit_3')} />
              <KeyValueItem label="Ratio R/R" value={getNestedValue(signal, 'risk_management.risk_reward_ratio')} />
              <KeyValueItem label="Time Frame Exécution" value={getNestedValue(signal, 'entry_details.execution_timeframe')} />

              {getNestedValue(signal, 'entry_conditions.length', 0) > 0 && (
                <CollapsibleSection title="Conditions d'Entrée" icon={Info} style={[styles.nestedCollapsible, { backgroundColor: `${colors.cardBackground}70`, borderColor: `${colors.border}20` }]}>
                  {signal.entry_conditions.map((item: string, index: number) => (
                    <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
                  ))}
                </CollapsibleSection>
              )}

              {getNestedValue(signal, 'invalidation_rules.length', 0) > 0 && (
                <CollapsibleSection title="Règles d'Invalidation" icon={AlertTriangle} style={[styles.nestedCollapsible, { backgroundColor: `${colors.cardBackground}70`, borderColor: `${colors.border}20` }]}>
                  {signal.invalidation_rules.map((item: string, index: number) => (
                    <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
                  ))}
                </CollapsibleSection>
              )}
            </CollapsibleSection>
          )}

          {marketAlerts && (
            <CollapsibleSection title="Alertes Marché" icon={AlertTriangle}>
              <Text style={[styles.subHeader, { color: colors.text }]}>Actualités à fort impact (24h)</Text>
              {(getNestedValue(marketAlerts, 'high_impact_news_next_24h', [])).map((item: any, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item.event || item}</Text>
              ))}
              <Text style={[styles.subHeader, { color: colors.text }]}>Niveaux techniques à surveiller</Text>
              {(getNestedValue(marketAlerts, 'technical_levels_to_watch', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
              ))}
            </CollapsibleSection>
          )}

          {getNestedValue(signal, 'performance_metrics') && (
            <CollapsibleSection title="Métriques de Performance" icon={TrendingUp}>
              <KeyValueItem label="Pips Gain Min" value={getNestedValue(signal, 'performance_metrics.pips_gain_min')} />
              <KeyValueItem label="Pips Gain Max" value={getNestedValue(signal, 'performance_metrics.pips_gain_max')} />
              <KeyValueItem label="Pips Risque" value={getNestedValue(signal, 'performance_metrics.pips_risk')} />
              <KeyValueItem label="Probabilité de Gain" value={getNestedValue(signal, 'performance_metrics.win_probability_estimated')} />
              <KeyValueItem label="Valeur Attendue" value={getNestedValue(signal, 'performance_metrics.expected_value')} />
            </CollapsibleSection>
          )}

          {getNestedValue(signal, 'validation_checks') && (
            <CollapsibleSection title="Vérifications de Validation" icon={ShieldCheck}>
              <Text style={[styles.subHeader, { color: colors.text }]}>Confluence Price Action</Text>
              {(getNestedValue(signal, 'validation_checks.price_action_confluence', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
              ))}
              <Text style={[styles.subHeader, { color: colors.text }]}>Confluence SMC</Text>
              {(getNestedValue(signal, 'validation_checks.smc_confluence', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
              ))}
              <Text style={[styles.subHeader, { color: colors.text }]}>Indicateurs Techniques</Text>
              {(getNestedValue(signal, 'validation_checks.technical_indicators', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
              ))}
              <Text style={[styles.subHeader, { color: colors.text }]}>Facteurs Fondamentaux</Text>
              {(getNestedValue(signal, 'validation_checks.fundamental_factors', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
              ))}
              <Text style={[styles.subHeader, { color: colors.text }]}>Facteurs de Timing</Text>
              {(getNestedValue(signal, 'validation_checks.timing_factors', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>• {item}</Text>
              ))}
            </CollapsibleSection>
          )}

          {getNestedValue(signal, 'market_context') && (
            <CollapsibleSection title="Contexte du Marché" icon={Info}>
              <KeyValueItem label="Alignement Tendance" value={getNestedValue(signal, 'market_context.trend_alignment')} />
              <KeyValueItem label="Volatilité" value={getNestedValue(signal, 'market_context.volatility_environment')} />
              <KeyValueItem label="Risque News (4h)" value={getNestedValue(signal, 'market_context.news_risk_next_4h')} />
              <KeyValueItem label="Caractéristiques Session" value={getNestedValue(signal, 'market_context.session_characteristics')} />
            </CollapsibleSection>
          )}

          {getNestedValue(signal, 'execution_plan') && (
            <CollapsibleSection title="Plan d'Exécution" icon={TrendingUp}>
              <KeyValueItem label="Fenêtre d'entrée optimale" value={getNestedValue(signal, 'execution_plan.optimal_entry_window')} />
              <Text style={[styles.subHeader, { color: colors.text }]}>Prise de Profits Partielle</Text>
              <KeyValueItem label="TP1 Exit" value={getNestedValue(signal, 'execution_plan.partial_profit_taking.tp1_exit')} />
              <KeyValueItem label="TP2 Exit" value={getNestedValue(signal, 'execution_plan.partial_profit_taking.tp2_exit')} />
              <KeyValueItem label="TP3 Exit" value={getNestedValue(signal, 'execution_plan.partial_profit_taking.tp3_exit')} />
              <KeyValueItem label="Stop Suiveur" value={getNestedValue(signal, 'execution_plan.trailing_stop')} />
              <KeyValueItem label="Monitoring Position" value={getNestedValue(signal, 'execution_plan.position_monitoring')} />
            </CollapsibleSection>
          )}

          {supportingAnalysis && (
            <CollapsibleSection title="Analyse Détaillée" icon={Info}>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé Price Action</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'price_action_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé Technique</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'technical_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé SMC</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'smc_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Évaluation du Risque</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'risk_assessment')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Scénarios Alternatifs</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'alternative_scenarios')}</Text>
            </CollapsibleSection>
          )}
        </>
      ) : (
        <>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analyse Sans Signal</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            L'IA n'a pas trouvé de configuration de trading à haute probabilité pour le moment.
          </Text>

          {noSignalAnalysis && getNestedValue(noSignalAnalysis, 'reasons_if_no_signal.length', 0) > 0 && (
            <CollapsibleSection title="Raisons de l'absence de signal" icon={Info} initialExpanded={true}>
              {noSignalAnalysis.reasons_if_no_signal.map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                  • {item}
                </Text>
              ))}
              <KeyValueItem label="Prochaine Évaluation" value={getNestedValue(noSignalAnalysis, 'next_evaluation')} />
            </CollapsibleSection>
          )}

          {metadata && (
            <CollapsibleSection title="Métadonnées de l'Analyse" icon={Info}>
              <KeyValueItem label="Généré le" value={getNestedValue(metadata, 'generated_at') || getNestedValue(metadata, 'date')} />
              <KeyValueItem label="Version Agent" value={getNestedValue(metadata, 'agent_version')} />
              <KeyValueItem label="Session" value={getNestedValue(metadata, 'market_session')} />
              <KeyValueItem label="Paire" value={getNestedValue(metadata, 'pair')} />
              <KeyValueItem label="Style" value={getNestedValue(metadata, 'style')} />
              <KeyValueItem label="Niveau de Risque" value={getNestedValue(metadata, 'risk')} />
              <KeyValueItem label="Objectif de Gain" value={getNestedValue(metadata, 'gain')} />
            </CollapsibleSection>
          )}

          {marketValidation && (
            <CollapsibleSection title="Validation du Marché" icon={ShieldCheck}>
              <KeyValueItem label="Alignement Price Action" value={getNestedValue(marketValidation, 'price_action_alignment')} />
              <KeyValueItem label="Score de Confluence" value={`${getNestedValue(marketValidation, 'overall_confluence_score', 0)} / 100`} />
              <KeyValueItem label="Qualité du Timing" value={getNestedValue(marketValidation, 'timing_quality')} />
              {getNestedValue(marketValidation, 'fundamental_context') !== 'N/A' && (
                <KeyValueItem label="Contexte Fondamental" value={getNestedValue(marketValidation, 'fundamental_context')} />
              )}
            </CollapsibleSection>
          )}

          {/* --- NEW SECTION FOR NO-SIGNAL: Analysis Summary Card --- */}
          {supportingAnalysis && (
            <CollapsibleSection title="Résumé de l'Analyse du Marché" icon={FileText} initialExpanded={true}>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé Price Action</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'price_action_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé Technique</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'technical_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé SMC</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'smc_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Résumé Fondamental</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'fundamental_summary')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Évaluation du Risque</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'risk_assessment')}</Text>
              <Text style={[styles.subHeader, { color: colors.text }]}>Scénarios Alternatifs</Text>
              <Text style={[styles.listItem, { color: colors.textSecondary }]}>{getNestedValue(supportingAnalysis, 'alternative_scenarios')}</Text>
            </CollapsibleSection>
          )}
          {/* --- END OF NEW SECTION --- */}

          {fundamentalContext && (
            <CollapsibleSection title="Contexte Fondamental Détaillé" icon={Info}>
              <KeyValueItem label="Facteur Principal" value={getNestedValue(fundamentalContext, 'facteur_principal')} />
              <KeyValueItem label="Sentiment Général" value={getNestedValue(fundamentalContext, 'sentiment_general')} />
              <KeyValueItem label="Sentiment News (24h)" value={getNestedValue(fundamentalContext, 'news_sentiment_24h')} />
              <KeyValueItem label="Tendance Dominante" value={getNestedValue(fundamentalContext, 'tendance_dominante')} />
              <KeyValueItem label="Mise en garde" value={getNestedValue(fundamentalContext, 'recommended_caution')} />
              {getNestedValue(fundamentalContext, 'evenements_critiques_48h.length', 0) > 0 && (
                <View>
                  <Text style={[styles.subHeader, { color: colors.text }]}>Événements Critiques (48h)</Text>
                  {fundamentalContext.evenements_critiques_48h.map((event: any, index: number) => (
                    <View key={index} style={styles.eventItem}>
                      <Text style={[styles.listItem, { color: colors.textSecondary }]}>• **{getNestedValue(event, 'event')}** ({getNestedValue(event, 'impact')}, {getNestedValue(event, 'currency')})</Text>
                      <Text style={[styles.listItem, { color: colors.textSecondary, marginLeft: 15 }]}>  {getNestedValue(event, 'datetime')}</Text>
                      <Text style={[styles.listItem, { color: colors.textSecondary, marginLeft: 15 }]}>  Implication: {getNestedValue(event, 'implication_signal')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </CollapsibleSection>
          )}

          {marketAlerts && (
            <CollapsibleSection title="Alertes Marché" icon={AlertTriangle}>
              <Text style={[styles.subHeader, { color: colors.text }]}>Actualités à fort impact (24h)</Text>
              {(getNestedValue(marketAlerts, 'high_impact_news_next_24h', [])).map((item: any, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                  • {item.event || item}
                </Text>
              ))}
              <Text style={[styles.subHeader, { color: colors.text }]}>Niveaux techniques à surveiller</Text>
              {(getNestedValue(marketAlerts, 'technical_levels_to_watch', [])).map((item: string, index: number) => (
                <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                  • {item}
                </Text>
              ))}
            </CollapsibleSection>
          )}

          {/* --- NEW SECTION FOR NO-SIGNAL: Risk Warnings --- */}
          {riskWarnings && (
            <CollapsibleSection title="Avertissements de Risque" icon={AlertTriangle}>
              <KeyValueItem label="Risque Événementiel" value={getNestedValue(riskWarnings, 'event_risk')} />
              <KeyValueItem label="Risque de Liquidité" value={getNestedValue(riskWarnings, 'liquidity_risk')} />
              <KeyValueItem label="Risque de Corrélation" value={getNestedValue(riskWarnings, 'correlation_risk')} />
              <KeyValueItem label="Risque de Sentiment" value={getNestedValue(riskWarnings, 'sentiment_risk')} />
            </CollapsibleSection>
          )}
          {/* --- END OF NEW SECTION --- */}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // To ensure content isn't hidden by bottom nav/padding
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  collapsibleContainer: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  collapsibleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
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
  },
  kvLabel: {
    fontSize: 14,
  },
  kvValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  signalMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
  },
  signalType: {
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderRadius: 10,
  },
  sellSignal: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#F87171',
  },
  buySignal: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#34D399',
  },
  signalConfidence: {
    fontSize: 18,
    fontWeight: '700',
  },
  subHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  listItem: {
    fontSize: 14,
    paddingLeft: 8,
    marginBottom: 4,
  },
  eventItem: {
    marginBottom: 8,
  },
  nestedCollapsible: {
    marginTop: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
