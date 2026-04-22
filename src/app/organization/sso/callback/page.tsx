"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function getSafeReturnTo(value: string | null): string {
  if (!value) return "/organization/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/organization/dashboard";
  }
  return value;
}

export default function OrganizationSsoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const returnTo = useMemo(
    () => getSafeReturnTo(searchParams.get("returnTo")),
    [searchParams]
  );

  useEffect(() => {
    if (!token || error) {
      return;
    }

    localStorage.setItem("org_token", token);
    router.replace(returnTo);
  }, [token, error, router, returnTo]);

  if (token && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card card-md text-center">
          <h1 className="text-2xl font-semibold">Signing you in...</h1>
          <p className="mt-2 text-gray-600">Please wait while we redirect you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card card-md text-center">
        <h1 className="text-2xl font-semibold">SSO sign-in failed</h1>
        <p className="mt-2 text-gray-600">
          We could not complete your CSO Go sign-in. Please try again.
        </p>
        <div className="mt-6">
          <Link href="/organization/login" className="btn-primary">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
