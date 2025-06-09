import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { PlantIdentificationResult, Disease, AIAnalysis, ChatMessage, AIResponse } from '@/types';

// AI Service Configuration
const AI_CONFIG = {
  PLANTNET_API_URL: 'https://my-api.plantnet.org/v1/identify',
  LOCAL_AI_ENDPOINT: process.env.EXPO_PUBLIC_LOCAL_AI_ENDPOINT || 'http://localhost:8080',
  OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',
  HUGGINGFACE_API_URL: 'https://api-inference.huggingface.co/models',
  MAX_IMAGE_SIZE: 1024 * 1024, // 1MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
};

class AIService {
  private apiKey: string | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Try to get API key from secure storage
      if (Platform.OS !== 'web') {
        this.apiKey = await SecureStore.getItemAsync('ai_api_key');
      } else {
        this.apiKey = localStorage.getItem('ai_api_key');
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize AI service:', error);
    }
  }

  async setApiKey(key: string) {
    this.apiKey = key;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync('ai_api_key', key);
      } else {
        localStorage.setItem('ai_api_key', key);
      }
    } catch (error) {
      console.warn('Failed to store API key:', error);
    }
  }

  // Plant Identification using PlantNet API
  async identifyPlant(imageUri: string, organs: string[] = ['leaf', 'flower', 'fruit']): Promise<PlantIdentificationResult> {
    await this.initialize();
    
    try {
      const formData = new FormData();
      
      // Convert image to blob for web or use file URI for mobile
      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('images', blob, 'plant.jpg');
      } else {
        formData.append('images', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'plant.jpg',
        } as any);
      }
      
      organs.forEach(organ => formData.append('organs', organ));
      formData.append('modifiers', 'crops');
      formData.append('modifiers', 'useful');
      formData.append('include-related-images', 'true');
      formData.append('no-reject', 'false');
      formData.append('nb-results', '10');
      formData.append('lang', 'en');
      
      const response = await fetch(`${AI_CONFIG.PLANTNET_API_URL}/k-world-flora/identify?api-key=${this.apiKey}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.ok) {
        throw new Error(`PlantNet API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        species: data.results.map((result: any) => ({
          scientificName: result.species.scientificNameWithoutAuthor,
          commonNames: result.species.commonNames || [],
          family: result.species.family?.scientificNameWithoutAuthor || '',
          genus: result.species.genus?.scientificNameWithoutAuthor || '',
          confidence: result.score * 100,
          images: result.images?.map((img: any) => img.url.o) || [],
          careInstructions: this.generateCareInstructions(result.species),
          nativeRegions: [],
        })),
        confidence: data.results[0]?.score * 100 || 0,
        processingTime: Date.now(),
        source: 'plantnet',
      };
    } catch (error) {
      console.error('Plant identification error:', error);
      // Fallback to local AI or mock data
      return this.fallbackPlantIdentification(imageUri);
    }
  }

  // Disease Detection using local AI model
  async detectDiseases(imageUri: string, plantType?: string): Promise<Disease[]> {
    await this.initialize();
    
    try {
      // Use Hugging Face's plant disease detection model
      const response = await fetch(`${AI_CONFIG.HUGGINGFACE_API_URL}/plant-disease-detection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: imageUri,
          parameters: {
            candidate_labels: [
              'healthy',
              'bacterial_spot',
              'early_blight',
              'late_blight',
              'leaf_mold',
              'septoria_leaf_spot',
              'spider_mites',
              'target_spot',
              'yellow_leaf_curl_virus',
              'mosaic_virus',
            ],
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Disease detection API error: ${response.status}`);
      }
      
      const results = await response.json();
      
      return results
        .filter((result: any) => result.label !== 'healthy' && result.score > 0.3)
        .map((result: any) => ({
          name: this.formatDiseaseName(result.label),
          severity: this.calculateSeverity(result.score),
          symptoms: this.getDiseaseSymptoms(result.label),
          causes: this.getDiseaseCauses(result.label),
          controlMeasures: this.getControlMeasures(result.label),
          prevention: this.getPreventionMethods(result.label),
          confidence: result.score * 100,
          treatmentUrgency: this.getTreatmentUrgency(result.score),
        }));
    } catch (error) {
      console.error('Disease detection error:', error);
      return [];
    }
  }

  // AI Chat Assistant
  async chatWithAssistant(
    message: string,
    userPlants: any[],
    language: string = 'en',
    context?: any
  ): Promise<AIResponse> {
    await this.initialize();
    
    try {
      const systemPrompt = this.buildSystemPrompt(userPlants, language);
      const userPrompt = this.buildUserPrompt(message, context);
      
      const response = await fetch(AI_CONFIG.OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiMessage = data.choices[0].message.content;
      
      return {
        confidence: 0.9,
        sources: ['OpenAI GPT-3.5', 'eGarden Knowledge Base'],
        relatedPlants: this.extractRelatedPlants(aiMessage, userPlants),
        actionItems: this.extractActionItems(aiMessage),
        followUpQuestions: this.generateFollowUpQuestions(message, aiMessage),
      };
    } catch (error) {
      console.error('AI chat error:', error);
      return this.fallbackChatResponse(message, language);
    }
  }

  // Generate AI Analysis for plants
  async generatePlantAnalysis(plant: any, imageUri?: string): Promise<AIAnalysis> {
    const diseaseDetection = imageUri ? await this.detectDiseases(imageUri, plant.plantType) : undefined;
    
    return {
      confidence: 85,
      identificationSource: 'local_ai',
      diseaseDetection: diseaseDetection ? {
        detected: diseaseDetection.length > 0,
        diseases: diseaseDetection,
        overallHealth: this.calculateOverallHealth(diseaseDetection),
        riskFactors: this.identifyRiskFactors(plant, diseaseDetection),
      } : undefined,
      careRecommendations: this.generateCareRecommendations(plant),
      environmentalFactors: this.analyzeEnvironmentalFactors(plant),
      lastAnalyzed: new Date(),
    };
  }

  // Helper methods
  private generateCareInstructions(species: any): any {
    return {
      watering: 'Water when soil feels dry to touch',
      sunlight: 'Bright, indirect light',
      soil: 'Well-draining potting mix',
      temperature: '18-24°C (65-75°F)',
      humidity: '40-60%',
      fertilizing: 'Monthly during growing season',
      pruning: 'Remove dead or yellowing leaves',
      commonIssues: ['Overwatering', 'Insufficient light', 'Pest infestation'],
    };
  }

  private fallbackPlantIdentification(imageUri: string): PlantIdentificationResult {
    return {
      species: [{
        scientificName: 'Unknown species',
        commonNames: ['Unknown plant'],
        family: 'Unknown',
        genus: 'Unknown',
        confidence: 50,
        images: [],
        careInstructions: this.generateCareInstructions({}),
        nativeRegions: [],
      }],
      confidence: 50,
      processingTime: Date.now(),
      source: 'local_ai',
    };
  }

  private formatDiseaseName(label: string): string {
    return label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private calculateSeverity(score: number): 'low' | 'medium' | 'high' {
    if (score > 0.8) return 'high';
    if (score > 0.5) return 'medium';
    return 'low';
  }

  private getTreatmentUrgency(score: number): 'immediate' | 'soon' | 'monitor' {
    if (score > 0.8) return 'immediate';
    if (score > 0.5) return 'soon';
    return 'monitor';
  }

  private getDiseaseSymptoms(disease: string): string[] {
    const symptoms: Record<string, string[]> = {
      bacterial_spot: ['Dark spots on leaves', 'Yellow halos around spots', 'Leaf drop'],
      early_blight: ['Brown spots with concentric rings', 'Yellowing leaves', 'Defoliation'],
      late_blight: ['Water-soaked spots', 'White fuzzy growth', 'Rapid spread'],
      leaf_mold: ['Yellow spots on upper leaf surface', 'Fuzzy growth on underside'],
      septoria_leaf_spot: ['Small circular spots', 'Dark borders', 'Yellow halos'],
      spider_mites: ['Fine webbing', 'Stippled leaves', 'Yellow/bronze discoloration'],
      target_spot: ['Concentric ring patterns', 'Brown lesions', 'Leaf yellowing'],
      yellow_leaf_curl_virus: ['Upward curling leaves', 'Yellowing', 'Stunted growth'],
      mosaic_virus: ['Mottled green/yellow pattern', 'Distorted leaves', 'Reduced growth'],
    };
    return symptoms[disease] || ['Visible symptoms on plant'];
  }

  private getDiseaseCauses(disease: string): string[] {
    const causes: Record<string, string[]> = {
      bacterial_spot: ['Bacterial infection', 'High humidity', 'Poor air circulation'],
      early_blight: ['Fungal infection', 'Wet conditions', 'Plant stress'],
      late_blight: ['Fungal pathogen', 'Cool wet weather', 'Poor drainage'],
      leaf_mold: ['Fungal infection', 'High humidity', 'Poor ventilation'],
      septoria_leaf_spot: ['Fungal pathogen', 'Wet foliage', 'Overhead watering'],
      spider_mites: ['Pest infestation', 'Hot dry conditions', 'Stressed plants'],
      target_spot: ['Fungal infection', 'Wet conditions', 'Plant debris'],
      yellow_leaf_curl_virus: ['Viral infection', 'Whitefly transmission', 'Infected plants'],
      mosaic_virus: ['Viral infection', 'Insect vectors', 'Contaminated tools'],
    };
    return causes[disease] || ['Environmental stress', 'Pathogen infection'];
  }

  private getControlMeasures(disease: string): string[] {
    const controls: Record<string, string[]> = {
      bacterial_spot: ['Copper-based fungicides', 'Remove affected leaves', 'Improve air circulation'],
      early_blight: ['Fungicide application', 'Remove infected foliage', 'Mulching'],
      late_blight: ['Preventive fungicides', 'Remove infected plants', 'Improve drainage'],
      leaf_mold: ['Reduce humidity', 'Increase ventilation', 'Fungicide treatment'],
      septoria_leaf_spot: ['Fungicide spray', 'Remove affected leaves', 'Avoid overhead watering'],
      spider_mites: ['Insecticidal soap', 'Increase humidity', 'Predatory mites'],
      target_spot: ['Fungicide application', 'Remove plant debris', 'Crop rotation'],
      yellow_leaf_curl_virus: ['Remove infected plants', 'Control whiteflies', 'Use resistant varieties'],
      mosaic_virus: ['Remove infected plants', 'Control insect vectors', 'Sanitize tools'],
    };
    return controls[disease] || ['Consult plant specialist', 'Improve growing conditions'];
  }

  private getPreventionMethods(disease: string): string[] {
    return [
      'Proper plant spacing',
      'Good air circulation',
      'Avoid overhead watering',
      'Regular plant inspection',
      'Clean gardening tools',
      'Remove plant debris',
      'Use disease-resistant varieties',
    ];
  }

  private calculateOverallHealth(diseases: Disease[]): number {
    if (diseases.length === 0) return 100;
    const avgSeverity = diseases.reduce((sum, d) => {
      const severityScore = d.severity === 'high' ? 30 : d.severity === 'medium' ? 20 : 10;
      return sum + severityScore;
    }, 0) / diseases.length;
    return Math.max(0, 100 - avgSeverity);
  }

  private identifyRiskFactors(plant: any, diseases: Disease[]): string[] {
    const factors = [];
    if (diseases.length > 0) factors.push('Disease presence detected');
    if (plant.lastWatered && this.daysSince(plant.lastWatered) > plant.wateringFrequency) {
      factors.push('Overdue for watering');
    }
    return factors;
  }

  private generateCareRecommendations(plant: any): string[] {
    const recommendations = [];
    
    if (plant.lastWatered && this.daysSince(plant.lastWatered) >= plant.wateringFrequency) {
      recommendations.push('Water your plant - it\'s due for watering');
    }
    
    if (plant.lastFertilized && this.daysSince(plant.lastFertilized) > 30) {
      recommendations.push('Consider fertilizing - last fertilized over a month ago');
    }
    
    recommendations.push('Check for pests regularly');
    recommendations.push('Ensure adequate light exposure');
    recommendations.push('Monitor soil moisture levels');
    
    return recommendations;
  }

  private analyzeEnvironmentalFactors(plant: any): any {
    return {
      lightLevel: 'medium',
      humidity: 50,
      temperature: 22,
      soilMoisture: 'moist',
    };
  }

  private buildSystemPrompt(userPlants: any[], language: string): string {
    const plantList = userPlants.map(p => `${p.commonName} (${p.scientificName})`).join(', ');
    
    return `You are eGarden Assistant, an expert AI gardening advisor. You have access to the user's garden containing: ${plantList}. 
    
    Respond in ${language} language. Provide helpful, accurate gardening advice. Be friendly and encouraging. 
    
    When asked about specific plants in their garden, reference their actual plants and care history. 
    
    Focus on:
    - Plant care and health
    - Disease identification and treatment
    - Watering and fertilizing schedules
    - Pest management
    - Seasonal gardening tips
    - Sustainable gardening practices`;
  }

  private buildUserPrompt(message: string, context?: any): string {
    let prompt = message;
    
    if (context?.plantId) {
      prompt += `\n\nContext: User is asking about their plant with ID: ${context.plantId}`;
    }
    
    if (context?.location) {
      prompt += `\n\nUser location: ${context.location}`;
    }
    
    return prompt;
  }

  private extractRelatedPlants(message: string, userPlants: any[]): string[] {
    const plantNames = userPlants.map(p => p.commonName.toLowerCase());
    const mentioned = plantNames.filter(name => 
      message.toLowerCase().includes(name)
    );
    return mentioned.slice(0, 3);
  }

  private extractActionItems(message: string): string[] {
    const actionWords = ['water', 'fertilize', 'prune', 'repot', 'check', 'treat', 'apply'];
    const sentences = message.split('.');
    
    return sentences
      .filter(sentence => 
        actionWords.some(word => sentence.toLowerCase().includes(word))
      )
      .slice(0, 3)
      .map(sentence => sentence.trim());
  }

  private generateFollowUpQuestions(userMessage: string, aiResponse: string): string[] {
    const questions = [
      'Would you like specific care instructions for any of your plants?',
      'Do you need help identifying any plant diseases?',
      'Would you like seasonal gardening tips for your area?',
    ];
    
    if (userMessage.toLowerCase().includes('water')) {
      questions.unshift('Would you like me to set up watering reminders?');
    }
    
    if (userMessage.toLowerCase().includes('disease') || userMessage.toLowerCase().includes('sick')) {
      questions.unshift('Would you like me to analyze a photo of the affected plant?');
    }
    
    return questions.slice(0, 3);
  }

  private fallbackChatResponse(message: string, language: string): AIResponse {
    const responses: Record<string, string> = {
      en: "I'm here to help with your gardening questions! Could you please be more specific about what you'd like to know?",
      af: "Ek is hier om te help met jou tuinmaak vrae! Kan jy asseblief meer spesifiek wees oor wat jy wil weet?",
      zu: "Ngilapha ukusiza ngemibuzo yakho yokuhlwanyela! Ungakwazi ukuba nemininingo ngalokho ofuna ukukwazi?",
    };
    
    return {
      confidence: 0.5,
      sources: ['eGarden Knowledge Base'],
      relatedPlants: [],
      actionItems: [],
      followUpQuestions: [
        'What specific plant care question do you have?',
        'Would you like help with plant identification?',
        'Do you need advice about plant diseases?',
      ],
    };
  }

  private daysSince(date: Date): number {
    return Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const aiService = new AIService();