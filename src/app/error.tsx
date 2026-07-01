'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong!</h2>
        <p className="text-slate-600 mb-8">
          We encountered an error while trying to load the transfer list. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="bg-[#0077b6] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#005d90] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
