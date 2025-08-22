import jsPDF from "jspdf";
import { Organization, Assessment, Report, ReportSuggestion } from "../generated/prisma";

export interface CSOScores {
  governanceScore: number;
  financialScore: number;
  programmeScore: number;
  hrScore: number;
  totalScore: number;
  governancePercentage: number;
  financialPercentage: number;
  programmePercentage: number;
  hrPercentage: number;
  totalPercentage: number;
  overallLevel: 'Emerging Organization' | 'Strong Foundation' | 'Leading Organization';
}

export interface ReportData {
  organization: Organization;
  assessment: Assessment;
  report: Report;
  scores: CSOScores;
  suggestions: ReportSuggestion[];
}

export class ReportGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;
  private readonly pageHeight = 280;
  private readonly margin = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  public generateReport(data: ReportData): ArrayBuffer {
    this.addTitlePage(data);
    this.addProjectPartners();
    this.addReportHeader(data);
    this.addCongratulations(data);
    this.addRatingsExplanation();
    this.addSummaryScores(data);
    this.addVisualization(data);
    this.addSectionHighlights(data);
    this.addActionPlan(data);
    this.addStakeholderEngagement();

    return this.doc.output('arraybuffer');
  }

  private addTitlePage(data: ReportData) {
    // Title Page
    this.doc.setFontSize(24);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("IGNITE CSOs", 105, 40, { align: "center" });
    
    this.doc.setFontSize(18);
    this.doc.text("CSO Self-Assessment", 105, 60, { align: "center" });
    this.doc.text("Your Organisation's Report", 105, 75, { align: "center" });
    
    this.doc.setFontSize(16);
    this.doc.text(data.organization.name, 105, 95, { align: "center" });
    
    this.doc.addPage();
    this.yPosition = 20;
  }

  private addProjectPartners() {
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("🏛 Project Partners", this.margin, this.yPosition);
    this.yPosition += 15;

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    const partners = [
      "• The Cropper Foundation",
      "• Veni Apwann", 
      "• European Union (Funding Agency)"
    ];

    partners.forEach(partner => {
      this.doc.text(partner, this.margin + 10, this.yPosition);
      this.yPosition += 8;
    });

    this.doc.text("(Logos for each partner would be placed here in a clean horizontal layout or triangular formation for visual balance.)", this.margin, this.yPosition);
    this.yPosition += 20;
  }

  private addReportHeader(data: ReportData) {
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("🔥 IGNITE CSOs Self-Assessment Report", this.margin, this.yPosition);
    this.yPosition += 15;

    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Reporting Period: January – December 2024`, this.margin, this.yPosition);
    this.yPosition += 8;
    this.doc.text(`Date of Submission: ${data.assessment.completedAt?.toLocaleDateString() || new Date().toLocaleDateString()}`, this.margin, this.yPosition);
    this.yPosition += 8;
    this.doc.text(`Assessment Tool Used: CPDC Accountability Assessment Tool for CSOs`, this.margin, this.yPosition);
    this.yPosition += 20;
  }

  private addCongratulations(data: ReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("🎉 Congratulations!", this.margin, this.yPosition);
    this.yPosition += 12;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    const congratulationsText = `${data.organization.name} has successfully completed the IGNITE CSOs Self-Assessment—a significant achievement in strengthening transparency, governance, and impact. This process reflects your commitment to ethical leadership, stakeholder engagement, and continuous improvement. You are setting a powerful example for CSOs across the region. Bravo!`;
    
    const lines = this.doc.splitTextToSize(congratulationsText, 170);
    lines.forEach((line: string) => {
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 6;
    });
    this.yPosition += 15;
  }

  private addRatingsExplanation() {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("📘 Understanding the Ratings", this.margin, this.yPosition);
    this.yPosition += 12;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("The assessment tool categorizes organizations based on their total score out of 215:", this.margin, this.yPosition);
    this.yPosition += 10;

    // Create table
    const tableData = [
      ['Category', 'Score Range', 'Interpretation'],
      ['Emerging Organization', '43–86 (5–40%)', 'Basic structures in place; needs significant development in accountability systems'],
      ['Strong Foundation', '87–170 (41–79%)', 'Solid operational base; room to strengthen strategic and governance practices'],
      ['Leading Organization', '171–215 (80–100%)', 'Exemplary accountability; systems are mature, transparent, and stakeholder-driven']
    ];

    this.addTable(tableData, this.margin, this.yPosition);
    this.yPosition += 60;
  }

  private addSummaryScores(data: ReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("📊 Summary of Scores", this.margin, this.yPosition);
    this.yPosition += 12;

    const summaryData = [
      ['Assessment Area', 'Max Score', 'Actual Score', '% Achieved', 'Rating'],
      ['Governing Body Accountability', '115', data.scores.governanceScore.toString(), `${Math.round(data.scores.governancePercentage)}%`, this.getRating(data.scores.governancePercentage)],
      ['Financial Management', '50', data.scores.financialScore.toString(), `${Math.round(data.scores.financialPercentage)}%`, this.getRating(data.scores.financialPercentage)],
      ['Programme/Project Accountability', '30', data.scores.programmeScore.toString(), `${Math.round(data.scores.programmePercentage)}%`, this.getRating(data.scores.programmePercentage)],
      ['Human Resource Accountability', '20', data.scores.hrScore.toString(), `${Math.round(data.scores.hrPercentage)}%`, this.getRating(data.scores.hrPercentage)],
      ['Total', '215', data.scores.totalScore.toString(), `${Math.round(data.scores.totalPercentage)}%`, data.scores.overallLevel]
    ];

    this.addTable(summaryData, this.margin, this.yPosition);
    this.yPosition += 80;

    // Add category note
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "italic");
    this.doc.text(`${data.organization.name} scored ${data.scores.totalScore}, placing it in the ${data.scores.overallLevel} category. 🌟`, this.margin, this.yPosition);
    this.yPosition += 20;
  }

  private addVisualization(data: ReportData) {
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("📊 Visualizing the Results", this.margin, this.yPosition);
    this.yPosition += 12;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Bar Graph: Max vs Actual Scores by Assessment Area", this.margin, this.yPosition);
    this.yPosition += 8;
    this.doc.text("This graph compares actual scores against the maximum possible scores across each category.", this.margin, this.yPosition);
    this.yPosition += 15;

    // Simple bar chart representation
    this.drawBarChart(data);
    this.yPosition += 60;

    this.doc.text("This graph makes it easy to spot strengths and areas for improvement at a glance.", this.margin, this.yPosition);
    this.yPosition += 8;
    this.doc.text("Governing Body and Programme/Project Accountability are standout performers, while Financial Management and HR show solid foundations with room to grow.", this.margin, this.yPosition);
    this.yPosition += 20;
  }

  private addSectionHighlights(data: ReportData) {
    const sections = [
      {
        title: "🏛 Governance Highlights",
        highlights: [
          "Strong ethical leadership and strategic oversight from the board",
          "Clear roles and responsibilities; annual board training conducted",
          "Signed CPDC Code of Conduct and Ethics for Caribbean NGOs",
          "Inclusive stakeholder engagement, especially marginalized voices",
          "Transparent communication and accessible governance information"
        ],
        improvements: [
          "Develop and test a crisis communication protocol",
          "Increase frequency of board self-assessments"
        ]
      },
      {
        title: "💰 Financial Management Overview",
        highlights: [
          "Budgeting aligns with strategic goals",
          "Annual audits conducted with follow-up actions",
          "Financial reports shared with donors and stakeholders",
          "Due diligence protocols in place for donor vetting"
        ],
        improvements: [
          "Expand long-term funding strategies",
          "Improve asset tracking and fund accounting systems"
        ]
      },
      {
        title: "📈 Programme/Project Accountability",
        highlights: [
          "Defined performance indicators for all projects",
          "Beneficiary involvement in design and evaluation",
          "Responsive programming based on community feedback"
        ],
        improvements: [
          "Enhance documentation of impact assessments",
          "Formalize feedback loops for partner organizations"
        ]
      },
      {
        title: "👥 Human Resource Management",
        highlights: [
          "HR strategy aligned with mission and values",
          "Inclusive and respectful workspaces",
          "Staff collaboration and engagement encouraged"
        ],
        improvements: [
          "Increase staff participation in HR policy reviews",
          "Expand professional development opportunities"
        ]
      }
    ];

    sections.forEach(section => {
      if (this.yPosition > this.pageHeight - 100) {
        this.doc.addPage();
        this.yPosition = 20;
      }

      this.doc.setFontSize(12);
      this.doc.setFont("helvetica", "bold");
      this.doc.text(section.title, this.margin, this.yPosition);
      this.yPosition += 10;

      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      section.highlights.forEach(highlight => {
        this.doc.text(`• ${highlight}`, this.margin + 5, this.yPosition);
        this.yPosition += 6;
      });

      this.yPosition += 5;
      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "bold");
      this.doc.text("Areas for Improvement:", this.margin, this.yPosition);
      this.yPosition += 8;

      this.doc.setFontSize(10);
      this.doc.setFont("helvetica", "normal");
      section.improvements.forEach(improvement => {
        this.doc.text(`• ${improvement}`, this.margin + 5, this.yPosition);
        this.yPosition += 6;
      });

      this.yPosition += 15;
    });
  }

  private addActionPlan(data: ReportData) {
    if (this.yPosition > this.pageHeight - 150) {
      this.doc.addPage();
      this.yPosition = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("📌 Next Steps and Action Plan", this.margin, this.yPosition);
    this.yPosition += 12;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("🛠 Improvement Plan Template (Based on RendirApp Framework)", this.margin, this.yPosition);
    this.yPosition += 8;
    this.doc.text("This improvement plan is designed to address the areas identified as weakest in the self-assessment.", this.margin, this.yPosition);
    this.yPosition += 15;

    const actionPlanData = [
      ['COMMITMENT', 'QUESTION', 'ANSWER', 'OBJECTIVE TO BE ACHIEVED', 'CHANGES OR ACTIONS TO BE TAKEN', 'TIME FRAME', 'RESPONSIBLE PARTY(IES)', 'COMPLIANCE INDICATORS'],
      ['Commitment 1: Governance', 'Does the organization have a crisis communication protocol?', 'No formal protocol exists', 'Establish a clear and tested crisis communication protocol', '1. Draft protocol with board input\n2. Conduct simulation exercise', 'Q4 2025', 'Executive Director, Board Secretary', 'Protocol document approved and simulation completed'],
      ['Commitment 2: Financial Strategy', 'Is there a long-term fundraising strategy in place?', 'Strategy is informal and not documented', 'Develop a 3-year fundraising strategy aligned with strategic goals', '1. Host strategy workshop\n2. Document and approve fundraising roadmap', 'Q1 2026', 'Finance Manager, Fundraising Committee', 'Approved strategy document and donor engagement plan'],
      ['Commitment 3: Programme Impact', 'Are impact evaluations standardized across projects?', 'Evaluations vary by project', 'Create a unified impact evaluation framework', '1. Develop standard templates\n2. Train project leads', 'Q2 2026', 'M&E Officer, Programme Leads', 'Framework adopted and used in all new project evaluations'],
      ['Commitment 4: HR Development', 'Are staff training opportunities regularly scheduled?', 'Trainings are ad hoc', 'Institutionalize a staff development calendar', '1. Identify training needs\n2. Schedule quarterly sessions', 'Q1 2026', 'HR Coordinator', 'Calendar published and 75% staff participation in sessions'],
      ['Commitment 5: Inclusion & Equity', 'Are justice, inclusion, and human rights reflected in institutional policies?', 'These values are not explicitly stated', 'Embed principles of justice, inclusion, and human rights in all institutional documents', '1. Review and revise bylaws\n2. Update policies and website content', 'Action 1: 6 months\nAction 2: 1 year', 'Executive Management, Board of Directors', 'Updated bylaws and revised institutional documents reflecting inclusion and human rights principles']
    ];

    this.addActionPlanTable(actionPlanData, this.margin, this.yPosition);
    this.yPosition += 120;
  }

  private addStakeholderEngagement() {
    if (this.yPosition > this.pageHeight - 50) {
      this.doc.addPage();
      this.yPosition = 20;
    }

    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("📣 Stakeholder Engagement", this.margin, this.yPosition);
    this.yPosition += 12;

    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    this.doc.text("CASD will host a stakeholder roundtable in November 2025 to share assessment findings, gather feedback, and co-create solutions for identified gaps. This will reinforce transparency and build trust across our network.", this.margin, this.yPosition);
  }

  private getRating(percentage: number): string {
    if (percentage >= 80) return 'Leading Organisation';
    if (percentage >= 41) return 'Strong Foundation';
    return 'Emerging Organisation';
  }

  private addTable(data: string[][], x: number, y: number) {
    const colWidths = [40, 25, 25, 25, 40];
    const rowHeight = 8;
    let currentY = y;

    data.forEach((row, rowIndex) => {
      let currentX = x;
      
      row.forEach((cell, colIndex) => {
        const width = colWidths[colIndex] || 30;
        
        // Draw cell border
        this.doc.rect(currentX, currentY, width, rowHeight);
        
        // Add text
        this.doc.setFontSize(8);
        this.doc.setFont("helvetica", rowIndex === 0 ? "bold" : "normal");
        
        const lines = this.doc.splitTextToSize(cell, width - 2);
        lines.forEach((line: string, lineIndex: number) => {
          this.doc.text(line, currentX + 1, currentY + 4 + (lineIndex * 3));
        });
        
        currentX += width;
      });
      
      currentY += rowHeight;
    });
  }

  private addActionPlanTable(data: string[][], x: number, y: number) {
    const colWidths = [25, 30, 25, 35, 35, 20, 25, 35];
    const rowHeight = 12;
    let currentY = y;

    data.forEach((row, rowIndex) => {
      let currentX = x;
      
      row.forEach((cell, colIndex) => {
        const width = colWidths[colIndex] || 30;
        
        // Draw cell border
        this.doc.rect(currentX, currentY, width, rowHeight);
        
        // Add text
        this.doc.setFontSize(6);
        this.doc.setFont("helvetica", rowIndex === 0 ? "bold" : "normal");
        
        const lines = this.doc.splitTextToSize(cell, width - 2);
        lines.forEach((line: string, lineIndex: number) => {
          this.doc.text(line, currentX + 1, currentY + 3 + (lineIndex * 2.5));
        });
        
        currentX += width;
      });
      
      currentY += rowHeight;
    });
  }

  private drawBarChart(data: ReportData) {
    const chartX = this.margin;
    const chartY = this.yPosition;
    const chartWidth = 150;
    const chartHeight = 40;
    const barWidth = 25;
    const barSpacing = 10;

    // Draw chart background
    this.doc.rect(chartX, chartY, chartWidth, chartHeight);

    // Draw bars
    const sections = [
      { name: 'Gov', score: data.scores.governanceScore, max: 115, color: '#4CAF50' },
      { name: 'Fin', score: data.scores.financialScore, max: 50, color: '#2196F3' },
      { name: 'Prog', score: data.scores.programmeScore, max: 30, color: '#FF9800' },
      { name: 'HR', score: data.scores.hrScore, max: 20, color: '#9C27B0' }
    ];

    sections.forEach((section, index) => {
      const barX = chartX + 10 + (index * (barWidth + barSpacing));
      const maxHeight = chartHeight - 10;
      const barHeight = (section.score / section.max) * maxHeight;
      
      // Draw bar
      this.doc.setFillColor(200, 200, 200);
      this.doc.rect(barX, chartY + 5, barWidth, maxHeight, 'F');
      
      this.doc.setFillColor(76, 175, 80);
      this.doc.rect(barX, chartY + 5 + (maxHeight - barHeight), barWidth, barHeight, 'F');
      
      // Add label
      this.doc.setFontSize(8);
      this.doc.text(section.name, barX + barWidth/2, chartY + chartHeight + 5, { align: 'center' });
    });

    // Add legend
    this.doc.setFontSize(8);
    this.doc.text('Max Score', chartX + chartWidth + 5, chartY + 10);
    this.doc.text('Actual Score', chartX + chartWidth + 5, chartY + 20);
  }
}
