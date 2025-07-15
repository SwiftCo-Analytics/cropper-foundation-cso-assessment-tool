"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle, BarChart3, FileText } from "lucide-react";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cropper-green-50/50 to-white pointer-events-none" />
        <div className="container mx-auto px-4 py-24 relative">
          <FadeIn>
            <div className="max-w-3xl mx-auto text-center">
              <motion.h1 
                className="text-5xl font-bold tracking-tight text-cropper-green-800 sm:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                CSO Self Assessment Tool
              </motion.h1>
              <motion.p 
                className="mt-6 text-lg leading-8 text-gray-600"
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
                  <Link
                    href="/assessment/new"
                    className="bg-cropper-green-600 text-white px-6 py-3 rounded-full hover:bg-cropper-green-700 transition-colors duration-300 flex items-center"
                  >
                    Start Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Hover>
                <Hover>
                  <Link
                    href="/about"
                    className="text-cropper-green-600 hover:text-cropper-green-700 font-medium flex items-center"
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
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cropper-blue-50/30 via-transparent to-cropper-green-50/30 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <ScaleIn>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">
                Everything you need to assess your organization
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Our tool provides a structured approach to evaluating your organization's
                practices across multiple dimensions.
              </p>
            </div>
          </ScaleIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
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
                  <div className="bg-white rounded-xl p-6 shadow-soft hover:shadow-soft-lg transition-all duration-300">
                    <div className={`h-12 w-12 rounded-lg bg-cropper-${feature.color}-100 flex items-center justify-center mb-4`}>
                      <feature.icon className={`h-6 w-6 text-cropper-${feature.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </Hover>
              </SlideIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cropper-green-50 to-cropper-blue-50 pointer-events-none" />
        <div className="container mx-auto px-4 relative">
          <FadeIn delay={0.2}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-cropper-green-800 mb-4">
                Ready to improve your organization?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Start your assessment today and get actionable insights to enhance your
                organization's effectiveness.
              </p>
              <Hover>
                <Link
                  href="/assessment/new"
                  className="inline-block bg-cropper-green-600 text-white px-6 py-3 rounded-full hover:bg-cropper-green-700 transition-colors duration-300 flex items-center justify-center mx-auto w-fit"
                >
                  Begin Assessment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Hover>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
