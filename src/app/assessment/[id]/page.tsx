import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AssessmentForm } from "@/components/forms/assessment-form";

interface AssessmentPageProps {
  params: {
    id: string;
  };
}

async function getAssessment(id: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      organization: true,
    },
  });

  if (!assessment) {
    notFound();
  }

  return assessment;
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const assessment = await getAssessment(params.id);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            CSO Self Assessment
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Organization: {assessment.organization.name}
          </p>
        </div>
        <AssessmentForm assessmentId={assessment.id} />
      </div>
    </div>
  );
} 