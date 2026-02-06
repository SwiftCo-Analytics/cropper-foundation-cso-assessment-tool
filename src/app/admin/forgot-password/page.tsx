"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, Loader2, ArrowLeft } from "lucide-react";
import { FadeIn, ScaleIn, SlideIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import BackButton from "@/components/ui/back-button";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cropper-mint-100/50 to-cropper-mint-50 pointer-events-none" />
      <div className="content-container relative min-h-screen flex items-center justify-center py-12">
        <FadeIn>
          <div className="content-narrow">
            <ScaleIn>
              <div className="card card-lg max-w-md w-full mx-auto">
                <div className="text-center mb-8">
                  <motion.div
                    className="mx-auto h-16 w-16 rounded-xl bg-cropper-mint-100 flex items-center justify-center mb-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Shield className="h-8 w-8 text-cropper-mint-600" />
                  </motion.div>
                  <motion.h1 className="page-title text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
                    Forgot admin password
                  </motion.h1>
                  <motion.p className="page-subtitle text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}>
                    Enter your admin email and we’ll send you a link to reset your password.
                  </motion.p>
                </div>

                {sent ? (
                  <SlideIn>
                    <div className="rounded-lg bg-cropper-mint-50 border border-cropper-mint-200 p-4 text-center">
                      <p className="text-cropper-mint-800">
                        If an account exists with that email, you’ll receive a reset link shortly. Check your inbox and spam folder.
                      </p>
                      <Link href="/admin/login" className="mt-4 inline-flex items-center text-sm font-medium text-cropper-mint-600 hover:text-cropper-mint-700">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
                      </Link>
                    </div>
                  </SlideIn>
                ) : (
                  <SlideIn delay={0.4}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email address</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-primary"
                          placeholder="Enter your admin email"
                        />
                      </div>
                      {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      )}
                      <Hover>
                        <button type="submit" disabled={loading} className="btn-primary btn-lg w-full flex justify-center items-center">
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="mr-2 h-5 w-5" /> Send reset link</>}
                        </button>
                      </Hover>
                    </form>
                  </SlideIn>
                )}

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
