import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: bookingId } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        company: true,
        lead: true,
        itinerary: {
          include: {
            days: {
              include: {
                lineItems: true,
              },
              orderBy: { dayNumber: 'asc' },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const company = booking.company;
    const lead = booking.lead;
    const itinerary = booking.itinerary;

    const companyName = company.name || 'Shanvi Hospitality';
    const gstNumber = company.gstNumber || '09AEKFS1932F1ZX';

    // Header Branding Banner
    doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold').text(companyName, { align: 'center' });
    doc.fillColor('#FF6B35').fontSize(12).font('Helvetica-Bold').text('HOTEL ACCOMMODATION & SERVICE VOUCHER', { align: 'center' });
    doc.fillColor('#64748B').fontSize(8).font('Helvetica').text('Sector 18, Noida, Uttar Pradesh 201301 | 24/7 Helpline: +91 9999885087 / 9355141058', { align: 'center' });
    doc.text(`GSTIN: ${gstNumber} | Email: enquiry@shanvihospitality.in`, { align: 'center' });
    doc.moveDown(1.2);

    // Voucher & Booking Reference Box
    const voucherNumber = `VCH-${booking.bookingNumber}`;
    doc.rect(45, doc.y, 505, 55).fillAndStroke('#F8FAFC', '#CBD5E1');
    const startY = doc.y + 10;

    doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`Voucher Number: ${voucherNumber}`, 55, startY);
    doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Booking Ref: ${booking.bookingNumber}`, 55, startY + 16);
    doc.text(`Issue Date: ${new Date().toLocaleDateString('en-IN')}`, 55, startY + 30);

    doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold').text(`Guest Name: ${lead.name}`, 320, startY);
    doc.fillColor('#475569').fontSize(9).font('Helvetica').text(`Contact: ${lead.phone}`, 320, startY + 16);
    doc.text(`Total Travelers: ${lead.paxCount} Pax`, 320, startY + 30);

    doc.y = startY + 55;
    doc.moveDown(1);

    // Tour & Destination Summary
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Tour & Destination Details');
    doc.fillColor('#475569').fontSize(9).font('Helvetica');
    doc.text(`Destination: ${itinerary?.destination || lead.destination}`);
    doc.text(`Itinerary Title: ${itinerary?.title || 'Custom Tour Package'}`);
    doc.moveDown(1);

    // Accommodation Schedule Table
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Hotel Reservation & Stay Schedule');
    doc.moveDown(0.5);

    if (itinerary?.days && itinerary.days.length > 0) {
      let currentY = doc.y;

      // Table Header
      doc.rect(45, currentY, 505, 20).fillAndStroke('#0F172A', '#0F172A');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');
      doc.text('DAY', 55, currentY + 6);
      doc.text('HALT / DESTINATION', 95, currentY + 6);
      doc.text('ACCOMMODATION & SERVICES', 220, currentY + 6);
      doc.text('MEAL PLAN', 470, currentY + 6);

      currentY += 20;

      itinerary.days.forEach((day: any, index: number) => {
        const rowBg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        doc.rect(45, currentY, 505, 26).fillAndStroke(rowBg, '#E2E8F0');

        doc.fillColor('#0F172A').fontSize(8).font('Helvetica-Bold').text(`Day ${day.dayNumber}`, 55, currentY + 8);
        doc.fillColor('#334155').fontSize(8).font('Helvetica').text(day.title.slice(0, 22), 95, currentY + 8);

        const accomItems = day.lineItems ? day.lineItems.filter((li: any) => li.category === 'ACCOMMODATION') : [];
        const desc = accomItems.length > 0
          ? accomItems.map((li: any) => li.description).join(', ').slice(0, 45)
          : (day.description ? day.description.slice(0, 45) : 'Standard Hotel (Double Sharing)');
        doc.text(desc, 220, currentY + 8);

        doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text('MAP (Breakfast + Dinner)', 430, currentY + 8);

        currentY += 26;
      });

      doc.y = currentY + 15;
    }

    // Standard Inclusions & Guest Instructions
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('General Check-in Instructions & Protocols');
    doc.fillColor('#475569').fontSize(8).font('Helvetica');
    doc.text('1. Standard hotel check-in time is 12:00 PM / 2:00 PM and check-out is 10:00 AM / 11:00 AM.');
    doc.text('2. Please present this official confirmation voucher along with Government ID proofs (Aadhaar / Passport) at check-in.');
    doc.text('3. Any personal expenses (minibar, telephone calls, laundry, additional room service) must be settled directly with the property.');
    doc.text('4. In case of delayed arrival or transfer coordination, please contact the Shanvi Hospitality helpline directly.');
    doc.moveDown(1.5);

    // Authorized Signatory & Emergency Contact
    doc.rect(45, doc.y, 505, 50).fillAndStroke('#FFF7ED', '#FDBA74');
    const emergencyY = doc.y + 10;
    doc.fillColor('#9A3412').fontSize(9).font('Helvetica-Bold').text('24/7 Tour Coordination & On-Ground Guest Support:', 55, emergencyY);
    doc.fillColor('#C2410C').fontSize(8).font('Helvetica').text('Himani Ma\'am (Tour Planner) / Operations Dispatch: +91 9999885087 | Secondary: +91 9355141058', 55, emergencyY + 15);
    doc.text('Shanvi Hospitality Head Office: Sector 18, Noida, Gautam Buddha Nagar, UP 201301', 55, emergencyY + 28);

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="voucher-${booking.bookingNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating voucher PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate voucher PDF', details: error.message },
      { status: 500 }
    );
  }
}
