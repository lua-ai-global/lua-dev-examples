import { LuaTool, Data } from "lua-cli";
import { z } from "zod";

// 1. Check Availability
export class CheckAvailabilityTool implements LuaTool {
  name = "check_availability";
  description = "Check room availability for specific dates";
  
  inputSchema = z.object({
    checkIn: z.string().describe("Check-in date (YYYY-MM-DD)"),
    checkOut: z.string().describe("Check-out date (YYYY-MM-DD)"),
    guests: z.number().min(1).max(10).describe("Number of guests")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Get all rooms
    const rooms = await Data.get('hotel_rooms', {}, 1, 100);
    
    // Get existing reservations for these dates
    const reservations = await Data.get('reservations', {
      checkIn: { $lte: input.checkOut },
      checkOut: { $gte: input.checkIn },
      status: { $ne: 'cancelled' }
    });
    
    const bookedRoomIds = new Set(reservations.data.map(r => r.data.roomId));
    
    // Filter available rooms
    const available = rooms.data
      .filter(room => !bookedRoomIds.has(room.id))
      .filter(room => room.data.maxGuests >= input.guests)
      .map(room => ({
        roomId: room.id,
        roomType: room.data.type,
        maxGuests: room.data.maxGuests,
        pricePerNight: `$${room.data.pricePerNight}`,
        amenities: room.data.amenities,
        description: room.data.description
      }));
    
    const nights = this.calculateNights(input.checkIn, input.checkOut);
    
    return {
      available: available.length > 0,
      rooms: available,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights,
      message: available.length > 0
        ? `${available.length} rooms available for ${nights} nights`
        : "No rooms available for these dates. Try different dates?"
    };
  }
  
  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// 2. Create Reservation
export class CreateReservationTool implements LuaTool {
  name = "create_reservation";
  description = "Book a hotel room";
  
  inputSchema = z.object({
    roomId: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    guestName: z.string(),
    guestEmail: z.string().email(),
    guestPhone: z.string(),
    guests: z.number().min(1),
    specialRequests: z.string().optional()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Get room details
    const room = await Data.getEntry('hotel_rooms', input.roomId);
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    // Calculate total
    const nights = this.calculateNights(input.checkIn, input.checkOut);
    const totalPrice = room.data.pricePerNight * nights;
    
    // Create reservation
    const reservation = await Data.create('reservations', {
      roomId: input.roomId,
      roomType: room.data.type,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      numberOfGuests: input.guests,
      nights,
      pricePerNight: room.data.pricePerNight,
      totalPrice,
      specialRequests: input.specialRequests,
      status: 'confirmed',
      confirmationCode: this.generateConfirmationCode(),
      createdAt: new Date().toISOString()
    }, `${input.guestName} ${input.guestEmail} ${input.checkIn}`);
    
    return {
      success: true,
      reservationId: reservation.id,
      confirmationCode: reservation.data.confirmationCode,
      roomType: room.data.type,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights,
      total: `$${totalPrice.toFixed(2)}`,
      message: `Reservation confirmed! Your confirmation code is ${reservation.data.confirmationCode}`
    };
  }
  
  private calculateNights(checkIn: string, checkOut: string): number {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
  
  private generateConfirmationCode(): string {
    return 'HTL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }
}

// 3. Get Reservation
export class GetReservationTool implements LuaTool {
  name = "get_reservation";
  description = "Look up reservation details";
  
  inputSchema = z.object({
    confirmationCode: z.string().describe("Reservation confirmation code"),
    email: z.string().email().describe("Guest email for verification")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Search reservations
    const results = await Data.get('reservations', {
      confirmationCode: input.confirmationCode,
      guestEmail: input.email
    });
    
    if (results.data.length === 0) {
      throw new Error('Reservation not found. Please check your confirmation code and email.');
    }
    
    const reservation = results.data[0];
    
    return {
      reservationId: reservation.id,
      confirmationCode: reservation.data.confirmationCode,
      guestName: reservation.data.guestName,
      roomType: reservation.data.roomType,
      checkIn: reservation.data.checkIn,
      checkOut: reservation.data.checkOut,
      nights: reservation.data.nights,
      guests: reservation.data.numberOfGuests,
      total: `$${reservation.data.totalPrice.toFixed(2)}`,
      status: reservation.data.status,
      specialRequests: reservation.data.specialRequests
    };
  }
}

// 4. Cancel Reservation
export class CancelReservationTool implements LuaTool {
  name = "cancel_reservation";
  description = "Cancel a hotel reservation";
  
  inputSchema = z.object({
    confirmationCode: z.string(),
    email: z.string().email()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const results = await Data.get('reservations', {
      confirmationCode: input.confirmationCode,
      guestEmail: input.email
    });
    
    if (results.data.length === 0) {
      throw new Error('Reservation not found');
    }
    
    const reservation = results.data[0];
    
    // Update status to cancelled
    await Data.update('reservations', reservation.id, {
      ...reservation.data,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });
    
    return {
      success: true,
      confirmationCode: input.confirmationCode,
      refundAmount: `$${reservation.data.totalPrice.toFixed(2)}`,
      message: "Reservation cancelled. Refund will be processed within 5-7 business days."
    };
  }
}

// 5. Room Service
export class RoomServiceTool implements LuaTool {
  name = "room_service";
  description = "Order room service or request amenities";
  
  inputSchema = z.object({
    confirmationCode: z.string(),
    request: z.string().describe("Room service order or amenity request")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Log room service request
    const request = await Data.create('room_service_requests', {
      confirmationCode: input.confirmationCode,
      request: input.request,
      status: 'pending',
      requestedAt: new Date().toISOString()
    }, input.request);
    
    return {
      success: true,
      requestId: request.id,
      estimatedTime: "15-30 minutes",
      message: `Room service request received. Estimated delivery: 15-30 minutes.`
    };
  }
}