import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  Dimensions
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Order, PaymentMethod } from '@/types';
import { marketplaceService } from '@/services/marketplaceService';
import { paymentService } from '@/services/paymentService';

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const paymentMethods: PaymentMethod[] = [
    { type: 'fiat', method: 'stripe', enabled: true },
    { type: 'fiat', method: 'paypal', enabled: true },
    { type: 'crypto', method: 'bitcoin', enabled: true },
    { type: 'crypto', method: 'ethereum', enabled: true },
    { type: 'crypto', method: 'coinbase', enabled: true },
  ];

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await marketplaceService.getOrder(orderId!);
      setOrder(orderData);
      
      // Set default payment method
      if (orderData?.paymentMethod) {
        setSelectedPaymentMethod(orderData.paymentMethod);
      } else {
        setSelectedPaymentMethod(paymentMethods[0]);
      }
    } catch (error) {
      console.error('Error loading order:', error);
      Alert.alert('Error', 'Failed to load order details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order || !selectedPaymentMethod) return;

    try {
      setProcessing(true);
      
      let paymentResult;
      
      if (selectedPaymentMethod.type === 'crypto') {
        paymentResult = await paymentService.processCryptoPayment({
          orderId: order.id,
          amount: order.totalPrice,
          currency: order.currency,
          cryptoMethod: selectedPaymentMethod.method as 'bitcoin' | 'ethereum' | 'coinbase',
          buyerAddress: user!.id, // In real app, this would be the wallet address
        });
      } else {
        paymentResult = await paymentService.processStripePayment({
          orderId: order.id,
          amount: order.totalPrice,
          currency: order.currency,
          paymentMethodId: 'pm_card_visa', // In real app, this would come from Stripe Elements
        });
      }

      if (paymentResult.success) {
        // Update order status
        await marketplaceService.updateOrder(order.id, {
          paymentStatus: 'paid',
          status: 'confirmed',
        });
        
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.push(`/(tabs)/market`)
            }
          ]
        );
      } else {
        Alert.alert('Payment Failed', paymentResult.error || 'Payment could not be processed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'An error occurred during payment processing');
    } finally {
      setProcessing(false);
    }
  };

  // ...existing methods for getting payment method details...

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payment details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Order not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.gray[600]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Payment content will be here */}
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Complete Your Payment</Text>
        <Text style={styles.subtitle}>Order #{orderId}</Text>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[800],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: Colors.gray[800],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: Colors.gray[700],
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'white',
  },
});