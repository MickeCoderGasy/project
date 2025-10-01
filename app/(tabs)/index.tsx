import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Eye, Activity, Plus, Bell, Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import NavigationHeader from '@/components/NavigationHeader';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';

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
        {/* Enhanced Navigation Header */}
        <NavigationHeader
          title="Dashboard"
          subtitle="Welcome back, Trader"
          showSearch={true}
          showNotifications={true}
          onSearch={() => console.log('Search pressed')}
          onNotifications={() => console.log('Notifications pressed')}
        />

        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            { label: 'Portfolio', isActive: true },
          ]}
          onHomePress={() => console.log('Home pressed')}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Enhanced Portfolio Card */}
          <View style={styles.portfolioContainer}>
            <BlurView intensity={effectiveTheme === 'light' ? 80 : 35} tint={effectiveTheme} style={[styles.portfolioCard, { borderColor: colors.border }]}>
              <LinearGradient
                colors={effectiveTheme === 'light' ? 
                  ['rgba(99, 102, 241, 0.1)', 'rgba(139, 92, 246, 0.05)'] :
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

          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              {quickActions.map(renderQuickAction)}
            </View>
          </View>

          {/* Market Overview */}
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

          {/* AI Insights */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>AI Insights</Text>
            <View style={styles.insightsContainer}>
              {aiInsights.map(renderInsightItem)}
            </View>
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
  scrollContent: {
    paddingBottom: 20,
  },
  portfolioContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  portfolioCard: {
    borderRadius: 28,
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
      },
      android: {
        elevation: 15,
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
    paddingHorizontal: 20,
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
    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    paddingHorizontal: 20,
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
});