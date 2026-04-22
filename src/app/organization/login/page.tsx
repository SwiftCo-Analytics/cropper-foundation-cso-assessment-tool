"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Building2, Users, Lock } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import BackButton from "@/components/ui/back-button";
import Link from "next/link";

function getSsoErrorMessage(code: string | null): string | null {
  switch (code) {
    case "missing_sso_token":
      return "SSO failed because no token was returned from CSO Go. Please try again.";
    case "sso_not_configured":
      return "SSO is not configured yet. Please contact support.";
    case "sso_auth_failed":
      return "SSO sign-in could not be verified. Please try again.";
    default:
      return null;
  }
}

const CSOGO_PASSWORD_RESET_URL =
  process.env.NEXT_PUBLIC_CSOGO_PASSWORD_RESET_URL ||
  "https://csogo.org/wp-login.php?action=lostpassword";

export default function OrganizationLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledEmail = searchParams.get("email") ?? "";
  const ssoErrorCode = searchParams.get("error");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: prefilledEmail,
    password: "",
  });

  useEffect(() => {
    const ssoError = getSsoErrorMessage(ssoErrorCode);
    if (ssoError) {
      setError(ssoError);
    }
  }, [ssoErrorCode]);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem("org_token");
    if (token) {
      // Verify the token is still valid by making a request to the me endpoint
      fetch("/api/organizations/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            // Token is valid, redirect to dashboard
            router.replace("/organization/dashboard");
          } else {
            // Token is invalid, remove it
            localStorage.removeItem("org_token");
          }
        })
        .catch(() => {
          // Network error or other issue, remove token
          localStorage.removeItem("org_token");
        });
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/organizations/auth?action=${isLogin ? "login" : "register"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (!isLogin) {
        setSuccess(data.message || "Registration successful. Please verify your email before logging in.");
        setIsLogin(true);
        setFormData((prev) => ({ ...prev, password: "" }));
        return;
      }

      if (!data.token) {
        throw new Error("No session token returned");
      }

      localStorage.setItem("org_token", data.token);
      setTimeout(() => {
        router.push("/organization/dashboard");
      }, 100);
    } catch (error) {
      console.error("Auth error:", error);
      setError(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!formData.email) {
      setError("Enter your email address first to resend verification.");
      return;
    }

    setResendingVerification(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/organizations/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
      }

      setSuccess("Verification email sent. Please check your inbox.");
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Failed to resend verification email"
      );
    } finally {
      setResendingVerification(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
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
                    <Building2 className="h-8 w-8 text-cropper-mint-600" />
                  </motion.div>
                  
                  <motion.h1 
                    className="page-title text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                  >
                    {isLogin ? "Self Assessment Login" : "Register Organization for Self Assessment"}
                  </motion.h1>
                  
                  <motion.p 
                    className="page-subtitle text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                  >
                    {isLogin ? (
                      <>
                        Don&apos;t have an account?{" "}
                        <button
                          onClick={() => {
                            setIsLogin(false);
                            setError("");
                            setSuccess("");
                          }}
                          className="text-cropper-mint-600 hover:text-cropper-mint-700 font-medium transition-colors duration-200"
                        >
                          Register here
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{" "}
                        <button
                          onClick={() => {
                            setIsLogin(true);
                            setError("");
                            setSuccess("");
                          }}
                          className="text-cropper-mint-600 hover:text-cropper-mint-700 font-medium transition-colors duration-200"
                        >
                          Login here
                        </button>
                      </>
                    )}
                  </motion.p>
                </div>
                
                <SlideIn delay={0.4}>
                  <div className="mb-6">
                    <Link
                      href="/api/organizations/sso/start?returnTo=/organization/dashboard"
                      className="btn-secondary btn-lg w-full inline-flex justify-center items-center"
                    >
                      Sign in with CSO Go
                    </Link>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Existing accounts can switch to SSO on first successful sign-in.
                    </p>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      SSO password help:{" "}
                      <a
                        href={CSOGO_PASSWORD_RESET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cropper-mint-700 hover:text-cropper-mint-800 underline"
                      >
                        reset on CSO Go
                      </a>
                    </p>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">or continue with email</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Organization Name
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          required={!isLogin}
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          className="input-primary"
                          placeholder="Enter your organization name"
                        />
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: !isLogin ? 0.1 : 0 }}
                    >
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="input-primary"
                        placeholder="Enter your email"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: !isLogin ? 0.2 : 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Password
                        </label>
                        {isLogin && (
                          <Link
                            href="/organization/forgot-password"
                            className="text-sm text-cropper-mint-600 hover:text-cropper-mint-700"
                          >
                            Forgot password?
                          </Link>
                        )}
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className="input-primary"
                        placeholder="Enter your password"
                      />
                    </motion.div>

                    {error && (
                      <motion.div 
                        className="rounded-lg bg-red-50 border border-red-200 p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        className="rounded-lg bg-green-50 border border-green-200 p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <p className="text-sm text-green-700">{success}</p>
                      </motion.div>
                    )}

                    <Hover>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary btn-lg w-full flex justify-center items-center"
                      >
                        {loading ? (
                          <div className="flex items-center">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            {isLogin ? "Signing In..." : "Registering..."}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            {isLogin ? (
                              <>
                                <Lock className="mr-2 h-5 w-5" />
                                Sign In
                              </>
                            ) : (
                              <>
                                <Users className="mr-2 h-5 w-5" />
                                Register
                              </>
                            )}
                          </div>
                        )}
                      </button>
                    </Hover>

                    {isLogin && (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resendingVerification}
                          className="text-sm text-cropper-mint-700 hover:text-cropper-mint-800 underline disabled:opacity-50"
                        >
                          {resendingVerification
                            ? "Sending verification email..."
                            : "Resend verification email"}
                        </button>
                      </div>
                    )}
                  </form>
                </SlideIn>

                <motion.div 
                  className="mt-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.6 }}
                >
                  <Hover>
                    <BackButton />
                  </Hover>
                </motion.div>
              </div>
            </ScaleIn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
} 