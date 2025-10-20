"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Mail, Shield, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { FadeIn, SlideIn } from "@/components/ui/animations";
import { motion } from "framer-motion";

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
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({
    name: "",
    email: "",
  });
  const [isInviting, setIsInviting] = useState(false);

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
        throw new Error(data.error || "Failed to invite admin");
      }

      onSuccess?.("Admin invitation sent successfully!");
      setInviteData({ name: "", email: "" });
      setShowInviteForm(false);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      console.error("Error inviting admin:", error);
      onError?.(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsInviting(false);
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
          Invite Admin
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
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteForm(false);
                    setInviteData({ name: "", email: "" });
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
                      Send Invitation
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
    </div>
  );
}
