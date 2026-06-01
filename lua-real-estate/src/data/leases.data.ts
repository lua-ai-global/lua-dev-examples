// Demo seed data — all names, emails, phone numbers, and financial figures are fictional.
import { Lease, Payment } from '../types/lease.types';
import { properties } from './properties.data';

export const existingLeases: Lease[] = [
  {
    id: 'lease-001',
    applicationId: 'app-hist1',
    propertyId: 'prop-002',
    propertyName: 'Oakwood Terrace',
    tenantName: 'James Rivera',
    tenantEmail: 'james.r@email.com',
    monthlyRent: 2100,
    deposit: 2100,
    startDate: '2025-06-01',
    endDate: '2026-05-31',
    termMonths: 12,
    status: 'active',
    createdAt: '2025-05-15T10:00:00Z',
  },
  {
    id: 'lease-002',
    applicationId: 'app-hist2',
    propertyId: 'prop-004',
    propertyName: 'Cedar Heights',
    tenantName: 'Lisa Park',
    tenantEmail: 'lisa.park@email.com',
    monthlyRent: 950,
    deposit: 950,
    startDate: '2025-09-01',
    endDate: '2026-08-31',
    termMonths: 12,
    status: 'active',
    createdAt: '2025-08-20T14:30:00Z',
  },
];

export const existingPayments: Payment[] = [
  { id: 'pay-001', leaseId: 'lease-001', amount: 2100, date: '2025-06-01', type: 'deposit', status: 'paid' },
  { id: 'pay-002', leaseId: 'lease-001', amount: 2100, date: '2025-07-01', type: 'rent', status: 'paid' },
  { id: 'pay-003', leaseId: 'lease-001', amount: 2100, date: '2025-08-01', type: 'rent', status: 'paid' },
  { id: 'pay-004', leaseId: 'lease-001', amount: 2100, date: '2025-09-01', type: 'rent', status: 'paid' },
  { id: 'pay-005', leaseId: 'lease-001', amount: 2100, date: '2025-10-01', type: 'rent', status: 'paid' },
  { id: 'pay-006', leaseId: 'lease-001', amount: 2100, date: '2025-11-01', type: 'rent', status: 'paid' },
  { id: 'pay-007', leaseId: 'lease-001', amount: 2100, date: '2025-12-01', type: 'rent', status: 'paid' },
  { id: 'pay-008', leaseId: 'lease-001', amount: 2100, date: '2026-01-01', type: 'rent', status: 'paid' },
  { id: 'pay-009', leaseId: 'lease-001', amount: 2100, date: '2026-02-01', type: 'rent', status: 'paid' },
  { id: 'pay-010', leaseId: 'lease-001', amount: 2100, date: '2026-03-01', type: 'rent', status: 'paid' },
  { id: 'pay-011', leaseId: 'lease-002', amount: 950, date: '2025-09-01', type: 'deposit', status: 'paid' },
  { id: 'pay-012', leaseId: 'lease-002', amount: 950, date: '2025-10-01', type: 'rent', status: 'paid' },
  { id: 'pay-013', leaseId: 'lease-002', amount: 950, date: '2025-11-01', type: 'rent', status: 'paid' },
  { id: 'pay-014', leaseId: 'lease-002', amount: 950, date: '2025-12-01', type: 'rent', status: 'paid' },
  { id: 'pay-015', leaseId: 'lease-002', amount: 950, date: '2026-01-01', type: 'rent', status: 'paid' },
  { id: 'pay-016', leaseId: 'lease-002', amount: 950, date: '2026-02-01', type: 'rent', status: 'paid' },
  { id: 'pay-017', leaseId: 'lease-002', amount: 950, date: '2026-03-01', type: 'rent', status: 'overdue' },
];

export function getPortfolioSummary() {
  const totalUnits = properties.length;
  const occupiedUnits = existingLeases.filter(l => l.status === 'active').length;
  const vacantUnits = totalUnits - occupiedUnits;
  const monthlyRevenue = existingLeases
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + l.monthlyRent, 0);
  const totalCollected = existingPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = existingPayments.filter(p => p.status === 'overdue');

  return {
    totalUnits,
    occupiedUnits,
    vacantUnits,
    occupancyRate: `${Math.round((occupiedUnits / totalUnits) * 100)}%`,
    monthlyRevenue,
    totalCollected,
    overdueCount: overduePayments.length,
    overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
    activeLeases: existingLeases.filter(l => l.status === 'active'),
  };
}
