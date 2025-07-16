import { getAssessment } from "@/lib/prisma";
import { AssessmentForm } from "@/components/forms/assessment-form";
import { redirect } from "next/navigation";

interface AssessmentPageProps {
  params: {
    id: string;
  };
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const assessment = await getAssessment(params.id);

  // If assessment is completed, redirect to report page
  if (assessment.status === "COMPLETED") {
    redirect(`/assessment/${params.id}/report`);
  }

  return (
    <div className="content-container section-spacing">
      <div className="content-wide">
        <div className="page-header">
          <h1 className="page-title">
            CSO Self Assessment
          </h1>
          <p className="page-description">
            Organization: {assessment.organization.name}
          </p>
        </div>
        <AssessmentForm assessmentId={assessment.id} />
      </div>
    </div>
  );
} 