import { OrganizationForm } from "@/components/forms/organization-form";

export default function NewAssessment() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Create Organization Account
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Please provide your organization&apos;s details to create your account and access the dashboard.
        </p>
        <div className="mt-8">
          <OrganizationForm />
        </div>
      </div>
    </div>
  );
} 