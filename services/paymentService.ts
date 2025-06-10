import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface StripePaymentData {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
}

interface CryptoPaymentData {
  orderId: string;
  amount: number;
  currency: string;
  cryptoMethod: 'bitcoin' | 'ethereum' | 'coinbase';
  buyerAddress: string;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class PaymentService {
  private stripePublishableKey: string | null = null;
  private coinbaseApiKey: string | null = null;

  async initialize() {
    try {
      // In a real app, these would be stored securely
      if (Platform.OS !== 'web') {
        this.stripePublishableKey = await SecureStore.getItemAsync('stripe_publishable_key');
        this.coinbaseApiKey = await SecureStore.getItemAsync('coinbase_api_key');
      } else {
        this.stripePublishableKey = localStorage.getItem('stripe_publishable_key');
        this.coinbaseApiKey = localStorage.getItem('coinbase_api_key');
      }
    } catch (error) {
      console.warn('Failed to initialize payment service:', error);
    }
  }

  async processStripePayment(paymentData: StripePaymentData): Promise<PaymentResult> {
    try {
      await this.initialize();
      
      if (!this.stripePublishableKey) {
        // Fallback to demo mode if no API key
        console.log('Demo mode - Processing Stripe payment:', paymentData);
        await new Promise(resolve => setTimeout(resolve, 1500));
        const success = Math.random() > 0.1;
        
        return {
          success,
          transactionId: success ? `demo_stripe_${Date.now()}` : undefined,
          error: success ? undefined : 'Demo payment declined',
        };
      }

      // Real Stripe integration
      const response = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripePublishableKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: (paymentData.amount * 100).toString(), // Convert to cents
          currency: paymentData.currency.toLowerCase(),
          payment_method: paymentData.paymentMethodId,
          confirm: 'true',
          return_url: 'egarden://payment-complete',
          'metadata[orderId]': paymentData.orderId,
        }),
      });

      const result = await response.json();
      
      if (result.status === 'succeeded') {
        return {
          success: true,
          transactionId: result.id,
        };
      } else if (result.status === 'requires_action') {
        return {
          success: false,
          error: 'Payment requires additional authentication',
        };
      } else {
        return {
          success: false,
          error: result.last_payment_error?.message || 'Payment failed',
        };
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      return {
        success: false,
        error: 'Payment processing failed',
      };
    }
  }

  async processCryptoPayment(paymentData: CryptoPaymentData): Promise<PaymentResult> {
    try {
      await this.initialize();
      
      console.log('Processing crypto payment:', paymentData);
      
      // Simulate different crypto payment methods
      switch (paymentData.cryptoMethod) {
        case 'bitcoin':
          return await this.processBitcoinPayment(paymentData);
        case 'ethereum':
          return await this.processEthereumPayment(paymentData);
        case 'coinbase':
          return await this.processCoinbasePayment(paymentData);
        default:
          return {
            success: false,
            error: 'Unsupported crypto payment method',
          };
      }
    } catch (error) {
      console.error('Crypto payment error:', error);
      return {
        success: false,
        error: 'Crypto payment processing failed',
      };
    }
  }

  private async processBitcoinPayment(paymentData: CryptoPaymentData): Promise<PaymentResult> {
    // Simulate Bitcoin payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Bitcoin payments have higher success rate but take longer
    const success = Math.random() > 0.05;
    
    if (success) {
      return {
        success: true,
        transactionId: `btc_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        error: 'Bitcoin transaction failed - insufficient funds or network error',
      };
    }
  }

  private async processEthereumPayment(paymentData: CryptoPaymentData): Promise<PaymentResult> {
    // Simulate Ethereum payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const success = Math.random() > 0.08;
    
    if (success) {
      return {
        success: true,
        transactionId: `eth_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        error: 'Ethereum transaction failed - gas fees too high or network congestion',
      };
    }
  }

  private async processCoinbasePayment(paymentData: CryptoPaymentData): Promise<PaymentResult> {
    // Simulate Coinbase Wallet payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const success = Math.random() > 0.07;
    
    if (success) {
      return {
        success: true,
        transactionId: `coinbase_${Date.now()}`,
      };
    } else {
      return {
        success: false,
        error: 'Coinbase payment failed - please check your wallet balance',
      };
    }
  }

  async processPayPalPayment(paymentData: StripePaymentData): Promise<PaymentResult> {
    try {
      console.log('Processing PayPal payment:', paymentData);
      
      // Simulate PayPal payment processing
      await new Promise(resolve => setTimeout(resolve, 2200));
      
      const success = Math.random() > 0.12;
      
      if (success) {
        return {
          success: true,
          transactionId: `paypal_${Date.now()}`,
        };
      } else {
        return {
          success: false,
          error: 'PayPal payment failed - please check your PayPal account',
        };
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      return {
        success: false,
        error: 'PayPal payment processing failed',
      };
    }
  }

  async refundPayment(transactionId: string, amount?: number): Promise<PaymentResult> {
    try {
      console.log('Processing refund for transaction:', transactionId);
      
      // Simulate refund processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const success = Math.random() > 0.05; // High success rate for refunds
      
      if (success) {
        return {
          success: true,
          transactionId: `refund_${Date.now()}`,
        };
      } else {
        return {
          success: false,
          error: 'Refund processing failed - please contact support',
        };
      }
    } catch (error) {
      console.error('Refund error:', error);
      return {
        success: false,
        error: 'Refund processing failed',
      };
    }
  }

  async validatePayment(transactionId: string): Promise<boolean> {
    try {
      // Simulate payment validation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would check with the payment provider
      return transactionId.length > 10;
    } catch (error) {
      console.error('Payment validation error:', error);
      return false;
    }
  }

  getCryptoExchangeRate(cryptoType: 'bitcoin' | 'ethereum', fiatCurrency: string = 'USD'): Promise<number> {
    // Simulate getting crypto exchange rates
    // In a real app, this would call a crypto API like CoinGecko or CoinMarketCap
    return new Promise((resolve) => {
      setTimeout(() => {
        const rates = {
          bitcoin: { USD: 45000, EUR: 38000, GBP: 33000 },
          ethereum: { USD: 3200, EUR: 2700, GBP: 2400 },
        };
        
        resolve(rates[cryptoType][fiatCurrency as keyof typeof rates.bitcoin] || 0);
      }, 500);
    });
  }

  calculateCryptoAmount(fiatAmount: number, cryptoType: 'bitcoin' | 'ethereum', fiatCurrency: string = 'USD'): Promise<number> {
    return new Promise(async (resolve) => {
      try {
        const exchangeRate = await this.getCryptoExchangeRate(cryptoType, fiatCurrency);
        const cryptoAmount = fiatAmount / exchangeRate;
        resolve(Math.round(cryptoAmount * 100000000) / 100000000); // Round to 8 decimal places
      } catch (error) {
        console.error('Error calculating crypto amount:', error);
        resolve(0);
      }
    });
  }
}

export const paymentService = new PaymentService();