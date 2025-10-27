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
    
    // Split by semicolons and execute each statement
    const statements = seedData
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...\n`);
    
    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (error: any) {
        // Skip errors for statements that are just comments or already exist
        if (!error.message.includes('UNIQUE constraint') && !error.message.includes('already exists')) {
          console.error('Error executing statement:', statement.substring(0, 100));
          console.error('Error:', error.message);
        }
      }
    }
    
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

