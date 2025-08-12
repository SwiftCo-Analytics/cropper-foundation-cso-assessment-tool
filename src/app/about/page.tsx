"use client";

import Image from "next/image";
import { FadeIn, SlideIn, ScaleIn, Hover } from "@/components/ui/animations";
import { motion } from "framer-motion";
import Logos from "@/components/ui/logos";

export default function AboutPage() {
  return (
    <div className="content-container section-spacing">
      {/* Hero Section */}
      <FadeIn>
        <div className="text-center mb-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cropper-yellow-100 to-cropper-green-50 rounded-3xl transform -skew-y-2" />
          <div className="relative py-12">
            <motion.h1 
              className="text-display mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Advancing Informed and Inclusive Decision-making
            </motion.h1>
            <motion.p 
              className="text-body-lg max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              For Sustainable Caribbean Development Through Civil Society Empowerment
            </motion.p>
          </div>
        </div>
      </FadeIn>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        <SlideIn direction="left">
          <div className="card card-lg">
            <h2 className="text-heading text-cropper-green-700 mb-6">
              The Cropper Foundation
            </h2>
            <div className="prose prose-lg">
              <p className="text-body mb-4">
                The Cropper Foundation is a non-profit organisation based in Trinidad and Tobago, 
                dedicated to advancing informed and inclusive decision-making for sustainable development. 
                For almost 25 years, we have been at the forefront of efforts to ensure that nature 
                and the environment are integral to how development is understood and approached by 
                decision-makers and communities alike.
              </p>
              <p className="text-body mb-4">
                Our work is driven by the belief that sustainable development must include everyone 
                and everything—from policymakers to private citizens, and from academia to the private 
                sector. At the heart of our mission is the idea that nature is everyone's business, 
                and its stewardship is essential for a thriving future.
              </p>
              <p className="text-body mb-4">
                Through nearly a quarter-century of innovation, collaboration, and impact, we remain 
                committed to creating a future where development respects and preserves the natural 
                world, ensuring a better quality of life for all.
              </p>
            </div>
          </div>
        </SlideIn>

        <SlideIn direction="right">
          <div className="card card-lg">
            <h2 className="text-heading text-cropper-blue-700 mb-6">
              Why CSO Self-Assessment Matters
            </h2>
            <div className="prose prose-lg">
              <p className="text-body mb-4">
                As part of our commitment to inclusive decision-making and sustainable development, 
                we recognize the crucial role that Civil Society Organizations (CSOs) play in shaping 
                our region's future. Our CSO Self-Assessment Tool is designed to strengthen these 
                vital organizations in their mission to create positive change.
              </p>
              <p className="text-body mb-4">
                Through this tool, we help CSOs:
              </p>
              <ul className="list-none pl-0 mb-4 space-y-2">
                {[
                  "Strengthen their organizational capacity and governance",
                  "Enhance their role in sustainable development initiatives",
                  "Build stronger partnerships across sectors",
                  "Improve their environmental stewardship practices",
                  "Increase their impact on policy and community levels",
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

      {/* Our Impact Section */}
      <ScaleIn>
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-8 mb-16 shadow-soft">
          <h2 className="text-heading text-center mb-8">
            Our Impact and Partnerships
          </h2>
          <div className="grid-cards">
            {[
              {
                title: "Policy Integration",
                description: "Partnering with policymakers to integrate environmental considerations into decision-making",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                ),
                color: "green"
              },
              {
                title: "Research & Advocacy",
                description: "Engaging with academia and civil society to foster research and advocacy for sustainability",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                ),
                color: "blue"
              },
              {
                title: "Private Sector",
                description: "Expanding partnerships with the private sector to ensure comprehensive sustainable development",
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                ),
                color: "orange"
              }
            ].map((item, index) => (
              <Hover key={index}>
                <div className="card">
                  <div className={`bg-cropper-${item.color}-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 text-cropper-${item.color}-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {item.icon}
                    </svg>
                  </div>
                  <h3 className="text-subheading text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-body">{item.description}</p>
                </div>
              </Hover>
            ))}
          </div>
        </div>
      </ScaleIn>

      {/* Vision Section */}
      <SlideIn direction="up">
        <div className="bg-gradient-to-r from-cropper-green-100 to-cropper-yellow-50 rounded-xl p-8 mb-16 shadow-soft transform hover:scale-[1.02] transition-transform duration-300">
          <h2 className="text-heading text-center mb-4">
            One Planet, One World, One Trinidad and Tobago
          </h2>
          <p className="text-body text-center max-w-3xl mx-auto mb-8">
            We all exist within nature, and sustainable development cannot happen without recognising 
            this interdependence. Through technical expertise, partnerships, and guided processes, 
            we ensure that development is informed by a holistic understanding of nature, equity, 
            and community resilience.
          </p>
        </div>
      </SlideIn>

      {/* Contact Section */}
      <FadeIn delay={0.4}>
        <div className="text-center card card-lg">
          <h2 className="text-heading mb-4">
            Join Us in Creating Sustainable Change
          </h2>
          <p className="text-body mb-4">
            Have questions about the CSO Self-Assessment Tool or The Cropper Foundation?
          </p>
          <Hover>
            <a
              href="mailto:info@thecropperfoundation.org"
              className="btn-primary"
            >
              Contact Us
            </a>
          </Hover>
        </div>
      </FadeIn>

      {/* Partners Section */}
      <FadeIn delay={0.6}>
        <div className="card card-lg">
          <Logos 
            title="Our Partners and Collaborators"
            subtitle="Working together to advance sustainable development in the Caribbean"
            variant="about"
          />
        </div>
      </FadeIn>
    </div>
  );
} 