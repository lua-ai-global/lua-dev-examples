// ===== Enums =====

export enum PricingModel {
  Fixed = 'fixed',
  TimeAndMaterials = 'time_and_materials',
  Retainer = 'retainer',
  Milestone = 'milestone',
  ValueBased = 'value_based',
}

export enum ProposalStatus {
  Draft = 'draft',
  Sent = 'sent',
  UnderReview = 'under_review',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Expired = 'expired',
}

export enum CompanySize {
  Startup = 'startup',
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
  Enterprise = 'enterprise',
}

// ===== Client =====

export interface Contact {
  name: string;
  title: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface ClientProfile {
  companyName: string;
  industry: string;
  companySize: CompanySize;
  contacts: Contact[];
  painPoints: string[];
  budget?: string;
  timeline?: string;
  notes?: string;
  website?: string;
  createdAt: string;
  updatedAt?: string;
}

// ===== Scope =====

export interface ScopeItem {
  phase: string;
  deliverable: string;
  description?: string;
  estimatedHours: number;
  role: string;
  ratePerHour: number;
}

export interface ScopeOfWork {
  clientId: string;
  title: string;
  overview: string;
  items: ScopeItem[];
  assumptions?: string[];
  exclusions?: string[];
  createdAt: string;
}

// ===== Pricing =====

export interface MilestonePayment {
  name: string;
  percentage: number;
  amount: number;
  dueDescription: string;
}

export interface PricingResult {
  model: PricingModel;
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  currency: string;
  breakdown: ScopeItem[];
  milestones?: MilestonePayment[];
  retainerDetails?: {
    monthlyHours: number;
    monthlyRate: number;
    termMonths: number;
    totalRate: number;
  };
}

// ===== Template =====

export interface ProposalTemplate {
  name: string;
  industry?: string;
  type?: string;
  sections: string[];
  body: string;
  createdAt: string;
}

// ===== Proposal =====

export interface StatusHistoryEntry {
  from: ProposalStatus;
  to: ProposalStatus;
  changedAt: string;
  reason?: string;
}

export interface Proposal {
  proposalId: string;
  title: string;
  clientId: string;
  clientName: string;
  scopeId: string;
  templateId?: string;
  status: ProposalStatus;
  executiveSummary: string;
  content: string;
  pricing: PricingResult;
  validUntil: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ===== Standard Rates =====

export interface StandardRate {
  role: string;
  ratePerHour: number;
}

export const STANDARD_RATES: Record<string, number> = {
  'Junior Consultant': 125,
  'Consultant': 175,
  'Senior Consultant': 225,
  'Principal Consultant': 300,
  'Managing Director': 400,
  'Subject Matter Expert': 350,
  'Project Manager': 200,
  'Technical Architect': 275,
  'Data Analyst': 150,
  'UX Designer': 175,
  'Developer': 200,
  'Senior Developer': 250,
  'QA Engineer': 150,
};

// ===== Valid Status Transitions =====

export const VALID_STATUS_TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  [ProposalStatus.Draft]: [ProposalStatus.Sent],
  [ProposalStatus.Sent]: [ProposalStatus.UnderReview, ProposalStatus.Rejected, ProposalStatus.Expired],
  [ProposalStatus.UnderReview]: [ProposalStatus.Accepted, ProposalStatus.Rejected, ProposalStatus.Expired],
  [ProposalStatus.Accepted]: [],
  [ProposalStatus.Rejected]: [],
  [ProposalStatus.Expired]: [],
};
