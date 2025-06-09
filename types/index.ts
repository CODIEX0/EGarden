export interface User {
  id: string;
  email: string;
  name: string;
  userType: 'farmer' | 'buyer' | 'both';
  location: string;
  interests: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'expert';
  profilePicture?: string;
  badges: Badge[];
  level: number;
  points: number;
  joinDate: Date;
  preferredLanguage: string;
  securitySettings: SecuritySettings;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  sessionTimeout: number; // minutes
  dataEncryption: boolean;
  privacyLevel: 'public' | 'friends' | 'private';
}

export interface Plant {
  id: string;
  userId: string;
  image: string;
  commonName: string;
  scientificName: string;
  plantType: 'flower' | 'vegetable' | 'herb' | 'tree' | 'other';
  plantingDate: Date;
  wateringFrequency: number;
  healthStatus: 'healthy' | 'potential_issue' | 'diseased';
  identifiedDisease?: Disease;
  userNotes: string;
  dateAdded: Date;
  lastWatered?: Date;
  lastFertilized?: Date;
  careInstructions?: string;
  aiAnalysis?: AIAnalysis;
  location?: PlantLocation;
}

export interface AIAnalysis {
  confidence: number;
  identificationSource: 'plantnet' | 'local_ai' | 'user_input';
  diseaseDetection?: DiseaseDetection;
  careRecommendations: string[];
  environmentalFactors: EnvironmentalFactors;
  lastAnalyzed: Date;
}

export interface DiseaseDetection {
  detected: boolean;
  diseases: Disease[];
  overallHealth: number; // 0-100
  riskFactors: string[];
}

export interface EnvironmentalFactors {
  lightLevel: 'low' | 'medium' | 'high';
  humidity: number;
  temperature: number;
  soilMoisture: 'dry' | 'moist' | 'wet';
}

export interface PlantLocation {
  latitude: number;
  longitude: number;
  address?: string;
  indoor: boolean;
}

export interface Disease {
  name: string;
  severity: 'low' | 'medium' | 'high';
  symptoms: string[];
  causes: string[];
  controlMeasures: string[];
  prevention: string[];
  confidence: number;
  treatmentUrgency: 'immediate' | 'soon' | 'monitor';
}

export interface Reminder {
  id: string;
  userId: string;
  plantId: string;
  type: 'watering' | 'fertilizing' | 'custom';
  title: string;
  description: string;
  frequency: number;
  nextDue: Date;
  isActive: boolean;
  dateCreated: Date;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  advanceNotice: number; // hours
  repeatInterval: number; // minutes
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category: 'pests' | 'soil' | 'vegetables' | 'flowers' | 'hydroponics' | 'general';
  images?: string[];
  upvotes: number;
  downvotes: number;
  commentCount: number;
  dateCreated: Date;
  tags: string[];
  language: string;
  isModerated: boolean;
  reportCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentCommentId?: string;
  upvotes: number;
  downvotes: number;
  dateCreated: Date;
  language: string;
  isModerated: boolean;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  sellerName: string;
  title: string;
  description: string;
  category: 'fruits' | 'vegetables' | 'flowers' | 'tools' | 'fertilizers' | 'seeds' | 'other';
  images: string[];
  price: number;
  currency: 'zar' | 'usd' | 'eur' | 'btc' | 'eth';
  quantity: number;
  location: string;
  condition: 'new' | 'used' | 'fresh';
  dateCreated: Date;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethod {
  type: 'crypto' | 'fiat' | 'mobile_money';
  provider: string;
  enabled: boolean;
  fees: number;
}

export interface DonationItem {
  id: string;
  donorId: string;
  donorName: string;
  title: string;
  description: string;
  category: 'produce' | 'tools' | 'seeds' | 'fertilizers' | 'other';
  images: string[];
  location: string;
  isAvailable: boolean;
  dateCreated: Date;
  interestedUsers: string[];
  verificationRequired: boolean;
  pickupInstructions: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'garden' | 'community' | 'identification' | 'care' | 'achievement';
  dateEarned: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  timestamp: Date;
  isUser: boolean;
  type: 'text' | 'plant_query' | 'care_suggestion' | 'disease_diagnosis';
  language: string;
  attachments?: ChatAttachment[];
  aiResponse?: AIResponse;
}

export interface ChatAttachment {
  type: 'image' | 'location' | 'plant_reference';
  data: string;
  metadata?: Record<string, any>;
}

export interface AIResponse {
  confidence: number;
  sources: string[];
  relatedPlants?: string[];
  actionItems?: string[];
  followUpQuestions?: string[];
}

export interface UserProgress {
  userId: string;
  plantsAdded: number;
  diseasesIdentified: number;
  postsCreated: number;
  helpfulVotes: number;
  dayStreak: number;
  lastActive: Date;
  achievements: string[];
  totalPoints: number;
  weeklyGoals: WeeklyGoal[];
}

export interface WeeklyGoal {
  id: string;
  type: 'water_plants' | 'add_plants' | 'community_engagement' | 'disease_identification';
  target: number;
  current: number;
  reward: number; // points
  deadline: Date;
}

export interface SecurityAuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: Date;
  ipAddress: string;
  deviceInfo: string;
  success: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface LanguageSupport {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  supported: boolean;
  aiSupported: boolean;
}

export interface PlantIdentificationResult {
  species: PlantSpecies[];
  confidence: number;
  processingTime: number;
  source: 'plantnet' | 'local_ai' | 'community';
}

export interface PlantSpecies {
  scientificName: string;
  commonNames: string[];
  family: string;
  genus: string;
  confidence: number;
  images: string[];
  careInstructions: CareInstructions;
  nativeRegions: string[];
}

export interface CareInstructions {
  watering: string;
  sunlight: string;
  soil: string;
  temperature: string;
  humidity: string;
  fertilizing: string;
  pruning: string;
  commonIssues: string[];
}