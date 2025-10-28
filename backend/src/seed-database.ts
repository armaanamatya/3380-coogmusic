import { createConnection, initializeDatabase } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Initialize database schema
    await initializeDatabase();
    console.log('✅ Schema initialized\n');
    
    const db = await createConnection();
    
    // Check if database already has data
    const userCount = db.prepare("SELECT COUNT(*) as count FROM userprofile").get() as { count: number };
    
    if (userCount.count > 0) {
      console.log('✅ Database already contains data, skipping seed\n');
      console.log('📊 Current Database Statistics:');
      const songCount = db.prepare("SELECT COUNT(*) as count FROM song").get() as { count: number };
      const albumCount = db.prepare("SELECT COUNT(*) as count FROM album").get() as { count: number };
      const artistCount = db.prepare("SELECT COUNT(*) as count FROM artist").get() as { count: number };
      console.log(`   Users: ${userCount.count}`);
      console.log(`   Songs: ${songCount.count}`);
      console.log(`   Albums: ${albumCount.count}`);
      console.log(`   Artists: ${artistCount.count}`);
      console.log('');
      return;
    }
    
    // Read seed data file
    const seedDataPath = path.join(__dirname, 'seedData/seed_data.sql');
    
    if (!fs.existsSync(seedDataPath)) {
      console.warn('⚠️  Seed data file not found at:', seedDataPath);
      console.log('Database will be empty (only schema created)');
      return;
    }
    
    const seedData = fs.readFileSync(seedDataPath, 'utf8');
    console.log('📄 Seed data file loaded\n');
    console.log(`📏 File size: ${seedData.length} characters\n`);
    
    // Split by semicolons and execute each statement  
    // (seed file now has all comments pre-stripped)
    const statements = seedData
      .split(';')
      .map(stmt => {
        // Replace all newlines/whitespace with single spaces for clean SQL
        return stmt.replace(/\s+/g, ' ').trim();
      })
      .filter(stmt => stmt.length > 0)
      .map(stmt => stmt + ';');  // Add semicolons back!
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    console.log(`🔍 First statement preview: ${statements[0]?.substring(0, 100)}...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Check if this is a large INSERT VALUES statement that might exceed SQLite's 999 parameter limit
        if (statement.includes('INSERT INTO') && statement.includes('VALUES') && statement.length > 10000) {
          // Split into smaller batches (max 100 rows per batch to stay under 999 param limit)
          const match = statement.match(/INSERT INTO (\w+) \([^)]+\) VALUES (.+);$/);
          if (match && match[1] && match[2]) {
            const tableName = match[1];
            const valuesSection = match[2];
            const columnMatch = statement.match(/INSERT INTO \w+ \(([^)]+)\)/);
            const columns = columnMatch ? columnMatch[1] : '';
            
            // Split by '), (' to separate individual rows
            const rows = valuesSection.split(/\),\s*\(/);
            const batchSize = 100;
            
            console.log(`📦 Splitting large INSERT into ${Math.ceil(rows.length / batchSize)} batches (${rows.length} rows)...`);
            
            for (let i = 0; i < rows.length; i += batchSize) {
              const batch = rows.slice(i, i + batchSize);
              // Clean up the first and last rows (they might have extra parens)
              if (batch[0]) batch[0] = batch[0].replace(/^\(/, '');
              const lastIdx = batch.length - 1;
              if (batch[lastIdx]) batch[lastIdx] = batch[lastIdx].replace(/\);?$/, '');
              
              const batchStatement = `INSERT INTO ${tableName} (${columns}) VALUES (${batch.join('), (')});`;
              db.exec(batchStatement);
            }
            successCount++;
          } else {
            db.exec(statement);
            successCount++;
          }
        } else {
          db.exec(statement);
          successCount++;
        }
      } catch (error: any) {
        errorCount++;
        // Skip errors for statements that are just comments or already exist
        if (!error.message.includes('UNIQUE constraint') && !error.message.includes('already exists')) {
          console.error('\n❌ Error executing statement:');
          console.error('First 200 chars:', statement.substring(0, 200));
          console.error('Last 200 chars:', statement.substring(Math.max(0, statement.length - 200)));
          console.error('Statement length:', statement.length, 'characters');
          console.error('Error:', error.message);
          console.error('');
        }
      }
    }
    
    console.log(`\n✅ Successfully executed: ${successCount} statements`);
    console.log(`❌ Failed: ${errorCount} statements\n`);
    
    console.log('\n✅ Database seeding completed successfully!\n');
    
    // Show final counts
    const finalUserCount = db.prepare("SELECT COUNT(*) as count FROM userprofile").get() as { count: number };
    const songCount = db.prepare("SELECT COUNT(*) as count FROM song").get() as { count: number };
    const albumCount = db.prepare("SELECT COUNT(*) as count FROM album").get() as { count: number };
    const artistCount = db.prepare("SELECT COUNT(*) as count FROM artist").get() as { count: number };
    
    console.log('📊 Database Statistics:');
    console.log(`   Users: ${finalUserCount.count}`);
    console.log(`   Songs: ${songCount.count}`);
    console.log(`   Albums: ${albumCount.count}`);
    console.log(`   Artists: ${artistCount.count}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { seedDatabase };

