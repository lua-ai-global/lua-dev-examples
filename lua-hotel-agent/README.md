# Hotel Booking Agent

> Reservation management with Lua Data API

## Overview

Hotel concierge AI agent for room bookings, reservations, and guest services using **Lua Data API**.

**What it does:**

* Check room availability
* Create reservations
* Modify bookings
* Request room service
* Provide local recommendations

**APIs used:** Lua Data API for reservations and rooms

## Complete Implementation

### src/index.ts

```typescript
import { LuaAgent, LuaSkill } from "lua-cli";
import {
  CheckAvailabilityTool,
  CreateReservationTool,
  GetReservationTool,
  CancelReservationTool,
  RoomServiceTool
} from "./tools/HotelTool";

// Hotel concierge skill
const hotelSkill = new LuaSkill({
  name: "hotel-concierge",
  description: "Hotel booking and concierge services",
  context: `
    This skill helps guests with hotel bookings and services.
    
    - check_availability: Search for available rooms by date and guest count
    - create_reservation: Book a room for specified dates
    - get_reservation: Look up existing reservation details
    - cancel_reservation: Cancel a booking
    - room_service: Order room service or request amenities
    
    Always confirm dates and guest count before booking.
    Offer upgrade suggestions when available.
    Be warm and hospitable.
  `,
  tools: [
    new CheckAvailabilityTool(),
    new CreateReservationTool(),
    new GetReservationTool(),
    new CancelReservationTool(),
    new RoomServiceTool()
  ]
});

// Configure agent (v3.0.0)
export const agent = new LuaAgent({
  name: "hotel-concierge-assistant",
  
  persona: `You are a friendly and professional hotel concierge.
  
Your role:
- Help guests find and book the perfect room
- Assist with reservations and modifications
- Provide room service and amenity requests
- Offer local recommendations and directions
- Ensure excellent guest experience

Communication style:
- Warm and hospitable
- Professional and attentive
- Proactive with suggestions
- Detail-oriented
- Service-minded

Best practices:
- Always confirm check-in and check-out dates
- Mention amenities included with each room type
- Offer upgrades when available
- Ask about special occasions (anniversary, birthday)
- Provide clear cancellation policies
- Suggest local attractions and dining

When to escalate:
- VIP guest requests
- Complex group bookings
- Special event coordination
- Maintenance issues`,
  
  skills: [hotelSkill]
});
```

> **Note:** This demo now uses the **v3.0.0 pattern** with `LuaAgent` to configure the agent's persona, welcome message, and skills.

### src/tools/HotelTool.ts

The implementation includes all 5 tools for complete hotel management. See the full source code for details.

## Testing

```bash
# Test individual tools
lua test

# Test conversation flow
lua chat
```

**Test conversation flow:**

```
User: "I need a room for 2 people from December 1st to 3rd"
AI: [Calls check_availability]
    "I found 3 available rooms for 2 nights..."

User: "Book the deluxe suite"
AI: [Calls create_reservation]
    "Reservation confirmed! Your confirmation code is HTL-ABC123..."

User: "Can I get some towels sent to my room?"
AI: [Calls room_service]
    "Room service request received. Estimated delivery: 15-30 minutes."

User: "Check my reservation HTL-ABC123, email john@example.com"
AI: [Calls get_reservation]
    "Here are your reservation details..."
```

## Deployment

```bash
lua push
lua deploy
```

## Key Features

### Lua Data API
Stores rooms and reservations

### Date Logic
Availability checking with conflict detection

### Confirmation Codes
Unique booking identifiers

### Room Service
Order amenities and services

### Guest Management
Complete reservation lifecycle

## Data Structure

### Hotel Rooms Collection
```typescript
{
  type: 'deluxe' | 'suite' | 'standard',
  maxGuests: number,
  pricePerNight: number,
  amenities: string[],
  description: string
}
```

### Reservations Collection
```typescript
{
  roomId: string,
  roomType: string,
  checkIn: string,
  checkOut: string,
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  numberOfGuests: number,
  nights: number,
  pricePerNight: number,
  totalPrice: number,
  specialRequests?: string,
  status: 'confirmed' | 'cancelled',
  confirmationCode: string,
  createdAt: string
}
```

### Room Service Requests Collection
```typescript
{
  confirmationCode: string,
  request: string,
  status: 'pending' | 'completed',
  requestedAt: string
}
```

## Seeding Sample Data

```typescript
// src/seed.ts
import { Data } from "lua-cli";

async function seedHotelData() {
  // Seed rooms
  await Data.create('hotel_rooms', {
    type: 'deluxe',
    maxGuests: 2,
    pricePerNight: 299,
    amenities: ['King bed', 'City view', 'WiFi', 'Mini bar'],
    description: 'Luxurious deluxe room with stunning city views'
  }, 'deluxe king bed city view luxury');

  await Data.create('hotel_rooms', {
    type: 'suite',
    maxGuests: 4,
    pricePerNight: 499,
    amenities: ['2 bedrooms', 'Living room', 'Kitchenette', 'Balcony'],
    description: 'Spacious suite perfect for families'
  }, 'suite family bedrooms living room spacious');

  await Data.create('hotel_rooms', {
    type: 'standard',
    maxGuests: 2,
    pricePerNight: 149,
    amenities: ['Queen bed', 'WiFi', 'Coffee maker'],
    description: 'Comfortable standard room'
  }, 'standard queen bed comfortable budget');

  console.log('✅ Hotel rooms seeded');
}

seedHotelData().catch(console.error);
```

Run with:
```bash
npx tsx src/seed.ts
```

## Customization

### Add Room Ratings
```typescript
export class RateStayTool implements LuaTool {
  name = "rate_stay";
  description = "Rate your hotel stay";
  
  inputSchema = z.object({
    confirmationCode: z.string(),
    rating: z.number().min(1).max(5),
    review: z.string().optional()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    await Data.create('reviews', {
      confirmationCode: input.confirmationCode,
      rating: input.rating,
      review: input.review,
      createdAt: new Date().toISOString()
    }, input.review || '');
    
    return {
      success: true,
      message: "Thank you for your feedback!"
    };
  }
}
```

### Add Pricing Tiers
```typescript
private calculateDynamicPrice(roomType: string, checkIn: string): number {
  const basePrice = this.getRoomBasePrice(roomType);
  const date = new Date(checkIn);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isHoliday = this.isHolidayPeriod(date);
  
  let multiplier = 1;
  if (isWeekend) multiplier += 0.2;
  if (isHoliday) multiplier += 0.3;
  
  return basePrice * multiplier;
}
```

### Add Loyalty Program
```typescript
export class GetLoyaltyPointsTool implements LuaTool {
  name = "get_loyalty_points";
  description = "Check loyalty program points";
  
  inputSchema = z.object({
    email: z.string().email()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Data.search('loyalty_members', input.email, 1);
    
    if (results.length === 0) {
      return {
        member: false,
        message: "Not a loyalty member. Would you like to join?"
      };
    }
    
    const member = results[0];
    return {
      member: true,
      points: member.points,
      tier: member.tier,
      benefits: member.benefits
    };
  }
}
```

## Project Structure

```
lua-hotel-agent/
├── src/
│   ├── index.ts              # Main skill definition
│   ├── seed.ts               # Seed sample rooms
│   └── tools/
│       └── HotelTool.ts      # All 5 hotel tools
├── lua.skill.yaml            # Configuration
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## How It Works

1. **Availability Check**: Queries rooms and existing reservations to find conflicts
2. **Booking Creation**: Generates confirmation codes and stores reservation
3. **Reservation Lookup**: Uses vector search to find by confirmation code or email
4. **Cancellation**: Updates reservation status and processes refunds
5. **Room Service**: Logs requests for hotel staff

## Documentation

For complete API reference and guides, visit [Lua Documentation](https://docs.heylua.ai/)
