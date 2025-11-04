"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, X } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/ui/animations";
import { motion } from "framer-motion";
import AdminManagement from "@/components/admin-management";

export default function AdminManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (status === "unauthenticated") {
      router.replace("/admin/login");
      return;
    }
  }, [status, router]);

  // Helper function to show success message temporarily
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000); // Hide after 3 seconds
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cropper-mint-600"></div>
      </div>
    );
  }

  return (
    <div className="content-container section-spacing">
      <FadeIn>
        <div className="page-header">
          <motion.h1 
            className="page-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Admin Management
          </motion.h1>
          <motion.p 
            className="page-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Manage system administrators and their access
          </motion.p>
          
          {/* Navigation */}
          <motion.div 
            className="flex space-x-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <Link
              href="/admin/dashboard"
              className="btn-secondary"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Link>
          </motion.div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div 
            className="bg-cropper-mint-50 text-cropper-mint-800 p-4 rounded-lg mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-cropper-mint-600 hover:text-cropper-mint-800">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <motion.div 
            className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        )}
      </FadeIn>

      {/* Admin Management */}
      <div className="mt-8">
        <AdminManagement 
          onSuccess={showSuccess}
          onError={setErrorMessage}
        />
      </div>
    </div>
  );
}

