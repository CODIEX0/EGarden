export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'planting' | 'care' | 'community' | 'learning' | 'trading';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedAt: Date;
}

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

// Community & Marketplace Types
export interface CommunityPost {
  id: string;
  userId: string;
  userProfile: {
    name: string;
    profilePicture?: string;
    badges: Badge[];
    level: number;
  };
  title: string;
  content: string;
  images: string[];
  category: 'pests' | 'soil' | 'vegetables' | 'flowers' | 'hydroponics' | 'tools' | 'general';
  tags: string[];
  upvotes: number;
  downvotes: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  isModerated: boolean;
  location?: string;
  relatedPlants?: string[];
}

// Enhanced Community Types
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userProfile: {
    name: string;
    profilePicture?: string;
    badges: Badge[];
  };
  content: string;
  images?: string[];
  upvotes: number;
  downvotes: number;
  parentCommentId?: string; // for nested replies
  replies: Comment[];
  createdAt: Date;
  updatedAt: Date;
  isModerated: boolean;
}

// Donation System
export interface DonationItem {
  id: string;
  donorId: string;
  donorProfile: {
    name: string;
    profilePicture?: string;
    rating: number;
    location: string;
  };
  title: string;
  description: string;
  category: 'produce' | 'seeds' | 'tools' | 'fertilizer' | 'containers' | 'other';
  images: string[];
  quantity: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  pickupLocation: Location;
  availableUntil: Date;
  status: 'available' | 'claimed' | 'completed' | 'expired' | 'pending';
  interestedUsers: string[];
  claimedBy?: string;
  createdAt: Date;
  tags: string[];
  donorName: string; // Simplified donor name for quick access
  location: string; // Simplified location string for display
}

// Marketplace System
export interface MarketListing {
  id: string;
  sellerId: string;
  sellerProfile: {
    name: string;
    profilePicture?: string;
    rating: number;
    totalSales: number;
    location: string;
    isVerified: boolean;
  };
  title: string;
  description: string;
  category: 'fruits' | 'vegetables' | 'flowers' | 'herbs' | 'seeds' | 'tools' | 'fertilizer' | 'hemp' | 'grass';
  images: string[];
  price: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'BTC' | 'ETH';
  quantity: number;
  unit: string; // kg, lbs, pieces, etc.
  location: Location;
  shippingOptions: ShippingOption[];
  paymentMethods: PaymentMethod[];
  status: 'active' | 'sold' | 'suspended' | 'draft';
  rating: number; // Average rating for this listing
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags: string[];
  organic: boolean;
  harvestDate?: Date;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: number;
  trackingAvailable: boolean;
}

export interface PaymentMethod {
  type: 'crypto' | 'fiat';
  method: 'stripe' | 'paypal' | 'bitcoin' | 'ethereum' | 'coinbase';
  enabled: boolean;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'disputed';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  shippingOption: ShippingOption;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedDelivery?: Date;
  messages: OrderMessage[];
}

export interface OrderMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  orderId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  images?: string[];
  response?: string; // seller response
  createdAt: Date;
  helpful: number;
  verified: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Enhanced AI System
export interface AIChat {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  context: AIContext;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AIContext {
  userPlants: Plant[];
  userLocation: string;
  currentWeather?: Weather;
  recentActivity: UserActivity[];
  preferences: AIPreferences;
}

export interface AIPreferences {
  responseStyle: 'casual' | 'professional' | 'educational';
  includeScientificNames: boolean;
  preferredLanguage: string;
  detailLevel: 'basic' | 'intermediate' | 'advanced';
}

export interface UserActivity {
  type: 'plant_added' | 'watered' | 'fertilized' | 'disease_detected' | 'post_created';
  timestamp: Date;
  data: any;
}

// Enhanced Disease Detection
export interface DetectedDisease {
  name: string;
  scientificName: string;
  confidence: number;
  description: string;
  symptoms: string[];
  causes: string[];
  treatments: Treatment[];
  images: string[];
}

export interface Treatment {
  type: 'organic' | 'chemical' | 'cultural' | 'biological';
  method: string;
  instructions: string;
  materials: string[];
  timeline: string;
  effectiveness: number; // 0-100
  cost: 'low' | 'medium' | 'high';
}

export interface TreatmentRecommendation {
  priority: 'immediate' | 'urgent' | 'moderate' | 'preventive';
  treatment: Treatment;
  reasoning: string;
  alternativeOptions: Treatment[];
}

// Gamification System
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'planting' | 'care' | 'community' | 'learning' | 'trading';
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  unlockedAt?: Date;
}

export interface AchievementRequirement {
  type: 'plant_count' | 'streak_days' | 'disease_identified' | 'posts_created' | 'helpful_votes';
  target: number;
  current: number;
}

export interface DailyStreak {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
  streakType: 'plant_care' | 'community' | 'learning';
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

// Enhanced Notification System
export interface PushNotification {
  id: string;
  userId: string;
  type: 'watering' | 'fertilizing' | 'disease_alert' | 'community' | 'market' | 'system';
  title: string;
  body: string;
  data?: any;
  scheduled: Date;
  sent: boolean;
  opened: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  action: string;
  data?: any;
}

// Enhanced Notification Settings
export interface EnhancedNotificationSettings {
  watering: boolean;
  fertilizing: boolean;
  disease_alerts: boolean;
  community_updates: boolean;
  market_updates: boolean;
  messages: boolean;
  promotional: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

// Chat Attachment for AI
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

// Chat Message for AI System
export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  type: 'text' | 'plant_query' | 'care_suggestion' | 'disease_diagnosis';
  language: string;
  attachments?: ChatAttachment[];
  aiResponse?: AIResponse;
}

// Weather Integration
export interface Weather {
  location: string;
  current: CurrentWeather;
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  uvIndex: number;
  windSpeed: number;
  conditions: string;
  icon: string;
  timestamp: Date;
}

export interface WeatherForecast {
  date: Date;
  high: number;
  low: number;
  humidity: number;
  precipitation: number;
  conditions: string;
  icon: string;
  gardeningTips: string[];
}

export interface WeatherAlert {
  type: 'frost' | 'heat' | 'drought' | 'storm' | 'humidity';
  severity: 'low' | 'medium' | 'high';
  message: string;
  validUntil: Date;
  affectedPlants: string[];
}

// Location type for donations and marketplace
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  country: string;
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

// Type aliases for easier usage
export type MarketCategory = MarketListing['category'];
export type DonationCategory = DonationItem['category'];