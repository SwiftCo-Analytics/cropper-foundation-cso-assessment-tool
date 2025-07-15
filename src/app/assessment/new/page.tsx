import { OrganizationForm } from "@/components/forms/organization-form";

export default function NewAssessment() {
  return (
    <div className="content-container section-spacing">
      <div className="content-narrow">
        <div className="page-header">
          <h1 className="page-title">
            Create Organization Account
          </h1>
          <p className="page-description">
            Please provide your organization&apos;s details to create your account and access the dashboard.
          </p>
        </div>
        <div className="mt-8">
          <OrganizationForm />
        </div>
      </div>
    </div>
  );
} 