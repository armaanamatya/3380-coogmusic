import { getPool, initializeDatabase } from './database.js';
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
    
    const pool = await getPool();
    
    // Check if database already has data
    const [userRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM userprofile");
    const userCount = userRows[0];
    
    if (userCount.count > 0) {
      console.log('✅ Database already contains data, skipping seed\n');
      console.log('📊 Current Database Statistics:');
      const [songRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM song");
      const [albumRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM album");
      const [artistRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM artist");
      const songCount = songRows[0];
      const albumCount = albumRows[0];
      const artistCount = artistRows[0];
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
    
    // Helper function to split large INSERT statements into batches
    const splitLargeInsert = (statement: string): string[] => {
      // Only process INSERT statements that are too large (>8000 chars to leave buffer)
      if (!statement.trim().toUpperCase().startsWith('INSERT INTO') || statement.length < 8000) {
        return [statement];
      }
      
      // Extract table name, columns, and values
      const insertMatch = statement.match(/INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*(.+);?$/is);
      if (!insertMatch || !insertMatch[1] || !insertMatch[2] || !insertMatch[3]) {
        return [statement]; // Can't parse, return as-is
      }
      
      const tableName = insertMatch[1];
      const columns = insertMatch[2].trim();
      const valuesPart = insertMatch[3].trim().replace(/;?\s*$/, ''); // Remove trailing semicolon
      
      // Split values by '),(' pattern while preserving the parentheses
      // Match: (value1, value2, ...), (value3, value4, ...)
      const valueGroups: string[] = [];
      let currentGroup = '';
      let depth = 0;
      let inString = false;
      let stringChar = '';
      
      for (let i = 0; i < valuesPart.length; i++) {
        const char = valuesPart[i];
        const nextChar = valuesPart[i + 1];
        
        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringChar = char;
          currentGroup += char;
        } else if (inString && char === stringChar && valuesPart[i - 1] !== '\\') {
          inString = false;
          currentGroup += char;
        } else if (!inString && char === '(') {
          depth++;
          currentGroup += char;
        } else if (!inString && char === ')') {
          depth--;
          currentGroup += char;
          // If depth is 0 and next is comma or end, we have a complete value group
          if (depth === 0 && (nextChar === ',' || i === valuesPart.length - 1)) {
            valueGroups.push(currentGroup.trim());
            currentGroup = '';
            if (nextChar === ',') i++; // Skip the comma
          }
        } else {
          currentGroup += char;
        }
      }
      
      // Add any remaining group
      if (currentGroup.trim()) {
        valueGroups.push(currentGroup.trim());
      }
      
      // If we couldn't split properly, return original statement
      if (valueGroups.length === 0) {
        return [statement];
      }
      
      // Create batched statements (100 rows per batch)
      const batchSize = 100;
      const batches: string[] = [];
      
      for (let i = 0; i < valueGroups.length; i += batchSize) {
        const batch = valueGroups.slice(i, i + batchSize);
        batches.push(`INSERT INTO ${tableName} (${columns}) VALUES ${batch.join(', ')};`);
      }
      
      return batches;
    };
    
    for (const statement of statements) {
      try {
        // Split large INSERT statements into batches
        const batchedStatements = splitLargeInsert(statement);
        
        if (batchedStatements.length > 1) {
          console.log(`📦 Splitting large INSERT into ${batchedStatements.length} batches...`);
        }
        
        for (let batchIdx = 0; batchIdx < batchedStatements.length; batchIdx++) {
          const batchedStatement = batchedStatements[batchIdx];
          if (batchedStatement) {
            await pool.query(batchedStatement);
            if (batchedStatements.length > 1) {
              console.log(`  ✅ Batch ${batchIdx + 1}/${batchedStatements.length} complete`);
            }
          }
        }
        
        successCount++;
      } catch (error: any) {
        errorCount++;
        // Skip errors for statements that are just comments or already exist
        if (!error.message.includes('Duplicate entry') && !error.message.includes('already exists')) {
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
    const [finalUserRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM userprofile");
    const [finalSongRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM song");
    const [finalAlbumRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM album");
    const [finalArtistRows] = await pool.query<any[]>("SELECT COUNT(*) as count FROM artist");
    
    const finalUserCount = finalUserRows[0];
    const finalSongCount = finalSongRows[0];
    const finalAlbumCount = finalAlbumRows[0];
    const finalArtistCount = finalArtistRows[0];
    
    console.log('📊 Database Statistics:');
    console.log(`   Users: ${finalUserCount.count}`);
    console.log(`   Songs: ${finalSongCount.count}`);
    console.log(`   Albums: ${finalAlbumCount.count}`);
    console.log(`   Artists: ${finalArtistCount.count}`);
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

