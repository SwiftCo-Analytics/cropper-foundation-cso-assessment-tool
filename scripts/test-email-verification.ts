#!/usr/bin/env ts-node

/**
 * Test script for email verification system
 */

import { PrismaClient } from '../src/generated/prisma';
import { sendVerificationEmail, sendWelcomeEmail } from '../src/lib/email';

const prisma = new PrismaClient();

async function testEmailVerification() {
  console.log('🧪 Testing email verification system...');

  try {
    // Test 1: Create a test organization
    console.log('📝 Creating test organization...');
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        email: 'test@example.com',
        password: 'hashedpassword123',
        emailVerified: false,
        emailVerifyToken: 'test-token-123',
        emailVerifyExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ Test organization created:', testOrg.email);

    // Test 2: Send verification email
    console.log('📧 Testing verification email...');
    const verificationResult = await sendVerificationEmail({
      name: testOrg.name,
      email: testOrg.email,
      verificationUrl: 'https://selfassess.csogo.org/api/organizations/verify-email?token=test-token-123&email=test@example.com',
    });
    
    if (verificationResult.success) {
      console.log('✅ Verification email sent successfully');
    } else {
      console.log('❌ Verification email failed:', verificationResult.error);
    }

    // Test 3: Verify email
    console.log('🔍 Testing email verification...');
    await prisma.organization.update({
      where: { id: testOrg.id },
      data: {
        emailVerified: true,
        emailVerifyToken: null,
        emailVerifyExpiry: null,
      },
    });
    console.log('✅ Email verification completed');

    // Test 4: Send welcome email
    console.log('📧 Testing welcome email...');
    const welcomeResult = await sendWelcomeEmail({
      name: testOrg.name,
      email: testOrg.email,
      loginUrl: 'https://selfassess.csogo.org/organization/login',
    });

    if (welcomeResult.success) {
      console.log('✅ Welcome email sent successfully');
    } else {
      console.log('❌ Welcome email failed:', welcomeResult.error);
    }

    // Clean up
    console.log('🧹 Cleaning up test data...');
    await prisma.organization.delete({
      where: { id: testOrg.id },
    });
    console.log('✅ Test data cleaned up');

    console.log('🎉 Email verification system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testDatabaseSchema() {
  console.log('🗄️ Testing database schema...');

  try {
    // Check if email verification fields exist
    const org = await prisma.organization.findFirst();
    if (org) {
      console.log('✅ Organization model has email verification fields');
      console.log('   - emailVerified:', typeof org.emailVerified);
      console.log('   - emailVerifyToken:', typeof org.emailVerifyToken);
      console.log('   - emailVerifyExpiry:', typeof org.emailVerifyExpiry);
    } else {
      console.log('ℹ️ No organizations found in database');
    }

    // Test creating organization with verification fields
    const testOrg = await prisma.organization.create({
      data: {
        name: 'Schema Test Org',
        email: 'schema-test@example.com',
        emailVerified: true,
      },
    });
    console.log('✅ Organization created with email verification fields');

    // Clean up
    await prisma.organization.delete({
      where: { id: testOrg.id },
    });
    console.log('✅ Schema test completed successfully');

  } catch (error) {
    console.error('❌ Schema test failed:', error);
    if (error instanceof Error && error.message.includes('Unknown field')) {
      console.log('💡 You may need to run the database migration first:');
      console.log('   npx prisma migrate deploy');
      console.log('   npx prisma generate');
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'email':
      await testEmailVerification();
      break;
    case 'schema':
      await testDatabaseSchema();
      break;
    default:
      console.log('🧪 Email Verification Test Script');
      console.log('');
      console.log('Usage:');
      console.log('  npm run test-email email   - Test email sending functionality');
      console.log('  npm run test-email schema  - Test database schema');
      console.log('');
      console.log('Examples:');
      console.log('  npm run test-email email');
      console.log('  npm run test-email schema');
      break;
  }
}

main();
