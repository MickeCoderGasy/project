import React, { useState } from 'react';
import AnalysisResultCard from '../../components/AnalysisResultCard'; // Import the new component
import geminiService from '@/services/geminiService';
import { ScrollView, Switch, TextInput, TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import NavigationHeader from '@/components/NavigationHeader';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { useTheme } from '@/contexts/ThemeContext';

// --- Types pour la clarté ---
type TimeFrame = '15m' | '1H' | '4H' | '1D';
type TradingStyle = 'Tendance' | 'Contre-tendance' | 'Breakout' | 'Range';
type Indicator = 'RSI' | 'MACD' | 'Moyennes Mobiles' | 'Bollinger';

export default function AnalyseScreen() {
  const { colors, effectiveTheme } = useTheme();
  // --- États pour les paramètres de base ---
  const [pair, setPair] = useState('EUR/USD');
  const [timeframe, setTimeframe] = useState<TimeFrame>('1H');

  // --- États pour les options activables ---
  const [useConfidence, setUseConfidence] = useState(true);
  const [confidence, setConfidence] = useState(75);

  const [useEntryType, setUseEntryType] = useState(true);
  const [isMultipleEntries, setIsMultipleEntries] = useState(false);

  const [useIndicators, setUseIndicators] = useState(true);
  const [selectedIndicators, setSelectedIndicators] = useState<Indicator[]>(['RSI']);

  const [useRiskReward, setUseRiskReward] = useState(false);
  const [riskReward, setRiskReward] = useState('1:2');

  const [useTradingStyle, setUseTradingStyle] = useState(true);
  const [tradingStyle, setTradingStyle] = useState<TradingStyle>('Tendance');

  // --- États pour la réponse de l'API ---
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);


  // --- Fonctions pour gérer les sélections multiples ---
  const toggleIndicator = (indicator: Indicator) => {
    setSelectedIndicators(prev =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  // --- Appel au service Gemini ---
  const handleStartAnalysis = async () => {
    const analysisConfig = {
      pair,
      timeframe,
      ...(useConfidence && { confidence }),
      ...(useEntryType && { isMultipleEntries }),
      ...(useIndicators && { indicators: selectedIndicators }),
      ...(useRiskReward && { riskReward }),
      ...(useTradingStyle && { tradingStyle }),
    };
    
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const result = await geminiService.getAnalysis(analysisConfig);
      if (result.rawResponse) {
        setError(`L'IA a retourné une réponse inattendue. Détails : ${result.rawResponse}`);
      } else {
        setAnalysisResult(result);
      }
    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Section réutilisable pour les options ---
  const OptionSection = ({ title, value, onValueChange, children }: any) => (
    <View style={styles.optionSection}>
      <View style={styles.optionHeader}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Switch
          trackColor={{ false: '#334155', true: '#4F46E5' }}
          thumbColor={value ? '#60A5FA' : '#94A3B8'}
          onValueChange={onValueChange}
          value={value}
        />
      </View>
      {value && <View style={styles.optionContent}>{children}</View>}
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: 100 }]}>
      {/* Enhanced Navigation Header */}
      <NavigationHeader
        title="Market Analysis"
        subtitle="AI-powered trading insights"
        showSearch={true}
        showNotifications={false}
        onSearch={() => console.log('Search analysis')}
      />

      {/* Breadcrumb Navigation */}
      <BreadcrumbNavigation
        items={[
          { label: 'Analysis', onPress: () => console.log('Analysis') },
          { label: 'Configuration', isActive: true },
        ]}
        onHomePress={() => console.log('Home pressed')}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Configuration de l'Analyse</Text>
        <Text style={styles.headerSubtitle}>
          Définissez les critères pour que l'IA trouve les meilleures opportunités.
        </Text>

        {/* --- Section de base --- */}
        <View style={styles.section}>
          <Text style={styles.label}>Paire de devises / Actif</Text>
          <TextInput
            style={styles.input}
            value={pair}
            onChangeText={setPair}
            placeholder="Ex: BTC/USD, AAPL..."
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>Time Frame</Text>
          <View style={styles.tagContainer}>
            {(['15m', '1H', '4H', '1D'] as TimeFrame[]).map(tf => (
              <TouchableOpacity
                key={tf}
                style={[styles.tag, timeframe === tf && styles.tagSelected]}
                onPress={() => setTimeframe(tf)}>
                <Text style={[styles.tagText, timeframe === tf && styles.tagTextSelected]}>
                  {tf}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- Sections optionnelles --- */}
        <OptionSection title="Niveau de Confiance" value={useConfidence} onValueChange={setUseConfidence}>
          <View style={styles.sliderContainer}>
            <Slider
              style={{ flex: 1 }}
              minimumValue={50}
              maximumValue={100}
              step={5}
              value={confidence}
              onValueChange={setConfidence}
              minimumTrackTintColor="#60A5FA"
              maximumTrackTintColor="#334155"
              thumbTintColor="#818CF8"
            />
            <Text style={styles.sliderValue}>{confidence}%</Text>
          </View>
        </OptionSection>

        <OptionSection title="Type d'Entrée" value={useEntryType} onValueChange={setUseEntryType}>
            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Entrée Unique</Text>
                <Switch
                    trackColor={{ false: '#4F46E5', true: '#334155' }}
                    thumbColor={!isMultipleEntries ? '#60A5FA' : '#94A3B8'}
                    value={!isMultipleEntries}
                    onValueChange={() => setIsMultipleEntries(false)}
                />
                <Text style={styles.switchLabel}>Entrées Multiples</Text>
                 <Switch
                    trackColor={{ false: '#334155', true: '#4F46E5' }}
                    thumbColor={isMultipleEntries ? '#60A5FA' : '#94A3B8'}
                    value={isMultipleEntries}
                    onValueChange={() => setIsMultipleEntries(true)}
                />
            </View>
        </OptionSection>

        <OptionSection title="Indicateurs Techniques" value={useIndicators} onValueChange={setUseIndicators}>
          <View style={styles.tagContainer}>
            {(['RSI', 'MACD', 'Moyennes Mobiles', 'Bollinger'] as Indicator[]).map(ind => (
              <TouchableOpacity
                key={ind}
                style={[styles.tag, selectedIndicators.includes(ind) && styles.tagSelected]}
                onPress={() => toggleIndicator(ind)}>
                <Text style={[styles.tagText, selectedIndicators.includes(ind) && styles.tagTextSelected]}>
                  {ind}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </OptionSection>

        <OptionSection title="Ratio Risque/Récompense" value={useRiskReward} onValueChange={setUseRiskReward}>
          <TextInput
            style={styles.input}
            value={riskReward}
            onChangeText={setRiskReward}
            placeholder="Ex: 1:2, 1:3..."
            placeholderTextColor="#64748B"
          />
        </OptionSection>

        <OptionSection title="Style de Trading" value={useTradingStyle} onValueChange={setUseTradingStyle}>
          <View style={styles.tagContainer}>
            {(['Tendance', 'Contre-tendance', 'Breakout', 'Range'] as TradingStyle[]).map(style => (
              <TouchableOpacity
                key={style}
                style={[styles.tag, tradingStyle === style && styles.tagSelected]}
                onPress={() => setTradingStyle(style)}>
                <Text style={[styles.tagText, tradingStyle === style && styles.tagTextSelected]}>
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </OptionSection>

        {/* --- Bouton d'action --- */}
        <TouchableOpacity style={styles.actionButton} onPress={handleStartAnalysis} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>Lancer l'Analyse</Text>
          )}
        </TouchableOpacity>

        {/* --- Zone d'affichage des résultats --- */}
        {error && (
          <View style={styles.resultContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {analysisResult && (
          <AnalysisResultCard result={analysisResult} />
        )}
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // Espace pour la barre de navigation
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: '#475569',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  tagSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#60A5FA',
  },
  tagText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  tagTextSelected: {
    color: 'white',
  },
  optionSection: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: 20,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  optionContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sliderValue: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  switchLabel: {
      color: '#E2E8F0',
      fontSize: 14,
      fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#60A5FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
  },
  errorText: {
    color: '#F87171',
    fontWeight: 'bold',
  }
});