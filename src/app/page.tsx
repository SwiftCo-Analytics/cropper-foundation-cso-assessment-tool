"use client";

import Link from "next/link";
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
        <div className="absolute inset-0 bg-gradient-to-b from-cropper-mint-100/50 to-cropper-mint-50 pointer-events-none" />
        <div className="content-container relative">
          <FadeIn>
            <div className="content-narrow text-center">
              <motion.h1 
                className="text-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                CSO Self Assessment Tool
              </motion.h1>
              <motion.p 
                className="text-body-lg mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                A comprehensive tool for Civil Society Organizations to evaluate their practices,
                identify strengths, and discover areas for improvement.
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
        <div className="absolute inset-0 bg-gradient-to-br from-cropper-mint-100/30 via-transparent to-cropper-mint-50/30 pointer-events-none" />
        <div className="content-container relative">
          <ScaleIn>
            <div className="section-header">
              <h2 className="section-title">
                Everything you need to assess your organization
              </h2>
              <p className="section-subtitle">
                Our tool provides a structured approach to evaluating your organization's
                practices across multiple dimensions.
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
                description: "Receive detailed PDF reports with actionable insights and recommendations tailored to your organization.",
                color: "blue",
                delay: 0.2
              },
              {
                icon: BarChart3,
                title: "Progress Tracking",
                description: "Monitor your organization's improvement over time with our comprehensive tracking system.",
                color: "brown",
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

      {/* CTA Section */}
      <section className="section-spacing-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cropper-mint-100 to-cropper-mint-50 pointer-events-none" />
        <div className="content-container relative">
          <FadeIn delay={0.2}>
            <div className="content-narrow text-center">
              <h2 className="text-heading text-cropper-mint-800 mb-4">
                Ready to improve your organization?
              </h2>
              <p className="text-body-lg mb-8">
                Start your assessment today and get actionable insights to enhance your
                organization's effectiveness.
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
