"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, User, Lock, Loader2, ArrowLeft } from "lucide-react";
import { FadeIn, ScaleIn, SlideIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import BackButton from "@/components/ui/back-button";

export default function OrganizationAccountPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("org_token");
    if (!token) {
      router.replace("/organization/login");
      return;
    }
    fetch("/api/organizations/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("org_token");
          router.replace("/organization/login");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.organization) {
          setOrganization(data.organization);
          setName(data.organization.name);
        }
      })
      .catch(() => {
        localStorage.removeItem("org_token");
        router.replace("/organization/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("org_token");
    if (!token || !name.trim()) return;
    setNameSaving(true);
    setNameMessage(null);
    try {
      const res = await fetch("/api/organizations/me", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setOrganization((prev) => (prev ? { ...prev, name: name.trim() } : null));
      setNameMessage({ type: "success", text: "Name updated successfully." });
    } catch (err) {
      setNameMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update name." });
    } finally {
      setNameSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    const token = localStorage.getItem("org_token");
    if (!token) return;
    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/organizations/change-password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword: currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
    } catch (err) {
      setPasswordMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update password." });
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cropper-mint-600" />
      </div>
    );
  }

  if (!organization) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cropper-mint-100/50 to-cropper-mint-50 pointer-events-none" />
      <div className="content-container relative min-h-screen flex items-center justify-center py-12">
        <FadeIn>
          <div className="content-narrow max-w-lg w-full">
            <ScaleIn>
              <div className="card card-lg">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-cropper-mint-100 flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-cropper-mint-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-display font-semibold text-cropper-green-800">Account settings</h1>
                      <p className="text-sm text-gray-600">{organization.email}</p>
                    </div>
                  </div>
                  <Link href="/organization/dashboard" className="text-sm font-medium text-cropper-mint-600 hover:text-cropper-mint-700 flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Dashboard
                  </Link>
                </div>

                <SlideIn delay={0.2}>
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" /> Organization name
                    </h2>
                    <form onSubmit={handleSaveName} className="space-y-4">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-primary"
                        placeholder="Organization name"
                        minLength={2}
                        required
                      />
                      {nameMessage && (
                        <p className={`text-sm ${nameMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>{nameMessage.text}</p>
                      )}
                      <Hover>
                        <button type="submit" disabled={nameSaving} className="btn-primary flex items-center gap-2">
                          {nameSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Save name
                        </button>
                      </Hover>
                    </form>
                  </section>
                </SlideIn>

                <SlideIn delay={0.3}>
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Lock className="h-5 w-5" /> Change password
                    </h2>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input-primary"
                          required
                          autoComplete="current-password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input-primary"
                          minLength={8}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="input-primary"
                          minLength={8}
                          required
                          autoComplete="new-password"
                        />
                      </div>
                      {passwordMessage && (
                        <p className={`text-sm ${passwordMessage.type === "success" ? "text-green-600" : "text-red-600"}`}>{passwordMessage.text}</p>
                      )}
                      <Hover>
                        <button type="submit" disabled={passwordSaving} className="btn-primary flex items-center gap-2">
                          {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Update password
                        </button>
                      </Hover>
                    </form>
                  </section>
                </SlideIn>

                <motion.div className="mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
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
