import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: itineraryId } = await params;
  const { companyId, user, role } = auth.context;

  // Verify itinerary belongs to this company
  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, companyId },
    include: { lead: true, booking: true },
  });

  if (!itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  // RBAC: Staff agent can only convert itinerary for their own assigned lead
  if (role === 'staff_agent' && itinerary.lead.assignedAgentId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to convert this itinerary to a booking' },
      { status: 403 }
    );
  }

  // Check if booking already exists
  if (itinerary.booking) {
    return NextResponse.json(
      {
        success: true,
        message: 'Itinerary is already converted to a booking',
        booking: itinerary.booking,
      },
      { status: 200 }
    );
  }

  const bookingNumber = `BK-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const booking = await prisma.booking.create({
    data: {
      companyId,
      leadId: itinerary.leadId,
      itineraryId: itinerary.id,
      bookingNumber,
      status: 'CONFIRMED',
      totalAmount: itinerary.finalPrice,
      currency: itinerary.currency,
    },
    include: {
      lead: true,
      itinerary: true,
    },
  });

  // Update lead status to CONFIRMED
  const updatedLead = await prisma.lead.update({
    where: { id: itinerary.leadId },
    data: { status: 'CONFIRMED' },
  });

  return NextResponse.json(
    {
      success: true,
      message: 'Itinerary successfully converted to confirmed Booking',
      booking,
      lead: updatedLead,
    },
    { status: 201 }
  );
}
