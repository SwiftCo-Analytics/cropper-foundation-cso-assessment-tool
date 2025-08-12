import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CSO Self-Assessment Tool database...');

  // Clear existing data
  console.log('🗑️ Clearing existing data...');
  await prisma.reportSuggestion.deleteMany();
  await prisma.report.deleteMany();
  await prisma.response.deleteMany();
  await prisma.questionSuggestion.deleteMany();
  await prisma.sectionSuggestion.deleteMany();
  await prisma.assessmentSuggestion.deleteMany();
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.organization.deleteMany();

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

  // Create sections for CSO Self-Assessment Tool
  const governanceSection = await prisma.section.upsert({
    where: { id: 'governance-section' },
    update: {},
    create: {
      id: 'governance-section',
      title: 'Governance',
      description: 'Assessment of governance practices, board oversight, stakeholder engagement, and ethical standards',
      order: 1,
      weight: 1.0,
    },
  });

  const financialSection = await prisma.section.upsert({
    where: { id: 'financial-section' },
    update: {},
    create: {
      id: 'financial-section',
      title: 'Financial Management',
      description: 'Evaluation of financial planning, budgeting, auditing, and sustainability practices',
      order: 2,
      weight: 1.0,
    },
  });

  const programmeSection = await prisma.section.upsert({
    where: { id: 'programme-section' },
    update: {},
    create: {
      id: 'programme-section',
      title: 'Programme/Project Accountability',
      description: 'Assessment of monitoring, evaluation, stakeholder involvement, and programme effectiveness',
      order: 3,
      weight: 1.0,
    },
  });

  const hrSection = await prisma.section.upsert({
    where: { id: 'hr-section' },
    update: {},
    create: {
      id: 'hr-section',
      title: 'Human Resource Accountability',
      description: 'Evaluation of HR strategy, collaboration, workplace environment, and organizational culture',
      order: 4,
      weight: 1.0,
    },
  });

  // Create Governance questions (23 statements)
  const governanceQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'gov-q1' },
      update: {},
      create: {
        id: 'gov-q1',
        sectionId: governanceSection.id,
        text: 'Governing body prioritizes business ethics, corporate responsibility, and social mission',
        description: 'The board demonstrates commitment to ethical practices and social impact',
        type: 'LIKERT_SCALE',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q2' },
      update: {},
      create: {
        id: 'gov-q2',
        sectionId: governanceSection.id,
        text: 'Members of the governing body are independent in character, judgment, and apolitical',
        description: 'Board members demonstrate independence and avoid political bias',
        type: 'LIKERT_SCALE',
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q3' },
      update: {},
      create: {
        id: 'gov-q3',
        sectionId: governanceSection.id,
        text: 'Our governing body provides consistent oversight of the organization',
        description: 'Regular and effective board oversight of organizational activities',
        type: 'LIKERT_SCALE',
        order: 3,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q4' },
      update: {},
      create: {
        id: 'gov-q4',
        sectionId: governanceSection.id,
        text: 'The roles and responsibilities of board members are clearly defined',
        description: 'Clear documentation of board member roles and expectations',
        type: 'LIKERT_SCALE',
        order: 4,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q5' },
      update: {},
      create: {
        id: 'gov-q5',
        sectionId: governanceSection.id,
        text: 'The board is trained and adequately supported to fulfill its duties',
        description: 'Board members receive appropriate training and resources',
        type: 'LIKERT_SCALE',
        order: 5,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q6' },
      update: {},
      create: {
        id: 'gov-q6',
        sectionId: governanceSection.id,
        text: 'We conduct regular self-assessments and external evaluations of board performance',
        description: 'Regular evaluation of board effectiveness and performance',
        type: 'LIKERT_SCALE',
        order: 6,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q7' },
      update: {},
      create: {
        id: 'gov-q7',
        sectionId: governanceSection.id,
        text: 'Stakeholders are identified and prioritized effectively',
        description: 'Systematic identification and prioritization of key stakeholders',
        type: 'LIKERT_SCALE',
        order: 7,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q8' },
      update: {},
      create: {
        id: 'gov-q8',
        sectionId: governanceSection.id,
        text: 'There is active stakeholder participation in decision-making processes',
        description: 'Meaningful stakeholder involvement in organizational decisions',
        type: 'LIKERT_SCALE',
        order: 8,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q9' },
      update: {},
      create: {
        id: 'gov-q9',
        sectionId: governanceSection.id,
        text: 'Marginalized voices are represented in engagement efforts',
        description: 'Inclusion of underrepresented and marginalized communities',
        type: 'LIKERT_SCALE',
        order: 9,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q10' },
      update: {},
      create: {
        id: 'gov-q10',
        sectionId: governanceSection.id,
        text: 'Relationships with other CSOs, government entities, and private sector partners are transparent',
        description: 'Transparent partnerships and collaborations with various sectors',
        type: 'LIKERT_SCALE',
        order: 10,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q11' },
      update: {},
      create: {
        id: 'gov-q11',
        sectionId: governanceSection.id,
        text: 'There is evidence of collaboration in strategic initiatives',
        description: 'Demonstrated collaboration in key strategic projects',
        type: 'LIKERT_SCALE',
        order: 11,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q12' },
      update: {},
      create: {
        id: 'gov-q12',
        sectionId: governanceSection.id,
        text: 'Ethical standards and guidelines are enforced',
        description: 'Active enforcement of ethical policies and guidelines',
        type: 'LIKERT_SCALE',
        order: 12,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q13' },
      update: {},
      create: {
        id: 'gov-q13',
        sectionId: governanceSection.id,
        text: 'Our organization has signed on to the Revised Caribbean Policy Development Centre\'s (CPDC) Code of Conduct and Ethics for Caribbean NGOs',
        description: 'Commitment to regional ethical standards for NGOs',
        type: 'BOOLEAN',
        order: 13,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q14' },
      update: {},
      create: {
        id: 'gov-q14',
        sectionId: governanceSection.id,
        text: 'Our organization is informed about and compliant with the relevant legal framework governing CSOs in Trinidad and Tobago, including registration requirements and compliance with the Companies Act 1995 or the NPO Act 2019',
        description: 'Legal compliance with Trinidad and Tobago CSO regulations',
        type: 'LIKERT_SCALE',
        order: 14,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q15' },
      update: {},
      create: {
        id: 'gov-q15',
        sectionId: governanceSection.id,
        text: 'A risk management plan is developed to identify potential risks and create mitigation strategies',
        description: 'Comprehensive risk management planning and implementation',
        type: 'LIKERT_SCALE',
        order: 15,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q16' },
      update: {},
      create: {
        id: 'gov-q16',
        sectionId: governanceSection.id,
        text: 'A crisis communication plan is developed for transparent communication during crises to maintain trust',
        description: 'Crisis communication planning and transparency protocols',
        type: 'LIKERT_SCALE',
        order: 16,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q17' },
      update: {},
      create: {
        id: 'gov-q17',
        sectionId: governanceSection.id,
        text: 'Key policies such as HR management, financial management, and IT security are established and in place',
        description: 'Comprehensive policy framework across key organizational areas',
        type: 'LIKERT_SCALE',
        order: 17,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q18' },
      update: {},
      create: {
        id: 'gov-q18',
        sectionId: governanceSection.id,
        text: 'Policies are regularly reviewed and updated as needed',
        description: 'Regular policy review and update processes',
        type: 'LIKERT_SCALE',
        order: 18,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q19' },
      update: {},
      create: {
        id: 'gov-q19',
        sectionId: governanceSection.id,
        text: 'Information about the organization\'s work is accessible and understandable to stakeholders',
        description: 'Transparent and accessible information sharing with stakeholders',
        type: 'LIKERT_SCALE',
        order: 19,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q20' },
      update: {},
      create: {
        id: 'gov-q20',
        sectionId: governanceSection.id,
        text: 'Communication channels are established for stakeholder feedback',
        description: 'Established feedback mechanisms for stakeholder input',
        type: 'LIKERT_SCALE',
        order: 20,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q21' },
      update: {},
      create: {
        id: 'gov-q21',
        sectionId: governanceSection.id,
        text: 'Platforms like social media, websites and newsletters are regularly utilized to keep stakeholders informed about organizational developments',
        description: 'Regular use of communication platforms to inform stakeholders',
        type: 'LIKERT_SCALE',
        order: 21,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q22' },
      update: {},
      create: {
        id: 'gov-q22',
        sectionId: governanceSection.id,
        text: 'Annual reports and financial statements are prepared and disseminated in a timely manner',
        description: 'Timely preparation and distribution of annual reports and financial statements',
        type: 'LIKERT_SCALE',
        order: 22,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'gov-q23' },
      update: {},
      create: {
        id: 'gov-q23',
        sectionId: governanceSection.id,
        text: 'Information about governance structures and decision-making processes are accessible to stakeholders',
        description: 'Transparency in governance structures and decision-making processes',
        type: 'LIKERT_SCALE',
        order: 23,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);

  // Create Financial Management questions (10 statements)
  const financialQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'fin-q1' },
      update: {},
      create: {
        id: 'fin-q1',
        sectionId: financialSection.id,
        text: 'Budgeting and financial planning processes are aligned with strategic goals',
        description: 'Financial planning that supports organizational strategic objectives',
        type: 'LIKERT_SCALE',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q2' },
      update: {},
      create: {
        id: 'fin-q2',
        sectionId: financialSection.id,
        text: 'A system for participatory budgeting is implemented',
        description: 'Inclusive budgeting processes involving key stakeholders',
        type: 'LIKERT_SCALE',
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q3' },
      update: {},
      create: {
        id: 'fin-q3',
        sectionId: financialSection.id,
        text: 'Regular audits are conducted and recommendations are implemented',
        description: 'Regular financial audits with follow-through on recommendations',
        type: 'LIKERT_SCALE',
        order: 3,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q4' },
      update: {},
      create: {
        id: 'fin-q4',
        sectionId: financialSection.id,
        text: 'Funding strategies promote long-term sustainability',
        description: 'Sustainable funding approaches for organizational longevity',
        type: 'LIKERT_SCALE',
        order: 4,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q5' },
      update: {},
      create: {
        id: 'fin-q5',
        sectionId: financialSection.id,
        text: 'Organizational performance is reviewed against determined criteria and corrective action taken to arrest and reverse declining financial performance and results',
        description: 'Regular performance review and corrective action for financial issues',
        type: 'LIKERT_SCALE',
        order: 5,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q6' },
      update: {},
      create: {
        id: 'fin-q6',
        sectionId: financialSection.id,
        text: 'Accurate records of organizational property and resources are maintained and all assets safeguarded',
        description: 'Proper asset management and safeguarding of organizational resources',
        type: 'LIKERT_SCALE',
        order: 6,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q7' },
      update: {},
      create: {
        id: 'fin-q7',
        sectionId: financialSection.id,
        text: 'Financial reports/management accounts are timely, accessible and understandable to stakeholders',
        description: 'Transparent and accessible financial reporting to stakeholders',
        type: 'LIKERT_SCALE',
        order: 7,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q8' },
      update: {},
      create: {
        id: 'fin-q8',
        sectionId: financialSection.id,
        text: 'Donor intent is respected and transparent reports provided to donors on the use of funds',
        description: 'Respect for donor intent and transparent donor reporting',
        type: 'LIKERT_SCALE',
        order: 8,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q9' },
      update: {},
      create: {
        id: 'fin-q9',
        sectionId: financialSection.id,
        text: 'A Fund Accounting System is implemented where necessary',
        description: 'Implementation of appropriate fund accounting systems',
        type: 'LIKERT_SCALE',
        order: 9,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'fin-q10' },
      update: {},
      create: {
        id: 'fin-q10',
        sectionId: financialSection.id,
        text: 'Due diligence on potential and current donors is conducted to mitigate against being used as channels for Terrorist Financing and Money Laundering',
        description: 'Donor due diligence to prevent financial crime risks',
        type: 'LIKERT_SCALE',
        order: 10,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);

  // Create Programme/Project Accountability questions (6 statements)
  const programmeQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'prog-q1' },
      update: {},
      create: {
        id: 'prog-q1',
        sectionId: programmeSection.id,
        text: 'Monitoring and evaluation systems are established to effectively measure programme outcomes and impact',
        description: 'Comprehensive M&E systems for measuring programme effectiveness',
        type: 'LIKERT_SCALE',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'prog-q2' },
      update: {},
      create: {
        id: 'prog-q2',
        sectionId: programmeSection.id,
        text: 'Clear performance indicators for measuring success are established for all programmes and projects',
        description: 'Well-defined KPIs for programme and project success measurement',
        type: 'LIKERT_SCALE',
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'prog-q3' },
      update: {},
      create: {
        id: 'prog-q3',
        sectionId: programmeSection.id,
        text: 'Regular assessments are conducted to evaluate programme effectiveness and impact',
        description: 'Regular evaluation of programme effectiveness and impact',
        type: 'LIKERT_SCALE',
        order: 3,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'prog-q4' },
      update: {},
      create: {
        id: 'prog-q4',
        sectionId: programmeSection.id,
        text: 'Stakeholders including beneficiaries and partners are involved in programme design and evaluation',
        description: 'Inclusive stakeholder involvement in programme design and evaluation',
        type: 'LIKERT_SCALE',
        order: 4,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'prog-q5' },
      update: {},
      create: {
        id: 'prog-q5',
        sectionId: programmeSection.id,
        text: 'Feedback mechanisms, e.g. community forums and surveys, exist',
        description: 'Established feedback mechanisms for programme improvement',
        type: 'LIKERT_SCALE',
        order: 5,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'prog-q6' },
      update: {},
      create: {
        id: 'prog-q6',
        sectionId: programmeSection.id,
        text: 'Programmes are adapted to changing needs and contexts',
        description: 'Flexible programme adaptation to changing circumstances',
        type: 'LIKERT_SCALE',
        order: 6,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);

  // Create Human Resource Accountability questions (4 statements)
  const hrQuestions = await Promise.all([
    prisma.question.upsert({
      where: { id: 'hr-q1' },
      update: {},
      create: {
        id: 'hr-q1',
        sectionId: hrSection.id,
        text: 'Our organization has an HR strategy which aligns with vision, mission and goals',
        description: 'HR strategy that supports organizational vision and mission',
        type: 'LIKERT_SCALE',
        order: 1,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'hr-q2' },
      update: {},
      create: {
        id: 'hr-q2',
        sectionId: hrSection.id,
        text: 'Our organization actively encourages partnership and collaboration',
        description: 'Active promotion of partnership and collaborative approaches',
        type: 'LIKERT_SCALE',
        order: 2,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'hr-q3' },
      update: {},
      create: {
        id: 'hr-q3',
        sectionId: hrSection.id,
        text: 'We actively create respectful and motivating in-person and online workspaces',
        description: 'Creation of positive and motivating work environments',
        type: 'LIKERT_SCALE',
        order: 3,
        weight: 1.0,
        mandatory: true,
      },
    }),
    prisma.question.upsert({
      where: { id: 'hr-q4' },
      update: {},
      create: {
        id: 'hr-q4',
        sectionId: hrSection.id,
        text: 'Everybody in our organization embraces our HR vision and proactively contributes to its implementation',
        description: 'Organization-wide commitment to HR vision and implementation',
        type: 'LIKERT_SCALE',
        order: 4,
        weight: 1.0,
        mandatory: true,
      },
    }),
  ]);

  // Create assessment-level suggestions for different score ranges
  const assessmentSuggestions = await Promise.all([
    // Emerging Organization (5-40% or 43-86 points)
    prisma.assessmentSuggestion.upsert({
      where: { id: 'emerging-overall' },
      update: {},
      create: {
        id: 'emerging-overall',
        condition: { overallScore: { min: 43, max: 86 } },
        suggestion: 'You are an Emerging Organization. Your organization is in the early stages of building accountability. This is a critical period to establish your foundation — and the good news is that small wins can create big momentum. Start with essential systems like board structure, financial tracking, and legal compliance. Use simple tools like checklists and templates to get moving, and seek support from peer organizations or umbrella bodies as needed.',
        category: 'Overall Assessment',
        priority: 10,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'emerging-governance' },
      update: {},
      create: {
        id: 'emerging-governance',
        condition: { sectionScore: { section: 'governance-section', min: 23, max: 46 } },
        suggestion: 'It\'s time to get the fundamentals in place. Consider conducting a governance audit to identify critical gaps in oversight and board function. Provide training to ensure board members fully understand their fiduciary roles and responsibilities. For example, use a simple checklist to assess how often the board meets, if minutes are documented, and whether board members have signed a code of conduct.',
        category: 'Governance',
        priority: 9,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'emerging-financial' },
      update: {},
      create: {
        id: 'emerging-financial',
        condition: { sectionScore: { section: 'financial-section', min: 10, max: 20 } },
        suggestion: 'It\'s time to take some steps that will ensure improved financial accountability. For example, start using simple accounting tools (e.g. spreadsheets or free software), develop basic financial protocols like expense tracking and approval processes and do due diligence on your current and potential donors.',
        category: 'Financial Management',
        priority: 9,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'emerging-programme' },
      update: {},
      create: {
        id: 'emerging-programme',
        condition: { sectionScore: { section: 'programme-section', min: 6, max: 12 } },
        suggestion: 'This is the opportune time to put systems in place for good programme and project accountability from the outset. For example ensure that programmes and projects are aligned with your mission, vision and strategic goals, and that monitoring and evaluation systems are in place.',
        category: 'Programme/Project Accountability',
        priority: 9,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'emerging-hr' },
      update: {},
      create: {
        id: 'emerging-hr',
        condition: { sectionScore: { section: 'hr-section', min: 4, max: 8 } },
        suggestion: 'Now is the time to start developing your volunteers and staff so they contribute effectively to the achievement of your CSO\'s goals. For example, draft an HR strategy that aligns with your CSO\'s vision, mission and goals, and reinforce the message that each member plays an integral role in upholding and bringing the vision to pass.',
        category: 'Human Resource Management',
        priority: 9,
        weight: 1.0,
        isActive: true,
      },
    }),

    // Strong Foundation (41-79% or 87-170 points)
    prisma.assessmentSuggestion.upsert({
      where: { id: 'strong-overall' },
      update: {},
      create: {
        id: 'strong-overall',
        condition: { overallScore: { min: 87, max: 170 } },
        suggestion: 'You Have a Strong Foundation. Your organization has a solid accountability structure in place. You\'re doing well — now\'s the time to focus on specific areas that could move you toward sector leadership. Use your scores to prioritize improvements — for example, if transparency or crisis planning scored lower, choose one to address this quarter. A few targeted upgrades can elevate your overall impact and credibility.',
        category: 'Overall Assessment',
        priority: 8,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'strong-governance' },
      update: {},
      create: {
        id: 'strong-governance',
        condition: { sectionScore: { section: 'governance-section', min: 47, max: 91 } },
        suggestion: 'Your board is functioning well. To stay on track, continue documenting decisions, refining practices, and mentoring new board members to maintain strong institutional knowledge and accountability. For example, develop a board orientation package and assign a mentor from the current board to support new members for their first six months.',
        category: 'Governance',
        priority: 7,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'strong-financial' },
      update: {},
      create: {
        id: 'strong-financial',
        condition: { sectionScore: { section: 'financial-section', min: 21, max: 40 } },
        suggestion: 'Now that you have a proven solid financial management base, press towards cutting-edge accountability. For example, proactively develop funding strategies to promote your organisation\'s sustainability.',
        category: 'Financial Management',
        priority: 7,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'strong-programme' },
      update: {},
      create: {
        id: 'strong-programme',
        condition: { sectionScore: { section: 'programme-section', min: 13, max: 24 } },
        suggestion: 'The design of your programmes and projects is informed by systems analysis and strategic goals with project partners (donors, other CSOs) are proactively selected because of their alignment with your vision. Explore more sophisticated project tools to ensure and highlight documented project success. For example, utilize real-time, online project monitoring and evaluation software. Integrate lessons learned from previous projects for continuous improvement. Demonstrate your emerging leadership by initiating or joining multi-sectoral, collaborative interventions.',
        category: 'Programme/Project Accountability',
        priority: 7,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'strong-hr' },
      update: {},
      create: {
        id: 'strong-hr',
        condition: { sectionScore: { section: 'hr-section', min: 9, max: 16 } },
        suggestion: 'You have made good progress. You are well on your way to creating an enabling work environment, key for a civil society organization to thrive. To build on your achievements here are some concrete recommendations. For example, develop new policies to address remote work and enhanced cybersecurity in post COVID and AI contexts.',
        category: 'Human Resource Management',
        priority: 7,
        weight: 1.0,
        isActive: true,
      },
    }),

    // Leading Organization (80-100% or 171-215 points)
    prisma.assessmentSuggestion.upsert({
      where: { id: 'leading-overall' },
      update: {},
      create: {
        id: 'leading-overall',
        condition: { overallScore: { min: 171, max: 215 } },
        suggestion: 'You are a Recognized Leader in the Civil Society Sector. You demonstrate strong accountability across your organization. Your systems are clear, consistent, and well-documented. This is the kind of practice that builds public trust and positions your CSO as a sector leader. Consider sharing your strategies through case studies, workshops, or peer mentoring to support other CSOs. Even top performers benefit from reviewing practices annually to stay sharp and adapt to change.',
        category: 'Overall Assessment',
        priority: 6,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'leading-governance' },
      update: {},
      create: {
        id: 'leading-governance',
        condition: { sectionScore: { section: 'governance-section', min: 92, max: 115 } },
        suggestion: 'Your board is functioning well. To stay on track, continue documenting decisions, refining practices, and mentoring new board members to maintain strong institutional knowledge and accountability. For example, develop a board orientation package and assign a mentor from the current board to support new members for their first six months.',
        category: 'Governance',
        priority: 5,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'leading-financial' },
      update: {},
      create: {
        id: 'leading-financial',
        condition: { sectionScore: { section: 'financial-section', min: 41, max: 50 } },
        suggestion: 'Your reputation for rigorous financial accountability and transparency precedes you. You are also sought out as a reputable partner for multi-level programmes by international, regional, state and private sector funders. You are often regarded as an umbrella organization through which large numbers of CSOs could benefit from critical financial capacity-building initiatives. For example, your organization could focus on leading the research, adaptation and implementation of global best fiscal practice to be applied within the national and regional spheres.',
        category: 'Financial Management',
        priority: 5,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'leading-programme' },
      update: {},
      create: {
        id: 'leading-programme',
        condition: { sectionScore: { section: 'programme-section', min: 25, max: 30 } },
        suggestion: 'Your partnerships are solid. Now\'s the time to deepen those relationships through joint initiatives, co-hosted events, and regular strategy sessions to amplify impact. For example, consider sharing your success by publishing case studies and highlighting examples where stakeholder input directly influenced your work.',
        category: 'Programme/Project Accountability',
        priority: 5,
        weight: 1.0,
        isActive: true,
      },
    }),
    prisma.assessmentSuggestion.upsert({
      where: { id: 'leading-hr' },
      update: {},
      create: {
        id: 'leading-hr',
        condition: { sectionScore: { section: 'hr-section', min: 17, max: 20 } },
        suggestion: 'Congratulations, your organization attracts and retains highly skilled personnel who thrive. Share your success within the sector: For example, while maintaining the cutting edge in this area, encourage board, staff and volunteers to pay it forward by finding ways to generously share lessons learned about establishing and maintaining creative and motivating workspaces.',
        category: 'Human Resource Management',
        priority: 5,
        weight: 1.0,
        isActive: true,
      },
    }),
  ]);

  console.log('✅ CSO Self-Assessment Tool database seeded successfully');
  console.log(`📊 Created ${governanceQuestions.length} Governance questions`);
  console.log(`💰 Created ${financialQuestions.length} Financial Management questions`);
  console.log(`📋 Created ${programmeQuestions.length} Programme/Project Accountability questions`);
  console.log(`👥 Created ${hrQuestions.length} Human Resource Accountability questions`);
  console.log(`💡 Created ${assessmentSuggestions.length} assessment-level suggestions`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 