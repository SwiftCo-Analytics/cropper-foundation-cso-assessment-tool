import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Header from "@/components/ui/header";
import AuthProvider from "@/components/providers/session-provider";
import Logos from "@/components/ui/logos";

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
            <main className="flex-grow">
              {children}
            </main>
            <footer className="bg-white border-t border-cropper-green-200">
              <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                  <Logos 
                    title="Our Partners"
                    subtitle="Working together for sustainable development"
                    variant="footer"
                  />
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
