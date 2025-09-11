import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown, CircleDot, Shield, Target, XCircle } from 'lucide-react-native';

// --- Helper pour les couleurs ---
const getRecommendationStyle = (recommendation: string) => {
  switch (recommendation) {
    case 'BUY':
      return { container: styles.buyContainer, text: styles.buyText, icon: <TrendingUp color="#22C55E" size={20} /> };
    case 'SELL':
      return { container: styles.sellContainer, text: styles.sellText, icon: <TrendingDown color="#EF4444" size={20} /> };
    default:
      return { container: styles.holdContainer, text: styles.holdText, icon: <CircleDot color="#94A3B8" size={20} /> };
  }
};

const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return { text: styles.lowRiskText };
      case 'MEDIUM':
        return { text: styles.mediumRiskText };
      case 'HIGH':
        return { text: styles.highRiskText };
      default:
        return { text: styles.holdText };
    }
  };


// --- Composant principal ---
export default function AnalysisResultCard({ result }: { result: any }) {
  const recommendationStyle = getRecommendationStyle(result.recommendation);
  const riskStyle = getRiskStyle(result.riskLevel);

  return (
    <View style={styles.card}>
      {/* --- En-tête avec la recommandation --- */}
      <View style={[styles.header, recommendationStyle.container]}>
        {recommendationStyle.icon}
        <Text style={[styles.headerText, recommendationStyle.text]}>
          {result.recommendation} ({result.strategy})
        </Text>
      </View>

      {/* --- Métriques clés --- */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Confiance</Text>
          <Text style={[styles.metricValue, { color: '#60A5FA' }]}>{result.confidence}%</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Risque</Text>
          <Text style={[styles.metricValue, riskStyle.text]}>{result.riskLevel}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Timeframe</Text>
          <Text style={styles.metricValue}>{result.timeframe}</Text>
        </View>
      </View>

      {/* --- Plan de trading --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan de Trading</Text>
        {result.entryPoints.map((entry: any, index: number) => (
             <View style={styles.planItem} key={index}>
                <CircleDot color="#818CF8" size={18} />
                <Text style={styles.planLabel}>Entrée {entry.type === 'SECONDARY' ? 'Secondaire' : 'Principale'}</Text>
                <Text style={styles.planValue}>${entry.price}</Text>
            </View>
        ))}
        <View style={styles.planItem}>
          <Target color="#22C55E" size={18} />
          <Text style={styles.planLabel}>Prix Cible</Text>
          <Text style={styles.planValue}>${result.targetPrice}</Text>
        </View>
        <View style={styles.planItem}>
          <XCircle color="#EF4444" size={18} />
          <Text style={styles.planLabel}>Stop Loss</Text>
          <Text style={styles.planValue}>${result.stopLoss}</Text>
        </View>
      </View>

      {/* --- Résumé de l'analyse --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Résumé de l'Analyse</Text>
        <Text style={styles.summaryText}>{result.summary}</Text>
      </View>

      {/* --- Indicateurs Clés --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Indicateurs Clés</Text>
        <View style={styles.tagContainer}>
            {result.keyIndicators.map((indicator: string, index: number) => (
                <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{indicator}</Text>
                </View>
            ))}
        </View>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyContainer: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  buyText: { color: '#22C55E' },
  sellContainer: { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  sellText: { color: '#EF4444' },
  holdContainer: { backgroundColor: 'rgba(148, 163, 184, 0.1)' },
  holdText: { color: '#94A3B8' },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 4,
  },
  metricValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lowRiskText: { color: '#22C55E' },
  mediumRiskText: { color: '#F59E0B' },
  highRiskText: { color: '#EF4444' },
  section: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  planLabel: {
    color: '#E2E8F0',
    fontSize: 15,
    flex: 1,
    marginLeft: 10,
  },
  planValue: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  summaryText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#334155',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '500',
  },
});