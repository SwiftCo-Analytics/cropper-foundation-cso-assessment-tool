import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Header from "@/components/ui/header";
import FloatingLoginPills from "@/components/ui/floating-login-pills";
import AuthProvider from "@/components/providers/session-provider";
import Logos from "@/components/ui/logos";
import Link from "next/link";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CSO Self-Assessment Tool",
  description: "A self-assessment tool for Civil Society Organizations",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <AuthProvider session={session}>
          <div className="min-h-screen flex flex-col bg-cropper-yellow-50">
            <Header />
            <FloatingLoginPills />
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white border-t border-cropper-green-200">
              <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                  <Logos 
                    title="Project Partners & Collaborators"
                    subtitle="Working together to Improve Governance, Networking and Inclusivity Towards Empowered CSOs (IGNITE CSOs)"
                    variant="footer"
                  />
                </div>
                <div className="mb-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-600">
                  <img src="/logos/SCA_logo.png" alt="SwiftCo Analytics" className="h-20 w-auto" />
                  <span className="text-center sm:text-left">This platform was developed by <Link href="https://swiftcoanalytics.com" target="_blank" className="font-medium text-cropper-blue-600">SwiftCo Analytics</Link> for <span className="font-medium">IGNITE CSOs</span></span>
                </div>
                <p className="text-center text-gray-500 text-sm">
                  © {new Date().getFullYear()} The Cropper Foundation. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
