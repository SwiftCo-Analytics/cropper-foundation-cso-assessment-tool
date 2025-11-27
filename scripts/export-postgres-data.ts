/**
 * Export data from PostgreSQL database to JSON file
 * 
 * IMPORTANT: This script requires temporarily switching your Prisma schema to PostgreSQL.
 * 
 * Usage:
 *   1. Temporarily change prisma/schema.prisma provider to "postgresql"
 *   2. Run: npx prisma generate
 *   3. Run: DATABASE_URL="postgresql://user:pass@localhost:5432/dbname" npm run export-postgres
 *   4. Change schema back to "mysql"
 *   5. Run: npx prisma generate
 * 
 * Or use the helper script: npm run export-postgres-helper
 * 
 * This script exports all data from PostgreSQL tables in the correct order
 * to maintain referential integrity during import.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '../src/generated/prisma';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const prisma = new PrismaClient();

interface ExportData {
  organizations: any[];
  sections: any[];
  questions: any[];
  questionSuggestions: any[];
  sectionSuggestions: any[];
  assessmentSuggestions: any[];
  admins: any[];
  assessments: any[];
  responses: any[];
  reports: any[];
  reportSuggestions: any[];
  exportedAt: string;
}

async function exportData() {
  console.log('🔄 Starting PostgreSQL data export...\n');

  // Check if DATABASE_URL is PostgreSQL
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith('postgresql://')) {
    console.error('❌ ERROR: DATABASE_URL or POSTGRES_DATABASE_URL must be a PostgreSQL connection string');
    console.error('   Example: postgresql://user:password@localhost:5432/database');
    console.error('\n   Also ensure:');
    console.error('   1. prisma/schema.prisma provider is set to "postgresql"');
    console.error('   2. You have run: npx prisma generate');
    process.exit(1);
  }

  try {
    // Verify connection
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database\n');

    const exportData: ExportData = {
      organizations: [],
      sections: [],
      questions: [],
      questionSuggestions: [],
      sectionSuggestions: [],
      assessmentSuggestions: [],
      admins: [],
      assessments: [],
      responses: [],
      reports: [],
      reportSuggestions: [],
      exportedAt: new Date().toISOString(),
    };

    // Export in dependency order to maintain referential integrity

    // 1. Independent tables first
    console.log('📦 Exporting Sections...');
    exportData.sections = await prisma.section.findMany({
      orderBy: { order: 'asc' },
    });
    console.log(`   ✓ Exported ${exportData.sections.length} sections`);

    console.log('📦 Exporting Admins...');
    exportData.admins = await prisma.admin.findMany();
    console.log(`   ✓ Exported ${exportData.admins.length} admins`);

    console.log('📦 Exporting Assessment Suggestions...');
    exportData.assessmentSuggestions = await prisma.assessmentSuggestion.findMany();
    console.log(`   ✓ Exported ${exportData.assessmentSuggestions.length} assessment suggestions`);

    // 2. Tables that depend on Sections
    console.log('📦 Exporting Questions...');
    exportData.questions = await prisma.question.findMany({
      orderBy: { order: 'asc' },
    });
    console.log(`   ✓ Exported ${exportData.questions.length} questions`);

    console.log('📦 Exporting Question Suggestions...');
    exportData.questionSuggestions = await prisma.questionSuggestion.findMany();
    console.log(`   ✓ Exported ${exportData.questionSuggestions.length} question suggestions`);

    console.log('📦 Exporting Section Suggestions...');
    exportData.sectionSuggestions = await prisma.sectionSuggestion.findMany();
    console.log(`   ✓ Exported ${exportData.sectionSuggestions.length} section suggestions`);

    // 3. Organizations
    console.log('📦 Exporting Organizations...');
    exportData.organizations = await prisma.organization.findMany();
    console.log(`   ✓ Exported ${exportData.organizations.length} organizations`);

    // 4. Tables that depend on Organizations
    console.log('📦 Exporting Assessments...');
    exportData.assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: 'asc' },
    });
    console.log(`   ✓ Exported ${exportData.assessments.length} assessments`);

    // 5. Tables that depend on Assessments and Questions
    console.log('📦 Exporting Responses...');
    exportData.responses = await prisma.response.findMany();
    console.log(`   ✓ Exported ${exportData.responses.length} responses`);

    // 6. Tables that depend on Assessments
    console.log('📦 Exporting Reports...');
    exportData.reports = await prisma.report.findMany();
    console.log(`   ✓ Exported ${exportData.reports.length} reports`);

    // 7. Tables that depend on Reports
    console.log('📦 Exporting Report Suggestions...');
    exportData.reportSuggestions = await prisma.reportSuggestion.findMany();
    console.log(`   ✓ Exported ${exportData.reportSuggestions.length} report suggestions`);

    // Save to file
    const outputPath = path.join(process.cwd(), 'postgres-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log('\n✅ Export completed successfully!');
    console.log(`📁 Data exported to: ${outputPath}`);
    console.log('\n📊 Export Summary:');
    console.log(`   - Sections: ${exportData.sections.length}`);
    console.log(`   - Questions: ${exportData.questions.length}`);
    console.log(`   - Organizations: ${exportData.organizations.length}`);
    console.log(`   - Assessments: ${exportData.assessments.length}`);
    console.log(`   - Responses: ${exportData.responses.length}`);
    console.log(`   - Reports: ${exportData.reports.length}`);
    console.log(`   - Admins: ${exportData.admins.length}`);
    console.log(`   - Suggestions: ${exportData.questionSuggestions.length + exportData.sectionSuggestions.length + exportData.assessmentSuggestions.length + exportData.reportSuggestions.length}`);

  } catch (error) {
    console.error('\n❌ Error during export:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run export
exportData();

