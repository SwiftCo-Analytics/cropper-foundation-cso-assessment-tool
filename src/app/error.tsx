'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Building2, Shield, ArrowRight, Bug } from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-cropper-mint-100/50 to-cropper-mint-50 pointer-events-none" />
      
      <div className="content-container relative min-h-screen flex items-center justify-center py-12">
        <FadeIn>
          <div className="content-narrow text-center">
            <ScaleIn>
              <div className="card card-lg max-w-2xl mx-auto">
                {/* Error Icon */}
                <motion.div 
                  className="mb-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mx-auto h-20 w-20 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                  </div>
                  <h1 className="text-heading mb-4">Something went wrong!</h1>
                  <div className="w-32 h-2 bg-cropper-mint-400 mx-auto rounded-full"></div>
                </motion.div>

                {/* Error Message */}
                <SlideIn delay={0.2}>
                  <div className="mb-8">
                    <p className="text-body-lg text-gray-700 mb-6">
                      An unexpected error occurred. Please try again or choose one of the options below.
                    </p>
                    <p className="text-body text-gray-600">
                      If the problem persists, please contact our support team.
                    </p>
                  </div>
                </SlideIn>

                {/* Primary Action - Retry */}
                <SlideIn delay={0.4}>
                  <Hover>
                    <button
                      onClick={reset}
                      className="btn-primary btn-lg inline-flex items-center mb-6"
                    >
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Try Again
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </button>
                  </Hover>
                </SlideIn>

                {/* Navigation Options */}
                <SlideIn delay={0.6}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Hover>
                      <Link 
                        href="/" 
                        className="card card-sm text-center hover:shadow-soft-lg transition-all duration-300 group"
                      >
                        <div className="h-12 w-12 rounded-lg bg-cropper-mint-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-cropper-mint-200 transition-colors duration-200">
                          <Home className="h-6 w-6 text-cropper-mint-600" />
                        </div>
                        <h3 className="text-subheading mb-2">Go Home</h3>
                        <p className="text-caption text-gray-600">Return to the main page</p>
                      </Link>
                    </Hover>

                    <Hover>
                      <Link 
                        href="/organization/login" 
                        className="card card-sm text-center hover:shadow-soft-lg transition-all duration-300 group"
                      >
                        <div className="h-12 w-12 rounded-lg bg-cropper-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-cropper-blue-200 transition-colors duration-200">
                          <Building2 className="h-6 w-6 text-cropper-blue-600" />
                        </div>
                        <h3 className="text-subheading mb-2">Self Assessment Login</h3>
                        <p className="text-caption text-gray-600">Access your self assessment dashboard</p>
                      </Link>
                    </Hover>

                    <Hover>
                      <Link 
                        href="/admin/login" 
                        className="card card-sm text-center hover:shadow-soft-lg transition-all duration-300 group"
                      >
                        <div className="h-12 w-12 rounded-lg bg-cropper-brown-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-cropper-brown-200 transition-colors duration-200">
                          <Shield className="h-6 w-6 text-cropper-brown-600" />
                        </div>
                        <h3 className="text-subheading mb-2">Admin Access</h3>
                        <p className="text-caption text-gray-600">Administrative dashboard</p>
                      </Link>
                    </Hover>
                  </div>
                </SlideIn>

                {/* Development Error Details */}
                {process.env.NODE_ENV === 'development' && (
                  <motion.div 
                    className="mt-8 pt-6 border-t border-gray-200"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                  >
                    <details className="cursor-pointer">
                      <summary className="font-semibold text-gray-900 mb-4 text-left flex items-center">
                        <Bug className="h-4 w-4 mr-2 text-gray-600" />
                        Error Details (Development)
                      </summary>
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap text-left">
                          {error.message}
                        </pre>
                        {error.digest && (
                          <div className="mt-2 text-xs text-gray-600">
                            Error ID: {error.digest}
                          </div>
                        )}
                      </div>
                    </details>
                  </motion.div>
                )}
              </div>
            </ScaleIn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
} 