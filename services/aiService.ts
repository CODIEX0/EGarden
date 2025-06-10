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

  // Comprehensive Disease Diagnosis
  async diagnosePlantDisease(imageUri: string, plantType?: string): Promise<{
    diseases: Disease[];
    healthScore: number;
    analysisConfidence: number;
    recommendations: string[];
    preventionTips: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> {
    await this.initialize();
    
    try {
      const base64Image = await this.convertImageToBase64(imageUri);
      
      // Get diseases from the existing detection method
      const diseases = await this.detectDiseases(imageUri, plantType);
      
      // Calculate overall health score
      const healthScore = this.calculateHealthScore(diseases);
      
      // Generate comprehensive analysis
      const analysisConfidence = diseases.length > 0 ? 
        Math.max(...diseases.map(d => d.confidence)) / 100 : 0.85;
      
      const recommendations = this.generateTreatmentRecommendations(diseases, plantType);
      const preventionTips = this.generatePreventionTips(diseases, plantType);
      const severity = this.calculateOverallSeverity(diseases);
      
      return {
        diseases,
        healthScore,
        analysisConfidence,
        recommendations,
        preventionTips,
        severity
      };
    } catch (error) {
      console.error('Disease diagnosis failed:', error);
      // Return fallback diagnosis
      return {
        diseases: [],
        healthScore: 85,
        analysisConfidence: 0.6,
        recommendations: [
          'Monitor plant closely for changes',
          'Ensure proper watering schedule',
          'Check for adequate lighting'
        ],
        preventionTips: [
          'Water at the base of the plant',
          'Ensure good air circulation',
          'Remove dead or yellowing leaves promptly'
        ],
        severity: 'low'
      };
    }
  }

  // Enhanced disease database
  private diseaseDatabase = {
    bacterial_spot: {
      name: 'Bacterial Spot',
      scientificName: 'Xanthomonas species',
      symptoms: ['Dark spots on leaves', 'Yellow halos around spots', 'Leaf drop'],
      causes: ['High humidity', 'Poor air circulation', 'Overhead watering'],
      treatments: ['Copper-based fungicides', 'Improve air circulation', 'Avoid overhead watering'],
      prevention: ['Use drip irrigation', 'Space plants properly', 'Remove infected debris'],
      severity: 'medium',
      urgency: 'soon'
    },
    early_blight: {
      name: 'Early Blight',
      scientificName: 'Alternaria solani',
      symptoms: ['Concentric ring spots', 'Yellow halos', 'Lower leaf browning'],
      causes: ['Wet conditions', 'Plant stress', 'High humidity'],
      treatments: ['Fungicide spray', 'Remove affected leaves', 'Improve drainage'],
      prevention: ['Crop rotation', 'Mulching', 'Proper spacing'],
      severity: 'high',
      urgency: 'immediate'
    },
    late_blight: {
      name: 'Late Blight',
      scientificName: 'Phytophthora infestans',
      symptoms: ['Water-soaked lesions', 'White fuzzy growth', 'Rapid spread'],
      causes: ['Cool wet weather', 'Poor drainage', 'High humidity'],
      treatments: ['Systemic fungicides', 'Remove infected plants', 'Improve ventilation'],
      prevention: ['Resistant varieties', 'Good drainage', 'Avoid overhead watering'],
      severity: 'high',
      urgency: 'immediate'
    },
    powdery_mildew: {
      name: 'Powdery Mildew',
      scientificName: 'Various fungi',
      symptoms: ['White powdery coating', 'Distorted leaves', 'Stunted growth'],
      causes: ['High humidity', 'Poor air circulation', 'Crowded plants'],
      treatments: ['Sulfur spray', 'Baking soda solution', 'Neem oil'],
      prevention: ['Proper spacing', 'Good air flow', 'Avoid overhead watering'],
      severity: 'medium',
      urgency: 'soon'
    },
    aphids: {
      name: 'Aphids',
      scientificName: 'Aphidoidea',
      symptoms: ['Sticky honeydew', 'Curled leaves', 'Stunted growth'],
      causes: ['Warm weather', 'New growth', 'Stressed plants'],
      treatments: ['Insecticidal soap', 'Neem oil', 'Beneficial insects'],
      prevention: ['Companion planting', 'Regular inspection', 'Healthy soil'],
      severity: 'low',
      urgency: 'monitor'
    },
    spider_mites: {
      name: 'Spider Mites',
      scientificName: 'Tetranychidae',
      symptoms: ['Fine webbing', 'Stippled leaves', 'Yellow/bronze coloring'],
      causes: ['Hot dry conditions', 'Stressed plants', 'Low humidity'],
      treatments: ['Miticide spray', 'Increase humidity', 'Predatory mites'],
      prevention: ['Regular watering', 'Humidity control', 'Avoid stress'],
      severity: 'medium',
      urgency: 'soon'
    }
  };

  // Advanced disease analysis with image processing
  async diagnoseWithImageAnalysis(imageUri: string, plantType?: string): Promise<{
    primaryDisease: Disease | null;
    secondaryDiseases: Disease[];
    healthScore: number;
    confidence: number;
    recommendations: string[];
    environmentalFactors: string[];
  }> {
    try {
      // Simulate advanced image analysis
      const detectedDiseases = await this.detectDiseases(imageUri, plantType);
      
      let healthScore = 100;
      if (detectedDiseases.length > 0) {
        healthScore = Math.max(20, 100 - (detectedDiseases.length * 25));
      }
      
      const primaryDisease = detectedDiseases.length > 0 ? detectedDiseases[0] : null;
      const secondaryDiseases = detectedDiseases.slice(1);
      
      const recommendations = this.generateAdvancedRecommendations(detectedDiseases, plantType);
      const environmentalFactors = this.analyzeEnvironmentalRisk(detectedDiseases);
      
      return {
        primaryDisease,
        secondaryDiseases,
        healthScore,
        confidence: primaryDisease ? primaryDisease.confidence / 100 : 0.9,
        recommendations,
        environmentalFactors
      };
    } catch (error) {
      console.error('Advanced diagnosis failed:', error);
      return {
        primaryDisease: null,
        secondaryDiseases: [],
        healthScore: 85,
        confidence: 0.7,
        recommendations: ['Monitor plant health', 'Ensure proper care routine'],
        environmentalFactors: ['Consider environmental conditions']
      };
    }
  }

  private generateAdvancedRecommendations(diseases: Disease[], plantType?: string): string[] {
    const recommendations: string[] = [];
    
    if (diseases.length === 0) {
      return [
        'Your plant appears healthy! Continue your current care routine',
        'Monitor regularly for any changes in appearance',
        'Maintain proper watering and lighting conditions'
      ];
    }
    
    // Priority recommendations based on urgency
    const urgentDiseases = diseases.filter(d => d.treatmentUrgency === 'immediate');
    const soonDiseases = diseases.filter(d => d.treatmentUrgency === 'soon');
    
    if (urgentDiseases.length > 0) {
      recommendations.push('⚠️ URGENT: Immediate treatment required');
      urgentDiseases.forEach(disease => {
        recommendations.push(`• ${disease.name}: ${disease.controlMeasures[0]}`);
      });
    }
    
    if (soonDiseases.length > 0) {
      recommendations.push('📅 Address within next few days:');
      soonDiseases.forEach(disease => {
        recommendations.push(`• ${disease.name}: ${disease.controlMeasures[0]}`);
      });
    }
    
    // General care recommendations
    if (plantType === 'vegetable') {
      recommendations.push('🥬 For vegetables: Consider organic treatments to maintain food safety');
    } else if (plantType === 'flower') {
      recommendations.push('🌸 For flowering plants: Avoid treatments during bloom period');
    }
    
    // Prevention advice
    recommendations.push('🛡️ Prevention: Improve air circulation and avoid overhead watering');
    
    return recommendations;
  }

  private analyzeEnvironmentalRisk(diseases: Disease[]): string[] {
    const factors: string[] = [];
    
    if (diseases.some(d => d.name.toLowerCase().includes('mildew') || d.name.toLowerCase().includes('blight'))) {
      factors.push('High humidity detected - ensure good ventilation');
      factors.push('Consider reducing watering frequency');
    }
    
    if (diseases.some(d => d.name.toLowerCase().includes('mite'))) {
      factors.push('Low humidity conditions - increase air moisture');
      factors.push('Hot, dry weather stress detected');
    }
    
    if (diseases.some(d => d.name.toLowerCase().includes('bacterial'))) {
      factors.push('Bacterial infection risk - improve sanitation');
      factors.push('Avoid working with wet plants');
    }
    
    factors.push('Monitor weather conditions for disease pressure');
    
    return factors;
  }

  // Enhanced plant health scoring system
  async generateHealthReport(plant: any, imageUri?: string): Promise<{
    overallHealth: number;
    categories: {
      visual: number;
      growth: number;
      environmental: number;
      care: number;
    };
    concerns: string[];
    strengths: string[];
    actionPlan: string[];
  }> {
    const report = {
      overallHealth: 85,
      categories: {
        visual: 90,
        growth: 85,
        environmental: 80,
        care: 85
      },
      concerns: [] as string[],
      strengths: [] as string[],
      actionPlan: [] as string[]
    };
    
    // Analyze visual health
    if (imageUri) {
      const diseases = await this.detectDiseases(imageUri, plant.plantType);
      if (diseases.length > 0) {
        report.categories.visual = Math.max(30, 90 - diseases.length * 20);
        report.concerns.push(`${diseases.length} potential health issue(s) detected`);
      } else {
        report.strengths.push('No visible diseases or pests detected');
      }
    }
    
    // Analyze care consistency
    if (plant.lastWatered) {
      const daysSinceWatered = this.daysSince(plant.lastWatered);
      if (daysSinceWatered > plant.wateringFrequency) {
        report.categories.care -= 20;
        report.concerns.push('Overdue for watering');
        report.actionPlan.push('Water plant immediately');
      } else {
        report.strengths.push('Watering schedule on track');
      }
    }
    
    // Calculate overall health
    const categoryAverage = Object.values(report.categories).reduce((a, b) => a + b) / 4;
    report.overallHealth = Math.round(categoryAverage);
    
    return report;
  }

  private calculateHealthScore(diseases: Disease[]): number {
    if (diseases.length === 0) return 95;
    
    const severityWeights = { low: 5, medium: 15, high: 30 };
    const totalDeduction = diseases.reduce((sum, disease) => {
      const weight = severityWeights[disease.severity] || 10;
      const confidenceMultiplier = disease.confidence / 100;
      return sum + (weight * confidenceMultiplier);
    }, 0);
    
    return Math.max(20, 100 - totalDeduction);
  }

  private generateTreatmentRecommendations(diseases: Disease[], plantType?: string): string[] {
    const recommendations: string[] = [];
    
    if (diseases.length === 0) {
      return [
        'Continue current care routine',
        'Monitor for any changes in appearance',
        'Maintain consistent watering schedule'
      ];
    }
    
    diseases.forEach(disease => {
      if (disease.severity === 'high') {
        recommendations.push(`Immediate attention required for ${disease.name}`);
        recommendations.push(...disease.controlMeasures.slice(0, 2));
      } else if (disease.severity === 'medium') {
        recommendations.push(`Address ${disease.name} within a few days`);
        recommendations.push(disease.controlMeasures[0]);
      }
    });
    
    // Add general recommendations based on plant type
    if (plantType === 'vegetable') {
      recommendations.push('Consider organic treatment options for edible plants');
    } else if (plantType === 'flower') {
      recommendations.push('Focus on preserving blooming capacity');
    }
    
    return [...new Set(recommendations)]; // Remove duplicates
  }

  private generatePreventionTips(diseases: Disease[], plantType?: string): string[] {
    const tips = new Set<string>();
    
    diseases.forEach(disease => {
      disease.prevention.forEach(tip => tips.add(tip));
    });
    
    // Add general prevention tips
    tips.add('Water early morning to allow leaves to dry');
    tips.add('Ensure adequate spacing between plants');
    tips.add('Use clean gardening tools');
    tips.add('Remove fallen leaves and debris regularly');
    
    if (plantType === 'herb') {
      tips.add('Harvest regularly to promote healthy growth');
    }
    
    return Array.from(tips).slice(0, 8); // Limit to 8 tips
  }

  private calculateOverallSeverity(diseases: Disease[]): 'low' | 'medium' | 'high' | 'critical' {
    if (diseases.length === 0) return 'low';
    
    const hasHigh = diseases.some(d => d.severity === 'high');
    const hasMedium = diseases.some(d => d.severity === 'medium');
    const highConfidenceDiseases = diseases.filter(d => d.confidence > 80);
    
    if (hasHigh && highConfidenceDiseases.length > 0) {
      return diseases.length > 2 ? 'critical' : 'high';
    } else if (hasMedium || diseases.length > 2) {
      return 'medium';
    }
    
    return 'low';
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

  private async convertImageToBase64(imageUri: string): Promise<string> {
    try {
      if (Platform.OS === 'web') {
        // For web, convert blob to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // For mobile, use expo-file-system
        const { FileSystem } = require('expo-file-system');
        if (imageUri.startsWith('data:')) {
          return imageUri; // Already base64
        }
        return await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  private validateImageFormat(imageUri: string): boolean {
    const supportedFormats = AI_CONFIG.SUPPORTED_FORMATS;
    return supportedFormats.some(format => 
      imageUri.toLowerCase().includes(format.split('/')[1])
    );
  }

  private async resizeImageIfNeeded(imageUri: string): Promise<string> {
    try {
      // Basic implementation - in production, you'd use a proper image resizing library
      if (Platform.OS !== 'web') {
        const { FileSystem } = require('expo-file-system');
        const info = await FileSystem.getInfoAsync(imageUri);
        if (info.exists && info.size && info.size > AI_CONFIG.MAX_IMAGE_SIZE) {
          console.warn('Image too large, resizing needed');
          // In production, implement actual resizing with expo-image-manipulator
        }
      }
      return imageUri;
    } catch (error) {
      console.warn('Error checking image size:', error);
      return imageUri;
    }
  }

  private daysSince(date: Date): number {
    return Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const aiService = new AIService();