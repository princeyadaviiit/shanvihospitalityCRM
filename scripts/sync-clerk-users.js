const { clerkClient } = require('@clerk/nextjs/server');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function syncClerkUsers() {
  try {
    console.log('🔄 Starting Clerk user sync...\n');

    const clerk = await clerkClient();

    // Fetch all users from Clerk
    const clerkUsers = await clerk.users.getUserList({ limit: 100 });

    console.log(`Found ${clerkUsers.totalCount} users in Clerk\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const clerkUser of clerkUsers.data) {
      try {
        const primaryEmail = clerkUser.emailAddresses.find(
          (email) => email.id === clerkUser.primaryEmailAddressId
        );

        if (!primaryEmail) {
          console.log(`⚠️  Skipping user ${clerkUser.id} - no primary email`);
          skipped++;
          continue;
        }

        const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User';

        // Extract metadata for staff invitations
        const companyId = clerkUser.publicMetadata?.companyId || null;
        const role = clerkUser.publicMetadata?.role || null;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { clerkUserId: clerkUser.id },
        });

        if (existingUser) {
          // Update existing user
          await prisma.user.update({
            where: { clerkUserId: clerkUser.id },
            data: {
              name: fullName,
              email: primaryEmail.emailAddress,
              ...(companyId && { companyId }),
              ...(role && { role }),
            },
          });
          console.log(`✅ Updated: ${fullName} (${primaryEmail.emailAddress})`);
        } else {
          // Create new user
          await prisma.user.create({
            data: {
              clerkUserId: clerkUser.id,
              name: fullName,
              email: primaryEmail.emailAddress,
              companyId,
              role,
              active: true,
            },
          });
          console.log(`✨ Created: ${fullName} (${primaryEmail.emailAddress})`);
        }

        synced++;
      } catch (err) {
        console.error(`❌ Error syncing user ${clerkUser.id}:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Sync Summary:');
    console.log(`✅ Synced: ${synced}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log('\n✅ Sync completed!');

  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncClerkUsers();
