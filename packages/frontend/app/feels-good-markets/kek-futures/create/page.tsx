/**
 * KEKTECH 3.0 - Create Market Page
 * Form to create new prediction markets
 */
'use client';

import { CreateMarketForm } from '@/components/kektech/create-market/CreateMarketForm';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateMarketPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/markets"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Markets
          </Link>

          <h1 className="text-3xl font-bold text-white">
            Create Prediction Market
          </h1>
          <p className="text-gray-400 mt-2">
            Create a new market for others to bet on future events
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Box */}
        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-semibold mb-1">Creator Bond Required</p>
              <p className="text-yellow-200/80">
                You must deposit 0.1 BASED to create a market. This bond is refundable
                after the market is finalized, but will be forfeited if the market is
                rejected for violating guidelines.
              </p>
            </div>
          </div>
        </div>

        {/* Create Market Form */}
        <CreateMarketForm />

        {/* Guidelines */}
        <div className="mt-8 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
          <h3 className="text-lg font-bold text-white mb-4">Market Guidelines</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-[#3fb8bd] font-bold">✓</span>
              <span>Questions must be clear, specific, and objectively resolvable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3fb8bd] font-bold">✓</span>
              <span>End date must be in the future (minimum 24 hours from now)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3fb8bd] font-bold">✓</span>
              <span>Markets about illegal activities or violence will be rejected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3fb8bd] font-bold">✓</span>
              <span>Resolution criteria must be clearly defined in the description</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3fb8bd] font-bold">✓</span>
              <span>All markets require admin approval before going live</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
