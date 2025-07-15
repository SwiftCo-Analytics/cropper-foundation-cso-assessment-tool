import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  email: string;
}

export function useOrganizationAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("org_token");
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/organizations/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.organization);
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("org_token");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      localStorage.removeItem("org_token");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const navigateToAssessment = () => {
    if (isAuthenticated && organization) {
      router.push("/organization/dashboard");
    } else {
      router.push("/organization/login");
    }
  };

  return {
    isAuthenticated,
    organization,
    loading,
    navigateToAssessment,
  };
} 