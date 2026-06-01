export interface Application {
  id: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  monthlyIncome: number;
  employmentStatus: 'full-time' | 'part-time' | 'freelance' | 'unemployed';
  creditScore: number;
  rentalHistoryYears: number;
  negativeRemarks: number;
  hasPets: boolean;
  petType?: string;
  desiredMoveIn?: string;
  status: 'pending' | 'approved' | 'under-review' | 'rejected';
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  createdAt: string;
  processedAt?: string;
}

export interface ScoreBreakdown {
  credit: number;
  incomeRatio: number;
  rentalHistory: number;
  employment: number;
  total: number;
}

export interface Lease {
  id: string;
  applicationId: string;
  propertyId: string;
  propertyName: string;
  tenantName: string;
  tenantEmail: string;
  monthlyRent: number;
  deposit: number;
  startDate: string;
  endDate: string;
  termMonths: number;
  status: 'active' | 'pending-signature' | 'expired' | 'terminated';
  createdAt: string;
}

export interface Payment {
  id: string;
  leaseId: string;
  amount: number;
  date: string;
  type: 'rent' | 'deposit' | 'late-fee' | 'maintenance';
  status: 'paid' | 'pending' | 'overdue';
}

export interface LeaseDocument {
  leaseId: string;
  type: 'summary' | 'full' | 'checklist';
  content: string;
  generatedAt: string;
}
