"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, User, Lock, Loader2, ArrowLeft } from "lucide-react";
import { FadeIn, ScaleIn, SlideIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import BackButton from "@/components/ui/back-button";

export default function AdminAccountPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<{ id: string; name: string; email: string } | null>(null);
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
    fetch("/api/admin/me")
      .then((res) => {
        if (!res.ok) {
          router.replace("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.admin) {
          setAdmin(data.admin);
          setName(data.admin.name);
        }
      })
      .catch(() => router.replace("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setNameSaving(true);
    setNameMessage(null);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      setAdmin((prev) => (prev ? { ...prev, name: name.trim() } : null));
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
    setPasswordSaving(true);
    setPasswordMessage(null);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
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

  if (!admin) return null;

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
                      <Shield className="h-6 w-6 text-cropper-mint-600" />
                    </div>
                    <div>
                      <h1 className="text-xl font-display font-semibold text-cropper-green-800">Admin account settings</h1>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                  <Link href="/admin/dashboard" className="text-sm font-medium text-cropper-mint-600 hover:text-cropper-mint-700 flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Dashboard
                  </Link>
                </div>

                <SlideIn delay={0.2}>
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" /> Display name
                    </h2>
                    <form onSubmit={handleSaveName} className="space-y-4">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="input-primary"
                        placeholder="Your name"
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
