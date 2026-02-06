"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Loader2 } from "lucide-react";
import { FadeIn, ScaleIn, SlideIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import BackButton from "@/components/ui/back-button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Missing reset token. Please use the link from your email.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");
      setSuccess(true);
      setTimeout(() => router.push("/admin/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
        <p className="text-red-700">Missing reset token. Please use the link from your email.</p>
        <Link href="/admin/forgot-password" className="mt-2 inline-block text-sm font-medium text-cropper-mint-600">Request a new link</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg bg-cropper-mint-50 border border-cropper-mint-200 p-4 text-center">
        <p className="text-cropper-mint-800">Password reset successfully. Redirecting to login...</p>
        <Link href="/admin/login" className="mt-2 inline-block text-sm font-medium text-cropper-mint-600">Go to login</Link>
      </div>
    );
  }

  return (
    <SlideIn delay={0.4}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
          <input id="password" name="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-primary" placeholder="At least 8 characters" />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">Confirm password</label>
          <input id="confirm" name="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-primary" placeholder="Confirm new password" />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <Hover>
          <button type="submit" disabled={loading} className="btn-primary btn-lg w-full flex justify-center items-center">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Lock className="mr-2 h-5 w-5" /> Set new password</>}
          </button>
        </Hover>
      </form>
    </SlideIn>
  );
}

export default function AdminResetPasswordPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cropper-mint-100/50 to-cropper-mint-50 pointer-events-none" />
      <div className="content-container relative min-h-screen flex items-center justify-center py-12">
        <FadeIn>
          <div className="content-narrow">
            <ScaleIn>
              <div className="card card-lg max-w-md w-full mx-auto">
                <div className="text-center mb-8">
                  <motion.div className="mx-auto h-16 w-16 rounded-xl bg-cropper-mint-100 flex items-center justify-center mb-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
                    <Shield className="h-8 w-8 text-cropper-mint-600" />
                  </motion.div>
                  <motion.h1 className="page-title text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>Set new admin password</motion.h1>
                  <motion.p className="page-subtitle text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>Enter your new password below.</motion.p>
                </div>
                <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
                  <ResetPasswordForm />
                </Suspense>
                <motion.div className="mt-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.6 }}>
                  <Hover><BackButton /></Hover>
                </motion.div>
              </div>
            </ScaleIn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
