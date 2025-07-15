import { PrismaClient, QuestionType } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.response.deleteMany();
  await prisma.question.deleteMany();
  await prisma.section.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.report.deleteMany();

  // Create sections and questions
  const sections = [
    {
      title: "Organizational Governance",
      description: "Assessment of your organization's governance structure and practices",
      questions: [
        {
          text: "Does your organization have a formal board of directors?",
          type: QuestionType.BOOLEAN,
          description: "A formal board provides oversight and strategic direction",
        },
        {
          text: "How often does your board meet?",
          type: QuestionType.SINGLE_CHOICE,
          description: "Regular board meetings are essential for effective governance",
          options: ["Monthly", "Quarterly", "Bi-annually", "Annually", "As needed"],
        },
        {
          text: "Rate your organization's transparency in decision-making",
          type: QuestionType.LIKERT_SCALE,
          description: "1 = Not transparent, 5 = Highly transparent",
        },
      ],
    },
    {
      title: "Financial Management",
      description: "Evaluation of financial practices and controls",
      questions: [
        {
          text: "Which financial controls does your organization have in place?",
          type: QuestionType.MULTIPLE_CHOICE,
          description: "Select all that apply",
          options: [
            "Annual budgeting process",
            "Regular financial audits",
            "Segregation of duties",
            "Written financial policies",
            "Asset management system",
          ],
        },
        {
          text: "How would you rate your organization's financial sustainability?",
          type: QuestionType.LIKERT_SCALE,
          description: "1 = Highly dependent on single source, 5 = Diverse and sustainable funding",
        },
        {
          text: "Describe your organization's approach to financial risk management",
          type: QuestionType.TEXT,
          description: "Include key strategies and challenges",
        },
      ],
    },
    {
      title: "Program Implementation",
      description: "Assessment of program delivery and impact",
      questions: [
        {
          text: "Does your organization have a formal M&E system?",
          type: QuestionType.BOOLEAN,
          description: "Monitoring and Evaluation system for tracking program outcomes",
        },
        {
          text: "How do you measure program success?",
          type: QuestionType.MULTIPLE_CHOICE,
          description: "Select all applicable methods",
          options: [
            "Quantitative indicators",
            "Qualitative feedback",
            "External evaluations",
            "Beneficiary surveys",
            "Impact assessments",
          ],
        },
        {
          text: "Rate your organization's ability to adapt programs based on learning",
          type: QuestionType.LIKERT_SCALE,
          description: "1 = Rigid approach, 5 = Highly adaptive",
        },
      ],
    },
  ];

  for (const [sectionIndex, section] of sections.entries()) {
    const createdSection = await prisma.section.create({
      data: {
        title: section.title,
        description: section.description,
        order: sectionIndex + 1,
        questions: {
          create: section.questions.map((question, questionIndex) => ({
            text: question.text,
            description: question.description,
            type: question.type,
            options: question.options || [],
            order: questionIndex + 1,
          })),
        },
      },
    });

    console.log(`Created section: ${createdSection.title}`);
  }

  // Create some sample recommendations
  const recommendations = [
    {
      category: "governance",
      condition: { score: { lt: 0.6 } },
      text: "Consider establishing a formal board of directors with regular meetings to improve governance",
      priority: 1,
    },
    {
      category: "financial",
      condition: { score: { lt: 0.7 } },
      text: "Implement additional financial controls and develop a financial sustainability strategy",
      priority: 1,
    },
    {
      category: "programs",
      condition: { score: { lt: 0.5 } },
      text: "Develop a formal M&E system to better track and demonstrate program impact",
      priority: 2,
    },
  ];

  for (const recommendation of recommendations) {
    await prisma.recommendation.create({
      data: recommendation,
    });
  }

  console.log(`Seeding completed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 