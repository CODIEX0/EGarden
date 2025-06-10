import { Platform } from 'react-native';
import { PaymentMethod, Order } from '@/types';

// Payment configuration
const PAYMENT_CONFIG = {
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  COINBASE_API_KEY: process.env.EXPO_PUBLIC_COINBASE_API_KEY || '',
  PAYPAL_CLIENT_ID: process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID || '',
  SANDBOX_MODE: process.env.NODE_ENV !== 'production',
};

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  receipt?: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  clientSecret?: string;
}

class PaymentService {
  private stripe: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize Stripe
      if (Platform.OS !== 'web') {
        const { initStripe } = await import('@stripe/stripe-react-native');
        await initStripe({
          publishableKey: PAYMENT_CONFIG.STRIPE_PUBLISHABLE_KEY,
          merchantIdentifier: 'merchant.com.egarden',
        });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize payment service:', error);
    }
  }

  // Stripe Payments
  async createPaymentIntent(
    amount: number, 
    currency: string = 'USD',
    orderId: string
  ): Promise<PaymentIntent> {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Convert to cents
          currency,
          orderId,
          metadata: {
            orderId,
            platform: 'egarden',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  async processStripePayment(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          paymentMethodId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          receipt: result.receipt,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error processing stripe payment:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  // Crypto Payments
  async processCryptoPayment(
    amount: number,
    currency: 'BTC' | 'ETH',
    walletAddress: string,
    orderId: string
  ): Promise<PaymentResult> {
    try {
      // Create cryptocurrency payment
      const response = await fetch('/api/payments/crypto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          walletAddress,
          orderId,
          type: 'charge',
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.transactionId,
          receipt: result.receipt,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error processing crypto payment:', error);
      return {
        success: false,
        error: 'Crypto payment processing failed',
      };
    }
  }

  // PayPal Payments
  async processPayPalPayment(
    amount: number,
    currency: string = 'USD',
    orderId: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId,
          return_url: 'egarden://payment/success',
          cancel_url: 'egarden://payment/cancel',
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Open PayPal checkout
        if (Platform.OS !== 'web') {
          const { Linking } = await import('react-native');
          await Linking.openURL(result.approval_url);
        } else {
          window.open(result.approval_url, '_blank');
        }

        return {
          success: true,
          transactionId: result.transactionId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error processing PayPal payment:', error);
      return {
        success: false,
        error: 'PayPal payment processing failed',
      };
    }
  }

  // Payment validation and verification
  async verifyPayment(transactionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/payments/verify/${transactionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.verified === true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // Refund processing
  async processRefund(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          amount,
          reason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          transactionId: result.refundId,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: 'Refund processing failed',
      };
    }
  }

  // Get supported payment methods
  getSupportedPaymentMethods(): PaymentMethod[] {
    return [
      {
        type: 'fiat',
        method: 'stripe',
        enabled: !!PAYMENT_CONFIG.STRIPE_PUBLISHABLE_KEY,
      },
      {
        type: 'fiat',
        method: 'paypal',
        enabled: !!PAYMENT_CONFIG.PAYPAL_CLIENT_ID,
      },
      {
        type: 'crypto',
        method: 'bitcoin',
        enabled: !!PAYMENT_CONFIG.COINBASE_API_KEY,
      },
      {
        type: 'crypto',
        method: 'ethereum',
        enabled: !!PAYMENT_CONFIG.COINBASE_API_KEY,
      },
      {
        type: 'crypto',
        method: 'coinbase',
        enabled: !!PAYMENT_CONFIG.COINBASE_API_KEY,
      },
    ];
  }

  // Calculate fees
  calculateFees(amount: number, paymentMethod: PaymentMethod): number {
    switch (paymentMethod.method) {
      case 'stripe':
        return Math.round((amount * 0.029 + 0.30) * 100) / 100; // 2.9% + $0.30
      case 'paypal':
        return Math.round((amount * 0.0349 + 0.49) * 100) / 100; // 3.49% + $0.49
      case 'bitcoin':
      case 'ethereum':
        return Math.round((amount * 0.01) * 100) / 100; // 1% for crypto
      case 'coinbase':
        return Math.round((amount * 0.015) * 100) / 100; // 1.5% for Coinbase
      default:
        return 0;
    }
  }

  // Get exchange rates for crypto
  async getCryptoExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response = await fetch(`/api/exchange-rates/${fromCurrency}/${toCurrency}`);
      const result = await response.json();
      return result.rate;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return 0;
    }
  }
}

export const paymentService = new PaymentService();