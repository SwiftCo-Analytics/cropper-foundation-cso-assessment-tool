'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong!</h1>
      <p className="mb-6 text-center text-gray-600">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          Go home
        </Link>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 p-4 bg-gray-100 rounded">
          <summary className="cursor-pointer font-semibold">Error Details</summary>
          <pre className="mt-2 text-sm text-red-600 whitespace-pre-wrap">
            {error.message}
          </pre>
        </details>
      )}
    </main>
  );
} 