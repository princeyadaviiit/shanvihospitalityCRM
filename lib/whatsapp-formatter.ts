/**
 * WhatsApp Message Formatter for Itineraries
 * Formats tour itineraries in the Shanvi Hospitality branded WhatsApp format
 */

interface ItineraryData {
  id: string;
  title: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  finalPrice: number;
  currency: string;
  adultsCount?: number | null;
  childrenCount?: number | null;
  childrenAges?: string | null;
  inclusions?: string | null;
  exclusions?: string | null;
  lead: {
    name: string;
    paxCount: number;
  };
  days: Array<{
    dayNumber: number;
    title: string;
    description: string | null;
    lineItems: Array<{
      category: string;
      description: string;
      cost: number;
      hotelName?: string | null;
      hotelStarRating?: number | null;
      mealPlan?: string | null;
      roomType?: string | null;
      checkInDate?: Date | null;
      checkOutDate?: Date | null;
      nightsCount?: number | null;
      vehicleType?: string | null;
      transferType?: string | null;
      startTime?: string | null;
      activityType?: string | null;
      paxCount?: string | null;
    }>;
  }>;
}

function formatDate(date: Date | null | undefined, format: 'short' | 'full' = 'short'): string {
  if (!date) return '';

  const d = new Date(date);
  const day = d.getDate();
  const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
  const monthFull = d.toLocaleDateString('en-US', { month: 'long' });
  const year = d.getFullYear();
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

  if (format === 'full') {
    return `${dayName} ${day}${getDaySuffix(day)} ${monthFull}, ${year}`;
  }

  return `${day} ${monthShort}`;
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function calculateNights(startDate: Date | null, endDate: Date | null): number {
  if (!startDate || !endDate) return 0;
  const diffTime = Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateDays(nights: number): number {
  return nights + 1;
}

export function formatWhatsAppMessage(itinerary: ItineraryData, leadName: string): string {
  const nights = calculateNights(itinerary.startDate, itinerary.endDate);
  const days = calculateDays(nights);

  const childrenAges = itinerary.childrenAges ? JSON.parse(itinerary.childrenAges) : [];
  const childrenText = itinerary.childrenCount && itinerary.childrenCount > 0
    ? `, ${itinerary.childrenCount} Children (${childrenAges.join(', ')})`
    : '';

  let message = `Hi ${leadName},\n\n`;
  message += `Greetings from Sembark International Demo Travel Company.\n\n`;
  message += `Thank you for your query with us. As per your requirements, following are the package details.\n\n`;

  // Trip Header
  message += `*Trip ID IB-${itinerary.id.slice(-5).toUpperCase()}*\n`;
  message += `----------\n`;
  message += `*${itinerary.title}*\n`;
  message += `• *${formatDate(itinerary.startDate)}, ${new Date(itinerary.startDate!).getFullYear()}* _for_ *${nights} Nights, ${days} Days*\n`;
  message += `• *${itinerary.adultsCount || 0} Adults${childrenText}*\n\n`;

  // Total Price
  const currencySymbol = itinerary.currency === 'USD' ? '$' : '₹';
  message += `*Total Price (${itinerary.currency}): ${itinerary.finalPrice.toLocaleString('en-IN')} /-* _(inc. Taxes)_\n\n`;

  // Hotels Section
  const hotelItems = itinerary.days.flatMap(day =>
    day.lineItems.filter(item => item.category === 'ACCOMMODATION' && item.hotelName)
  );

  if (hotelItems.length > 0) {
    message += `🏨  *_Hotels_*\n`;
    message += `-----------\n`;

    // Group hotels by location
    const hotelsByLocation = new Map<string, typeof hotelItems>();
    hotelItems.forEach(hotel => {
      const location = extractLocationFromDescription(hotel.description);
      if (!hotelsByLocation.has(location)) {
        hotelsByLocation.set(location, []);
      }
      hotelsByLocation.get(location)?.push(hotel);
    });

    hotelsByLocation.forEach((hotels, location) => {
      const firstHotel = hotels[0];
      const nightNumbers = hotels.map((_, idx) =>
        getOrdinal(itinerary.days.find(d => d.lineItems.includes(firstHotel))?.dayNumber || 1)
      ).join(', ');

      message += `*${nightNumbers} ${hotels.length > 1 ? 'Nights' : 'Night'}* _at_ *${location}*\n`;
      message += `_Check-in: ${formatDate(firstHotel.checkInDate)}_ & _Check-out: ${formatDate(firstHotel.checkOutDate)}_\n`;
      message += `*${firstHotel.hotelName}* (${firstHotel.hotelStarRating || 3} Star)\n`;
      message += `${firstHotel.mealPlan || 'Room Only'} • ${firstHotel.roomType || 'Standard Room'}`;
      if (firstHotel.paxCount) {
        message += ` (${firstHotel.paxCount})`;
      }
      message += `\n\n`;
    });
  }

  // Transportation and Activities
  message += `🚖  *Transportation and Activities*\n`;
  message += `-----------\n`;

  itinerary.days.forEach((day) => {
    const dayDate = new Date(itinerary.startDate!);
    dayDate.setDate(dayDate.getDate() + (day.dayNumber - 1));

    message += `*${getOrdinal(day.dayNumber)} Day - ${formatDate(dayDate, 'full')}*\n`;

    const nonHotelItems = day.lineItems.filter(item => item.category !== 'ACCOMMODATION');

    nonHotelItems.forEach((item, idx) => {
      if (item.category === 'TRANSPORT') {
        message += `• ${item.description}`;
        if (item.vehicleType) {
          message += ` _(1-Vehicle (${item.vehicleType}))_`;
        }
        if (item.startTime) {
          message += `   \n   _Start: ${item.startTime}_`;
        }
        message += `\n`;
      } else if (item.category === 'ACTIVITY') {
        message += `• ${item.description}`;
        if (item.paxCount) {
          message += ` _(${item.paxCount})_`;
        }
        message += `\n`;
      } else {
        message += `• ${item.description}\n`;
      }
    });

    message += `\n`;
  });

  // Inclusions
  const inclusions = itinerary.inclusions ? JSON.parse(itinerary.inclusions) : getDefaultInclusions();
  message += `*_Inclusions_*\n`;
  message += `-----------\n`;
  inclusions.forEach((inc: string) => {
    message += `+ ${inc}\n`;
  });
  message += `\n`;

  // Exclusions
  const exclusions = itinerary.exclusions ? JSON.parse(itinerary.exclusions) : getDefaultExclusions();
  message += `*_Exclusions_*\n`;
  message += `-----------\n`;
  exclusions.forEach((exc: string) => {
    message += `- ${exc}\n`;
  });
  message += `\n`;

  message += `_*NOTE*: Anything not mentioned in the inclusions is excluded_\n\n`;

  // Day-wise Itinerary
  message += `🗓️   *_Day Wise Itinerary_*\n`;
  message += `----------\n`;

  itinerary.days.forEach((day) => {
    const dayDate = new Date(itinerary.startDate!);
    dayDate.setDate(dayDate.getDate() + (day.dayNumber - 1));

    message += `*${getOrdinal(day.dayNumber)} Day - ${formatDate(dayDate, 'full')}*\n`;
    message += `----\n`;

    day.lineItems.forEach((item, idx) => {
      if (idx === 0) {
        message += `*${item.description}*\n`;
      } else {
        message += `+ *${item.description}*\n`;
      }

      if (day.description && idx === day.lineItems.length - 1) {
        message += `${day.description}\n`;
      }
    });

    message += `\n----------\n`;
  });

  return message;
}

function getOrdinal(num: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}

function extractLocationFromDescription(desc: string): string {
  // Try to extract location from description like "Ho Chi Minh City - Hotel Stay"
  const match = desc.match(/^([^-]+)/);
  return match ? match[1].trim() : 'Destination';
}

function getDefaultInclusions(): string[] {
  return [
    'Accommodation in well-rated hotels/resorts as per the itinerary',
    'Daily breakfast at the hotel (except on Day 1)',
    'Sightseeing as per itinerary in a private/shared vehicle',
    'Airport Transfers',
    'All toll taxes, parking charges, driver allowances',
    'Entry tickets to attractions (as mentioned in the itinerary)',
    'Assistance by our local representative',
  ];
}

function getDefaultExclusions(): string[] {
  return [
    'Airfare / Train fare / Bus tickets',
    'Meals other than those specified in the Hotel inclusions',
    'Personal expenses: Laundry, telephone calls, room service, mini-bar, etc.',
    'Early check-in or late check-out at hotels (subject to availability)',
    'Tips, porterage, and guide charges',
    'Optional tours and activities not mentioned in the itinerary',
    'Cost of any medical or travel insurance (unless included)',
    'Any additional cost due to flight cancellation, delay, natural calamity, etc.',
  ];
}
