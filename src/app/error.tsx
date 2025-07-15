'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="min-h-screen bg-mint-50 flex flex-col items-center justify-center py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-mint-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-mint-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="w-32 h-2 bg-mint-400 mx-auto rounded-full"></div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8">
          <h1 className="text-heading font-bold text-mint-900 mb-6">Something went wrong!</h1>
          <p className="text-body text-mint-700 mb-8">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center px-6 py-3 bg-mint-600 text-white font-medium rounded-lg hover:bg-mint-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border-2 border-mint-300 text-mint-700 font-medium rounded-lg hover:bg-mint-50 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go home
            </Link>
          </div>
        </div>

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <details className="cursor-pointer">
              <summary className="font-semibold text-mint-900 mb-4 text-left">Error Details</summary>
              <div className="mt-4 p-4 bg-mint-50 rounded-lg">
                <pre className="text-sm text-mint-800 whitespace-pre-wrap text-left">
                  {error.message}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>
    </main>
  );
} 