import React, { useState } from 'react';
// import AnalysisResultCard from '../../components/AnalysisResultCard'; // Ce composant n'est plus utilisé car la réponse n'est pas immédiate
import { ScrollView, TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import NavigationHeader from '@/components/NavigationHeader';
import BreadcrumbNavigation from '@/components/BreadcrumbNavigation';
import { useTheme } from '@/contexts/ThemeContext';

// --- Types pour la clarté ---
type TradingStyle = 'intraday' | 'swing';
type RiskLevel = 'basse' | 'moyenne' | 'Haut';
type GainLevel = 'min' | 'moyen' | 'Max';
type ForexPair = 'EUR/USD' | 'USD/JPY' | 'GBP/USD' | 'USD/CHF' | 'AUD/USD' | 'USD/CAD' | 'NZD/USD';

// --- Constantes pour les options ---
const MAJOR_PAIRS: ForexPair[] = ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
const TRADING_STYLES: TradingStyle[] = ['intraday', 'swing'];
const RISK_LEVELS: RiskLevel[] = ['basse', 'moyenne', 'Haut'];
const GAIN_LEVELS: GainLevel[] = ['min', 'moyen', 'Max'];

export default function AnalyseScreen() {
  const { colors } = useTheme();

  // --- États pour les paramètres de l'analyse ---
  const [pair, setPair] = useState<ForexPair>('EUR/USD');
  const [style, setStyle] = useState<TradingStyle>('intraday');
  const [risk, setRisk] = useState<RiskLevel>('moyenne');
  const [gain, setGain] = useState<GainLevel>('moyen');

  // --- États pour la requête et sa réponse ---
  const [isLoading, setIsLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // --- Envoi direct de la requête POST au webhook ---
  const handleStartAnalysis = async () => {
    // Formatte l'heure actuelle au format "YYYY-MM-DD HH:mm"
    const now = new Date();
    const formattedTime = now.toISOString().slice(0, 16).replace('T', ' '); // Format YYYY-MM-DD HH:mm

    // La charge utile (payload) à envoyer
    const payload = {
      pair,
      style,
      risk,
      gain,
      time: formattedTime, // Le temps est pré-programmé
    };
    
    const webhookUrl = "http://localhost:5678/webhook-test/maestro";

    setIsLoading(true);
    setRequestStatus(null);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Gérer les erreurs HTTP (ex: 404, 500)
        const errorText = await response.text();
        throw new Error(`Erreur du serveur: ${response.status}. ${errorText}`);
      }

      // Si la requête réussit (status 2xx), afficher un message de succès
      setRequestStatus({ message: "Requête d'analyse envoyée avec succès.", type: 'success' });

    } catch (e: any) {
      // Gérer les erreurs réseau ou autres exceptions
      setRequestStatus({ message: e.message || 'Une erreur inconnue est survenue.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Composant réutilisable pour une section de sélection ---
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

  return (
    <View style={[styles.container, { paddingBottom: 100 }]}>
      <NavigationHeader
        title="Market Analysis"
        subtitle="AI-powered trading insights"
      />
      <BreadcrumbNavigation
        items={[
          { label: 'Analysis', onPress: () => {} },
          { label: 'Configuration', isActive: true },
        ]}
        onHomePress={() => {}}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Configuration de l'Analyse</Text>
        <Text style={styles.headerSubtitle}>
          Définissez les critères pour que l'IA trouve les meilleures opportunités.
        </Text>

        <SelectionSection
          title="Paire de Devises (Majeures)"
          options={MAJOR_PAIRS}
          selectedValue={pair}
          onSelect={setPair}
        />
        <SelectionSection
          title="Style de Trading"
          options={TRADING_STYLES}
          selectedValue={style}
          onSelect={setStyle}
        />
        <SelectionSection
          title="Niveau de Risque"
          options={RISK_LEVELS}
          selectedValue={risk}
          onSelect={setRisk}
        />
        <SelectionSection
          title="Objectif de Gain"
          options={GAIN_LEVELS}
          selectedValue={gain}
          onSelect={setGain}
        />

        <TouchableOpacity style={styles.actionButton} onPress={handleStartAnalysis} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>Lancer l'Analyse</Text>
          )}
        </TouchableOpacity>

        {/* --- Zone d'affichage du statut de la requête --- */}
        {requestStatus && (
          <View style={styles.resultContainer}>
            <Text style={requestStatus.type === 'success' ? styles.successText : styles.errorText}>
              {requestStatus.message}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
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
    textAlign: 'center',
  },
  successText: {
    color: '#34D399', // Vert pour le succès
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
