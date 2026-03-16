import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { resolveProperty } from '../../../utils/property.util';
import { generateId } from '../../../utils/id.util';
import { Application } from '../../../types/lease.types';

export class ApplyForPropertyTool implements LuaTool {
  name = 'apply_for_property';
  description = 'Submit a rental application for a property. Collects tenant financial and background info, creates the application, and returns an applicationId. IMPORTANT: After this tool returns, IMMEDIATELY call process_application with the returned applicationId.';

  inputSchema = z.object({
    propertyId: z.string().describe('Property ID or name (e.g., "prop-001" or "Sunrise Loft")'),
    tenantName: z.string().describe('Full legal name'),
    tenantEmail: z.string().describe('Email address'),
    monthlyIncome: z.number().describe('Gross monthly income in dollars'),
    employmentStatus: z.enum(['full-time', 'part-time', 'freelance', 'unemployed']).describe('Current employment status'),
    creditScore: z.number().describe('Credit score (300-850)'),
    rentalHistoryYears: z.number().optional().describe('Years of rental history. Default: 0'),
    negativeRemarks: z.number().optional().describe('Number of negative marks on rental history. Default: 0'),
    hasPets: z.boolean().optional().describe('Whether applicant has pets. Default: false'),
    petType: z.string().optional().describe('Type of pet if applicable (e.g., "dog", "cat")'),
    desiredMoveIn: z.string().optional().describe('Desired move-in date in YYYY-MM-DD format'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const property = resolveProperty(input.propertyId);
      if (!property) {
        return { success: false, error: `Property "${input.propertyId}" not found. Use search_properties to find available listings.` };
      }

      if (!property.available) {
        return { success: false, error: `${property.name} is no longer available for applications.` };
      }

      if (input.hasPets && !property.petFriendly) {
        return {
          success: false,
          error: `${property.name} does not allow pets. Consider looking at our pet-friendly properties.`,
        };
      }

      if (input.monthlyIncome <= 0) {
        return { success: false, error: 'Monthly income must be a positive number.' };
      }

      if (input.creditScore < 300 || input.creditScore > 850) {
        return { success: false, error: 'Credit score must be between 300 and 850.' };
      }

      // U1: Check for duplicate applications (same email + property with pending/approved status)
      try {
        const existingApps = await Data.get('applications', { tenantEmail: input.tenantEmail });
        const duplicate = existingApps.data?.find((r: any) => {
          const app = r.data;
          return (
            app?.tenantEmail?.toLowerCase() === input.tenantEmail.toLowerCase() &&
            app?.propertyId === property.id &&
            (app?.status === 'pending' || app?.status === 'approved' || app?.status === 'under-review')
          );
        });

        if (duplicate) {
          const existingApp = duplicate.data;
          return {
            success: false,
            error: `You already have an active application (${existingApp.id}) for ${property.name} with status "${existingApp.status}". Use get_application_status to check its progress.`,
          };
        }
      } catch {
        // Data store may be empty on first application — continue
      }

      const applicationId = generateId('APP');
      const application: Application = {
        id: applicationId,
        propertyId: property.id,
        tenantName: input.tenantName,
        tenantEmail: input.tenantEmail,
        monthlyIncome: input.monthlyIncome,
        employmentStatus: input.employmentStatus,
        creditScore: input.creditScore,
        rentalHistoryYears: input.rentalHistoryYears ?? 0,
        negativeRemarks: input.negativeRemarks ?? 0,
        hasPets: input.hasPets ?? false,
        petType: input.petType,
        desiredMoveIn: input.desiredMoveIn,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Write to Data store — this bridges to the lease management skill
      await Data.create('applications', {
        ...application,
        propertyName: property.name,
        propertyRent: property.rent,
      });

      return {
        success: true,
        message: `Application ${applicationId} submitted successfully for ${property.name}!`,
        applicationId,
        property: {
          name: property.name,
          rent: property.rent,
          address: property.address,
        },
        applicant: {
          name: input.tenantName,
          income: input.monthlyIncome,
          creditScore: input.creditScore,
          employmentStatus: input.employmentStatus,
        },
        nextStep: `Application is pending review. IMMEDIATELY call process_application with applicationId "${applicationId}" to score and process this application.`,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
