import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { scoreApplication, getDecision } from '../../../utils/scoring.util';

export class ProcessApplicationTool implements LuaTool {
  name = 'process_application';
  description = 'Process and score a rental application. Reads from Data store, runs multi-factor scoring engine, and updates application status. IMPORTANT: If approved (score >= 75), IMMEDIATELY call create_lease with the applicationId.';

  inputSchema = z.object({
    applicationId: z.string().describe('Application ID returned by apply_for_property (e.g., "APP-7x3k")'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      // Read application from Data store
      const results = await Data.get('applications', { id: input.applicationId });
      const record = results.data?.find((r: any) => r.data?.id === input.applicationId);

      if (!record) {
        return {
          success: false,
          error: `Application ${input.applicationId} not found. It may not have been submitted yet.`,
        };
      }

      const app = record.data;

      if (app.status !== 'pending') {
        return {
          success: false,
          error: `Application ${input.applicationId} has already been processed (status: ${app.status}).`,
        };
      }

      // Run scoring engine
      const breakdown = scoreApplication(
        app.creditScore,
        app.monthlyIncome,
        app.propertyRent,
        app.rentalHistoryYears,
        app.negativeRemarks,
        app.employmentStatus
      );

      const decision = getDecision(breakdown.total);

      // Update application in Data store
      await Data.update('applications', record.id, {
        ...app,
        status: decision,
        score: breakdown.total,
        scoreBreakdown: breakdown,
        processedAt: new Date().toISOString(),
      });

      const decisionMessages: Record<string, string> = {
        'approved': `APPROVED! Score ${breakdown.total}/100 meets the 75-point threshold. The applicant qualifies for ${app.propertyName}. IMMEDIATELY call create_lease with applicationId "${input.applicationId}" to generate the lease.`,
        'under-review': `UNDER REVIEW. Score ${breakdown.total}/100 falls in the 50-74 review range. A property manager will review this application manually within 1-2 business days.`,
        'rejected': `REJECTED. Score ${breakdown.total}/100 is below the 50-point minimum threshold. The applicant does not currently qualify.`,
      };

      // Build improvement suggestions for non-approved applications
      const improvements: string[] = [];
      if (decision !== 'approved') {
        if (breakdown.credit < 28) {
          const pointGap = 35 - breakdown.credit;
          improvements.push(`Credit score: Currently ${app.creditScore}. A score of 720+ would earn ${pointGap} more points (reaching 35/35).`);
        }
        if (breakdown.incomeRatio < 22) {
          const neededIncome = app.propertyRent * 2.5;
          improvements.push(`Income ratio: A monthly income of at least $${neededIncome.toLocaleString()} (2.5x rent) would improve this category.`);
        }
        if (breakdown.rentalHistory < 15) {
          improvements.push('Rental history: Providing verified references from previous landlords can strengthen this area.');
        }
        if (breakdown.employment < 15) {
          improvements.push('Employment: Full-time employment verification earns the maximum 15 points in this category.');
        }
        if (decision === 'rejected') {
          improvements.push('Alternative: Consider applying with a co-signer or looking at properties with lower rent to improve the income ratio.');
        }
      }

      return {
        success: true,
        applicationId: input.applicationId,
        applicant: app.tenantName,
        property: app.propertyName,
        decision,
        score: breakdown.total,
        scoreBreakdown: {
          creditScore: `${breakdown.credit}/35 (credit score: ${app.creditScore}; thresholds: 780+=35, 720+=28, 680+=20, below=10)`,
          incomeRatio: `${breakdown.incomeRatio}/30 (income $${app.monthlyIncome}/mo vs rent $${app.propertyRent}/mo = ${(app.monthlyIncome / app.propertyRent).toFixed(1)}x ratio; thresholds: 3x+=30, 2.5x+=22, 2x+=15, below=5)`,
          rentalHistory: `${breakdown.rentalHistory}/20 (${app.rentalHistoryYears} years x5 pts capped at 20, minus ${app.negativeRemarks} negative remarks x5 pts)`,
          employment: `${breakdown.employment}/15 (${app.employmentStatus}; full-time=15, part-time=10, freelance=8)`,
          total: `${breakdown.total}/100`,
        },
        message: decisionMessages[decision],
        improvements: improvements.length > 0 ? improvements : undefined,
        nextStep: decision === 'approved'
          ? `Call create_lease with applicationId "${input.applicationId}" to generate the lease agreement.`
          : undefined,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
