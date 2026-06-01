export type Amenity =
  | 'parking'
  | 'gym'
  | 'pool'
  | 'laundry'
  | 'doorman'
  | 'rooftop'
  | 'pet-friendly'
  | 'balcony'
  | 'dishwasher'
  | 'central-ac'
  | 'hardwood-floors'
  | 'storage';

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  neighborhood: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  rent: number;
  deposit: number;
  available: boolean;
  availableDate: string;
  petFriendly: boolean;
  petDeposit?: number;
  amenities: Amenity[];
  description: string;
  yearBuilt: number;
  unitType: 'apartment' | 'loft' | 'townhouse' | 'studio';
}

export interface PropertyFilter {
  city?: string;
  neighborhood?: string;
  minBedrooms?: number;
  maxRent?: number;
  petFriendly?: boolean;
  unitType?: string;
}
