import React from 'react';

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-mint-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-16">
            <h1 className="text-hero font-bold text-mint-900 mb-6">Terms of Service</h1>
            <div className="w-24 h-1 bg-mint-400 mx-auto rounded-full"></div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-body text-mint-700 mb-8">
                Welcome to our website. By accessing or using our service, you agree to be bound by these Terms of Service.
              </p>

              <section className="space-y-6">
                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Use of Service</h2>
                  <ul className="list-disc ml-6 space-y-2 text-body text-mint-700">
                    <li>You must be at least 18 years old to use this service.</li>
                    <li>You agree not to misuse the service or help anyone else do so.</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Intellectual Property</h2>
                  <p className="text-body text-mint-700">
                    All content on this site is the property of SwiftCo Analytics. You may not copy, reproduce, or distribute any content without permission.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Limitation of Liability</h2>
                  <p className="text-body text-mint-700">
                    We are not liable for any damages or losses resulting from your use of our service.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Changes to Terms</h2>
                  <p className="text-body text-mint-700">
                    We may update these Terms of Service from time to time. Continued use of the service means you accept the changes.
                  </p>
                </div>

                <div>
                  <h2 className="text-heading font-semibold text-mint-900 mb-4">Contact Us</h2>
                  <p className="text-body text-mint-700">
                    If you have any questions about these Terms, please contact us at{' '}
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