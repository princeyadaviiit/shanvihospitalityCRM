#!/bin/bash

# Script to update old auth imports to new Clerk-based auth system

echo "Updating auth imports across all API routes..."

# Find all files importing old auth functions
grep -r "from '@/lib/auth/session'" app/api --files-with-matches | while read file; do
  echo "Updating $file"

  # Replace the import statement
  sed -i "s/from '@\/lib\/auth\/session'/from '@\/lib\/auth'/g" "$file"

  # Replace authenticateRequest with requireRole (most common case)
  sed -i 's/authenticateRequest(/requireRole(/g' "$file"

  # Replace getAuthenticatedUser with getCurrentUser
  sed -i 's/getAuthenticatedUser(/getCurrentUser(/g' "$file"
done

# Also check for any remaining references to the old import path
grep -r "lib/auth/session" app/api --files-with-matches | while read file; do
  echo "Found remaining old import in: $file"
done

echo "Auth import updates completed!"
echo "Note: Some files may need manual adjustment for requireRole vs requireAuth"
