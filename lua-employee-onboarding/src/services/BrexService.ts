import axios, { AxiosInstance } from 'axios';

/**
 * Brex API Service
 * 
 * Handles all communication with the Brex API for employee onboarding.
 * Documentation: https://developer.brex.com/
 */
export default class BrexService {
  private client: AxiosInstance;
  private baseURL = 'https://platform.brexapis.com';

  constructor(apiToken: string) {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': this.generateIdempotencyKey(),
      },
    });
  }

  /**
   * Generate idempotency key for safe API retries
   */
  private generateIdempotencyKey(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Register bank account information for a user
   * This uses the Brex Payments API to set up ACH transfer capabilities
   * 
   * @param bankDetails - Bank account information for ACH transfers
   */
  async registerBankAccount(bankDetails: {
    userId: string;
    employeeName: string;
    accountHolderName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: 'CHECKING' | 'SAVINGS';
    bankName?: string;
  }) {
    try {
      // Set a unique idempotency key for this specific request
      const idempotencyKey = `bank-reg-${bankDetails.userId}-${Date.now()}`;
      
      const response = await this.client.post('/v2/accounts/bank', {
        user_id: bankDetails.userId,
        account_holder_name: bankDetails.accountHolderName,
        account_number: bankDetails.accountNumber,
        routing_number: bankDetails.routingNumber,
        account_type: bankDetails.accountType,
        bank_name: bankDetails.bankName,
      }, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      return {
        success: true,
        accountId: response.data.id,
        status: response.data.status,
        message: `Bank account successfully registered for ${bankDetails.employeeName}`,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Brex API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code,
      };
    }
  }

  /**
   * Verify bank account details before registration
   * Uses micro-deposit verification or instant verification
   */
  async verifyBankAccount(params: {
    accountNumber: string;
    routingNumber: string;
  }) {
    try {
      const response = await this.client.post('/v2/accounts/bank/verify', {
        account_number: params.accountNumber,
        routing_number: params.routingNumber,
      });

      return {
        success: true,
        verified: response.data.verified,
        bankName: response.data.bank_name,
        message: response.data.verified 
          ? 'Bank account verified successfully' 
          : 'Bank account verification pending',
        data: response.data,
      };
    } catch (error: any) {
      console.error('Brex Verification Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  /**
   * Create or update user in Brex system
   * This is typically called before registering bank details
   */
  async createUser(userDetails: {
    email: string;
    firstName: string;
    lastName: string;
    departmentId?: string;
    managerId?: string;
  }) {
    try {
      const response = await this.client.post('/v2/users', {
        email: userDetails.email,
        first_name: userDetails.firstName,
        last_name: userDetails.lastName,
        department_id: userDetails.departmentId,
        manager_id: userDetails.managerId,
      });

      return {
        success: true,
        userId: response.data.id,
        message: `User ${userDetails.firstName} ${userDetails.lastName} created in Brex`,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Brex User Creation Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        errorCode: error.response?.data?.code,
      };
    }
  }

  /**
   * Get user details from Brex
   */
  async getUser(userId: string) {
    try {
      const response = await this.client.get(`/v2/users/${userId}`);
      
      return {
        success: true,
        user: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
}

