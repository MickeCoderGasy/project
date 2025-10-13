import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, LayoutAnimation, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Eye, Activity, Plus, Bell, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import NavigationHeader from '@/components/NavigationHeader';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { supabase } from '../../lib/supabase';
import AnalysisResultDisplay from '@/components/AnalysisResultDisplay'; // Import the new component

// Activer LayoutAnimation pour Android si nécessaire
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- Configuration du webhook n8n pour les logs ---
const N8N_LOGS_WEBHOOK_URL = process.env.EXPO_PUBLIC_N8N_LOGS_WEBHOOK_URL!;

if (!N8N_LOGS_WEBHOOK_URL) {
  console.warn("La variable d'environnement EXPO_PUBLIC_N8N_LOGS_WEBHOOK_URL n'est pas définie. Le chargement des logs d'analyse ne fonctionnera pas.");
}

// Removed CollapsibleSection and KeyValueItem as they are now in AnalysisResultDisplay.tsx

// Type pour un journal d'analyse historique
type SignalLog = {
  job_id: string;
  created_at: string;
  overall_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  final_result: any; // L'objet complet de l'analyse, tel que reçu du backend
};

export default function HomeScreen() {
  const { colors, effectiveTheme } = useTheme();
  const portfolioValue = 125420.50;
  const dailyChange = 2340.25;
  const dailyChangePercent = 1.87;

  const marketData = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 178.25, change: 2.15, changePercent: 1.22, volume: '45.2M' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 142.80, change: -1.45, changePercent: -1.01, volume: '28.1M' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 415.30, change: 5.80, changePercent: 1.42, volume: '32.8M' },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.42, change: -8.25, changePercent: -3.21, volume: '67.3M' },
  ];

  const aiInsights = [
    {
      title: 'Market Opportunity',
      description: 'Tech sector showing strong momentum. Consider DCA into NVDA.',
      type: 'bullish',
    },
    {
      title: 'Risk Alert',
      description: 'High volatility expected in energy sector this week.',
      type: 'warning',
    },
    {
      title: 'Portfolio Optimization',
      description: 'Rebalancing recommended - overweight in growth stocks.',
      type: 'neutral',
    },
  ];

  const quickActions = [
    { icon: Plus, label: 'Add Stock', color: colors.primary },
    { icon: BarChart3, label: 'Analytics', color: colors.success },
    { icon: Bell, label: 'Alerts', color: colors.warning },
    { icon: Search, label: 'Research', color: colors.primary },
  ];

  const [activeDashboardTab, setActiveDashboardTab] = useState<'overview' | 'signalLogs'>('overview');
  const [signalLogs, setSignalLogs] = useState<SignalLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [selectedLogAnalysis, setSelectedLogAnalysis] = useState<any | null>(null);

  const fetchSignalLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    setLogsError(null);
    setSelectedLogAnalysis(null);

    if (!N8N_LOGS_WEBHOOK_URL) {
      setLogsError("L'URL du webhook n8n pour les logs n'est pas configurée.");
      setIsLoadingLogs(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    let accessToken: string | null = null;

    if (sessionError || !sessionData?.session) {
      setLogsError(`Vous devez être connecté pour voir l'historique des analyses. ${sessionError?.message || ''}`);
      setIsLoadingLogs(false);
      return;
    }
    accessToken = sessionData.session.access_token;

    try {
      console.log('Sending request to n8n webhook for signal logs...');
      const response = await fetch(N8N_LOGS_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: accessToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText || 'Réponse du serveur n8n non valide'}`);
      }

      const responseData = await response.json();
      console.log('Response from n8n webhook for signal logs:', responseData);

      if (responseData && Array.isArray(responseData)) {
        const mappedLogs: SignalLog[] = responseData.map((logData: any) => ({
          job_id: logData.job_id,
          created_at: logData.generated_at,
          overall_status: logData.Status?.toLowerCase() as SignalLog['overall_status'] || 'unknown',
          final_result: logData,
        }));
        setSignalLogs(mappedLogs);
      } else {
        console.error('Unexpected response format from n8n:', responseData);
        throw new Error("Format de réponse inattendu du webhook n8n.");
      }

    } catch (e: any) {
      setLogsError(`Une erreur est survenue lors de la récupération des analyses via n8n: ${e.message}`);
      console.error('Error fetching signal logs via n8n:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (activeDashboardTab === 'signalLogs' && !isLoadingLogs && !logsError && signalLogs.length === 0) {
      fetchSignalLogs();
    }
  }, [activeDashboardTab, isLoadingLogs, logsError, signalLogs.length, fetchSignalLogs]);


  const renderStockItem = (stock: any) => (
    <TouchableOpacity key={stock.symbol} style={[styles.stockItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      <BlurView intensity={effectiveTheme === 'light' ? 40 : 15} tint={effectiveTheme} style={styles.stockItemBlur}>
        <View style={styles.stockHeader}>
          <View style={styles.stockInfo}>
            <Text style={[styles.stockSymbol, { color: colors.text }]}>{stock.symbol}</Text>
            <Text style={[styles.stockName, { color: colors.textTertiary }]}>{stock.name}</Text>
          </View>
          <View style={styles.stockPriceContainer}>
            <Text style={[styles.stockPrice, { color: colors.text }]}>${stock.price}</Text>
            <Text style={[styles.stockVolume, { color: colors.textMuted }]}>Vol: {stock.volume}</Text>
          </View>
        </View>
        <View style={styles.stockFooter}>
          <View style={[styles.changeContainer, stock.change >= 0 ? styles.positive : styles.negative]}>
            {stock.change >= 0 ? (
              <TrendingUp size={12} color={colors.success} />
            ) : (
              <TrendingDown size={12} color={colors.error} />
            )}
            <Text style={[styles.changeText, { color: stock.change >= 0 ? colors.success : colors.error }]}>
              ${Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
            </Text>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  );

  const renderQuickAction = (action: any, index: number) => (
    <TouchableOpacity key={index} style={styles.quickActionItem}>
      <BlurView intensity={effectiveTheme === 'light' ? 60 : 25} tint={effectiveTheme} style={[styles.quickActionBlur, { borderColor: colors.border }]}>
        <LinearGradient
          colors={[`${action.color}20`, `${action.color}10`]}
          style={styles.quickActionGradient}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}30` }]}>
            <action.icon size={20} color={action.color} />
          </View>
          <Text style={[styles.quickActionLabel, { color: colors.text }]}>{action.label}</Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const renderInsightItem = (insight: any, index: number) => (
    <TouchableOpacity key={index} style={styles.insightCard}>
      <BlurView intensity={effectiveTheme === 'light' ? 60 : 25} tint={effectiveTheme} style={[styles.insightBlur, { borderColor: colors.border }]}>
        <LinearGradient
          colors={
            insight.type === 'bullish' ? [`${colors.success}20`, `${colors.success}05`] :
            insight.type === 'warning' ? [`${colors.warning}20`, `${colors.warning}05`] :
            [`${colors.primary}20`, `${colors.primary}05`]
          }
          style={styles.insightGradient}
        >
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, 
              insight.type === 'bullish' ? { backgroundColor: `${colors.success}30` } : 
              insight.type === 'warning' ? { backgroundColor: `${colors.warning}30` } : 
              { backgroundColor: `${colors.primary}30` }
            ]}>
              {insight.type === 'bullish' ? <TrendingUp size={16} color={colors.success} /> :
               insight.type === 'warning' ? <Activity size={16} color={colors.warning} /> :
               <BarChart3 size={16} color={colors.primary} />}
            </View>
            <Text style={[styles.insightTitle, { color: colors.text }]}>{insight.title}</Text>
          </View>
          <Text style={[styles.insightDescription, { color: colors.textSecondary }]}>{insight.description}</Text>
        </LinearGradient>
      </BlurView>
    </TouchableOpacity>
  );

  const renderSignalLogsTab = () => {
    if (selectedLogAnalysis) {
      return (
        <AnalysisResultDisplay
          analysisResult={selectedLogAnalysis}
          onBackPress={() => setSelectedLogAnalysis(null)}
        />
      );
    }

    const getStatusText = (status: SignalLog['overall_status']) => {
      switch (status) {
        case 'completed': return 'Terminée';
        case 'failed': return 'Échouée';
        case 'in_progress': return 'En cours';
        case 'pending': return 'En attente';
        default: return status;
      }
    };

    const getStatusColor = (status: SignalLog['overall_status']) => {
      switch (status) {
        case 'completed': return colors.success;
        case 'failed': return colors.error;
        case 'in_progress': return colors.warning;
        case 'pending': return colors.textMuted;
        default: return colors.textMuted;
      }
    };

    return (
      <View style={[styles.section, { paddingHorizontal: 0 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 20 }]}>Historique des Analyses</Text>
        {isLoadingLogs ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : logsError ? (
          <Text style={[styles.errorText, { color: colors.error, paddingHorizontal: 20 }]}>{logsError}</Text>
        ) : signalLogs.length === 0 ? (
          <Text style={[styles.noLogsText, { color: colors.textMuted, paddingHorizontal: 20 }]}>
            Aucune analyse trouvée pour le moment. Lancez votre première analyse !
          </Text>
        ) : (
          <View style={styles.signalLogsList}>
            {signalLogs.map((log) => (
              <TouchableOpacity
                key={log.job_id}
                style={[styles.logItem, { borderColor: colors.border, backgroundColor: colors.cardBackground }]}
                onPress={() => {
                  console.log('Viewing details for:', log.job_id, 'Result:', log.final_result);
                  setSelectedLogAnalysis(log.final_result);
                }}
              >
                <BlurView intensity={effectiveTheme === 'light' ? 40 : 15} tint={effectiveTheme} style={styles.logItemBlur}>
                  <View style={styles.logItemHeader}>
                    <Text style={[styles.logItemTitle, { color: colors.text }]}>
                      Analyse {log.final_result?.metadata_info?.pair ? `(${log.final_result.metadata_info.pair}) ` : ''}
                      du {new Date(log.created_at).toLocaleDateString()} à {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    <Text style={[styles.logItemStatus, { 
                      color: getStatusColor(log.overall_status),
                      backgroundColor: `${getStatusColor(log.overall_status)}20`,
                    }]}>
                      {getStatusText(log.overall_status)}
                    </Text>
                  </View>
                  <Text style={[styles.logItemSubtitle, { color: colors.textSecondary }]}>
                    ID de la tâche: {log.job_id.substring(0, 8)}...
                  </Text>
                  {log.final_result?.signals?.[0]?.signal && (
                    <Text style={[styles.logItemSignal, { color: log.final_result.signals[0].signal === 'BUY' ? colors.success : colors.error }]}>
                      Signal: {log.final_result.signals[0].signal}
                    </Text>
                  )}
                  {log.final_result?.no_signal_analysis && (
                    <Text style={[styles.logItemNoSignal, { color: colors.textMuted }]}>
                      Pas de signal trouvé.
                    </Text>
                  )}
                  <View style={styles.viewDetailsButton}>
                    <Text style={[styles.viewDetailsButtonText, { color: colors.primary }]}>Voir les détails</Text>
                    <Eye size={16} color={colors.primary} style={{ marginLeft: 5 }} />
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: 100 }]}>
      <LinearGradient
        colors={
          effectiveTheme === 'light'
            ? ['#FAFBFF', '#F0F4FF', '#E6EFFF']
            : ['#0A0E1A', '#1A1F2E', '#2A2F3E']
        }
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <NavigationHeader
          title="Dashboard"
          subtitle="Welcome back, Trader"
          showSearch={true}
          showNotifications={true}
          onSearch={() => console.log('Search pressed')}
          onNotifications={() => console.log('Notifications pressed')}
        />

        <View style={styles.tabButtonsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeDashboardTab === 'overview' ? styles.tabButtonActive : styles.tabButtonInactive, { borderColor: colors.border }]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveDashboardTab('overview');
              setSelectedLogAnalysis(null);
            }}
          >
            <Text style={[styles.tabButtonText, activeDashboardTab === 'overview' ? styles.tabButtonTextActive : { color: colors.textMuted }]}>
              Aperçu
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeDashboardTab === 'signalLogs' ? styles.tabButtonActive : styles.tabButtonInactive, { borderColor: colors.border }]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveDashboardTab('signalLogs');
              setSelectedLogAnalysis(null);
              fetchSignalLogs();
            }}
          >
            <Text style={[styles.tabButtonText, activeDashboardTab === 'signalLogs' ? styles.tabButtonTextActive : { color: colors.textMuted }]}>
              Historique Analyses
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeDashboardTab === 'overview' ? (
            <>
              <View style={styles.portfolioContainer}>
                <BlurView intensity={effectiveTheme === 'light' ? 80 : 35} tint={effectiveTheme} style={[styles.portfolioCard, { borderColor: colors.border }]}>
                  <LinearGradient
                    colors={effectiveTheme === 'light' ? 
                      ['rgba(8, 8, 8, 0.1)', 'rgba(139, 92, 246, 0.05)'] :
                      ['rgba(99, 102, 241, 0.2)', 'rgba(139, 92, 246, 0.1)']
                    }
                    style={styles.portfolioGradient}
                  >
                    <View style={styles.portfolioHeader}>
                      <View style={[styles.portfolioIcon, { backgroundColor: `${colors.primary}30` }]}>
                        <DollarSign size={24} color={colors.primary} />
                      </View>
                      <Text style={[styles.portfolioLabel, { color: colors.textSecondary }]}>Total Portfolio</Text>
                    </View>
                    <Text style={[styles.portfolioValue, { color: colors.text }]}>
                      ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.portfolioChange}>
                      <BlurView intensity={30} tint={effectiveTheme} style={[styles.changeChip, { backgroundColor: `${colors.success}20`, borderColor: `${colors.success}30` }]}>
                        <TrendingUp size={14} color={colors.success} />
                        <Text style={[styles.changeValue, { color: colors.success }]}>
                          +${dailyChange.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </Text>
                      </BlurView>
                      <Text style={[styles.changePercent, { color: colors.success }]}>+{dailyChangePercent}%</Text>
                    </View>
                  </LinearGradient>
                </BlurView>
              </View>

              <View style={styles.quickActionsContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map(renderQuickAction)}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Market Overview</Text>
                  <TouchableOpacity>
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.marketGrid}>
                  {marketData.map(renderStockItem)}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Insights</Text>
                <View style={styles.insightsContainer}>
                  {aiInsights.map(renderInsightItem)}
                </View>
              </View>
            </>
          ) : (
            renderSignalLogsTab()
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  portfolioContainer: {
    marginBottom: 24,
  },
  portfolioCard: {
    borderRadius: 28,
    overflow: Platform.OS === 'android' ? 'hidden' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
       // elevation: 15,
      },
    }),
  },
  portfolioGradient: {
    padding: 28,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  portfolioIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  portfolioLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  portfolioValue: {
    fontSize: 42,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -1,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  changePercent: {
    fontSize: 16,
    fontWeight: '700',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionBlur: {
    borderRadius: 20,
    overflow: Platform.OS === 'android' ? 'hidden' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stockItem: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 20,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  stockItemBlur: {
    padding: 16,
  },
  stockHeader: {
    marginBottom: 12,
  },
  stockInfo: {
    marginBottom: 8,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  stockName: {
    fontSize: 12,
    fontWeight: '500',
  },
  stockPriceContainer: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  stockVolume: {
    fontSize: 11,
    fontWeight: '500',
  },
  stockFooter: {
    alignItems: 'flex-start',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  positive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  negative: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  insightsContainer: {
    gap: 12,
  },
  insightCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  insightBlur: {
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  insightGradient: {
    padding: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 5,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#60A5FA',
    borderColor: '#60A5FA',
  },
  tabButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#475569',
  },
  tabButtonText: {
    fontWeight: '600',
    fontSize: 15,
  },
  tabButtonTextActive: {
    color: 'white',
  },
  tabButtonTextInactive: {
    color: '#94A3B8',
  },
  signalLogsList: {
    marginTop: 15,
  },
  logItem: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      },
    }),
  },
  logItemBlur: {
    padding: 16,
  },
  logItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logItemTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  logItemStatus: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logItemSubtitle: {
    fontSize: 12,
    color: '#CBD5E1',
    marginBottom: 8,
  },
  logItemSignal: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  logItemNoSignal: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  viewDetailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noLogsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 15,
  },
});
