import fs from 'fs';
import path from 'path';

const schemaDir = path.join(process.cwd(), 'schema');
const outputFile = path.join(process.cwd(), 'compiled-schema.sql');

const filesToCompile = [
  '00-base-enums-and-extensions.sql',
  '01-super-admin-hud.sql',
  '02-tenant-foundation.sql',
  '03-tenant-crm.sql',
  '04-tenant-finance.sql',
  '05-tenant-operations.sql',
  '06-global-marketplace.sql',
  '07-security-rls.sql'
];

try {
  let compiledSQL = '-- ============================================================\n';
  compiledSQL += '-- INTRAVOS COMPILED MASTER SCHEMA\n';
  compiledSQL += '-- Generated automatically from modular schema files.\n';
  compiledSQL += '-- ============================================================\n\n';

  for (const file of filesToCompile) {
    const filePath = path.join(schemaDir, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      compiledSQL += `\n-- ====================================\n`;
      compiledSQL += `-- SOURCE: ${file}\n`;
      compiledSQL += `-- ====================================\n\n`;
      compiledSQL += content + '\n';
    } else {
      console.warn(`Warning: Schema file not found - ${file}`);
    }
  }

  fs.writeFileSync(outputFile, compiledSQL);
  console.log(`✅ Schema compiled successfully to ${outputFile}`);
} catch (error) {
  console.error(`❌ Failed to compile schema: ${error.message}`);
}
