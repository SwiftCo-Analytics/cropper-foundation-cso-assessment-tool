"use client";

import Image from "next/image";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import Logos from "@/components/ui/logos";
import BackButton from "@/components/ui/back-button";

export default function AboutPage() {
  return (
    <div className="content-container section-spacing">
      <div className="mb-6">
        <BackButton />
      </div>
      {/* Hero Section */}
      <FadeIn>
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cropper-yellow-100 to-cropper-green-50 rounded-3xl transform -skew-y-2" />
          <div className="relative py-12">
            <motion.h1 
              className="text-display mb-0 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              IGNITE CSOs: 
            </motion.h1>
            <motion.p 
              className="text-body-lg max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Improving Governance, Networking and Inclusivity Towards Empowered Civil Society Organisations
            </motion.p>
          </div>
        </div>
      </FadeIn>

      {/* IGNITE CSOs Overview */}
      <SlideIn direction="up">
        <div className="card card-lg mb-16">
          <h2 className="text-heading text-cropper-green-700 mb-6">
            IGNITE CSOs
          </h2>
          <div>
            <p className="text-body mb-4">
              In 2023, The Cropper Foundation and Veni Apwann were awarded a grant by the European Union for the implementation of this 30-month Action, which aims to strengthen the capacities of TT-based CSOs to enhance, uphold and promote the enabling environment on behalf of vulnerable communities.
            </p>
            <p className="text-body mb-4">
              IGNITE CSOs is equally focused on strengthening national (legal and fiscal) regulatory frameworks and improving accountability across the local civil society sector through the creation of self-regulatory frameworks and capacity-building tools.
            </p>
            <p className="text-body mb-4">
              Premised on the multi-stakeholder approach, the Action engages productively with state regulators, private sector actors, professional associations and representatives of a diverse civil society sector.
            </p>
            <p className="text-body mb-4">
              IGNITE CSOs builds on the work pioneered by a consortium of CSOs under the EU-funded CSOs for Good Governance action (2017-2021).
            </p>
          </div>
        </div>
      </SlideIn>

      {/* Main Content - stacked */}
      <div className="flex flex-col gap-12 mb-16">
        <SlideIn direction="up">
          <div className="card card-lg">
            <h2 className="text-heading text-cropper-green-700 mb-6">
              The Cropper Foundation
            </h2>
            <div>
              <p className="text-body mb-4">
                The Cropper Foundation is a non-profit organisation based in Trinidad and Tobago, dedicated to advancing informed and inclusive decision-making for sustainable development. For 25 years, we have led and supported efforts to ensure that nature and the environment are integral to how our Caribbean communities and decision-makers alike understand and approach development.
              </p>
              <p className="text-body mb-4">
                Our work is driven by the belief that sustainable development must include everyone —from policymakers to private citizens, and from academia to the private sector.
              </p>
              <p className="text-body mb-4">
                After a quarter-century of collaboration, innovation and impact, we remain committed to creating a sustainable, just, equitable future where development ensures the preservation of the natural world alongside a better quality of life for all.
              </p>
            </div>
          </div>
        </SlideIn>

        <SlideIn direction="up">
          <div className="card card-lg">
            <h2 className="text-heading text-cropper-blue-700 mb-6">
              Veni Apwann
            </h2>
            <div>
              <p className="text-body mb-4">
                Veni Apwann is a registered non-profit company, established in 2002 by civil society leaders, to build capacity in the sector by providing training, technical support and guidance.
              </p>
              <p className="text-body mb-4">
                Meaning both 'come and learn' and 'come and teach' in Creole, "Veni Apwann" captures the essence of our approach – innovative, participatory, strongly rooted in our Caribbean heritage and civil society backgrounds, and based on a spirit of partnership within and beyond the non-profit sector.
              </p>
              <p className="text-body mb-4">
                We are honoured to have partnered with The Cropper Foundation on the IGNITE CSOs Project, and to have led the development of the National Accountability Framework, which includes the CSO Assessment Tool.
              </p>
              <p className="text-body mb-4">
                We encourage all organizations to make rigourous use of this Assessment Tool!
              </p>
            </div>
          </div>
        </SlideIn>
      </div>

      {/* SwiftCo Analytics Section */}
      <SlideIn direction="up">
        <div className="card card-lg mb-16">
          <h2 className="text-heading text-cropper-orange-700 mb-6">
            SwiftCo Analytics
          </h2>
          <div>
            <p className="text-body mb-4">
              SwiftCo Analytics is a technology company specializing in data analytics and digital solutions. We are proud to have developed this CSO Self-Assessment Tool as part of the IGNITE CSOs project.
            </p>
            <p className="text-body mb-4">
              Our mission is to empower organisations with data-driven insights and digital tools that enhance their capacity for impact and accountability. Through innovative technology solutions, we're helping CSOs measure, track, and improve their performance while strengthening their governance and operational effectiveness.
            </p>
            <p className="text-body mb-4">
              We believe that technology should be accessible, user-friendly, and purpose-driven. This assessment tool represents our commitment to supporting the civil society sector with practical, scalable solutions that drive positive change.
            </p>
          </div>
        </div>
      </SlideIn>

      {/* Why CSO Self-Assessment Matters */}
      <SlideIn direction="up">
        <div className="card card-lg mb-16">
          <h2 className="text-heading text-cropper-green-700 mb-6">
            Why CSO Self-Assessment Matters
          </h2>
          <div>
            <p className="text-body mb-4">
              Civil Society Organisations (CSOs) play a crucial role in responding to our country's challenges while helping shape its future. This CSO Self-Assessment Tool is designed to strengthen our organisations' capacities to realise our collective mission to create positive and lasting change.
            </p>
            <p className="text-body mb-4">
              Through this tool, we aim to help CSOs:
            </p>
            <ul className="list-none pl-0 mb-4 space-y-2">
              {[
                "Measure themselves against generally accepted standards of accountability",
                "Determine the actions they might take to achieve the level of accountability they deem suited to them",
                "Develop more resilient and sustainable operations"
              ].map((item, index) => (
                <motion.li 
                  key={index}
                  className="flex items-center bg-cropper-green-100 p-3 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="h-2 w-2 rounded-full bg-cropper-green-500 mr-3" />
                  <span className="text-body">{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </SlideIn>
    </div>
  );
} 