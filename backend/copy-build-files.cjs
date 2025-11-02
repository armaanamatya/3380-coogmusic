const fs = require('fs');
const path = require('path');

// Helper function to copy file
function copyFile(source, dest) {
  try {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(source, dest);
    console.log(`✅ Copied: ${path.basename(source)}`);
  } catch (err) {
    console.error(`❌ Failed to copy ${source}:`, err.message);
    process.exit(1);
  }
}

// Helper function to copy directory recursively
function copyDirectory(source, dest) {
  try {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
    console.log(`✅ Copied directory: ${path.basename(source)}`);
  } catch (err) {
    console.error(`❌ Failed to copy directory ${source}:`, err.message);
    process.exit(1);
  }
}

console.log('\n📦 Copying build files...\n');

// Copy schema file
const schemaSource = path.join(__dirname, 'src', 'schema.mysql.sql');
const schemaDest = path.join(__dirname, 'dist', 'schema.mysql.sql');
copyFile(schemaSource, schemaDest);

// Copy seedData directory from project root
const seedDataSource = path.join(__dirname, '..', 'seedData');
const seedDataDest = path.join(__dirname, 'dist', 'seedData');
if (fs.existsSync(seedDataSource)) {
  copyDirectory(seedDataSource, seedDataDest);
} else {
  console.log('⚠️  seedData directory not found at', seedDataSource);
  console.log('    Continuing without seed data...');
}

console.log('\n✅ All build files copied successfully!\n');

