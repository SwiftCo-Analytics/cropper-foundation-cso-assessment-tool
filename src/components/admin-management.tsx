"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Mail, Shield, Clock, CheckCircle, AlertCircle, KeyRound, X, Copy, Check } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn } from "@/components/ui/animations";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

interface Admin {
  id: string;
  name: string;
  email: string;
  isInvited: boolean;
  inviteExpiry: string | null;
  inviteAcceptedAt: string | null;
  createdAt: string;
  invitedByName?: string | null;
}

interface AdminManagementProps {
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

export default function AdminManagement({ onSuccess, onError }: AdminManagementProps) {
  const { data: session } = useSession();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isInviting, setIsInviting] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState<{
    adminId: string;
    adminName: string;
    newPassword: string;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    try {
      const response = await fetch("/api/admin");
      if (!response.ok) {
        throw new Error("Failed to fetch admins");
      }
      const data = await response.json();
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
      onError?.("Failed to fetch admin list");
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault();
    setIsInviting(true);

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin");
      }

      onSuccess?.("Admin created successfully!");
      setInviteData({ name: "", email: "", password: "" });
      setShowInviteForm(false);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error("Error inviting admin:", error);
      onError?.(error instanceof Error ? error.message : "Failed to create admin");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleResetPassword(adminId: string, adminName: string) {
    if (!confirm(`Are you sure you want to reset the password for ${adminName}? A new password will be generated and displayed.`)) {
      return;
    }

    setIsResettingPassword(adminId);

    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "reset-password" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setPasswordResetData({
        adminId,
        adminName,
        newPassword: data.newPassword,
        emailSent: data.emailSent,
        emailError: data.emailError,
      });

      onSuccess?.("Password reset successfully! The new password has been displayed.");
    } catch (error) {
      console.error("Error resetting password:", error);
      onError?.(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setIsResettingPassword(null);
    }
  }

  async function handleDeleteAdmin(adminId: string, adminName: string) {
    if (!confirm(`Are you sure you want to delete ${adminName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/${adminId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete admin");
      }

      onSuccess?.("Admin deleted successfully!");
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error("Error deleting admin:", error);
      onError?.(error instanceof Error ? error.message : "Failed to delete admin");
    }
  }

  function handleCopyPassword() {
    if (passwordResetData) {
      navigator.clipboard.writeText(passwordResetData.newPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    }
  }

  function getAdminStatus(admin: Admin) {
    if (!admin.isInvited) {
      return { status: "active", icon: CheckCircle, color: "text-green-600", label: "Active" };
    }
    
    if (admin.inviteAcceptedAt) {
      return { status: "active", icon: CheckCircle, color: "text-green-600", label: "Active" };
    }
    
    const expiryDate = admin.inviteExpiry ? new Date(admin.inviteExpiry) : null;
    if (expiryDate && expiryDate < new Date()) {
      return { status: "expired", icon: AlertCircle, color: "text-red-600", label: "Invitation Expired" };
    }
    
    return { status: "pending", icon: Clock, color: "text-yellow-600", label: "Pending Setup" };
  }

  if (loading) {
    return (
      <div className="card card-lg">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading admins...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card card-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-heading flex items-center">
          <Shield className="h-5 w-5 mr-2 text-green-600" />
          Admin Management
        </h2>
        <button
          onClick={() => setShowInviteForm(true)}
          className="btn-primary btn-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Admin
        </button>
      </div>

      {showInviteForm && (
        <FadeIn>
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-subheading mb-4">Invite New Admin</h3>
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="adminName" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="adminName"
                    required
                    value={inviteData.name}
                    onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Admin's full name"
                  />
                </div>
                <div>
                  <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="adminEmail"
                    required
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="admin@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="adminPassword"
                    required
                    minLength={8}
                    value={inviteData.password}
                    onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteData({ name: "", email: "", password: "" });
                  }}
                  className="btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="btn-primary btn-sm"
                >
                  {isInviting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </FadeIn>
      )}

      <div className="space-y-3">
        {admins.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No admins found</p>
          </div>
        ) : (
          admins.map((admin) => {
            const statusInfo = getAdminStatus(admin);
            const StatusIcon = statusInfo.icon;
            
            return (
              <motion.div
                key={admin.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-green-600">
                        {admin.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{admin.name}</h3>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                    {admin.invitedByName && (
                      <p className="text-xs text-gray-400">
                        Invited by {admin.invitedByName}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                    <span className={`text-sm ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  
                  {statusInfo.status !== "active" && (
                    <div className="text-xs text-gray-400">
                      {admin.inviteExpiry && (
                        <div>
                          Expires: {new Date(admin.inviteExpiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Only show reset password button if admin has accepted invitation (has password) and is not current user */}
                  {statusInfo.status === "active" && admin.id !== (session?.user as any)?.id && (
                    <button
                      onClick={() => handleResetPassword(admin.id, admin.name)}
                      disabled={isResettingPassword === admin.id}
                      className="text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reset password"
                    >
                      {isResettingPassword === admin.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Delete admin"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Password Reset Success Modal */}
      {passwordResetData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <ScaleIn>
            <div className="card card-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-heading">Password Reset Successful</h3>
                <button
                  onClick={() => {
                    setPasswordResetData(null);
                    setPasswordCopied(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Password has been reset for <strong>{passwordResetData.adminName}</strong>
                  </p>
                  {passwordResetData.emailSent ? (
                    <p className="text-sm text-green-700">
                      ✓ An email with the new password has been sent to the admin.
                    </p>
                  ) : (
                    <div className="text-sm">
                      <p className="text-yellow-700 mb-2">
                        ⚠ Email could not be sent: {passwordResetData.emailError || "Unknown error"}
                      </p>
                      <p className="text-gray-700">
                        Please share the password below with the admin manually.
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Temporary Password:
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md p-3 font-mono text-lg text-center tracking-wider">
                      {passwordResetData.newPassword}
                    </div>
                    <button
                      onClick={handleCopyPassword}
                      className="btn-secondary btn-sm px-3"
                      title="Copy password"
                    >
                      {passwordCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    ⚠️ Important: The admin should change this password immediately after logging in.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setPasswordResetData(null);
                      setPasswordCopied(false);
                    }}
                    className="btn-primary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </ScaleIn>
        </div>
      )}
    </div>
  );
}
