import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
      <p className="mb-6 text-center">Sorry, the page you are looking for does not exist or has been moved.</p>
      <Link href="/" className="text-blue-600 hover:underline">Go back home</Link>
    </main>
  );
} 