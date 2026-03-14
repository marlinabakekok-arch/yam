#!/usr/bin/env node

/**
 * Initialize Prisma database
 * This script runs: prisma generate && prisma migrate dev --name init
 */

const { execSync } = require('child_process');

try {
  console.log('Generating Prisma client...');
  execSync('prisma generate', { stdio: 'inherit' });
  
  console.log('\nPushing schema to database...');
  execSync('prisma db push', { stdio: 'inherit' });
  
  console.log('\n✅ Database initialized successfully!');
} catch (error) {
  console.error('❌ Database initialization failed:', error.message);
  process.exit(1);
}
