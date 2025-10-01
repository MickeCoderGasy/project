import React, { useState, useRef, useEffect } from 'react';
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
import geminiService from '../../services/geminiService';

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

    try {
      // Call the Gemini Service which now returns a structured JSON object
      const analysisResult = await geminiService.analyzeStock(trimmedInput);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: analysisResult.analysis, // The main summary text
        isUser: false,
        timestamp: new Date(),
        analysis: analysisResult, // Pass the entire structured object to the analysis view
      };
      
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your request. Please ensure you entered a valid stock symbol and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      Alert.alert('Error', 'Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        colors={
          effectiveTheme === 'light'
            ? ['#FAFBFF', '#F0F4FF', '#E6EFFF']
            : ['#0A0E1A', '#1A1F2E', '#2A2F3E']
        }
        style={styles.backgroundGradient}
      />
      <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
          <BlurView intensity={effectiveTheme === 'light' ? 80 : 30} tint={effectiveTheme} style={[styles.header, { borderColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.aiIcon, { backgroundColor: `${colors.primary}30` }]}>
                <Bot size={20} color={colors.primary} />
              </View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>AI Trading Assistant</Text>
            </View>
            <TouchableOpacity 
              style={styles.toggleButton}
              onPress={() => setShowAnalysis(!showAnalysis)}
            >
              <BlurView intensity={40} tint={effectiveTheme} style={[styles.toggleButtonInner, { borderColor: colors.border }]}>
                {showAnalysis ? (
                  <ToggleRight size={20} color={colors.primary} />
                ) : (
                  <ToggleLeft size={20} color={colors.textMuted} />
                )}
                <Text style={[styles.toggleText, { color: colors.text }]}>Analysis</Text>
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
                  intensity={effectiveTheme === 'light' ? 60 : 20} 
                  tint={effectiveTheme} 
                  style={[styles.messageContainer, styles.aiMessage]}
                >
                  <LinearGradient
                    colors={effectiveTheme === 'light' ? 
                      ['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.02)'] :
                      ['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']
                    }
                    style={styles.messageGradient}
                  >
                    <View style={styles.messageHeader}>
                      <View style={styles.messageIcon}>
                        <Bot size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.messageTime, { color: colors.textMuted }]}>Typing...</Text>
                    </View>
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>AI is analyzing your request...</Text>
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
          <BlurView intensity={effectiveTheme === 'light' ? 80 : 40} tint={effectiveTheme} style={[styles.inputContainer, { borderColor: colors.border }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.inputBackground, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about a stock symbol (e.g., AAPL)..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient
                  colors={inputText.trim() ? [colors.primary, colors.primaryDark] : [colors.border, colors.borderLight]}
                  style={styles.sendButtonGradient}
                >
                  <Send size={18} color={inputText.trim() ? '#FFFFFF' : colors.textMuted} />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  toggleButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  toggleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
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
    borderRadius: 24,
    maxWidth: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  messageGradient: {
    padding: 18,
    borderRadius: 24,
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
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageTime: {
    fontSize: 11,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  loadingText: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  analysisScrollView: {
    flex: 1,
    padding: 20,
  },
  analysisContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 15,
  },
  analysisGradient: {
    padding: 28,
    borderRadius: 28,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(96, 165, 250, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  analysisItem: {
    width: '32%', // Adjusted for 3 items per row
    padding: 14,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12, // Added margin for spacing
  },
  analysisLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  keyFactors: {
    padding: 18,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  keyFactorsTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  keyFactor: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  inputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  sendButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});