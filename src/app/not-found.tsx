"use client";

import React from 'react';
import Link from 'next/link';
import { Home, Building2, Shield, ArrowRight, Search, AlertTriangle } from 'lucide-react';
import { FadeIn, SlideIn, ScaleIn } from "@/components/ui/animations";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cropper-mint-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="max-w-2xl mx-auto">
            <ScaleIn>
              <div className="bg-white rounded-xl shadow-soft border border-cropper-mint-200 p-8">
                {/* Error Icon and Number */}
                <motion.div 
                  className="mb-8 text-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="mx-auto h-20 w-20 rounded-xl bg-red-100 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-10 w-10 text-red-600" />
                  </div>
                  <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                  <div className="w-32 h-2 bg-cropper-mint-400 mx-auto rounded-full"></div>
                </motion.div>

                {/* Error Message */}
                <SlideIn delay={0.2}>
                  <div className="mb-8 text-center">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
                    <p className="text-lg text-gray-700 mb-6">
                      Sorry, the page you are looking for does not exist or has been moved.
                    </p>
                    <p className="text-base text-gray-600">
                      You can try one of the options below to get back on track.
                    </p>
                  </div>
                </SlideIn>

                {/* Navigation Options */}
                <SlideIn delay={0.4}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Link 
                      href="/" 
                      className="bg-white rounded-lg border border-cropper-mint-200 p-4 text-center hover:shadow-soft-lg hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="h-12 w-12 rounded-lg bg-cropper-mint-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-cropper-mint-200 transition-colors duration-200">
                        <Home className="h-6 w-6 text-cropper-mint-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Go Home</h3>
                      <p className="text-sm text-gray-600">Return to the main page</p>
                    </Link>

                    <Link 
                      href="/organization/login" 
                      className="bg-white rounded-lg border border-cropper-mint-200 p-4 text-center hover:shadow-soft-lg hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="h-12 w-12 rounded-lg bg-cropper-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-cropper-blue-200 transition-colors duration-200">
                        <Building2 className="h-6 w-6 text-cropper-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Organization Login</h3>
                      <p className="text-sm text-gray-600">Access your organization dashboard</p>
                    </Link>

                    <Link 
                      href="/admin/login" 
                      className="bg-white rounded-lg border border-cropper-mint-200 p-4 text-center hover:shadow-soft-lg hover:scale-105 transition-all duration-300 group"
                    >
                      <div className="h-12 w-12 rounded-lg bg-cropper-brown-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-cropper-brown-200 transition-colors duration-200">
                        <Shield className="h-6 w-6 text-cropper-brown-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Access</h3>
                      <p className="text-sm text-gray-600">Administrative dashboard</p>
                    </Link>
                  </div>
                </SlideIn>

                {/* Primary Action */}
                <SlideIn delay={0.6}>
                  <div className="text-center">
                    <Link 
                      href="/" 
                      className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-cropper-mint-600 hover:bg-cropper-mint-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cropper-mint-500 transition-colors duration-200 hover:scale-105"
                    >
                      <Home className="mr-2 h-5 w-5" />
                      Return to Home
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                </SlideIn>

                {/* Additional Help */}
                <motion.div 
                  className="mt-8 pt-6 border-t border-gray-200 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.8 }}
                >
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-2">
                    <Search className="h-4 w-4" />
                    <span>Need help finding something?</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    If you believe this is an error, please contact our support team.
                  </p>
                </motion.div>
              </div>
            </ScaleIn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
} 