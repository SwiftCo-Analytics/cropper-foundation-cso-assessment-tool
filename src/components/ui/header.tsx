"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [orgData, setOrgData] = useState<{ name: string } | null>(null);

  const isAdminPath = pathname.startsWith("/admin");
  const isOrgPath = pathname.startsWith("/organization");

  useEffect(() => {
    // Check for organization login
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

  return (
    <header className="bg-white shadow-sm border-b border-cropper-green-200">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="w-full py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex flex-col items-center text-center">
                <div className="text-cropper-green-700 text-xs font-medium leading-tight">
                   IGNITE CSOs
                </div>
                <div className="text-cropper-green-800 font-display font-bold text-lg md:text-xl leading-tight">
                  Self Assessment Tool
                </div>
                <div className="text-cropper-green-600 text-xs font-medium leading-tight">
                  for Civil Society Organizations
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-6">
              <Link
                href="/"
                className={`text-base font-medium ${
                  pathname === "/"
                    ? "text-cropper-green-600"
                    : "text-gray-600 hover:text-cropper-green-700"
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`text-base font-medium ${
                  pathname === "/about"
                    ? "text-cropper-green-600"
                    : "text-gray-600 hover:text-cropper-green-700"
                }`}
              >
                About
              </Link>

              <Link
                href="/privacy"
                className={`text-base font-medium ${
                  pathname === "/privacy"
                    ? "text-cropper-green-600"
                    : "text-gray-600 hover:text-cropper-green-700"
                }`}
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className={`text-base font-medium ${
                  pathname === "/terms"
                    ? "text-cropper-green-600"
                    : "text-gray-600 hover:text-cropper-green-700"
                }`}
              >
                Terms of Service
              </Link>

              {/* Organization Auth */}
              {orgData ? (
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-base font-medium text-cropper-blue-600">
                    <span>Organization: {orgData.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link
                      href="/organization/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
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
                !isOrgPath && (
                  <Link
                    href="/organization/login"
                    className="text-base font-medium text-cropper-blue-600 hover:text-cropper-blue-500"
                  >
                    Organization Login
                  </Link>
                )
              )}

              {/* Admin Auth */}
              {status === "authenticated" && session?.user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-1 text-base font-medium text-cropper-orange-600">
                    <span>Admin: {session.user.name || 'Admin'}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="absolute right-0 w-48 mt-2 py-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Dashboard
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
                !isAdminPath && (
                  <Link
                    href="/admin/login"
                    className="text-base font-medium text-cropper-orange-600 hover:text-cropper-orange-500"
                  >
                    Admin Login
                  </Link>
                )
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-gray-900"
              >
                <span className="sr-only">Open menu</span>
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`text-base font-medium ${
                  pathname === "/"
                    ? "text-cropper-green-600"
                    : "text-gray-600 hover:text-cropper-green-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`text-base font-medium ${
                  pathname === "/about"
                    ? "text-cropper-green-600"
                    : "text-gray-600 hover:text-cropper-green-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>

              {/* Organization Mobile Auth */}
              {orgData ? (
                <>
                  <div className="text-base font-medium text-cropper-blue-600">
                    Organization: {orgData.name}
                  </div>
                  <Link
                    href="/organization/dashboard"
                    className="text-base font-medium text-cropper-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Organization Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleOrgSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="text-base font-medium text-gray-500 hover:text-gray-900 text-left"
                  >
                    Sign Out Organization
                  </button>
                </>
              ) : (
                !isOrgPath && (
                  <Link
                    href="/organization/login"
                    className="text-base font-medium text-cropper-blue-600 hover:text-cropper-blue-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Organization Login
                  </Link>
                )
              )}

              {/* Admin Mobile Auth */}
              {status === "authenticated" && session?.user ? (
                <>
                  <div className="text-base font-medium text-cropper-orange-600">
                    Admin: {session.user.name || 'Admin'}
                  </div>
                  <Link
                    href="/admin/dashboard"
                    className="text-base font-medium text-cropper-orange-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/" });
                      setIsMenuOpen(false);
                    }}
                    className="text-base font-medium text-gray-500 hover:text-gray-900 text-left"
                  >
                    Sign Out Admin
                  </button>
                </>
              ) : (
                !isAdminPath && (
                  <Link
                    href="/admin/login"
                    className="text-base font-medium text-cropper-orange-600 hover:text-cropper-orange-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Admin Login
                  </Link>
                )
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
} 