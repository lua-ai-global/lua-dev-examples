import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { filterProperties } from '../../../data/properties.data';
import { formatCurrency } from '../../../utils/date.util';

export class SearchPropertiesTool implements LuaTool {
  name = 'search_properties';
  description = 'Search available rental properties by location, bedrooms, price range, pet policy, and unit type. Returns matching listings with full details.';

  inputSchema = z.object({
    city: z.string().optional().describe('City name to filter by (e.g., "Maplewood")'),
    neighborhood: z.string().optional().describe('Neighborhood name (e.g., "Downtown", "Riverside", "Hilltop", "Greenway", "Arts District")'),
    minBedrooms: z.number().optional().describe('Minimum number of bedrooms'),
    maxRent: z.number().optional().describe('Maximum monthly rent in dollars'),
    petFriendly: z.boolean().optional().describe('Only show pet-friendly properties'),
    unitType: z.string().optional().describe('Type: "apartment", "loft", "townhouse", or "studio"'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const results = filterProperties(input);

      if (results.length === 0) {
        return {
          success: true,
          count: 0,
          message: 'No properties match your criteria. Try broadening your search — adjust the price range, bedroom count, or remove the pet filter.',
          properties: [],
        };
      }

      const listings = results.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        neighborhood: p.neighborhood,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        sqft: p.sqft,
        rent: formatCurrency(p.rent) + '/mo',
        deposit: formatCurrency(p.deposit),
        petFriendly: p.petFriendly,
        petDeposit: p.petDeposit ? formatCurrency(p.petDeposit) : undefined,
        availableDate: p.availableDate,
        amenities: p.amenities,
        description: p.description,
        unitType: p.unitType,
      }));

      return {
        success: true,
        count: results.length,
        message: `Found ${results.length} matching ${results.length === 1 ? 'property' : 'properties'}.`,
        properties: listings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
