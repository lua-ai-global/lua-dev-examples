import { User, env } from 'lua-cli';
import { randomUUID } from 'crypto';
import { UserData } from '../models/user';
import { UserStage, ProductType, AccountType, ImageType, EmploymentStatus, UserGender, NextOfKinRelation, BusinessCategory, LoanTerm, ReferralSource } from '../models/enums';
import { getCountryConfig, formatCurrency } from './CountryConfig';

export class FinservService {
  private trackStageTransition(user: UserData, newStage: UserStage, triggeredBy?: string): UserData {
    const now = new Date().toISOString();

    if (!user._stageHistory) {
      user._stageHistory = [];
    }

    if (user._stageHistory.length > 0) {
      const current = user._stageHistory[user._stageHistory.length - 1];
      if (!current.exitedAt) {
        current.exitedAt = now;
        current.durationMs = new Date(now).getTime() - new Date(current.enteredAt).getTime();
      }
    }

    user._stageHistory.push({ stage: newStage, enteredAt: now, triggeredBy });
    user.stage = newStage;
    return user;
  }

  private async retrieveUser(requireOtp = false): Promise<{ status: boolean; message: string; user?: UserData }> {
    const userInstance = await User.get();
    const user = userInstance.data as UserData;

    if (!user.stage) {
      const initial: UserData = {
        phoneNumber: '',
        countryCode: '',
        countryName: '',
        stage: 'welcome',
      };
      this.trackStageTransition(initial, 'welcome', 'auto-init');
      await userInstance.update(initial);
      return { status: true, message: 'User initialised', user: initial };
    }

    if (requireOtp && !user.otp?.verified) {
      return { status: false, message: 'Identity not yet verified. Please complete OTP verification first.' };
    }

    return { status: true, message: 'User retrieved', user };
  }

  async getUserById(): Promise<{ status: boolean; message: string; user?: UserData; countryConfig?: object }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const user = result.user;
      const config = user.phoneNumber ? getCountryConfig(user.phoneNumber) : null;

      return {
        status: true,
        message: this.stageGuidance(user),
        user,
        countryConfig: config ? {
          name: config.name,
          currency: config.currency,
          currencySymbol: config.currencySymbol,
          availableProducts: config.availableProducts,
          languages: config.languages,
        } : undefined,
      };
    } catch (error) {
      return { status: false, message: `Unexpected error: ${error}` };
    }
  }

  private stageGuidance(user: UserData): string {
    switch (user.stage) {
      case 'welcome':
        return 'New user — greet them and ask for their phone number to begin.';
      case 'product-selection':
        return 'Phone verified — ask the user which financial product they are interested in: bank account, personal loan, or business loan.';
      case 'identity-verification':
        return 'Product selected — send an OTP to verify the user\'s phone number.';
      case 'kyc-basic':
        return 'OTP verified — collect the user\'s full name, date of birth, gender, and nationality.';
      case 'document-upload':
        return `KYC complete — ask the user to upload their identity document. Supported types for their country: ${user.countryCode || 'Passport'}.`;
      case 'bank-account-check':
        return 'Documents uploaded (loan product). Call checkBankAccount to verify whether the user has a bank account for loan disbursement.';
      case 'account-type-selection':
        return 'Document uploaded — ask what type of bank account they want: savings, current, or business.';
      case 'employment-details':
        return 'Account type selected — collect employment status, employer name (if employed), and monthly income.';
      case 'employment-status':
        return 'Document uploaded (personal loan) — ask for employment status and income details.';
      case 'income-details':
        return 'Employment status set — collect monthly income and loan purpose.';
      case 'business-details':
        return 'Document uploaded (business loan) — collect business name, category, and age in months.';
      case 'business-financials':
        return 'Business details collected — ask for monthly revenue, employee count, and business address.';
      case 'loan-quote':
        return 'Financial info collected — generate a loan quote with amount, term, interest rate, and monthly repayment.';
      case 'review-and-submit':
        return 'All information collected — present a full summary and ask the user to confirm and accept terms.';
      case 'completed':
        return `This user has a completed application on file. Greet them normally and ask how you can help today. Do NOT proactively mention or summarise their past application unless they specifically ask about it.`;
      case 'blocked':
        return `Application blocked — reason: ${user.blockedReason}. Explain the issue and offer customer care contact.`;
      default:
        return 'Proceed with the current stage.';
    }
  }

  async linkPhone(phoneNumber: string): Promise<{ status: boolean; message: string; countryConfig?: object }> {
    try {
      const userInstance = await User.get();
      const user = userInstance.data as UserData;

      const config = getCountryConfig(phoneNumber);

      const updated: UserData = {
        ...user,
        phoneNumber,
        countryCode: config.isoCode,
        countryName: config.name,
        stage: user.stage === 'welcome' ? 'product-selection' : user.stage,
      };

      if (updated.stage === 'product-selection') {
        this.trackStageTransition(updated, 'product-selection', 'linkPhone');
      }

      await userInstance.update(updated);

      return {
        status: true,
        message: `Phone number registered. Country detected: ${config.name} (${config.currency}). Now ask the user which product they are interested in.`,
        countryConfig: {
          name: config.name,
          currency: config.currency,
          currencySymbol: config.currencySymbol,
          availableProducts: config.availableProducts,
          supportedIdTypes: config.supportedIdTypes.map(t => t.label),
          regulatoryNote: config.regulatoryNote,
          languages: config.languages,
          customerCare: config.customerCare,
        },
      };
    } catch (error) {
      return { status: false, message: `Error linking phone: ${error}` };
    }
  }

  async selectProduct(product: ProductType): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;
      user.selectedProduct = product;
      this.trackStageTransition(user, 'identity-verification', 'selectProduct');
      await userInstance.update(user);

      return { status: true, message: `Product selected: ${product}. Now send an OTP to verify the user's identity.` };
    } catch (error) {
      return { status: false, message: `Error selecting product: ${error}` };
    }
  }

  async sendOtp(): Promise<{ status: boolean; message: string; otp?: string }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      const isDemoMode = env('DEMO_MODE') === 'true';
      const code = isDemoMode ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();

      user.otp = { code, sentAt: new Date().toISOString(), verified: false };
      await userInstance.update(user);

      if (isDemoMode) {
        return { status: true, message: `[DEMO MODE] OTP sent to ${user.phoneNumber}. For demo purposes the code is: ${code}`, otp: code };
      }

      return { status: true, message: `OTP sent to ${user.phoneNumber}. Ask the user to enter the 6-digit code they received.` };
    } catch (error) {
      return { status: false, message: `Error sending OTP: ${error}` };
    }
  }

  async verifyOtp(code: string): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      if (!user.otp) {
        return { status: false, message: 'No OTP has been sent. Please use sendOtp first.' };
      }

      const isDemoMode = env('DEMO_MODE') === 'true';
      const isValid = isDemoMode ? code === '123456' : code === user.otp.code;

      if (!isValid) {
        return { status: false, message: 'Incorrect OTP. Please ask the user to check the code and try again.' };
      }

      user.otp.verified = true;
      this.trackStageTransition(user, 'kyc-basic', 'verifyOtp');
      await userInstance.update(user);

      return { status: true, message: 'OTP verified successfully. Now collect the user\'s personal details: full name, date of birth, gender, and nationality.' };
    } catch (error) {
      return { status: false, message: `Error verifying OTP: ${error}` };
    }
  }

  async updatePersonalInfo(params: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: UserGender;
    nationality: string;
    email?: string;
    address?: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.profile = { ...user.profile, ...params };
      this.trackStageTransition(user, 'document-upload', 'updatePersonalInfo');
      await userInstance.update(user);

      const config = getCountryConfig(user.phoneNumber);
      const idOptions = config.supportedIdTypes.map(t => t.label).join(', ');

      return { status: true, message: `Personal information saved. Now ask the user to upload their identity document. Accepted documents in ${config.name}: ${idOptions}.` };
    } catch (error) {
      return { status: false, message: `Error updating personal info: ${error}` };
    }
  }

  async skipDocumentUpload(): Promise<{ status: boolean; message: string }> {
    const isDemoMode = env('DEMO_MODE') === 'true';
    if (!isDemoMode) {
      return { status: false, message: 'Document upload cannot be skipped outside of demo mode.' };
    }

    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.documents = [{ type: 'passport_front', luaCdnUrl: 'demo://skipped', uploadedAt: new Date().toISOString() }];
      const nextStage = this.getDocumentUploadNextStage(user.selectedProduct!);
      this.trackStageTransition(user, nextStage, 'skipDocumentUpload');
      await userInstance.update(user);

      return { status: true, message: `[DEMO MODE] Document upload skipped. Moving to: ${nextStage}.` };
    } catch (error) {
      return { status: false, message: `Error skipping document: ${error}` };
    }
  }

  async uploadDocument(params: { type: ImageType; luaCdnUrl: string }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      if (!user.documents) user.documents = [];
      user.documents.push({ type: params.type, luaCdnUrl: params.luaCdnUrl, uploadedAt: new Date().toISOString() });

      const config = getCountryConfig(user.phoneNumber);
      const selectedIdGroup = config.supportedIdTypes.find(g => g.types.includes(params.type));

      const allRequiredUploaded = selectedIdGroup
        ? selectedIdGroup.types.every(t => user.documents!.some(d => d.type === t))
        : true;

      if (!allRequiredUploaded) {
        const missing = selectedIdGroup!.types.filter(t => !user.documents!.some(d => d.type === t));
        await userInstance.update(user);
        return { status: true, message: `Document uploaded. Still need: ${missing.join(', ')}. Ask the user to upload the remaining side(s).` };
      }

      const nextStage = this.getDocumentUploadNextStage(user.selectedProduct!);
      this.trackStageTransition(user, nextStage, 'uploadDocument');
      await userInstance.update(user);

      return { status: true, message: `All required identity documents uploaded. Moving to: ${nextStage}.` };
    } catch (error) {
      return { status: false, message: `Error uploading document: ${error}` };
    }
  }

  private getDocumentUploadNextStage(product: ProductType): UserStage {
    switch (product) {
      case 'bank-account': return 'account-type-selection';
      case 'personal-loan': return 'bank-account-check';
      case 'business-loan': return 'bank-account-check';
    }
  }

  private getLoanStageAfterBankCheck(product: ProductType): UserStage {
    switch (product) {
      case 'personal-loan': return 'employment-status';
      case 'business-loan': return 'business-details';
      default: return 'employment-status';
    }
  }

  async checkBankAccount(): Promise<{ status: boolean; message: string; hasBankAccount: boolean }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message, hasBankAccount: false };

      const user = result.user;
      const hasInternalAccount = !!user.accountApplication?.referenceNumber;
      const hasExternalAccount = !!user.bankAccount?.accountNumber;

      return {
        status: true,
        hasBankAccount: hasInternalAccount || hasExternalAccount,
        message: hasInternalAccount || hasExternalAccount
          ? `Bank account on file. Proceeding with loan application.`
          : `No bank account found. Ask the user to provide their account number for loan disbursement, or offer to open a bank account with you first.`,
      };
    } catch (error) {
      return { status: false, message: `Error checking bank account: ${error}`, hasBankAccount: false };
    }
  }

  async provideBankAccountNumber(accountNumber: string): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.bankAccount = { sourceType: 'external', accountNumber };
      const nextStage = this.getLoanStageAfterBankCheck(user.selectedProduct!);
      this.trackStageTransition(user, nextStage, 'provideBankAccountNumber');
      await userInstance.update(user);

      return { status: true, message: `Bank account number saved. Loan will be disbursed to account ending in ${accountNumber.slice(-4)}. Proceeding with the ${user.selectedProduct} application.` };
    } catch (error) {
      return { status: false, message: `Error saving bank account: ${error}` };
    }
  }

  async switchToOpenBankAccount(): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.selectedProduct = 'bank-account';
      this.trackStageTransition(user, 'account-type-selection', 'switchToOpenBankAccount');
      await userInstance.update(user);

      return { status: true, message: `Switched to bank account opening. The user can apply for their loan after the account is approved. Now ask what type of account they would like: savings, current, or business.` };
    } catch (error) {
      return { status: false, message: `Error switching product: ${error}` };
    }
  }

  async addNextOfKin(params: { name: string; relation: NextOfKinRelation; phoneNumber: string }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      if (!user.nextOfKin) user.nextOfKin = [];
      user.nextOfKin.push(params);
      await userInstance.update(user);

      return { status: true, message: `Next of kin added: ${params.name} (${params.relation}). ${user.nextOfKin.length < 2 ? 'Ask for a second next of kin contact.' : 'All required contacts added.'}` };
    } catch (error) {
      return { status: false, message: `Error adding next of kin: ${error}` };
    }
  }

  async selectAccountType(accountType: AccountType): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.accountApplication = { ...user.accountApplication, accountType };
      this.trackStageTransition(user, 'employment-details', 'selectAccountType');
      await userInstance.update(user);

      return { status: true, message: `Account type set to: ${accountType}. Now ask for employment status and monthly income.` };
    } catch (error) {
      return { status: false, message: `Error selecting account type: ${error}` };
    }
  }

  async updateEmploymentDetails(params: {
    employmentStatus: EmploymentStatus;
    employerName?: string;
    monthlyIncome: number;
    initialDepositAmount?: number;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.accountApplication = { ...user.accountApplication, ...params };
      this.trackStageTransition(user, 'review-and-submit', 'updateEmploymentDetails');
      await userInstance.update(user);

      return { status: true, message: 'Employment details saved. All required information collected. Present a full summary to the user and ask them to confirm and accept the terms.' };
    } catch (error) {
      return { status: false, message: `Error updating employment details: ${error}` };
    }
  }

  async updateEmploymentStatus(params: {
    employmentStatus: EmploymentStatus;
    employerName?: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.loanApplication = { ...user.loanApplication, ...params };
      this.trackStageTransition(user, 'income-details', 'updateEmploymentStatus');
      await userInstance.update(user);

      return { status: true, message: 'Employment status saved. Now ask for monthly income and the purpose of the loan.' };
    } catch (error) {
      return { status: false, message: `Error updating employment status: ${error}` };
    }
  }

  async updateIncomeDetails(params: {
    monthlyIncome: number;
    purpose: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.loanApplication = { ...user.loanApplication, ...params };
      this.trackStageTransition(user, 'loan-quote', 'updateIncomeDetails');
      await userInstance.update(user);

      return { status: true, message: 'Income details saved. Now generate a loan quote using getLoanQuote.' };
    } catch (error) {
      return { status: false, message: `Error updating income details: ${error}` };
    }
  }

  async updateBusinessDetails(params: {
    businessName: string;
    businessCategory: BusinessCategory;
    businessAgeMonths: number;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.loanApplication = { ...user.loanApplication, ...params };
      this.trackStageTransition(user, 'business-financials', 'updateBusinessDetails');
      await userInstance.update(user);

      return { status: true, message: 'Business details saved. Now ask for monthly revenue, number of employees, and business address.' };
    } catch (error) {
      return { status: false, message: `Error updating business details: ${error}` };
    }
  }

  async updateBusinessFinancials(params: {
    monthlyRevenue: number;
    employeeCount: number;
    businessAddress: string;
    purpose?: string;
  }): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      user.loanApplication = { ...user.loanApplication, ...params };
      this.trackStageTransition(user, 'loan-quote', 'updateBusinessFinancials');
      await userInstance.update(user);

      return { status: true, message: 'Business financials saved. Now generate a loan quote using getLoanQuote.' };
    } catch (error) {
      return { status: false, message: `Error updating business financials: ${error}` };
    }
  }

  async getLoanQuote(params: {
    requestedAmount: number;
    term: LoanTerm;
  }): Promise<{ status: boolean; message: string; quote?: object }> {
    try {
      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;
      const config = getCountryConfig(user.phoneNumber);

      if (!config.loanConfig) {
        return { status: false, message: 'Loan products are not available in your country.' };
      }

      const { minAmount, maxAmount, interestRateMonthly } = config.loanConfig;

      if (params.requestedAmount < minAmount || params.requestedAmount > maxAmount) {
        return {
          status: false,
          message: `Requested amount must be between ${formatCurrency(minAmount, config)} and ${formatCurrency(maxAmount, config)}.`,
        };
      }

      const termMonths: Record<LoanTerm, number> = {
        '3 months': 3,
        '6 months': 6,
        '12 months': 12,
        '24 months': 24,
        '36 months': 36,
      };
      const months = termMonths[params.term];
      const totalInterest = params.requestedAmount * (interestRateMonthly / 100) * months;
      const totalRepayable = params.requestedAmount + totalInterest;
      const monthlyRepayment = Math.round(totalRepayable / months);

      user.loanApplication = {
        ...user.loanApplication,
        requestedAmount: params.requestedAmount,
        term: params.term,
        interestRate: interestRateMonthly,
        monthlyRepayment,
      };
      this.trackStageTransition(user, 'review-and-submit', 'getLoanQuote');
      await userInstance.update(user);

      const quote = {
        requestedAmount: formatCurrency(params.requestedAmount, config),
        term: params.term,
        interestRateMonthly: `${interestRateMonthly}%`,
        totalInterest: formatCurrency(totalInterest, config),
        totalRepayable: formatCurrency(totalRepayable, config),
        monthlyRepayment: formatCurrency(monthlyRepayment, config),
      };

      return {
        status: true,
        message: 'Loan quote generated. Present the quote to the user clearly, then ask if they want to proceed or adjust the amount/term.',
        quote,
      };
    } catch (error) {
      return { status: false, message: `Error generating quote: ${error}` };
    }
  }

  async customiseLoanQuote(params: {
    requestedAmount: number;
    term: LoanTerm;
  }): Promise<{ status: boolean; message: string; quote?: object }> {
    return this.getLoanQuote(params);
  }

  async canAdvanceToSubmit(user: UserData): Promise<{ canAdvance: boolean; missing: string[] }> {
    const missing: string[] = [];

    if (!user.profile?.firstName) missing.push('First name');
    if (!user.profile?.lastName) missing.push('Last name');
    if (!user.profile?.dateOfBirth) missing.push('Date of birth');
    if (!user.profile?.gender) missing.push('Gender');
    if (!user.profile?.nationality) missing.push('Nationality');
    if (!user.documents || user.documents.length === 0) missing.push('Identity document');

    if (user.selectedProduct === 'bank-account') {
      if (!user.accountApplication?.accountType) missing.push('Account type');
      if (!user.accountApplication?.employmentStatus) missing.push('Employment status');
      if (!user.accountApplication?.monthlyIncome) missing.push('Monthly income');
    }

    if (user.selectedProduct === 'personal-loan') {
      if (!user.loanApplication?.employmentStatus) missing.push('Employment status');
      if (!user.loanApplication?.monthlyIncome) missing.push('Monthly income');
      if (!user.loanApplication?.requestedAmount) missing.push('Loan amount');
      if (!user.loanApplication?.term) missing.push('Loan term');
    }

    if (user.selectedProduct === 'business-loan') {
      if (!user.loanApplication?.businessName) missing.push('Business name');
      if (!user.loanApplication?.businessCategory) missing.push('Business category');
      if (!user.loanApplication?.businessAgeMonths) missing.push('Business age');
      if (!user.loanApplication?.monthlyRevenue) missing.push('Monthly revenue');
      if (!user.loanApplication?.employeeCount) missing.push('Employee count');
      if (!user.loanApplication?.requestedAmount) missing.push('Loan amount');
      if (!user.loanApplication?.term) missing.push('Loan term');
    }

    return { canAdvance: missing.length === 0, missing };
  }

  async submitApplication(agreedToTerms: boolean): Promise<{ status: boolean; message: string; referenceNumber?: string }> {
    try {
      if (!agreedToTerms) {
        return { status: false, message: 'The user must accept the terms and conditions before submitting.' };
      }

      const result = await this.retrieveUser(true);
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;

      const { canAdvance, missing } = await this.canAdvanceToSubmit(user);
      if (!canAdvance) {
        return { status: false, message: `Application is incomplete. Missing: ${missing.join(', ')}.` };
      }

      const referenceNumber = `FS-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
      const submittedAt = new Date().toISOString();

      if (user.selectedProduct === 'bank-account') {
        user.accountApplication = { ...user.accountApplication, agreedToTerms: true, referenceNumber, submittedAt };
      } else {
        user.loanApplication = { ...user.loanApplication, agreedToTerms: true, referenceNumber, submittedAt, status: 'active' };
      }

      this.trackStageTransition(user, 'completed', 'submitApplication');
      await userInstance.update(user);

      const config = getCountryConfig(user.phoneNumber);

      if (user.selectedProduct === 'bank-account') {
        const accountNumber = `ACC-${randomUUID().slice(0, 8).toUpperCase()}`;
        user.bankAccount = { sourceType: 'internal', accountNumber, referenceNumber };
        await userInstance.update(user);

        return {
          status: true,
          referenceNumber,
          message: `Bank account created successfully! Account number: ${accountNumber}. Reference: ${referenceNumber}. The account for ${user.profile?.firstName} ${user.profile?.lastName} is now active and ready to use. ${config.regulatoryNote}`,
        };
      }

      return {
        status: true,
        referenceNumber,
        message: `Loan application submitted successfully! Reference: ${referenceNumber}. The application for ${user.profile?.firstName} ${user.profile?.lastName} is now under review. Our team will contact you within 2 business days. ${config.regulatoryNote}`,
      };
    } catch (error) {
      return { status: false, message: `Error submitting application: ${error}` };
    }
  }

  async setReferralSource(source: ReferralSource): Promise<{ status: boolean; message: string }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const userInstance = await User.get();
      const user = result.user;
      user.referralSource = source;
      await userInstance.update(user);

      return { status: true, message: `Referral source recorded: ${source}.` };
    } catch (error) {
      return { status: false, message: `Error setting referral source: ${error}` };
    }
  }

  async repayLoan(): Promise<{ status: boolean; message: string; referenceNumber?: string }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const user = result.user;

      if (!user.loanApplication?.submittedAt) {
        return { status: false, message: 'No active loan found on this account.' };
      }

      if (user.loanApplication.status === 'repaid') {
        return { status: false, message: `This loan (reference: ${user.loanApplication.referenceNumber}) has already been repaid.` };
      }

      const userInstance = await User.get();
      user.loanApplication = {
        ...user.loanApplication,
        status: 'repaid',
        repaidAt: new Date().toISOString(),
      };
      await userInstance.update(user);

      const config = getCountryConfig(user.phoneNumber);
      const amount = user.loanApplication.requestedAmount
        ? formatCurrency(user.loanApplication.requestedAmount, config)
        : 'your loan';

      return {
        status: true,
        referenceNumber: user.loanApplication.referenceNumber,
        message: `Loan repaid successfully! Reference: ${user.loanApplication.referenceNumber}. The ${amount} loan has been fully settled. Your account is now clear and you are eligible to apply for new products.`,
      };
    } catch (error) {
      return { status: false, message: `Error processing repayment: ${error}` };
    }
  }

  async deleteAccount(): Promise<{ status: boolean; message: string; canDelete?: boolean }> {
    try {
      const result = await this.retrieveUser();
      if (!result.status || !result.user) return { status: false, message: result.message };

      const user = result.user;

      const hasActiveLoan =
        user.selectedProduct !== 'bank-account' &&
        !!user.loanApplication?.submittedAt &&
        user.loanApplication?.status !== 'repaid';

      if (hasActiveLoan) {
        return {
          status: false,
          canDelete: false,
          message: `Your account cannot be deleted while you have an active loan (reference: ${user.loanApplication?.referenceNumber ?? 'pending'}). Please repay your loan in full before closing your account.`,
        };
      }

      const userInstance = await User.get();
      const blank: UserData = {
        phoneNumber: '',
        countryCode: '',
        countryName: '',
        stage: 'welcome',
      };
      await userInstance.update(blank);

      return {
        status: true,
        canDelete: true,
        message: 'Your account and all associated data have been permanently deleted. We are sorry to see you go. If you ever need financial services in the future, we will be here to help.',
      };
    } catch (error) {
      return { status: false, message: `Error deleting account: ${error}` };
    }
  }
}
