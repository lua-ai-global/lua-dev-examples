import {
  UserStage,
  ProductType,
  AccountType,
  ImageType,
  EmploymentStatus,
  UserGender,
  NextOfKinRelation,
  BusinessCategory,
  LoanTerm,
  ReferralSource,
} from './enums';

export interface UserData {
  phoneNumber: string;
  countryCode: string;
  countryName: string;
  stage: UserStage;
  selectedProduct?: ProductType;
  blockedReason?: string;

  otp?: {
    code: string;
    sentAt: string;
    verified: boolean;
  };

  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: UserGender;
    nationality?: string;
    email?: string;
    address?: string;
  };

  documents?: {
    type: ImageType;
    luaCdnUrl: string;
    uploadedAt: string;
  }[];

  nextOfKin?: {
    name: string;
    relation: NextOfKinRelation;
    phoneNumber: string;
  }[];

  accountApplication?: {
    accountType?: AccountType;
    employmentStatus?: EmploymentStatus;
    employerName?: string;
    monthlyIncome?: number;
    initialDepositAmount?: number;
    agreedToTerms?: boolean;
    referenceNumber?: string;
    submittedAt?: string;
  };

  loanApplication?: {
    employmentStatus?: EmploymentStatus;
    employerName?: string;
    monthlyIncome?: number;
    requestedAmount?: number;
    term?: LoanTerm;
    interestRate?: number;
    monthlyRepayment?: number;
    purpose?: string;
    businessName?: string;
    businessCategory?: BusinessCategory;
    businessAgeMonths?: number;
    monthlyRevenue?: number;
    employeeCount?: number;
    businessAddress?: string;
    agreedToTerms?: boolean;
    referenceNumber?: string;
    submittedAt?: string;
    status?: 'pending' | 'active' | 'repaid' | 'rejected';
    repaidAt?: string;
  };

  bankAccount?: {
    sourceType: 'internal' | 'external';
    accountNumber?: string;
    referenceNumber?: string;
  };

  referralSource?: ReferralSource;

  _stageHistory?: {
    stage: UserStage;
    enteredAt: string;
    exitedAt?: string;
    durationMs?: number;
    triggeredBy?: string;
  }[];
}
