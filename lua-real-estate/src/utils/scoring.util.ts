import { ScoreBreakdown } from '../types/lease.types';

export function scoreApplication(
  creditScore: number,
  monthlyIncome: number,
  monthlyRent: number,
  rentalHistoryYears: number,
  negativeRemarks: number,
  employmentStatus: string
): ScoreBreakdown {
  // Credit score (0-35)
  let credit = 10;
  if (creditScore >= 780) credit = 35;
  else if (creditScore >= 720) credit = 28;
  else if (creditScore >= 680) credit = 20;

  // Income ratio (0-30)
  const ratio = monthlyIncome / monthlyRent;
  let incomeRatio = 5;
  if (ratio >= 3) incomeRatio = 30;
  else if (ratio >= 2.5) incomeRatio = 22;
  else if (ratio >= 2) incomeRatio = 15;

  // Rental history (0-20)
  let rentalHistory = Math.min(rentalHistoryYears * 5, 20);
  rentalHistory = Math.max(rentalHistory - (negativeRemarks * 5), 0);

  // Employment (0-15)
  let employment = 0;
  if (employmentStatus === 'full-time') employment = 15;
  else if (employmentStatus === 'part-time') employment = 10;
  else if (employmentStatus === 'freelance') employment = 8;

  const total = credit + incomeRatio + rentalHistory + employment;

  return { credit, incomeRatio, rentalHistory, employment, total };
}

export function getDecision(score: number): 'approved' | 'under-review' | 'rejected' {
  if (score >= 75) return 'approved';
  if (score >= 50) return 'under-review';
  return 'rejected';
}
