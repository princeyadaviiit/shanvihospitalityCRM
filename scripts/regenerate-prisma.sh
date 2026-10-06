#!/bin/bash

echo "🔧 Regenerating Prisma Client..."

# Regenerate Prisma client with latest schema
npx prisma generate --force

echo ""
echo "✅ Prisma client regenerated successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test CRUD operations (create lead, add employee, etc.)"
echo "3. Check for any remaining Prisma errors"
echo ""
