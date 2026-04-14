import { ProductType, ImageType } from '../models/enums';

export interface CountryConfig {
  name: string;
  isoCode: string;
  currency: string;
  currencySymbol: string;
  phonePrefix: string;
  supportedIdTypes: {
    label: string;
    types: ImageType[];
    requiresBothSides: boolean;
  }[];
  availableProducts: ProductType[];
  loanConfig?: {
    minAmount: number;
    maxAmount: number;
    interestRateMonthly: number;
    currency: string;
  };
  regulatoryNote: string;
  customerCare: {
    chat?: string;
    phone?: string;
    email?: string;
  };
  languages: string[];
}

const COUNTRY_CONFIGS: Record<string, CountryConfig> = {
  '+256': {
    name: 'Uganda',
    isoCode: 'UG',
    currency: 'UGX',
    currencySymbol: 'UGX',
    phonePrefix: '+256',
    supportedIdTypes: [
      {
        label: 'National ID',
        types: ['national_id_front', 'national_id_back'],
        requiresBothSides: true,
      },
      {
        label: "Driver's Licence",
        types: ['driver_license_front', 'driver_license_back'],
        requiresBothSides: true,
      },
      {
        label: 'Passport',
        types: ['passport_front', 'passport_back'],
        requiresBothSides: true,
      },
      {
        label: 'Refugee Identity Card',
        types: ['refugee_id_front', 'refugee_id_back'],
        requiresBothSides: true,
      },
    ],
    availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
    loanConfig: {
      minAmount: 500_000,
      maxAmount: 30_000_000,
      interestRateMonthly: 4,
      currency: 'UGX',
    },
    regulatoryNote:
      'Licensed by Bank of Uganda. All deposits are protected under the Financial Institutions Act 2004.',
    customerCare: {
      chat: '+256787568903',
      phone: '0800314413',
    },
    languages: ['English', 'Luganda', 'Swahili'],
  },
  '+254': {
    name: 'Kenya',
    isoCode: 'KE',
    currency: 'KES',
    currencySymbol: 'KSh',
    phonePrefix: '+254',
    supportedIdTypes: [
      {
        label: 'National ID',
        types: ['national_id_front', 'national_id_back'],
        requiresBothSides: true,
      },
      {
        label: "Driver's Licence",
        types: ['driver_license_front', 'driver_license_back'],
        requiresBothSides: true,
      },
      {
        label: 'Passport',
        types: ['passport_front', 'passport_back'],
        requiresBothSides: true,
      },
    ],
    availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
    loanConfig: {
      minAmount: 5_000,
      maxAmount: 500_000,
      interestRateMonthly: 3,
      currency: 'KES',
    },
    regulatoryNote:
      'Licensed by the Central Bank of Kenya. Member of the Kenya Deposit Insurance Corporation (KDIC).',
    customerCare: {
      chat: '+254704454031',
      phone: '0800720960',
    },
    languages: ['English', 'Swahili'],
  },
  '+255': {
    name: 'Tanzania',
    isoCode: 'TZ',
    currency: 'TZS',
    currencySymbol: 'TSh',
    phonePrefix: '+255',
    supportedIdTypes: [
      {
        label: 'National ID (NIDA)',
        types: ['national_id_front', 'national_id_back'],
        requiresBothSides: true,
      },
      {
        label: 'Passport',
        types: ['passport_front', 'passport_back'],
        requiresBothSides: true,
      },
      {
        label: "Driver's Licence",
        types: ['driver_license_front', 'driver_license_back'],
        requiresBothSides: true,
      },
    ],
    availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
    loanConfig: {
      minAmount: 100_000,
      maxAmount: 50_000_000,
      interestRateMonthly: 3.5,
      currency: 'TZS',
    },
    regulatoryNote:
      'Licensed by the Bank of Tanzania. Regulated under the Banking and Financial Institutions Act 2006.',
    customerCare: {
      phone: '+255800000000',
    },
    languages: ['English', 'Swahili'],
  },
  '+234': {
    name: 'Nigeria',
    isoCode: 'NG',
    currency: 'NGN',
    currencySymbol: '₦',
    phonePrefix: '+234',
    supportedIdTypes: [
      {
        label: 'National ID (NIN)',
        types: ['national_id_front', 'national_id_back'],
        requiresBothSides: true,
      },
      {
        label: 'Passport',
        types: ['passport_front', 'passport_back'],
        requiresBothSides: true,
      },
      {
        label: "Driver's Licence",
        types: ['driver_license_front', 'driver_license_back'],
        requiresBothSides: true,
      },
    ],
    availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
    loanConfig: {
      minAmount: 50_000,
      maxAmount: 10_000_000,
      interestRateMonthly: 5,
      currency: 'NGN',
    },
    regulatoryNote:
      'Licensed by the Central Bank of Nigeria (CBN). NDIC insured.',
    customerCare: {
      phone: '07000000000',
    },
    languages: ['English', 'Hausa', 'Yoruba', 'Igbo'],
  },
  '+233': {
    name: 'Ghana',
    isoCode: 'GH',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    phonePrefix: '+233',
    supportedIdTypes: [
      {
        label: 'Ghana Card (National ID)',
        types: ['national_id_front', 'national_id_back'],
        requiresBothSides: true,
      },
      {
        label: 'Passport',
        types: ['passport_front', 'passport_back'],
        requiresBothSides: true,
      },
      {
        label: "Driver's Licence",
        types: ['driver_license_front', 'driver_license_back'],
        requiresBothSides: true,
      },
    ],
    availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
    loanConfig: {
      minAmount: 500,
      maxAmount: 100_000,
      interestRateMonthly: 4.5,
      currency: 'GHS',
    },
    regulatoryNote:
      'Licensed by the Bank of Ghana. Member of the Ghana Deposit Protection Corporation.',
    customerCare: {
      phone: '0800000000',
    },
    languages: ['English', 'Twi', 'Ga'],
  },
  '+27': {
    name: 'South Africa',
    isoCode: 'ZA',
    currency: 'ZAR',
    currencySymbol: 'R',
    phonePrefix: '+27',
    supportedIdTypes: [
      {
        label: 'South African ID',
        types: ['national_id_front'],
        requiresBothSides: false,
      },
      {
        label: 'Passport',
        types: ['passport_front', 'passport_back'],
        requiresBothSides: true,
      },
      {
        label: "Driver's Licence",
        types: ['driver_license_front', 'driver_license_back'],
        requiresBothSides: true,
      },
    ],
    availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
    loanConfig: {
      minAmount: 1_000,
      maxAmount: 250_000,
      interestRateMonthly: 2,
      currency: 'ZAR',
    },
    regulatoryNote:
      'Registered credit provider (NCRCP). Regulated by the South African Reserve Bank (SARB).',
    customerCare: {
      phone: '0860000000',
    },
    languages: ['English', 'Afrikaans', 'Zulu', 'Xhosa'],
  },
};

const GENERIC_CONFIG: CountryConfig = {
  name: 'International',
  isoCode: 'XX',
  currency: 'USD',
  currencySymbol: '$',
  phonePrefix: '',
  supportedIdTypes: [
    {
      label: 'Passport',
      types: ['passport_front', 'passport_back'],
      requiresBothSides: true,
    },
  ],
  availableProducts: ['bank-account', 'personal-loan', 'business-loan'],
  loanConfig: {
    minAmount: 100,
    maxAmount: 10_000,
    interestRateMonthly: 3,
    currency: 'USD',
  },
  regulatoryNote:
    'Your information is securely stored and processed in accordance with applicable data protection laws.',
  customerCare: {
    email: 'support@finserv-demo.com',
  },
  languages: ['English'],
};

export function getCountryConfig(phoneNumber: string): CountryConfig {
  const normalised = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

  for (const prefix of Object.keys(COUNTRY_CONFIGS).sort((a, b) => b.length - a.length)) {
    if (normalised.startsWith(prefix)) {
      return COUNTRY_CONFIGS[prefix];
    }
  }

  return GENERIC_CONFIG;
}

export function formatCurrency(amount: number, config: CountryConfig): string {
  return `${config.currencySymbol} ${amount.toLocaleString()}`;
}

export { COUNTRY_CONFIGS };
