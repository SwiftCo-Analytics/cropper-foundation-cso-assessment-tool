"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Building2, ChevronDown, Shield } from "lucide-react";

export default function FloatingLoginPills() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [orgData, setOrgData] = useState<{ name: string } | null>(null);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const orgMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!orgMenuOpen && !adminMenuOpen) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (orgMenuOpen && orgMenuRef.current && !orgMenuRef.current.contains(t)) {
        setOrgMenuOpen(false);
      }
      if (adminMenuOpen && adminMenuRef.current && !adminMenuRef.current.contains(t)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [orgMenuOpen, adminMenuOpen]);

  const handleOrgSignOut = () => {
    localStorage.removeItem("org_token");
    setOrgData(null);
    setOrgMenuOpen(false);
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
        <div className="relative" ref={orgMenuRef}>
          <div className="flex items-stretch rounded-full shadow-lg overflow-hidden bg-cropper-blue-500 text-white">
            <Link
              href="/organization/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-cropper-blue-600 transition-colors"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="max-w-[10rem] truncate">{orgData.name}</span>
            </Link>
            <button
              type="button"
              aria-expanded={orgMenuOpen}
              aria-haspopup="menu"
              aria-label="Organization menu"
              onClick={() => setOrgMenuOpen((o) => !o)}
              className="px-2 border-l border-white/25 hover:bg-cropper-blue-600 transition-colors flex items-center"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${orgMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          {orgMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl border border-gray-100"
              role="menu"
            >
              <Link
                href="/organization/dashboard"
                role="menuitem"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setOrgMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/organization/account"
                role="menuitem"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setOrgMenuOpen(false)}
              >
                Account
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleOrgSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          )}
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
        <div className="relative" ref={adminMenuRef}>
          <div className="flex items-stretch rounded-full shadow-lg overflow-hidden bg-cropper-orange-500 text-white">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-cropper-orange-600 transition-colors"
            >
              <Shield className="h-4 w-4 shrink-0" />
              <span className="max-w-[10rem] truncate">
                Admin: {session.user.name || "Admin"}
              </span>
            </Link>
            <button
              type="button"
              aria-expanded={adminMenuOpen}
              aria-haspopup="menu"
              aria-label="Admin menu"
              onClick={() => setAdminMenuOpen((o) => !o)}
              className="px-2 border-l border-white/25 hover:bg-cropper-orange-600 transition-colors flex items-center"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${adminMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
          {adminMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-48 py-2 bg-white rounded-lg shadow-xl border border-gray-100"
              role="menu"
            >
              <Link
                href="/admin/dashboard"
                role="menuitem"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setAdminMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/account"
                role="menuitem"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setAdminMenuOpen(false)}
              >
                Account
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAdminMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          )}
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

