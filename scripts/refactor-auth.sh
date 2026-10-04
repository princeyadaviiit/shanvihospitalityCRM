#!/bin/bash
# Script to refactor API routes from Supabase auth to Clerk auth

# Files to refactor
files=(
  "app/api/bookings/[id]/invoice/route.ts"
  "app/api/bookings/[id]/ledger/route.ts"
  "app/api/bookings/[id]/voucher/route.ts"
  "app/api/calendar/route.ts"
  "app/api/calls/initiate/route.ts"
  "app/api/company/route.ts"
  "app/api/employees/[id]/route.ts"
  "app/api/employees/route.ts"
  "app/api/itineraries/[id]/convert-booking/route.ts"
  "app/api/itineraries/[id]/export/route.ts"
  "app/api/leaderboard/route.ts"
  "app/api/leads/[id]/itinerary/route.ts"
  "app/api/leads/[id]/notes/route.ts"
  "app/api/leads/[id]/route.ts"
  "app/api/leads/route.ts"
  "app/api/packages/custom/route.ts"
  "app/api/payments/create-order/route.ts"
  "app/api/payroll/route.ts"
  "app/api/reports/sales/route.ts"
  "app/api/staff/[id]/route.ts"
  "app/api/staff/route.ts"
  "app/api/targets/route.ts"
  "app/api/whatsapp/send/route.ts"
)

echo "Refactoring ${#files[@]} API route files..."

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Replace import statement
    sed -i "s/from '@\/lib\/auth\/session'/from '@\/lib\/auth'/g" "$file"

    # This is a complex transformation that needs manual review
    echo "  ✓ Updated import in $file"
  else
    echo "  ✗ File not found: $file"
  fi
done

echo "Phase 1 complete: Import statements updated"
echo "Note: Authentication logic needs manual review and update for proper error handling"
