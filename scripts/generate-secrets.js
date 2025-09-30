#!/usr/bin/env node

/**
 * Security Secret Generator
 *
 * This script generates cryptographically secure secrets for your application.
 * Run this script to generate new secrets before production deployment.
 *
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64');
}

function generateHex(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         SECURITY SECRETS GENERATOR                         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('🔐 Generated Secure Secrets:\n');
console.log('─────────────────────────────────────────────────────────────');

console.log('\n1. NextAuth Secret (Copy to NEXTAUTH_SECRET):');
console.log('   ' + generateSecret(32));

console.log('\n2. Alternative NextAuth Secret:');
console.log('   ' + generateSecret(32));

console.log('\n3. API Key (32 bytes hex):');
console.log('   ' + generateHex(32));

console.log('\n4. Session Token Secret:');
console.log('   ' + generateSecret(24));

console.log('\n5. CSRF Token Secret:');
console.log('   ' + generateHex(32));

console.log('\n─────────────────────────────────────────────────────────────\n');

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('   1. Keep these secrets confidential');
console.log('   2. Never commit secrets to version control');
console.log('   3. Use different secrets for dev/staging/production');
console.log('   4. Rotate secrets regularly (at least quarterly)');
console.log('   5. Store production secrets in a secrets manager\n');

console.log('📋 TODO for Production:');
console.log('   ✓ Generate new NEXTAUTH_SECRET');
console.log('   ✓ Rotate Google OAuth credentials');
console.log('   ✓ Generate new payment gateway keys');
console.log('   ✓ Rotate email service API keys');
console.log('   ✓ Update UploadThing tokens');
console.log('   ✓ Remove all secrets from .env.local before committing\n');

console.log('═════════════════════════════════════════════════════════════\n');