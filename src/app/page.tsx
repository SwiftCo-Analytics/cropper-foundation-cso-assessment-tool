"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, BarChart3, FileText } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import { useOrganizationAuth } from "@/hooks/useOrganizationAuth";

export default function Home() {
  const { isAuthenticated, organization, loading, navigateToAssessment } = useOrganizationAuth();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden section-spacing">
        <div className="absolute inset-0 bg-gradient-to-b from-cropper-yellow-100/50 to-cropper-yellow-50 pointer-events-none" />
        
        {/* Background Artwork */}
        <div className="absolute top-0 right-0 w-full h-4/3 opacity-40">
          <img
            src="/naf/Artboard 1@300x.png"
            alt="Decorative background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="content-container relative">
          <FadeIn>
            <div className="content-narrow text-center">
              <motion.h1 
                className="text-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <div className="text-center">
                  <div className="flex justify-start mb-2">
                    <div className="text-cropper-green-700 text-lg md:text-xl font-medium text-left">
                      IGNITE CSOs
                    </div>
                  </div>
                  <div className="text-cropper-green-800 font-display font-bold text-4xl md:text-5xl lg:text-6xl mb-2">
                    CSO Self Assessment
                  </div>
                  <div className="flex justify-end">
                    <div className="text-cropper-green-600 text-lg md:text-xl font-medium text-right">
                      for Civil Society Organisations
                    </div>
                  </div>
                </div>
              </motion.h1>
              <motion.p 
                className="text-body-lg mt-6 text-gray-700 leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                A comprehensive accountability assessment tool designed to help Civil Society Organisations 
                <span className="text-cropper-green-700 font-medium"> evaluate their governance</span>,
                <span className="text-cropper-green-700 font-medium"> financial management</span>,
                <span className="text-cropper-green-700 font-medium"> project management</span>, and
                <span className="text-cropper-green-700 font-medium"> human resource practices</span> for 
                sustainable growth and sector leadership.
              </motion.p>
              <motion.div 
                className="mt-10 flex items-center justify-center gap-x-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                <Hover>
                  <button
                    onClick={navigateToAssessment}
                    disabled={loading}
                    className="btn-primary btn-lg"
                  >
                    {loading ? "Loading..." : "Start Assessment"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Hover>
                <Hover>
                  <Link
                    href="/about"
                    className="nav-link text-body-lg flex items-center"
                  >
                    Learn more <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Hover>
              </motion.div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-spacing bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cropper-yellow-100/30 via-transparent to-cropper-green-50/30 pointer-events-none" />
        
        {/* Decorative artwork */}
        <div className="absolute top-10 left-10 w-32 h-32 opacity-5">
          <img
            src="/naf/OVAL@300x.png"
            alt="Decorative element"
            className="w-full h-full object-contain"
          />
        </div>
        
        <div className="content-container relative">
          <ScaleIn>
            <div className="section-header">
                          <h2 className="section-title">
              Everything you need to assess your CSO accountability
            </h2>
            <p className="section-subtitle">
              Our tool provides a structured approach to evaluating your organisation's
              accountability practices across four key dimensions.
            </p>
            </div>
          </ScaleIn>

          <div className="grid-cards">
            {[
              {
                icon: CheckCircle,
                title: "Automated Scoring",
                description: "Get instant feedback with our sophisticated scoring system that evaluates your responses in real-time.",
                color: "green",
                delay: 0
              },
              {
                icon: FileText,
                title: "Custom Reports",
                description: "Receive detailed PDF reports with actionable insights and recommendations tailored to your organisation.",
                color: "blue",
                delay: 0.2
              },
              {
                icon: BarChart3,
                title: "Progress Tracking",
                description: "Monitor your organisation's improvement over time with our comprehensive tracking system.",
                color: "orange",
                delay: 0.4
              }
            ].map((feature, index) => (
              <SlideIn key={index} direction="up" delay={feature.delay}>
                <Hover>
                  <div className="card">
                    <div className={`h-12 w-12 rounded-lg bg-cropper-${feature.color}-100 flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 text-cropper-${feature.color}-600`} />
                    </div>
                    <h3 className="text-subheading mb-2">{feature.title}</h3>
                    <p className="text-body">{feature.description}</p>
                  </div>
                </Hover>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Elements Section */}
      <section className="section-spacing-sm bg-gradient-to-r from-cropper-green-50 to-cropper-blue-50 relative overflow-hidden">
        <div className="content-container relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="text-center">
              <div className="relative w-64 h-64 mx-auto mb-4">
                <img
                  src="/naf/ACC@300x.png"
                  alt="Assessment visualization"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-display font-semibold text-cropper-green-800 mb-2">Comprehensive Assessment</h3>
              <p className="text-sm text-gray-600">Evaluate all aspects of your CSO accountability</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-64 h-64 mx-auto mb-4">
                <img
                  src="/naf/GOV@300x.png"
                  alt="Analysis visualization"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-display font-semibold text-cropper-blue-800 mb-2">Detailed Analysis</h3>
              <p className="text-sm text-gray-600">Get insights into your accountability strengths and areas for improvement</p>
            </div>
            
            <div className="text-center">
              <div className="relative w-64 h-64 mx-auto mb-4">
                <img
                  src="/naf/OVAL@300x.png"
                  alt="Growth visualization"
                  className="w-full h-full object-contain"
                />
              </div>
              <h3 className="text-lg font-display font-semibold text-cropper-orange-800 mb-2">Sustainable Growth</h3>
              <p className="text-sm text-gray-600">Build a stronger, more accountable CSO</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-spacing-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cropper-orange-100 to-cropper-yellow-100 pointer-events-none" />
        
        {/* Background decoration */}
        <div className="absolute bottom-0 right-0 w-full h-full opacity-10">
          <img
            src="/naf/Artboard 10@300x.png"
            alt="Decorative background"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="content-container relative">
          <FadeIn delay={0.2}>
            <div className="content-narrow text-center">
              <h2 className="text-heading text-cropper-green-800 mb-4">
                Ready to improve your CSO accountability?
              </h2>
              <p className="text-body-lg mb-8">
                Start your assessment today and get actionable insights to enhance your
                organisation's accountability practices.
              </p>
              <Hover>
                <button
                  onClick={navigateToAssessment}
                  disabled={loading}
                  className="btn-primary btn-lg"
                >
                  {loading ? "Loading..." : "Begin Assessment"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </Hover>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
