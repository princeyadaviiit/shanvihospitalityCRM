import { readFile, writeFile } from 'fs/promises';
import { glob } from 'glob';

// Transform authentication pattern from Supabase to Clerk
async function refactorApiRoute(filePath: string): Promise<void> {
  let content = await readFile(filePath, 'utf-8');
  let modified = false;

  // Pattern 1: Replace authenticateRequest with requireRole
  const authRequestPattern = /const auth = await authenticateRequest\(request,\s*\[([^\]]+)\]\);[\s\n]*if \(!auth\.success\) \{[\s\n]*return auth\.response;[\s\n]*\}[\s\n]*const \{ companyId, user, role \} = auth\.context;/g;

  if (authRequestPattern.test(content)) {
    content = content.replace(
      authRequestPattern,
      (match, roles) => {
        return `const user = await requireRole(${roles});\n  const companyId = user.companyId!;\n  const role = user.role!;`;
      }
    );
    modified = true;
  }

  // Pattern 2: Wrap handlers that don't have try-catch
  // This is complex and needs manual review

  if (modified) {
    await writeFile(filePath, content, 'utf-8');
    console.log(`✓ Refactored: ${filePath}`);
  } else {
    console.log(`⊘ No changes: ${filePath}`);
  }
}

// Main execution
async function main() {
  const files = await glob('app/api/**/route.ts', { ignore: ['**/webhooks/**'] });

  console.log(`Found ${files.length} API route files to refactor\n`);

  for (const file of files) {
    try {
      await refactorApiRoute(file);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error);
    }
  }

  console.log('\nRefactoring complete!');
}

main().catch(console.error);
