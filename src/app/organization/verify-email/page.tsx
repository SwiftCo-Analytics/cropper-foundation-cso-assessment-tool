"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const verificationUrl = useMemo(() => {
    if (!token || !email) return null;
    return `/api/organizations/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  }, [token, email]);

  useEffect(() => {
    async function verifyEmail() {
      if (!verificationUrl) {
        setSuccess(false);
        setMessage("Invalid verification link. Please request a new verification email.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(verificationUrl);
        const data = await response.json();

        if (!response.ok) {
          setSuccess(false);
          setMessage(data.error || "Email verification failed. Please request a new verification email.");
          return;
        }

        setSuccess(true);
        setMessage(data.message || "Email verified successfully. You can now log in.");
      } catch {
        setSuccess(false);
        setMessage("Unable to verify your email right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, [verificationUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cropper-mint-100/50 to-cropper-mint-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-4">
        {loading ? (
          <Loader2 className="h-10 w-10 animate-spin text-cropper-mint-600 mx-auto" />
        ) : success ? (
          <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto" />
        ) : (
          <XCircle className="h-10 w-10 text-red-600 mx-auto" />
        )}

        <h1 className="text-2xl font-semibold text-cropper-green-800">Email Verification</h1>
        <p className="text-gray-700">{loading ? "Verifying your email..." : message}</p>

        {!loading && (
          <div className="pt-2 space-y-3">
            <Link href="/organization/login" className="btn-primary w-full inline-flex justify-center">
              Go to Organization Login
            </Link>
            {!success && email ? (
              <Link
                href={`/organization/login?email=${encodeURIComponent(email)}`}
                className="text-sm text-cropper-mint-700 underline"
              >
                Back to login and resend verification
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
