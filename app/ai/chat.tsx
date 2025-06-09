import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { usePlants } from '@/context/PlantContext';
import { useLanguage } from '@/context/LanguageContext';
import { aiService } from '@/services/aiService';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { ArrowLeft, Send, Bot, User, Leaf, Lightbulb, CircleHelp as HelpCircle } from 'lucide-react-native';
import { ChatMessage, AIResponse } from '@/types';

export default function AIChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plants } = usePlants();
  const { t } = useLanguage();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Add welcome message
    const welcomeMessage: ChatMessage = {
      id: '1',
      userId: user?.id || '',
      message: `Hello ${user?.name}! I'm your eGarden AI assistant. I can help you with plant care, disease identification, and answer questions about your garden. What would you like to know?`,
      timestamp: new Date(),
      isUser: false,
      type: 'text',
      language: 'en',
      aiResponse: {
        confidence: 1.0,
        sources: ['eGarden AI Assistant'],
        relatedPlants: [],
        actionItems: [],
        followUpQuestions: [
          'How can I improve my plant care routine?',
          'What should I do if my plants look unhealthy?',
          'Can you help me identify plant diseases?',
        ],
      },
    };
    setMessages([welcomeMessage]);
  }, [user]);

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: user?.id || '',
      message: inputText.trim(),
      timestamp: new Date(),
      isUser: true,
      type: 'text',
      language: 'en',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const aiResponse = await aiService.chatWithAssistant(
        inputText.trim(),
        plants,
        'en',
        { userId: user?.id }
      );

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'ai',
        message: generateAIResponse(inputText.trim(), plants, aiResponse),
        timestamp: new Date(),
        isUser: false,
        type: 'text',
        language: 'en',
        aiResponse,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI chat error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'ai',
        message: "I'm sorry, I'm having trouble connecting right now. Please try again later or check your internet connection.",
        timestamp: new Date(),
        isUser: false,
        type: 'text',
        language: 'en',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const generateAIResponse = (userInput: string, userPlants: any[], aiResponse: AIResponse): string => {
    const input = userInput.toLowerCase();
    
    // Plant-specific responses
    if (input.includes('water') || input.includes('watering')) {
      const plantsNeedingWater = userPlants.filter(plant => {
        if (!plant.lastWatered) return true;
        const daysSince = Math.floor((new Date().getTime() - plant.lastWatered.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince >= plant.wateringFrequency;
      });

      if (plantsNeedingWater.length > 0) {
        return `I see you have ${plantsNeedingWater.length} plants that need watering: ${plantsNeedingWater.map(p => p.commonName).join(', ')}. Generally, most plants prefer to be watered when the top inch of soil feels dry. Check the soil moisture before watering to avoid overwatering.`;
      } else {
        return `Your plants look well-watered! Remember that overwatering is more harmful than underwatering for most plants. Always check the soil moisture before watering.`;
      }
    }

    if (input.includes('disease') || input.includes('sick') || input.includes('problem')) {
      const unhealthyPlants = userPlants.filter(plant => plant.healthStatus !== 'healthy');
      
      if (unhealthyPlants.length > 0) {
        return `I notice you have ${unhealthyPlants.length} plants that might need attention: ${unhealthyPlants.map(p => p.commonName).join(', ')}. Common signs of plant problems include yellowing leaves, brown spots, wilting, or unusual growth patterns. Would you like me to help you identify specific issues? You can take a photo for disease diagnosis.`;
      } else {
        return `Your plants appear to be healthy! To keep them that way, maintain consistent watering, ensure proper lighting, and regularly inspect for pests or diseases. Early detection is key to plant health.`;
      }
    }

    if (input.includes('fertilize') || input.includes('fertilizer') || input.includes('nutrients')) {
      return `Most plants benefit from fertilizing during their growing season (spring and summer). Use a balanced fertilizer (equal N-P-K ratios) for general feeding, or specific formulations for flowering or fruiting plants. Always follow package instructions and avoid over-fertilizing, which can burn roots.`;
    }

    if (input.includes('light') || input.includes('sun') || input.includes('shade')) {
      return `Light requirements vary by plant type. Most vegetables and flowering plants need 6-8 hours of direct sunlight daily. Herbs typically need 4-6 hours, while many houseplants prefer bright, indirect light. If plants are stretching toward light or have pale leaves, they may need more light.`;
    }

    // General gardening advice
    return `Based on your garden with ${userPlants.length} plants, here are some general tips: 

🌱 **Watering**: Check soil moisture regularly and water deeply but less frequently
🌞 **Light**: Ensure each plant gets appropriate light for its type  
🌿 **Nutrition**: Feed plants during growing season with appropriate fertilizer
🔍 **Monitoring**: Inspect plants weekly for pests, diseases, or stress signs

Is there a specific plant or issue you'd like help with?`;
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    "How often should I water my plants?",
    "What are signs of plant diseases?",
    "How can I improve plant growth?",
    "When should I fertilize my plants?",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <View style={styles.headerInfo}>
          <Bot size={24} color="white" />
          <Text style={styles.title}>eGarden Assistant</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={FadeInUp.delay(index * 100)}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                {message.isUser ? (
                  <User size={20} color={Colors.primary[600]} />
                ) : (
                  <Bot size={20} color={Colors.secondary[600]} />
                )}
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              
              <Text style={[
                styles.messageText,
                message.isUser ? styles.userMessageText : styles.aiMessageText,
              ]}>
                {message.message}
              </Text>

              {!message.isUser && message.aiResponse?.followUpQuestions && (
                <View style={styles.followUpContainer}>
                  <Text style={styles.followUpTitle}>Suggested questions:</Text>
                  {message.aiResponse.followUpQuestions.map((question, qIndex) => (
                    <Pressable
                      key={qIndex}
                      style={styles.followUpButton}
                      onPress={() => handleQuickQuestion(question)}
                    >
                      <HelpCircle size={14} color={Colors.primary[600]} />
                      <Text style={styles.followUpText}>{question}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </Animated.View>
          ))}

          {loading && (
            <Animated.View entering={FadeInUp} style={styles.loadingContainer}>
              <Bot size={20} color={Colors.secondary[600]} />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </Animated.View>
          )}
        </ScrollView>

        {messages.length === 1 && (
          <Animated.View entering={FadeInDown.delay(500)} style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Quick questions:</Text>
            <View style={styles.quickQuestionsGrid}>
              {quickQuestions.map((question, index) => (
                <Pressable
                  key={index}
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion(question)}
                >
                  <Lightbulb size={16} color={Colors.primary[600]} />
                  <Text style={styles.quickQuestionText}>{question}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        <View style={styles.inputContainer}>
          <Input
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about gardening..."
            multiline
            style={styles.messageInput}
            onSubmitEditing={sendMessage}
          />
          <Button
            title=""
            onPress={sendMessage}
            icon={Send}
            disabled={!inputText.trim() || loading}
            style={styles.sendButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
    color: 'white',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary[500],
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[500],
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: Colors.gray[800],
  },
  followUpContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  followUpTitle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray[600],
    marginBottom: 8,
  },
  followUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.primary[50],
    borderRadius: 20,
    marginBottom: 6,
  },
  followUpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.primary[700],
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
    fontStyle: 'italic',
  },
  quickQuestionsContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  quickQuestionsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[900],
    marginBottom: 12,
  },
  quickQuestionsGrid: {
    gap: 8,
  },
  quickQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.gray[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  quickQuestionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[700],
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
    gap: 12,
  },
  messageInput: {
    flex: 1,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 0,
  },
});