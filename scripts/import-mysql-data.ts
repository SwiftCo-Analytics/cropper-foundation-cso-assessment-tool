/**
 * Import data from JSON file into MySQL database
 * 
 * Usage:
 *   DATABASE_URL="mysql://user:pass@localhost:3306/dbname" npm run import-mysql
 * 
 * This script imports data from postgres-export.json into MySQL tables
 * in the correct order to maintain referential integrity.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '../src/generated/prisma';

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

async function importData() {
  console.log('🔄 Starting MySQL data import...\n');

  // Check if DATABASE_URL is MySQL
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith('mysql://')) {
    console.error('❌ ERROR: DATABASE_URL or MYSQL_DATABASE_URL must be a MySQL connection string');
    console.error('   Example: mysql://user:password@localhost:3306/database');
    process.exit(1);
  }

  // Check if export file exists
  const exportPath = path.join(process.cwd(), 'postgres-export.json');
  if (!fs.existsSync(exportPath)) {
    console.error(`❌ Export file not found: ${exportPath}`);
    console.error('   Please run the export script first: npm run export-postgres');
    process.exit(1);
  }

  try {
    // Verify connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL database\n');

    // Read export file
    console.log('📖 Reading export file...');
    const fileContent = fs.readFileSync(exportPath, 'utf-8');
    const exportData: ExportData = JSON.parse(fileContent);
    console.log(`✅ Export file loaded (exported at: ${exportData.exportedAt})\n`);

    // Check if database has existing data
    const existingOrgs = await prisma.organization.count();
    if (existingOrgs > 0) {
      console.warn('⚠️  WARNING: Database already contains data!');
      console.warn('   This import will add new records. Duplicates may occur if IDs conflict.\n');
      const answer = process.argv[2];
      if (answer !== '--force') {
        console.error('   Use --force flag to proceed anyway');
        process.exit(1);
      }
    }

    // Import in dependency order to maintain referential integrity
    // Using transactions for data integrity

    await prisma.$transaction(async (tx) => {
      // 1. Independent tables first
      if (exportData.sections.length > 0) {
        console.log(`📦 Importing ${exportData.sections.length} Sections...`);
        for (const section of exportData.sections) {
          await tx.section.upsert({
            where: { id: section.id },
            update: {
              title: section.title,
              description: section.description,
              order: section.order,
              weight: section.weight ?? 1.0,
              createdAt: section.createdAt ? new Date(section.createdAt) : undefined,
              updatedAt: section.updatedAt ? new Date(section.updatedAt) : undefined,
            },
            create: {
              id: section.id,
              title: section.title,
              description: section.description,
              order: section.order,
              weight: section.weight ?? 1.0,
              createdAt: section.createdAt ? new Date(section.createdAt) : undefined,
              updatedAt: section.updatedAt ? new Date(section.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.sections.length} sections`);
      }

      if (exportData.admins.length > 0) {
        console.log(`📦 Importing ${exportData.admins.length} Admins...`);
        for (const admin of exportData.admins) {
          await tx.admin.upsert({
            where: { id: admin.id },
            update: {
              name: admin.name,
              email: admin.email,
              password: admin.password,
              isInvited: admin.isInvited ?? false,
              inviteToken: admin.inviteToken,
              inviteExpiry: admin.inviteExpiry ? new Date(admin.inviteExpiry) : null,
              invitedBy: admin.invitedBy,
              inviteAcceptedAt: admin.inviteAcceptedAt ? new Date(admin.inviteAcceptedAt) : null,
              createdAt: admin.createdAt ? new Date(admin.createdAt) : undefined,
              updatedAt: admin.updatedAt ? new Date(admin.updatedAt) : undefined,
            },
            create: {
              id: admin.id,
              name: admin.name,
              email: admin.email,
              password: admin.password,
              isInvited: admin.isInvited ?? false,
              inviteToken: admin.inviteToken,
              inviteExpiry: admin.inviteExpiry ? new Date(admin.inviteExpiry) : null,
              invitedBy: admin.invitedBy,
              inviteAcceptedAt: admin.inviteAcceptedAt ? new Date(admin.inviteAcceptedAt) : null,
              createdAt: admin.createdAt ? new Date(admin.createdAt) : undefined,
              updatedAt: admin.updatedAt ? new Date(admin.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.admins.length} admins`);
      }

      if (exportData.assessmentSuggestions.length > 0) {
        console.log(`📦 Importing ${exportData.assessmentSuggestions.length} Assessment Suggestions...`);
        for (const suggestion of exportData.assessmentSuggestions) {
          await tx.assessmentSuggestion.create({
            data: {
              id: suggestion.id,
              condition: suggestion.condition, // JSON field - should work directly
              suggestion: suggestion.suggestion,
              category: suggestion.category,
              priority: suggestion.priority ?? 0,
              weight: suggestion.weight ?? 1.0,
              isActive: suggestion.isActive ?? true,
              createdAt: suggestion.createdAt ? new Date(suggestion.createdAt) : undefined,
              updatedAt: suggestion.updatedAt ? new Date(suggestion.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.assessmentSuggestions.length} assessment suggestions`);
      }

      // 2. Tables that depend on Sections
      if (exportData.questions.length > 0) {
        console.log(`📦 Importing ${exportData.questions.length} Questions...`);
        for (const question of exportData.questions) {
          await tx.question.upsert({
            where: { id: question.id },
            update: {
              sectionId: question.sectionId,
              text: question.text,
              description: question.description,
              type: question.type,
              options: question.options, // JSON field
              order: question.order,
              weight: question.weight ?? 1.0,
              isHidden: question.isHidden ?? false,
              mandatory: question.mandatory ?? false,
              createdAt: question.createdAt ? new Date(question.createdAt) : undefined,
              updatedAt: question.updatedAt ? new Date(question.updatedAt) : undefined,
            },
            create: {
              id: question.id,
              sectionId: question.sectionId,
              text: question.text,
              description: question.description,
              type: question.type,
              options: question.options, // JSON field
              order: question.order,
              weight: question.weight ?? 1.0,
              isHidden: question.isHidden ?? false,
              mandatory: question.mandatory ?? false,
              createdAt: question.createdAt ? new Date(question.createdAt) : undefined,
              updatedAt: question.updatedAt ? new Date(question.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.questions.length} questions`);
      }

      if (exportData.questionSuggestions.length > 0) {
        console.log(`📦 Importing ${exportData.questionSuggestions.length} Question Suggestions...`);
        for (const suggestion of exportData.questionSuggestions) {
          await tx.questionSuggestion.create({
            data: {
              id: suggestion.id,
              questionId: suggestion.questionId,
              condition: suggestion.condition, // JSON field
              suggestion: suggestion.suggestion,
              category: suggestion.category,
              priority: suggestion.priority ?? 0,
              weight: suggestion.weight ?? 1.0,
              isActive: suggestion.isActive ?? true,
              createdAt: suggestion.createdAt ? new Date(suggestion.createdAt) : undefined,
              updatedAt: suggestion.updatedAt ? new Date(suggestion.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.questionSuggestions.length} question suggestions`);
      }

      if (exportData.sectionSuggestions.length > 0) {
        console.log(`📦 Importing ${exportData.sectionSuggestions.length} Section Suggestions...`);
        for (const suggestion of exportData.sectionSuggestions) {
          await tx.sectionSuggestion.create({
            data: {
              id: suggestion.id,
              sectionId: suggestion.sectionId,
              condition: suggestion.condition, // JSON field
              suggestion: suggestion.suggestion,
              category: suggestion.category,
              priority: suggestion.priority ?? 0,
              weight: suggestion.weight ?? 1.0,
              isActive: suggestion.isActive ?? true,
              createdAt: suggestion.createdAt ? new Date(suggestion.createdAt) : undefined,
              updatedAt: suggestion.updatedAt ? new Date(suggestion.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.sectionSuggestions.length} section suggestions`);
      }

      // 3. Organizations
      if (exportData.organizations.length > 0) {
        console.log(`📦 Importing ${exportData.organizations.length} Organizations...`);
        for (const org of exportData.organizations) {
          await tx.organization.upsert({
            where: { id: org.id },
            update: {
              name: org.name,
              email: org.email,
              password: org.password,
              emailVerified: org.emailVerified ?? false,
              emailVerifyToken: org.emailVerifyToken,
              emailVerifyExpiry: org.emailVerifyExpiry ? new Date(org.emailVerifyExpiry) : null,
              createdAt: org.createdAt ? new Date(org.createdAt) : undefined,
              updatedAt: org.updatedAt ? new Date(org.updatedAt) : undefined,
            },
            create: {
              id: org.id,
              name: org.name,
              email: org.email,
              password: org.password,
              emailVerified: org.emailVerified ?? false,
              emailVerifyToken: org.emailVerifyToken,
              emailVerifyExpiry: org.emailVerifyExpiry ? new Date(org.emailVerifyExpiry) : null,
              createdAt: org.createdAt ? new Date(org.createdAt) : undefined,
              updatedAt: org.updatedAt ? new Date(org.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.organizations.length} organizations`);
      }

      // 4. Tables that depend on Organizations
      if (exportData.assessments.length > 0) {
        console.log(`📦 Importing ${exportData.assessments.length} Assessments...`);
        for (const assessment of exportData.assessments) {
          await tx.assessment.upsert({
            where: { id: assessment.id },
            update: {
              name: assessment.name,
              organizationId: assessment.organizationId,
              status: assessment.status,
              startedAt: assessment.startedAt ? new Date(assessment.startedAt) : undefined,
              completedAt: assessment.completedAt ? new Date(assessment.completedAt) : null,
              shareableLink: assessment.shareableLink,
              createdAt: assessment.createdAt ? new Date(assessment.createdAt) : undefined,
              updatedAt: assessment.updatedAt ? new Date(assessment.updatedAt) : undefined,
            },
            create: {
              id: assessment.id,
              name: assessment.name,
              organizationId: assessment.organizationId,
              status: assessment.status,
              startedAt: assessment.startedAt ? new Date(assessment.startedAt) : undefined,
              completedAt: assessment.completedAt ? new Date(assessment.completedAt) : null,
              shareableLink: assessment.shareableLink,
              createdAt: assessment.createdAt ? new Date(assessment.createdAt) : undefined,
              updatedAt: assessment.updatedAt ? new Date(assessment.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.assessments.length} assessments`);
      }

      // 5. Tables that depend on Assessments and Questions
      if (exportData.responses.length > 0) {
        console.log(`📦 Importing ${exportData.responses.length} Responses...`);
        for (const response of exportData.responses) {
          await tx.response.create({
            data: {
              id: response.id,
              assessmentId: response.assessmentId,
              questionId: response.questionId,
              value: response.value, // JSON field
              createdAt: response.createdAt ? new Date(response.createdAt) : undefined,
              updatedAt: response.updatedAt ? new Date(response.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.responses.length} responses`);
      }

      // 6. Tables that depend on Assessments
      if (exportData.reports.length > 0) {
        console.log(`📦 Importing ${exportData.reports.length} Reports...`);
        for (const report of exportData.reports) {
          await tx.report.upsert({
            where: { id: report.id },
            update: {
              assessmentId: report.assessmentId,
              content: report.content, // JSON field
              createdAt: report.createdAt ? new Date(report.createdAt) : undefined,
              updatedAt: report.updatedAt ? new Date(report.updatedAt) : undefined,
            },
            create: {
              id: report.id,
              assessmentId: report.assessmentId,
              content: report.content, // JSON field
              createdAt: report.createdAt ? new Date(report.createdAt) : undefined,
              updatedAt: report.updatedAt ? new Date(report.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.reports.length} reports`);
      }

      // 7. Tables that depend on Reports
      if (exportData.reportSuggestions.length > 0) {
        console.log(`📦 Importing ${exportData.reportSuggestions.length} Report Suggestions...`);
        for (const suggestion of exportData.reportSuggestions) {
          await tx.reportSuggestion.create({
            data: {
              id: suggestion.id,
              reportId: suggestion.reportId,
              type: suggestion.type,
              sourceId: suggestion.sourceId,
              suggestion: suggestion.suggestion,
              priority: suggestion.priority ?? 0,
              weight: suggestion.weight ?? 1.0,
              metadata: suggestion.metadata, // JSON field
              createdAt: suggestion.createdAt ? new Date(suggestion.createdAt) : undefined,
              updatedAt: suggestion.updatedAt ? new Date(suggestion.updatedAt) : undefined,
            },
          });
        }
        console.log(`   ✓ Imported ${exportData.reportSuggestions.length} report suggestions`);
      }
    }, {
      timeout: 300000, // 5 minutes timeout for large imports
    });

    console.log('\n✅ Import completed successfully!');
    console.log('\n📊 Import Summary:');
    console.log(`   - Sections: ${exportData.sections.length}`);
    console.log(`   - Questions: ${exportData.questions.length}`);
    console.log(`   - Organizations: ${exportData.organizations.length}`);
    console.log(`   - Assessments: ${exportData.assessments.length}`);
    console.log(`   - Responses: ${exportData.responses.length}`);
    console.log(`   - Reports: ${exportData.reports.length}`);
    console.log(`   - Admins: ${exportData.admins.length}`);
    console.log(`   - Suggestions: ${exportData.questionSuggestions.length + exportData.sectionSuggestions.length + exportData.assessmentSuggestions.length + exportData.reportSuggestions.length}`);

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importData();

