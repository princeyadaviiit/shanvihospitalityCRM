import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(request, ['admin', 'staff_agent', 'accounts']);
  if (!auth.success) {
    return auth.response;
  }

  const { id: itineraryId } = await params;
  const { companyId, user, role } = auth.context;

  // Verify itinerary belongs to this tenant
  const itinerary = await prisma.itinerary.findFirst({
    where: { id: itineraryId, companyId },
    include: {
      company: true,
      lead: {
        include: {
          assignedAgent: true,
        },
      },
      days: {
        include: {
          lineItems: true,
        },
      },
      booking: true,
    },
  });

  if (!itinerary) {
    return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 });
  }

  // RBAC: Staff agent can only export itineraries for their own assigned leads
  if (role === 'staff_agent' && itinerary.lead.assignedAgentId !== user.id) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to export this itinerary' },
      { status: 403 }
    );
  }

  try {
    const pdfBuffer = await generateItineraryPdfBuffer({
      companyName: itinerary.company?.name || 'Travel CRM Agency',
      itinerary,
      lead: itinerary.lead,
    });

    const filename = `Itinerary-${itinerary.lead.name.replace(/\s+/g, '_')}-${itinerary.destination.replace(/\s+/g, '_')}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary PDF' },
      { status: 500 }
    );
  }
}

function generateItineraryPdfBuffer(data: {
  companyName: string;
  itinerary: any;
  lead: any;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#1d4ed8'; // Tailwind Blue 700
      const slateDark = '#0f172a';
      const slateMuted = '#475569';
      const slateLight = '#64748b';
      const borderGray = '#e2e8f0';

      // --- Header Banner ---
      doc.rect(40, 40, 515, 60).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor(primaryColor).fontSize(18).font('Helvetica-Bold')
        .text(data.companyName.toUpperCase(), 55, 52);
      doc.fillColor(slateMuted).fontSize(10).font('Helvetica')
        .text('CUSTOM TRAVEL PROPOSAL & ITINERARY QUOTE', 55, 74);

      doc.moveDown(2);

      // --- Proposal Details Box ---
      const detailsTop = 115;
      doc.rect(40, detailsTop, 515, 80).fillAndStroke('#f8fafc', borderGray);

      // Left Column
      doc.fillColor(slateLight).fontSize(8).font('Helvetica-Bold').text('TRAVELLER NAME', 55, detailsTop + 12);
      doc.fillColor(slateDark).fontSize(11).font('Helvetica-Bold').text(data.lead.name, 55, detailsTop + 24);

      doc.fillColor(slateLight).fontSize(8).font('Helvetica-Bold').text('DESTINATION', 55, detailsTop + 44);
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text(data.itinerary.destination, 55, detailsTop + 56);

      // Middle Column
      doc.fillColor(slateLight).fontSize(8).font('Helvetica-Bold').text('CONTACT PHONE', 230, detailsTop + 12);
      doc.fillColor(slateDark).fontSize(10).font('Helvetica').text(data.lead.phone, 230, detailsTop + 24);

      doc.fillColor(slateLight).fontSize(8).font('Helvetica-Bold').text('GROUP SIZE', 230, detailsTop + 44);
      doc.fillColor(slateDark).fontSize(10).font('Helvetica').text(`${data.lead.paxCount} Travellers`, 230, detailsTop + 56);

      // Right Column
      doc.fillColor(slateLight).fontSize(8).font('Helvetica-Bold').text('PROPOSAL DATE', 410, detailsTop + 12);
      doc.fillColor(slateDark).fontSize(10).font('Helvetica').text(new Date().toLocaleDateString(), 410, detailsTop + 24);

      doc.fillColor(slateLight).fontSize(8).font('Helvetica-Bold').text('TOTAL PACKAGE PRICE', 410, detailsTop + 44);
      const currencySymbol = data.itinerary.currency === 'INR' ? 'INR ' : 'USD $';
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
        .text(`${currencySymbol}${data.itinerary.finalPrice.toLocaleString()}`, 410, detailsTop + 56);

      // --- Section Title: Day by Day Plan ---
      let y = detailsTop + 105;
      doc.fillColor(slateDark).fontSize(13).font('Helvetica-Bold').text('DAY-BY-DAY ITINERARY SCHEDULE', 40, y);
      y += 20;

      const days = (data.itinerary.days || []).sort((a: any, b: any) => a.dayNumber - b.dayNumber);

      for (const day of days) {
        // Page break safety
        if (y > 700) {
          doc.addPage();
          y = 40;
        }

        // Day Header Bar
        doc.rect(40, y, 515, 24).fillAndStroke('#f1f5f9', '#cbd5e1');
        doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold')
          .text(`DAY ${day.dayNumber}: ${day.title}`, 50, y + 6);
        y += 30;

        if (day.description) {
          doc.fillColor(slateMuted).fontSize(9).font('Helvetica')
            .text(day.description, 50, y, { width: 495 });
          y += doc.heightOfString(day.description, { width: 495 }) + 8;
        }

        // Line Items
        const items = day.lineItems || [];
        for (const item of items) {
          if (y > 720) {
            doc.addPage();
            y = 40;
          }

          const categoryName = String(item.category).replace('_', ' ');
          doc.rect(50, y, 90, 14).fill('#e0e7ff');
          doc.fillColor('#3730a3').fontSize(7).font('Helvetica-Bold')
            .text(categoryName, 55, y + 3);

          doc.fillColor(slateDark).fontSize(9).font('Helvetica')
            .text(item.description, 150, y + 2, { width: 380 });

          y += 18;
        }

        y += 10;
      }

      // --- Total Costing Summary Box ---
      if (y > 660) {
        doc.addPage();
        y = 40;
      }

      y += 10;
      doc.rect(40, y, 515, 75).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('INVESTMENT & PRICING SUMMARY', 55, y + 12);

      doc.fillColor(slateMuted).fontSize(9).font('Helvetica')
        .text('Base Destination Services & Accommodation:', 55, y + 30);
      doc.fillColor(slateDark).fontSize(9).font('Helvetica-Bold')
        .text(`${currencySymbol}${data.itinerary.totalCost.toLocaleString()}`, 420, y + 30);

      doc.fillColor(slateMuted).fontSize(9).font('Helvetica')
        .text('Agency Management, Coordination & Service Fee:', 55, y + 46);
      doc.fillColor(slateDark).fontSize(9).font('Helvetica-Bold')
        .text(`${currencySymbol}${data.itinerary.markup.toLocaleString()}`, 420, y + 46);

      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
        .text('Grand Total Quoted Package Price:', 55, y + 62);
      doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold')
        .text(`${currencySymbol}${data.itinerary.finalPrice.toLocaleString()}`, 420, y + 60);

      y += 90;

      // Footer Terms
      doc.fillColor(slateLight).fontSize(8).font('Helvetica')
        .text(
          'Note: This quote is valid for 7 days from issue date. Flights, hotels, and tours are subject to availability at the time of confirmed booking deposit. All rights reserved by ' +
            data.companyName +
            '.',
          40,
          y,
          { width: 515, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
