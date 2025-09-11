import React, { useState, useRef, useEffect } from 'react';
import { WEBHOOK_URL } from '@env';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Send, ToggleLeft, ToggleRight, Bot, User, ChartBar as BarChart3 } from 'lucide-react-native';
// import geminiService from '../../services/geminiService'; // Supprimez cette importation

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  analysis?: any;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI trading assistant. Ask me about a stock symbol (e.g., "AAPL", "TSLA") to get an analysis.',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: trimmedInput,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // --- MODIFICATION ICI : Appel direct au webhook n8n ---
    // Remplacez 'your-chat-webhook-id' par l'ID de votre webhook n8n dédié pour le chat
    const webhookUrl = WEBHOOK_URL; 

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envoyez le symbole boursier dans un objet JSON
        body: JSON.stringify({ symbol: trimmedInput }), 
      });

      if (!response.ok) {
        // Si la réponse HTTP n'est pas OK (e.g., 404, 500), lancez une erreur
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorData.message || response.statusText}`);
      }

      // Parsez la réponse JSON du webhook
      const analysisResult = await response.json();
      
      // Vérifiez que la structure de la réponse du webhook correspond à ce que le composant attend
      // Votre workflow n8n doit renvoyer un objet avec au moins une propriété 'analysis' (pour le texte)
      // et potentiellement d'autres propriétés comme 'symbol', 'recommendation', etc.
      if (!analysisResult || typeof analysisResult.analysis !== 'string') {
        throw new Error('Invalid analysis result format received from webhook. Expected an object with an "analysis" string property.');
      }

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: analysisResult.analysis, // Le texte récapitulatif principal de l'analyse
        isUser: false,
        timestamp: new Date(),
        analysis: analysisResult, // Passez l'objet structuré complet à la vue d'analyse
      };
      
      setMessages(prev => [...prev, aiResponse]);

    } catch (error: any) {
      console.error('Error sending message to webhook:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I couldn't process your request. Error: ${error.message}. Please ensure you entered a valid stock symbol and try again.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      Alert.alert('Error', `Failed to get AI response: ${error.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };
  // --- FIN DE LA MODIFICATION ---

  const renderMessage = (message: Message) => (
    <BlurView 
      key={message.id} 
      intensity={20} 
      tint={message.isUser ? "light" : "dark"} 
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage
      ]}
    >
      <LinearGradient
        colors={message.isUser ? 
          ['rgba(59, 130, 246, 0.3)', 'rgba(59, 130, 246, 0.1)'] : 
          ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
        }
        style={styles.messageGradient}
      >
        <View style={styles.messageHeader}>
          <View style={styles.messageIcon}>
            {message.isUser ? (
              <User size={16} color="#60A5FA" />
            ) : (
              <Bot size={16} color="#10B981" />
            )}
          </View>
          <Text style={styles.messageTime}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.messageText}>{message.text}</Text>
      </LinearGradient>
    </BlurView>
  );

  const renderAnalysis = () => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.analysis || lastMessage.isUser) return null;

    const analysis = lastMessage.analysis;
    
    return (
      <BlurView intensity={30} tint="dark" style={styles.analysisContainer}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']}
          style={styles.analysisGradient}
        >
          <View style={styles.analysisHeader}>
            <View style={styles.analysisIconContainer}>
              <BarChart3 size={20} color="#60A5FA" />
            </View>
            <Text style={styles.analysisTitle}>AI Analysis: {analysis.symbol}</Text>
          </View>

          <View style={styles.analysisGrid}>
            <BlurView intensity={20} tint="light" style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Recommendation</Text>
              <Text style={[styles.analysisValue, { color: '#10B981' }]}>{analysis.recommendation || 'N/A'}</Text>
            </BlurView>
            <BlurView intensity={20} tint="light" style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Confidence</Text>
              <Text style={styles.analysisValue}>{analysis.confidence || 'N/A'}%</Text>
            </BlurView>
            <BlurView intensity={20} tint="light" style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Risk Level</Text>
              <Text style={styles.analysisValue}>{analysis.riskLevel || 'N/A'}</Text>
            </BlurView>
            <BlurView intensity={20} tint="light" style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Target Price</Text>
              <Text style={styles.analysisValue}>${analysis.targetPrice || 'N/A'}</Text>
            </BlurView>
            <BlurView intensity={20} tint="light" style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Stop Loss</Text>
              <Text style={styles.analysisValue}>${analysis.stopLoss || 'N/A'}</Text>
            </BlurView>
            <BlurView intensity={20} tint="light" style={styles.analysisItem}>
              <Text style={styles.analysisLabel}>Timeframe</Text>
              <Text style={styles.analysisValue}>{analysis.timeframe || 'N/A'}</Text>
            </BlurView>
          </View>

          <BlurView intensity={25} tint="dark" style={styles.keyFactors}>
            <Text style={styles.keyFactorsTitle}>Key Factors</Text>
            {analysis.keyFactors && analysis.keyFactors.map((factor: string, index: number) => (
              <Text key={index} style={styles.keyFactor}>• {factor}</Text>
            ))}
          </BlurView>
        </LinearGradient>
      </BlurView>
    );
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
          <BlurView intensity={30} tint="dark" style={styles.header}>
            <Text style={styles.headerTitle}>AI Trading Assistant</Text>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowAnalysis(!showAnalysis)}
            >
              <BlurView intensity={40} tint="light" style={styles.toggleButtonInner}>
                {showAnalysis ? (
                  <ToggleRight size={24} color="#60A5FA" />
                ) : (
                  <ToggleLeft size={24} color="#9CA3AF" />
                )}
                <Text style={styles.toggleText}>Analysis</Text>
              </BlurView>
            </TouchableOpacity>
          </BlurView>

        {/* Chat/Analysis View */}
        <View style={styles.contentContainer}>
          {!showAnalysis ? (
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map(renderMessage)}
              {isLoading && (
                <BlurView 
                  intensity={20} 
                  tint="dark" 
                  style={[styles.messageContainer, styles.aiMessage]}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                    style={styles.messageGradient}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.messageIcon}>
                        <Bot size={16} color="#22C55E" />
                      </View>
                      <Text style={styles.messageTime}>Typing...</Text>
                    </View>
                    <Text style={styles.loadingText}>AI is analyzing your request...</Text>
                  </LinearGradient>
                </BlurView>
              )}
            </ScrollView>
          ) : (
            <ScrollView 
              style={styles.analysisScrollView}
              showsVerticalScrollIndicator={false}
            >
              {renderAnalysis()}
            </ScrollView>
          )}
        </View>

        {/* Input Area */}
          <BlurView intensity={40} tint="dark" style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about a stock symbol (e.g., AAPL)..."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#3B82F6', '#1D4ED8'] : ['#374151', '#4B5563']}
                  style={styles.sendButtonGradient}
                >
                  <Send size={20} color={inputText.trim() ? '#FFFFFF' : '#9CA3AF'} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </BlurView>
      </KeyboardAvoidingView>
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
  keyboardContainer: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  toggleButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  toggleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
    borderRadius: 20,
    maxWidth: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  messageGradient: {
    padding: 16,
    borderRadius: 20,
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  aiMessage: {
    alignSelf: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  analysisScrollView: {
    flex: 1,
    padding: 20,
  },
  analysisContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  analysisGradient: {
    padding: 24,
    borderRadius: 24,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(96, 165, 250, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  analysisItem: {
    width: '32%', // Adjusted for 3 items per row
    padding: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12, // Added margin for spacing
  },
  analysisLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  keyFactors: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyFactorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  keyFactor: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  sendButtonActive: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
