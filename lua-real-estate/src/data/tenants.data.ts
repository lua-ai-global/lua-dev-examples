// Demo seed data — all names, emails, phone numbers, and financial figures are fictional.
import { TenantProfile } from '../types/tenant.types';

export const tenants: TenantProfile[] = [
  {
    id: 'tenant-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1-555-0101',
    monthlyIncome: 8500,
    creditScore: 780,
    employmentStatus: 'full-time',
    employer: 'TechCorp Inc.',
    rentalHistoryYears: 5,
    negativeRemarks: 0,
    hasPets: false,
  },
  {
    id: 'tenant-002',
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    phone: '+1-555-0102',
    monthlyIncome: 5200,
    creditScore: 690,
    employmentStatus: 'full-time',
    employer: 'City Hospital',
    rentalHistoryYears: 3,
    negativeRemarks: 1,
    hasPets: true,
    petType: 'dog',
  },
  {
    id: 'tenant-003',
    name: 'Priya Patel',
    email: 'priya.p@email.com',
    phone: '+1-555-0103',
    monthlyIncome: 4000,
    creditScore: 620,
    employmentStatus: 'freelance',
    rentalHistoryYears: 1,
    negativeRemarks: 2,
    hasPets: false,
  },
];

export function findTenant(nameOrEmail: string): TenantProfile | undefined {
  const query = nameOrEmail.toLowerCase();
  return tenants.find(
    t => t.name.toLowerCase() === query || t.email.toLowerCase() === query
  );
}
