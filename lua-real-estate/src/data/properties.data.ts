import { Property } from '../types/property.types';

export const properties: Property[] = [
  {
    id: 'prop-001',
    name: 'Sunrise Loft',
    address: '142 Elm Street, Unit 3A',
    city: 'Maplewood',
    neighborhood: 'Downtown',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    rent: 1450,
    deposit: 1450,
    available: true,
    availableDate: '2026-04-01',
    petFriendly: false,
    amenities: ['laundry', 'hardwood-floors', 'central-ac', 'rooftop'],
    description: 'Sun-drenched corner loft with 12-foot ceilings, exposed brick walls, and skyline views from the shared rooftop deck. Walking distance to cafes and transit.',
    yearBuilt: 2018,
    unitType: 'loft',
  },
  {
    id: 'prop-002',
    name: 'Oakwood Terrace',
    address: '85 Oakwood Avenue, Unit 7B',
    city: 'Maplewood',
    neighborhood: 'Riverside',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 1050,
    rent: 2100,
    deposit: 2100,
    available: true,
    availableDate: '2026-04-15',
    petFriendly: true,
    petDeposit: 500,
    amenities: ['parking', 'laundry', 'balcony', 'dishwasher', 'pet-friendly', 'storage'],
    description: 'Spacious 2-bedroom with a private balcony overlooking the river. In-unit washer/dryer, reserved parking spot, and a large storage unit included.',
    yearBuilt: 2015,
    unitType: 'apartment',
  },
  {
    id: 'prop-003',
    name: 'The Riverview',
    address: '200 Waterfront Drive, Unit 12C',
    city: 'Maplewood',
    neighborhood: 'Riverside',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1600,
    rent: 3200,
    deposit: 3200,
    available: true,
    availableDate: '2026-05-01',
    petFriendly: true,
    petDeposit: 750,
    amenities: ['parking', 'gym', 'pool', 'doorman', 'balcony', 'dishwasher', 'central-ac', 'pet-friendly'],
    description: 'Premium 3-bedroom corner unit with panoramic river views, floor-to-ceiling windows, chef\'s kitchen with quartz counters, and access to full-service amenities including pool, gym, and 24/7 doorman.',
    yearBuilt: 2022,
    unitType: 'apartment',
  },
  {
    id: 'prop-004',
    name: 'Cedar Heights',
    address: '31 Cedar Lane, Unit 1A',
    city: 'Maplewood',
    neighborhood: 'Hilltop',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 580,
    rent: 950,
    deposit: 950,
    available: true,
    availableDate: '2026-03-15',
    petFriendly: false,
    amenities: ['laundry', 'hardwood-floors'],
    description: 'Cozy and affordable 1-bedroom in a quiet residential neighborhood. Recently renovated with new hardwood floors, updated kitchen, and shared laundry in the basement.',
    yearBuilt: 1998,
    unitType: 'apartment',
  },
  {
    id: 'prop-005',
    name: 'Parkside Commons',
    address: '450 Park Boulevard, Unit 5D',
    city: 'Maplewood',
    neighborhood: 'Greenway',
    bedrooms: 2,
    bathrooms: 1,
    sqft: 920,
    rent: 1750,
    deposit: 1750,
    available: true,
    availableDate: '2026-04-01',
    petFriendly: true,
    petDeposit: 400,
    amenities: ['parking', 'laundry', 'pet-friendly', 'dishwasher', 'balcony', 'storage'],
    description: 'Bright 2-bedroom across from Maplewood Park. Open floor plan, in-unit laundry, private balcony, and one parking spot. Pet-friendly with a dog run nearby.',
    yearBuilt: 2019,
    unitType: 'apartment',
  },
  {
    id: 'prop-006',
    name: 'Industrial Loft 7B',
    address: '77 Factory Row, Unit 7B',
    city: 'Maplewood',
    neighborhood: 'Arts District',
    bedrooms: 1,
    bathrooms: 1,
    sqft: 850,
    rent: 1600,
    deposit: 1600,
    available: true,
    availableDate: '2026-04-01',
    petFriendly: true,
    petDeposit: 350,
    amenities: ['laundry', 'hardwood-floors', 'central-ac', 'pet-friendly', 'rooftop', 'gym'],
    description: 'Converted warehouse loft with soaring 14-foot ceilings, original timber beams, polished concrete floors, and oversized factory windows. Rooftop lounge and co-working space on-site.',
    yearBuilt: 2020,
    unitType: 'loft',
  },
];

export function findProperty(id: string): Property | undefined {
  return properties.find(p => p.id === id);
}

export function filterProperties(filter: {
  city?: string;
  neighborhood?: string;
  minBedrooms?: number;
  maxRent?: number;
  petFriendly?: boolean;
  unitType?: string;
}): Property[] {
  return properties.filter(p => {
    if (!p.available) return false;
    if (filter.city && p.city.toLowerCase() !== filter.city.toLowerCase()) return false;
    if (filter.neighborhood && p.neighborhood.toLowerCase() !== filter.neighborhood.toLowerCase()) return false;
    if (filter.minBedrooms && p.bedrooms < filter.minBedrooms) return false;
    if (filter.maxRent && p.rent > filter.maxRent) return false;
    if (filter.petFriendly && !p.petFriendly) return false;
    if (filter.unitType && p.unitType !== filter.unitType) return false;
    return true;
  });
}
