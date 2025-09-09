import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, DollarSign, ChartBar as BarChart3, Eye, Activity } from 'lucide-react-native';

export default function HomeScreen() {
  const portfolioValue = 125420.50;
  const dailyChange = 2340.25;
  const dailyChangePercent = 1.87;

  const marketData = [
    { symbol: 'AAPL', price: 178.25, change: 2.15, changePercent: 1.22 },
    { symbol: 'GOOGL', price: 142.80, change: -1.45, changePercent: -1.01 },
    { symbol: 'MSFT', price: 415.30, change: 5.80, changePercent: 1.42 },
    { symbol: 'TSLA', price: 248.42, change: -8.25, changePercent: -3.21 },
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

  const renderStockItem = (stock: any) => (
    <View key={stock.symbol} style={styles.stockItem}>
      <View style={styles.stockInfo}>
        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
        <Text style={styles.stockPrice}>${stock.price}</Text>
      </View>
      <View style={styles.stockChange}>
        <View style={[styles.changeContainer, stock.change >= 0 ? styles.positive : styles.negative]}>
          {stock.change >= 0 ? (
            <TrendingUp size={14} color="#22C55E" />
          ) : (
            <TrendingDown size={14} color="#EF4444" />
          )}
          <Text style={[styles.changeText, stock.change >= 0 ? styles.positiveText : styles.negativeText]}>
            ${Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent).toFixed(2)}%)
          </Text>
        </View>
      </View>
    </View>
  );

  const renderInsightItem = (insight: any, index: number) => (
    <TouchableOpacity key={index} style={styles.insightItem}>
      <View style={styles.insightHeader}>
        <View style={[styles.insightIcon, 
          insight.type === 'bullish' ? styles.bullishIcon : 
          insight.type === 'warning' ? styles.warningIcon : styles.neutralIcon
        ]}>
          {insight.type === 'bullish' ? <TrendingUp size={16} color="#22C55E" /> :
           insight.type === 'warning' ? <Activity size={16} color="#F59E0B" /> :
           <BarChart3 size={16} color="#3B82F6" />}
        </View>
        <Text style={styles.insightTitle}>{insight.title}</Text>
      </View>
      <Text style={styles.insightDescription}>{insight.description}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
          <BlurView intensity={20} tint="dark" style={styles.header}>
            <Text style={styles.greeting}>Good morning, Trader</Text>
            <TouchableOpacity style={styles.watchlistButton}>
              <BlurView intensity={40} tint="light" style={styles.glassButton}>
                <Eye size={20} color="#60A5FA" />
              </BlurView>
            </TouchableOpacity>
          </BlurView>

        {/* Portfolio Summary */}
          <BlurView intensity={30} tint="dark" style={styles.portfolioCard}>
            <LinearGradient
              colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
              style={styles.portfolioGradient}
            >
              <View style={styles.portfolioHeader}>
                <View style={styles.iconContainer}>
                  <DollarSign size={24} color="#60A5FA" />
                </View>
                <Text style={styles.portfolioTitle}>Portfolio Value</Text>
              </View>
              <Text style={styles.portfolioValue}>${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              <View style={styles.portfolioChange}>
                <BlurView intensity={40} tint="light" style={[styles.changeContainer, dailyChange >= 0 ? styles.positive : styles.negative]}>
                  {dailyChange >= 0 ? (
                    <TrendingUp size={16} color="#10B981" />
                  ) : (
                    <TrendingDown size={16} color="#F87171" />
                  )}
                  <Text style={[styles.changeText, dailyChange >= 0 ? styles.positiveText : styles.negativeText]}>
                    +${dailyChange.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({dailyChangePercent}%)
                  </Text>
                </BlurView>
                <Text style={styles.changeLabel}>Today</Text>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Market Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            <BlurView intensity={25} tint="dark" style={styles.marketCard}>
              {marketData.map(renderStockItem)}
            </BlurView>
            </View>

          {/* AI Insights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Insights</Text>
            {aiInsights.map(renderInsightItem)}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  watchlistButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  glassButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  portfolioCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  portfolioGradient: {
    padding: 24,
    borderRadius: 24,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  portfolioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  portfolioChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  positive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  negative: {
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  positiveText: {
    color: '#10B981',
  },
  negativeText: {
    color: '#F87171',
  },
  changeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  marketCard: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  stockPrice: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stockChange: {
    alignItems: 'flex-end',
  },
  insightItem: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bullishIcon: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  warningIcon: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  neutralIcon: {
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  insightDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
});