"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

const organizationSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

export function OrganizationForm() {
  const router = useRouter();
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  async function onSubmit(data: OrganizationFormValues) {
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create organization");
      }

      const result = await response.json();
      router.push(`/assessment/${result.assessmentId}`);
    } catch (error) {
      console.error("Error creating organization:", error);
      // Handle error appropriately
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="card">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Organization Name
            </label>
            <div className="mt-2">
              <input
                {...form.register("name")}
                type="text"
                id="name"
                className="input-primary"
                placeholder="Enter your organization's name"
              />
              {form.formState.errors.name && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium leading-6 text-gray-900"
            >
              Email Address
            </label>
            <div className="mt-2">
              <input
                {...form.register("email")}
                type="email"
                id="email"
                className="input-primary"
                placeholder="Enter your email address"
              />
              {form.formState.errors.email && (
                <p className="mt-2 text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="btn-primary w-full"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    </form>
  );
} 