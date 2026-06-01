import { LuaTool, Data } from 'lua-cli';
import { z } from 'zod';
import { properties } from '../../../data/properties.data';
import { getPortfolioSummary } from '../../../data/leases.data';
import { formatCurrency } from '../../../utils/date.util';

export class GetPortfolioTool implements LuaTool {
  name = 'get_portfolio';
  description = 'Get a portfolio overview of all properties, occupancy rates, revenue, and vacancies.';

  inputSchema = z.object({
    includeFinancials: z.boolean().optional().describe('Include financial details (revenue, collections, overdue). Default: false'),
    includeVacancies: z.boolean().optional().describe('Include list of vacant properties. Default: false'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const summary = getPortfolioSummary();

      // U3: Also query Data store for dynamically created leases
      let dynamicLeases: any[] = [];
      try {
        const leaseResults = await Data.get('leases', {});
        dynamicLeases = (leaseResults.data || [])
          .map((r: any) => r.data)
          .filter((l: any) => l && (l.status === 'active' || l.status === 'pending-signature'));
      } catch {
        // Data store may be empty
      }

      // Deduplicate by id (static takes precedence)
      const staticIds = new Set(summary.activeLeases.map(l => l.id));
      const newDynamicLeases = dynamicLeases.filter((l: any) => !staticIds.has(l.id));

      const totalOccupied = summary.occupiedUnits + newDynamicLeases.length;
      const totalVacant = summary.totalUnits - totalOccupied;
      const dynamicRevenue = newDynamicLeases.reduce((sum: number, l: any) => sum + (l.monthlyRent || 0), 0);

      const result: any = {
        success: true,
        portfolio: {
          totalUnits: summary.totalUnits,
          occupiedUnits: totalOccupied,
          vacantUnits: Math.max(0, totalVacant),
          occupancyRate: `${Math.round((totalOccupied / summary.totalUnits) * 100)}%`,
        },
      };

      if (input.includeFinancials) {
        const totalMonthlyRevenue = summary.monthlyRevenue + dynamicRevenue;
        result.financials = {
          monthlyRevenue: formatCurrency(totalMonthlyRevenue),
          totalCollected: formatCurrency(summary.totalCollected),
          overduePayments: summary.overdueCount,
          overdueAmount: formatCurrency(summary.overdueAmount),
          annualProjectedRevenue: formatCurrency(totalMonthlyRevenue * 12),
        };
      }

      if (input.includeVacancies) {
        const vacantProperties = properties.filter(p => p.available);
        result.vacancies = vacantProperties.map(p => ({
          id: p.id,
          name: p.name,
          neighborhood: p.neighborhood,
          bedrooms: p.bedrooms,
          rent: formatCurrency(p.rent) + '/mo',
          availableDate: p.availableDate,
        }));
      }

      const allActiveLeases = [
        ...summary.activeLeases.map(l => ({
          leaseId: l.id,
          property: l.propertyName,
          tenant: l.tenantName,
          rent: formatCurrency(l.monthlyRent) + '/mo',
          endDate: l.endDate,
        })),
        ...newDynamicLeases.map((l: any) => ({
          leaseId: l.id,
          property: l.propertyName,
          tenant: l.tenantName,
          rent: formatCurrency(l.monthlyRent) + '/mo',
          endDate: l.endDate,
        })),
      ];

      result.activeLeases = allActiveLeases;

      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
