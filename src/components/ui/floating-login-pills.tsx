"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Building2, Shield } from "lucide-react";

export default function FloatingLoginPills() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [orgData, setOrgData] = useState<{ name: string } | null>(null);

  const isAdminPath = pathname.startsWith("/admin");
  const isOrgPath = pathname.startsWith("/organization");

  useEffect(() => {
    // Check for organization for self assessment login
    const token = localStorage.getItem("org_token");
    if (token) {
      fetch("/api/organizations/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.organization) {
            setOrgData(data.organization);
          }
        })
        .catch((error) => {
          console.error("Error fetching organization data:", error);
          localStorage.removeItem("org_token");
        });
    }
  }, []);

  const handleOrgSignOut = () => {
    localStorage.removeItem("org_token");
    setOrgData(null);
    router.push("/");
  };

  // Don't show on login pages (they have back buttons instead)
  if (pathname === "/organization/login" || pathname === "/admin/login") {
    return null;
  }
  
  // Show on all other pages (public, admin, and org pages)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      {/* Organization for Self Assessment Login */}
      {orgData ? (
        <div className="group relative">
          <button className="flex items-center gap-2 px-4 py-2 bg-cropper-blue-500 text-white rounded-full shadow-lg hover:bg-cropper-blue-600 transition-colors">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">{orgData.name}</span>
          </button>
          <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <Link
              href="/organization/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>
            <Link
              href="/organization/account"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Account
            </Link>
            <button
              onClick={handleOrgSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <Link
          href="/organization/login"
          className="flex items-center gap-2 px-4 py-2 bg-cropper-blue-500 text-white rounded-full shadow-lg hover:bg-cropper-blue-600 transition-colors"
        >
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">Self Assessment Login</span>
        </Link>
      )}

      {/* Admin Login */}
      {status === "authenticated" && session?.user ? (
        <div className="group relative">
          <button className="flex items-center gap-2 px-4 py-2 bg-cropper-orange-500 text-white rounded-full shadow-lg hover:bg-cropper-orange-600 transition-colors">
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Admin: {session.user.name || 'Admin'}</span>
          </button>
          <div className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <Link
              href="/admin/dashboard"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/account"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Account
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <Link
          href="/admin/login"
          className="flex items-center gap-2 px-4 py-2 bg-cropper-orange-500 text-white rounded-full shadow-lg hover:bg-cropper-orange-600 transition-colors"
        >
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">Admin Login</span>
        </Link>
      )}
    </div>
  );
}

