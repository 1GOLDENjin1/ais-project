// Enhanced Payment System for Mendoza Diagnostic Center
// Supports multiple payment methods and secure transactions

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank_transfer' | 'e_wallet' | 'cash' | 'installment' | 'gateway';
  icon: string;
  isAvailable: boolean;
  processingFee?: number;
  description: string;
  requirements?: string[];
}

export interface PaymentTransaction {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  paymentMethodId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  transactionDate: Date;
  completedDate?: Date;
  referenceNumber: string;
  description: string;
  metadata?: {
    cardLast4?: string;
    bankName?: string;
    walletProvider?: string;
    installmentTerm?: number;
    processingFee?: number;
  };
  receiptUrl?: string;
  notes?: string;
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  totalAmount: number;
  downPayment: number;
  installmentAmount: number;
  installmentCount: number;
  remainingInstallments: number;
  nextDueDate: Date;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  createdDate: Date;
  serviceDescription: string;
}

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'paymongo',
    name: 'PayMongo',
    type: 'gateway',
    icon: '�',
    isAvailable: true,
    processingFee: 2.5,
    description: 'Secure checkout powered by PayMongo',
    requirements: ['Valid email address', 'Supported payment instrument (card or wallet)']
  }
];

export class PaymentService {
  private static instance: PaymentService;
  private transactions: PaymentTransaction[] = [];
  private paymentPlans: PaymentPlan[] = [];

  private constructor() {}

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Process payment
  async processPayment(paymentRequest: {
    patientId: string;
    appointmentId?: string;
    amount: number;
    paymentMethodId: string;
    description: string;
    paymentDetails?: {
      cardNumber?: string;
      expiryDate?: string;
      cvv?: string;
      walletAccount?: string;
      bankAccount?: string;
      installmentTerm?: number;
    };
  }): Promise<{ success: boolean; transaction?: PaymentTransaction; error?: string }> {
    try {
      const paymentMethod = paymentMethods.find(pm => pm.id === paymentRequest.paymentMethodId);
      if (!paymentMethod) {
        return { success: false, error: 'Invalid payment method' };
      }

      if (!paymentMethod.isAvailable) {
        return { success: false, error: 'Payment method temporarily unavailable' };
      }

      // Calculate processing fee
      const processingFee = paymentMethod.processingFee 
        ? (paymentRequest.amount * paymentMethod.processingFee / 100)
        : 0;

      const totalAmount = paymentRequest.amount + processingFee;

      // Create transaction record
      const transaction: PaymentTransaction = {
        id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        patientId: paymentRequest.patientId,
        appointmentId: paymentRequest.appointmentId,
        amount: totalAmount,
        paymentMethodId: paymentRequest.paymentMethodId,
        status: 'pending',
        transactionDate: new Date(),
        referenceNumber: this.generateReferenceNumber(),
        description: paymentRequest.description,
        metadata: {
          processingFee: processingFee
        }
      };

      // Add method-specific metadata
      if (paymentRequest.paymentDetails) {
        if (paymentRequest.paymentDetails.cardNumber) {
          transaction.metadata!.cardLast4 = paymentRequest.paymentDetails.cardNumber.slice(-4);
        }
        if (paymentRequest.paymentDetails.installmentTerm) {
          transaction.metadata!.installmentTerm = paymentRequest.paymentDetails.installmentTerm;
        }
      }

      this.transactions.push(transaction);

      // Process based on payment method type
      const result = await this.processPaymentByType(transaction, paymentMethod, paymentRequest.paymentDetails);
      
      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      return { success: false, error: 'Payment processing failed' };
    }
  }

  // Create payment plan
  async createPaymentPlan(planRequest: {
    patientId: string;
    totalAmount: number;
    downPaymentPercentage: number;
    installmentMonths: number;
    serviceDescription: string;
  }): Promise<PaymentPlan> {
    const downPayment = planRequest.totalAmount * (planRequest.downPaymentPercentage / 100);
    const remainingAmount = planRequest.totalAmount - downPayment;
    const installmentAmount = remainingAmount / planRequest.installmentMonths;

    const paymentPlan: PaymentPlan = {
      id: `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patientId: planRequest.patientId,
      totalAmount: planRequest.totalAmount,
      downPayment: downPayment,
      installmentAmount: installmentAmount,
      installmentCount: planRequest.installmentMonths,
      remainingInstallments: planRequest.installmentMonths,
      nextDueDate: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days from now
      status: 'active',
      createdDate: new Date(),
      serviceDescription: planRequest.serviceDescription
    };

    this.paymentPlans.push(paymentPlan);
    return paymentPlan;
  }

  // Get transaction history
  getTransactionHistory(patientId: string): PaymentTransaction[] {
    return this.transactions
      .filter(t => t.patientId === patientId)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime());
  }

  // Get payment plans
  getPaymentPlans(patientId: string): PaymentPlan[] {
    return this.paymentPlans
      .filter(p => p.patientId === patientId)
      .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
  }

  // Get transaction by ID
  getTransaction(transactionId: string): PaymentTransaction | undefined {
    return this.transactions.find(t => t.id === transactionId);
  }

  // Refund transaction
  async refundTransaction(transactionId: string, reason: string): Promise<boolean> {
    const transaction = this.getTransaction(transactionId);
    if (!transaction || transaction.status !== 'completed') {
      return false;
    }

    transaction.status = 'refunded';
    transaction.notes = `Refunded: ${reason}`;
    
    // In a real implementation, you would process the actual refund
    console.log(`Refund processed for transaction ${transactionId}: ${reason}`);
    
    return true;
  }

  // Calculate payment breakdown
  calculatePaymentBreakdown(amount: number, paymentMethodId: string): {
    subtotal: number;
    processingFee: number;
    total: number;
    feePercentage: number;
  } {
    const paymentMethod = paymentMethods.find(pm => pm.id === paymentMethodId);
    const feePercentage = paymentMethod?.processingFee || 0;
    const processingFee = amount * (feePercentage / 100);
    
    return {
      subtotal: amount,
      processingFee: processingFee,
      total: amount + processingFee,
      feePercentage: feePercentage
    };
  }

  private async processPaymentByType(
    transaction: PaymentTransaction, 
    paymentMethod: PaymentMethod, 
    paymentDetails?: any
  ): Promise<{ success: boolean; transaction: PaymentTransaction; error?: string }> {
    transaction.status = 'processing';

    // Simulate different processing times and success rates
    const processingTime = this.getProcessingTime(paymentMethod.type);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Simulate payment processing
    const success = Math.random() > 0.05; // 95% success rate

    if (success) {
      transaction.status = 'completed';
      transaction.completedDate = new Date();
      transaction.receiptUrl = this.generateReceiptUrl(transaction.id);
      
      console.log(`✅ Payment successful: ${transaction.referenceNumber}`);
      return { success: true, transaction };
    } else {
      transaction.status = 'failed';
      console.log(`❌ Payment failed: ${transaction.referenceNumber}`);
      return { success: false, transaction, error: 'Payment processing failed' };
    }
  }

  private getProcessingTime(paymentType: string): number {
    switch (paymentType) {
      case 'e_wallet': return 1000; // 1 second
      case 'card': return 3000; // 3 seconds
      case 'bank_transfer': return 5000; // 5 seconds
      case 'installment': return 7000; // 7 seconds
      case 'cash': return 0; // Instant
      case 'gateway': return 2000; // 2 seconds default for online gateway
      default: return 2000;
    }
  }

  private generateReferenceNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `MDC-${timestamp}-${random}`;
  }

  private generateReceiptUrl(transactionId: string): string {
    return `/api/receipts/${transactionId}/download`;
  }
}

// Payment component helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2
  }).format(amount);
};

export const getPaymentMethodIcon = (paymentMethodId: string): string => {
  const method = paymentMethods.find(pm => pm.id === paymentMethodId);
  return method?.icon || '💳';
};

export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'pending': return 'text-yellow-600';
    case 'processing': return 'text-blue-600';
    case 'failed': return 'text-red-600';
    case 'refunded': return 'text-purple-600';
    case 'cancelled': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getPaymentStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed': return 'default';
    case 'pending': return 'secondary';
    case 'processing': return 'secondary';
    case 'failed': return 'destructive';
    case 'refunded': return 'outline';
    case 'cancelled': return 'outline';
    default: return 'secondary';
  }
};

export default { PaymentService, paymentMethods, formatCurrency, getPaymentMethodIcon };