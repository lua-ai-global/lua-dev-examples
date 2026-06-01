export interface TenantProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  monthlyIncome: number;
  creditScore: number;
  employmentStatus: 'full-time' | 'part-time' | 'freelance' | 'unemployed';
  employer?: string;
  rentalHistoryYears: number;
  negativeRemarks: number;
  hasPets: boolean;
  petType?: string;
  desiredMoveIn?: string;
}

export interface Viewing {
  id: string;
  propertyId: string;
  tenantName: string;
  tenantPhone: string;
  date: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'structural' | 'pest' | 'other';
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  status: 'submitted' | 'in-progress' | 'resolved';
  createdAt: string;
}
