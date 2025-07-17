import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@cropper.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@cropper.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i', // password: admin123
    },
  });

  // Create sections
  const securitySection = await prisma.section.upsert({
    where: { id: 'security-section' },
    update: {},
    create: {
      id: 'security-section',
      title: 'Security Practices',
      description: 'Assessment of security measures and protocols',
      order: 1,
      weight: 1.0,
    },
  });

  const complianceSection = await prisma.section.upsert({
    where: { id: 'compliance-section' },
    update: {},
    create: {
      id: 'compliance-section',
      title: 'Compliance & Governance',
      description: 'Evaluation of compliance frameworks and governance structures',
      order: 2,
      weight: 1.0,
    },
  });

  const operationsSection = await prisma.section.upsert({
    where: { id: 'operations-section' },
    update: {},
    create: {
      id: 'operations-section',
      title: 'Operations & Processes',
      description: 'Assessment of operational procedures and workflows',
      order: 3,
      weight: 1.0,
    },
  });

  // Create questions for Security section
  const securityQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'security-q1' },
      update: {},
      create: {
        id: 'security-q1',
        sectionId: securitySection.id,
        text: 'Does your organization have a formal security policy?',
        description: 'A documented security policy that outlines roles, responsibilities, and procedures',
        type: 'BOOLEAN',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'security-q2' },
      update: {},
      create: {
        id: 'security-q2',
        sectionId: securitySection.id,
        text: 'How often do you conduct security training for employees?',
        description: 'Regular security awareness training for all staff members',
        type: 'SINGLE_CHOICE',
        options: ['Never', 'Annually', 'Semi-annually', 'Quarterly', 'Monthly'],
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'security-q3' },
      update: {},
      create: {
        id: 'security-q3',
        sectionId: securitySection.id,
        text: 'Rate your organization\'s incident response capability',
        description: 'Ability to detect, respond to, and recover from security incidents',
        type: 'LIKERT_SCALE',
        order: 3,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);

  // Create questions for Compliance section
  const complianceQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'compliance-q1' },
      update: {},
      create: {
        id: 'compliance-q1',
        sectionId: complianceSection.id,
        text: 'Do you have a designated compliance officer?',
        description: 'A person responsible for overseeing compliance activities',
        type: 'BOOLEAN',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'compliance-q2' },
      update: {},
      create: {
        id: 'compliance-q2',
        sectionId: complianceSection.id,
        text: 'How would you rate your current compliance monitoring?',
        description: 'Ongoing monitoring and assessment of compliance status',
        type: 'LIKERT_SCALE',
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);

  // Create questions for Operations section
  const operationsQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'operations-q1' },
      update: {},
      create: {
        id: 'operations-q1',
        sectionId: operationsSection.id,
        text: 'Do you have documented standard operating procedures?',
        description: 'Written procedures for key operational activities',
        type: 'BOOLEAN',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'operations-q2' },
      update: {},
      create: {
        id: 'operations-q2',
        sectionId: operationsSection.id,
        text: 'Rate your organization\'s process documentation',
        description: 'Quality and completeness of process documentation',
        type: 'LIKERT_SCALE',
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);



  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 