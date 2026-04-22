"use client";

import { useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function getSafeReturnTo(value: string | null): string {
  if (!value) return "/admin/dashboard";
  if (!value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin/dashboard";
  }
  return value;
}

export default function AdminSsoCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ssoToken = searchParams.get("ssoToken");
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"));
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      router.replace(`/admin/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!ssoToken) {
      router.replace("/admin/login?error=sso_missing_token");
      return;
    }

    (async () => {
      const result = await signIn("admin-sso", {
        ssoToken,
        callbackUrl: returnTo,
        redirect: false,
      });

      if (!result?.error) {
        window.location.assign(returnTo);
      } else {
        router.replace("/admin/login?error=sso_auth_failed");
      }
    })();
  }, [error, ssoToken, returnTo, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card card-md text-center">
        <h1 className="text-2xl font-semibold">Signing you in...</h1>
        <p className="mt-2 text-gray-600">
          Please wait while we verify your CSO Go identity.
        </p>
        <div className="mt-6">
          <Link href="/admin/login" className="text-sm text-cropper-mint-700 underline">
            Return to admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
