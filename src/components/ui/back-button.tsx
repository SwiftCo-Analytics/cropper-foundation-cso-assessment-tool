"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function BackButton({ 
  href, 
  label,
  className = ""
}: BackButtonProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine default href based on current path
  const getDefaultHref = () => {
    if (pathname.startsWith("/admin")) {
      return "/admin/dashboard";
    }
    if (pathname.startsWith("/organization")) {
      return "/organization/dashboard";
    }
    // For public pages, go to home
    return "/";
  };

  const defaultLabel = () => {
    if (pathname.startsWith("/admin")) {
      return "Back to Dashboard";
    }
    if (pathname.startsWith("/organization")) {
      return "Back to Dashboard";
    }
    return "Back to Home";
  };

  const targetHref = href || getDefaultHref();
  const targetLabel = label || defaultLabel();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(targetHref);
  };

  return (
    <Link
      href={targetHref}
      onClick={handleClick}
      className={`inline-flex items-center text-cropper-green-600 hover:text-cropper-green-700 transition-colors ${className}`}
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      {targetLabel}
    </Link>
  );
}

