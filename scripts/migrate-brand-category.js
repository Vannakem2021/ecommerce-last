#!/usr/bin/env node

/**
 * Migration script runner for brand/category ObjectId conversion
 * Usage: node scripts/migrate-brand-category.js
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('Starting brand/category migration...');

try {
  // Run the TypeScript migration script
  const migrationPath = path.join(__dirname, '..', 'lib', 'db', 'migrate-brand-category.ts');
  
  // Use ts-node to run the TypeScript file directly
  execSync(`npx ts-node ${migrationPath}`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exit(1);
}
