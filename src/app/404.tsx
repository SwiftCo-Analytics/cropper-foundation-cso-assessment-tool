import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-mint-50 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Number */}
        <div className="mb-8">
          <h1 className="text-display font-bold text-mint-900 mb-4">404</h1>
          <div className="w-32 h-2 bg-mint-400 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h2 className="text-heading font-semibold text-mint-900 mb-6">Page Not Found</h2>
          <p className="text-body text-mint-700 mb-8">
            Sorry, the page you are looking for does not exist or has been moved.
          </p>
          
          {/* Action Button */}
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-mint-600 text-white font-medium rounded-lg hover:bg-mint-700 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Go back home
          </Link>
        </div>

        {/* Additional Help */}
        <div className="text-caption text-mint-600">
          <p>If you believe this is an error, please contact our support team.</p>
        </div>
      </div>
    </main>
  );
} 