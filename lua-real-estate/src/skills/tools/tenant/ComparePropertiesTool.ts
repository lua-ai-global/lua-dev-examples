import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { resolveProperty } from '../../../utils/property.util';
import { formatCurrency } from '../../../utils/date.util';

export class ComparePropertiesTool implements LuaTool {
  name = 'compare_properties';
  description = 'Compare 2-4 properties side-by-side on key metrics: rent, size, bedrooms, amenities, pet policy, and availability. Accepts property IDs or property names.';

  inputSchema = z.object({
    propertyIds: z.array(z.string()).min(2).max(4).describe('Array of 2-4 property IDs or names to compare (e.g., ["prop-001", "Parkside Commons"])'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const properties = input.propertyIds.map(idOrName => {
        const p = resolveProperty(idOrName);
        if (!p) return { id: idOrName, error: `Property "${idOrName}" not found` };
        return {
          id: p.id,
          name: p.name,
          neighborhood: p.neighborhood,
          unitType: p.unitType,
          bedrooms: p.bedrooms,
          bathrooms: p.bathrooms,
          sqft: p.sqft,
          rent: formatCurrency(p.rent) + '/mo',
          rentPerSqft: `${(p.rent / p.sqft).toFixed(2)}/sqft`,
          deposit: formatCurrency(p.deposit),
          petFriendly: p.petFriendly ? `Yes (${formatCurrency(p.petDeposit || 0)} deposit)` : 'No',
          amenities: p.amenities,
          availableDate: p.availableDate,
          yearBuilt: p.yearBuilt,
          description: p.description,
        };
      });

      const valid = properties.filter((p: any) => !p.error);
      const notFound = properties.filter((p: any) => p.error);

      // Find best values for highlighting
      const rents = valid.map((p: any) => parseInt(p.rent.replace(/[$,/mo]/g, '')));
      const sizes = valid.map((p: any) => p.sqft);

      return {
        success: true,
        comparison: properties,
        highlights: valid.length >= 2 ? {
          lowestRent: valid[rents.indexOf(Math.min(...rents))]?.name,
          largestUnit: valid[sizes.indexOf(Math.max(...sizes))]?.name,
          mostAmenities: valid.reduce((a: any, b: any) => a.amenities.length > b.amenities.length ? a : b)?.name,
        } : undefined,
        notFound: notFound.length > 0 ? notFound : undefined,
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
