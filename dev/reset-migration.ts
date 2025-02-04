import { $ } from 'bun';
import fs from 'node:fs';
import path from 'node:path';

async function resetMigration() {
  const migrationPath = path.join(process.cwd(), 'prisma', 'migrations');

  // Check if migrations directory exists before attempting deletion
  if (fs.existsSync(migrationPath)) {
    fs.rmSync(migrationPath, { recursive: true, force: true });
    console.log('✅ Deleted existing migrations folder');
  }

  // Generate new migration
  try {
    await $`prisma migrate reset --force`;
    await $`prisma migrate --create-only --name gen --skip-seed`;

    // Rename the timestamped folder to just 'gen'
    const files = fs.readdirSync(migrationPath);
    const migrationFolder = files.find((f) => f.endsWith('_gen'));

    if (migrationFolder) {
      const oldPath = path.join(migrationPath, migrationFolder);
      const newPath = path.join(migrationPath, 'gen');

      // Read and modify the migration.sql file
      const sqlPath = path.join(oldPath, 'migration.sql');
      let sqlContent = fs.readFileSync(sqlPath, 'utf-8');

      // Add "IF NOT EXISTS" to CREATE TABLE statements
      sqlContent = sqlContent.replace(
        /CREATE TABLE (?!IF NOT EXISTS)"(\w+)"/g,
        'CREATE TABLE IF NOT EXISTS "$1"'
      );

      // Add "IF NOT EXISTS" to CREATE INDEX statements
      sqlContent = sqlContent.replace(
        /CREATE (UNIQUE )?INDEX (?!IF NOT EXISTS)"(\w+)"/g,
        'CREATE $1INDEX IF NOT EXISTS "$2"'
      );

      // Write modified SQL back to file
      fs.writeFileSync(sqlPath, sqlContent);

      // Generate schema.ts
      const schemaTs = `// Generated from db:gen script in package.json
export const schema = \`${sqlContent}\`;
`;
      const schemaPath =
        process.argv[2] || path.join(process.cwd(), 'prisma', 'schema.ts');
      fs.writeFileSync(schemaPath, schemaTs);

      // Rename the folder
      fs.renameSync(oldPath, newPath);
      console.log('✅ Added IF NOT EXISTS clauses and generated schema.ts');
    }

    console.log('✅ Migration setup complete');
  } catch (error) {
    console.error('❌ Failed to generate migration:', error);
    process.exit(1);
  }
}

resetMigration();
