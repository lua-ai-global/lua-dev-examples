export const UserStageValues = [
  'welcome',
  'product-selection',
  'identity-verification',
  'kyc-basic',
  'document-upload',
  'bank-account-check',
  'account-type-selection',
  'employment-details',
  'employment-status',
  'income-details',
  'business-details',
  'business-financials',
  'loan-quote',
  'review-and-submit',
  'completed',
  'blocked',
] as const;
export type UserStage = (typeof UserStageValues)[number];

export const ProductTypeValues = [
  'bank-account',
  'personal-loan',
  'business-loan',
] as const;
export type ProductType = (typeof ProductTypeValues)[number];

export const AccountTypeValues = [
  'savings',
  'current',
  'business',
] as const;
export type AccountType = (typeof AccountTypeValues)[number];

export const ImageTypeValues = [
  'national_id_front',
  'national_id_back',
  'driver_license_front',
  'driver_license_back',
  'passport_front',
  'passport_back',
  'refugee_id_front',
  'refugee_id_back',
  'proof_of_address',
  'business_registration',
  'selfie',
] as const;
export type ImageType = (typeof ImageTypeValues)[number];

export const EmploymentStatusValues = [
  'employed',
  'self-employed',
  'business-owner',
  'unemployed',
  'retired',
  'student',
] as const;
export type EmploymentStatus = (typeof EmploymentStatusValues)[number];

export const UserGenderValues = ['Male', 'Female', 'Prefer not to say'] as const;
export type UserGender = (typeof UserGenderValues)[number];

export const NextOfKinRelationValues = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Other',
] as const;
export type NextOfKinRelation = (typeof NextOfKinRelationValues)[number];

export const BusinessCategoryValues = [
  'Retail / Wholesale trade',
  'Manufacturing',
  'Services',
  'Agriculture / Farming',
  'Technology',
  'Healthcare',
  'Education',
  'Hospitality / Food',
  'Transport / Logistics',
  'Other',
] as const;
export type BusinessCategory = (typeof BusinessCategoryValues)[number];

export const LoanTermValues = [
  '3 months',
  '6 months',
  '12 months',
  '24 months',
  '36 months',
] as const;
export type LoanTerm = (typeof LoanTermValues)[number];

export const ReferralSourceValues = [
  'Friend / Family',
  'Social media',
  'Radio / TV',
  'Bank branch',
  'Online search',
  'Other',
] as const;
export type ReferralSource = (typeof ReferralSourceValues)[number];
