// Check what tables and views exist in the database
const Database = require('better-sqlite3');

const db = new Database('./coogmusic.db');

console.log('\n📋 Tables in database:');
const tables = db.prepare(`
  SELECT name, sql FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

tables.forEach(table => {
  console.log(`\n✓ ${table.name}`);
  if (table.sql) {
    console.log(`  ${table.sql.substring(0, 100)}...`);
  }
});

console.log('\n\n📋 Views in database:');
const views = db.prepare(`
  SELECT name, sql FROM sqlite_master 
  WHERE type='view' 
  ORDER BY name
`).all();

if (views.length === 0) {
  console.log('  (none)');
} else {
  views.forEach(view => {
    console.log(`\n✓ ${view.name}`);
    console.log(`  ${view.sql}`);
  });
}

console.log('\n\n📋 Triggers in database:');
const triggers = db.prepare(`
  SELECT name, sql FROM sqlite_master 
  WHERE type='trigger' 
  ORDER BY name
`).all();

if (triggers.length === 0) {
  console.log('  (none)');
} else {
  triggers.forEach(trigger => {
    console.log(`\n✓ ${trigger.name}`);
    console.log(`  ${trigger.sql}`);
  });
}

db.close();
console.log('\n');

