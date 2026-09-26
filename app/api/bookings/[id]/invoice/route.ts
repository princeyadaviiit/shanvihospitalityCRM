import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: bookingId } = await params;

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
        ledgerEntries: {
          where: { type: 'PAYMENT' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.companyId !== user.companyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
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

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.fontSize(10).text('TAX INVOICE', { align: 'center' });
    doc.fontSize(8).text('Sector 18, Noida, Uttar Pradesh 201301 | Helpline: +91 9999885087', { align: 'center' });
    doc.fontSize(9).text(`GSTIN: ${gstNumber}`, { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).text(`Invoice Number: INV-${booking.bookingNumber}`);
    doc.text(`Booking Number: ${booking.bookingNumber}`);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`);
    doc.moveDown();

    doc.fontSize(12).text('Bill To:', { underline: true });
    doc.fontSize(10).text(lead.name);
    if (lead.email) doc.text(`Email: ${lead.email}`);
    if (lead.phone) doc.text(`Phone: ${lead.phone}`);
    doc.moveDown();

    doc.fontSize(12).text('Itinerary Details:', { underline: true });
    doc.fontSize(10);
    if (itinerary) {
      doc.text(`Destination: ${itinerary.destination}`);
      if (itinerary.startDate) {
        doc.text(`Start Date: ${new Date(itinerary.startDate).toLocaleDateString('en-IN')}`);
      }
      if (itinerary.endDate) {
        doc.text(`End Date: ${new Date(itinerary.endDate).toLocaleDateString('en-IN')}`);
      }
      doc.text(`Pax Count: ${lead.paxCount}`);
    }
    doc.moveDown();

    doc.fontSize(12).text('Line Items:', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const itemX = 50;
    const qtyX = 350;
    const priceX = 420;
    const amountX = 490;

    doc.font('Helvetica-Bold').fontSize(10);
    doc.text('Description', itemX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Price', priceX, tableTop);
    doc.text('Amount', amountX, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

    let yPosition = tableTop + 25;
    let subtotal = 0;

    if (itinerary) {
      itinerary.days.forEach((day: any) => {
        day.lineItems.forEach((item: any) => {
          const amount = item.cost;
          subtotal += amount;

          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }

          doc.font('Helvetica').fontSize(9);
          doc.text(item.description, itemX, yPosition, { width: 280 });
          doc.text('1', qtyX, yPosition);
          doc.text(amount.toFixed(2), priceX, yPosition);
          doc.text(amount.toFixed(2), amountX, yPosition);
          yPosition += 20;
        });
      });
    }

    doc.moveTo(50, yPosition).lineTo(560, yPosition).stroke();
    yPosition += 10;

    const gstRate = 0.18;
    const cgst = subtotal * (gstRate / 2);
    const sgst = subtotal * (gstRate / 2);
    const totalWithGst = subtotal + cgst + sgst;

    doc.fontSize(10);
    doc.text('Subtotal:', 400, yPosition);
    doc.text(`${booking.currency} ${subtotal.toFixed(2)}`, amountX, yPosition, { align: 'right' });
    yPosition += 20;

    doc.text('CGST (9%):', 400, yPosition);
    doc.text(`${booking.currency} ${cgst.toFixed(2)}`, amountX, yPosition, { align: 'right' });
    yPosition += 20;

    doc.text('SGST (9%):', 400, yPosition);
    doc.text(`${booking.currency} ${sgst.toFixed(2)}`, amountX, yPosition, { align: 'right' });
    yPosition += 20;

    doc.font('Helvetica-Bold').fontSize(12).text('Total:', 400, yPosition);
    doc.text(`${booking.currency} ${totalWithGst.toFixed(2)}`, amountX, yPosition, { align: 'right' });
    yPosition += 30;

    const totalPaid = booking.ledgerEntries.reduce((sum: number, entry: any) => sum + entry.amount, 0);
    const balance = totalWithGst - totalPaid;

    if (totalPaid > 0) {
      doc.font('Helvetica').fontSize(10).text('Amount Paid:', 400, yPosition);
      doc.text(`${booking.currency} ${totalPaid.toFixed(2)}`, amountX, yPosition, { align: 'right' });
      yPosition += 20;
    }

    doc.font('Helvetica-Bold').fontSize(11).text('Balance Due:', 400, yPosition);
    doc.text(`${booking.currency} ${balance.toFixed(2)}`, amountX, yPosition, { align: 'right' });

    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    } else {
      yPosition += 50;
    }

    doc.fontSize(9).text('Terms & Conditions:', 50, yPosition);
    doc.fontSize(8).text('1. Payment is due within 7 days of invoice date.', 50, yPosition + 15);
    doc.text('2. Cancellation charges apply as per company policy.', 50, yPosition + 30);

    doc.end();

    const pdfBuffer = await pdfPromise;

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.bookingNumber}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Generate invoice error:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
