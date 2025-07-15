import React from 'react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-mint-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-hero font-bold text-mint-900 mb-6">Privacy Policy</h1>
            <div className="w-24 h-1 bg-mint-400 mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-body text-mint-700 mb-8">
                Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website.
              </p>

              <section className="space-y-6">
                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Information We Collect</h2>
                  <ul className="list-disc ml-6 space-y-2 text-body text-mint-700">
                    <li>Personal identification information (Name, email address, etc.)</li>
                    <li>Usage data and cookies</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">How We Use Information</h2>
                  <ul className="list-disc ml-6 space-y-2 text-body text-mint-700">
                    <li>To provide and maintain our service</li>
                    <li>To improve our website</li>
                    <li>To communicate with you</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Your Rights</h2>
                  <p className="text-body text-mint-700">
                    You have the right to access, update, or delete your personal information. Contact us for any privacy-related requests.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Contact Us</h2>
                  <p className="text-body text-mint-700">
                    If you have any questions about this Privacy Policy, please contact us at{' '}
                    <a href="mailto:support@swiftcoanalytics.com" className="text-mint-600 hover:text-mint-700 underline">
                      support@swiftcoanalytics.com
                    </a>
                    .
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 