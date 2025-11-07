/**
 * KEKTECH 3.0 - Create Market Form
 * Multi-step form for creating prediction markets
 */
'use client';

import { useState, useEffect } from 'react';
import { useCreateMarket } from '@/lib/hooks/kektech';
import { useWallet } from '@/lib/hooks/kektech';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { TransactionError, InlineError } from '../ui/ErrorDisplay';
import { parseEther } from 'viem';
import { ArrowRight, ArrowLeft, Check, Calendar, FileText, Tag, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'question' | 'description' | 'category' | 'timing' | 'review' | 'submit';

interface MarketFormData {
  question: string;
  description: string;
  category: string;
  endTime: number;
  creatorBond: string;
}

const STEPS: { id: Step; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'question', title: 'Question', icon: FileText },
  { id: 'description', title: 'Description', icon: FileText },
  { id: 'category', title: 'Category', icon: Tag },
  { id: 'timing', title: 'End Time', icon: Calendar },
  { id: 'review', title: 'Review', icon: Check },
];

const CATEGORIES = [
  'Politics',
  'Sports',
  'Crypto',
  'Technology',
  'Entertainment',
  'Science',
  'Finance',
  'Other',
];

interface CreateMarketFormProps {
  onSuccess?: (marketAddress: string) => void;
  onCancel?: () => void;
}

/**
 * Multi-step form for creating prediction markets
 */
export function CreateMarketForm({ onSuccess, onCancel }: CreateMarketFormProps) {
  const { isConnected, connect, balance } = useWallet();
  const [currentStep, setCurrentStep] = useState<Step>('question');
  const [errors, setErrors] = useState<Partial<Record<keyof MarketFormData, string>>>({});

  const [formData, setFormData] = useState<MarketFormData>({
    question: '',
    description: '',
    category: '',
    endTime: 0,
    creatorBond: '0.1', // Default 0.1 BASED
  });

  const { createMarket, isLoading, isSuccess, hash, error: txError } = useCreateMarket();

  // Reset on success
  useEffect(() => {
    if (isSuccess && hash) {
      // Market address will be in the transaction receipt
      // For now, we'll use a placeholder
      if (onSuccess) {
        onSuccess(hash); // In production, parse receipt for market address
      }
    }
  }, [isSuccess, hash, onSuccess]);

  const validateStep = (step: Step): boolean => {
    const newErrors: Partial<Record<keyof MarketFormData, string>> = {};

    switch (step) {
      case 'question':
        if (!formData.question.trim()) {
          newErrors.question = 'Question is required';
        } else if (formData.question.length < 10) {
          newErrors.question = 'Question must be at least 10 characters';
        } else if (formData.question.length > 200) {
          newErrors.question = 'Question must be less than 200 characters';
        }
        break;

      case 'description':
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        } else if (formData.description.length > 1000) {
          newErrors.description = 'Description must be less than 1000 characters';
        }
        break;

      case 'category':
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        }
        break;

      case 'timing':
        const now = Math.floor(Date.now() / 1000);
        if (!formData.endTime) {
          newErrors.endTime = 'End time is required';
        } else if (formData.endTime <= now) {
          newErrors.endTime = 'End time must be in the future';
        } else if (formData.endTime < now + 3600) {
          newErrors.endTime = 'Market must run for at least 1 hour';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1].id);
    }
  };

  const handleBack = () => {
    const stepIndex = STEPS.findIndex(s => s.id === currentStep);
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (const step of STEPS) {
      if (!validateStep(step.id)) {
        setCurrentStep(step.id);
        return;
      }
    }

    // Check balance
    const bondAmount = parseEther(formData.creatorBond);
    if (balance && bondAmount > balance) {
      setErrors({ creatorBond: 'Insufficient balance for creator bond' });
      return;
    }

    // Create market config
    const config = {
      question: formData.question,
      description: formData.description,
      category: formData.category,
      endTime: BigInt(formData.endTime),
      resolutionTime: BigInt(formData.endTime + 3600), // 1 hour after end
      minBond: bondAmount,
      curveId: 0n, // Default LMSR curve
      curveParams: [], // Default params
      metadata: '', // No additional metadata
    };

    // Create market
    await createMarket(config, bondAmount);
  };

  // Wallet connection required
  if (!isConnected) {
    return (
      <div className="p-8 bg-gray-900 rounded-xl border border-gray-800 text-center max-w-2xl mx-auto">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400 mb-6">You need to connect your wallet to create a market</p>
        <button
          onClick={() => connect()}
          className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black font-bold hover:scale-105 transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = STEPS.findIndex(s => s.id === currentStep) > index;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition',
                    isActive && 'bg-[#3fb8bd] text-black',
                    isCompleted && 'bg-green-500 text-white',
                    !isActive && !isCompleted && 'bg-gray-800 text-gray-400'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-12 h-1 mx-2 transition',
                      isCompleted ? 'bg-green-500' : 'bg-gray-800'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-gray-400 text-sm">
          Step {STEPS.findIndex(s => s.id === currentStep) + 1} of {STEPS.length}:{' '}
          {STEPS.find(s => s.id === currentStep)?.title}
        </p>
      </div>

      {/* Form content */}
      <div className="p-8 bg-gray-900 rounded-xl border border-gray-800">
        {/* Question step */}
        {currentStep === 'question' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">What&apos;s your prediction question?</h3>
            <p className="text-gray-400 mb-6">
              Ask a clear yes/no question that can be objectively resolved
            </p>
            <input
              type="text"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              placeholder="Will Bitcoin reach $100,000 by end of 2025?"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.question && <InlineError message={errors.question} />}
              <span className="text-xs text-gray-500 ml-auto">
                {formData.question.length}/200
              </span>
            </div>
          </div>
        )}

        {/* Description step */}
        {currentStep === 'description' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Add context and details</h3>
            <p className="text-gray-400 mb-6">
              Provide background information and resolution criteria
            </p>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the market, resolution criteria, and any relevant context..."
              rows={6}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd] resize-none"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-2">
              {errors.description && <InlineError message={errors.description} />}
              <span className="text-xs text-gray-500 ml-auto">
                {formData.description.length}/1000
              </span>
            </div>
          </div>
        )}

        {/* Category step */}
        {currentStep === 'category' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Choose a category</h3>
            <p className="text-gray-400 mb-6">
              Help users discover your market
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={cn(
                    'px-4 py-3 rounded-lg font-medium transition',
                    formData.category === cat
                      ? 'bg-[#3fb8bd] text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && (
              <div className="mt-4">
                <InlineError message={errors.category} />
              </div>
            )}
          </div>
        )}

        {/* Timing step */}
        {currentStep === 'timing' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">When should this market end?</h3>
            <p className="text-gray-400 mb-6">
              Choose when betting should close and resolution can begin
            </p>
            <input
              type="datetime-local"
              value={formData.endTime ? new Date(formData.endTime * 1000).toISOString().slice(0, 16) : ''}
              onChange={(e) => {
                const timestamp = Math.floor(new Date(e.target.value).getTime() / 1000);
                setFormData({ ...formData, endTime: timestamp });
              }}
              min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)} // Min 1 hour from now
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
            />
            {errors.endTime && (
              <div className="mt-2">
                <InlineError message={errors.endTime} />
              </div>
            )}

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Creator Bond (BASED)
              </label>
              <input
                type="number"
                value={formData.creatorBond}
                onChange={(e) => setFormData({ ...formData, creatorBond: e.target.value })}
                step="0.1"
                min="0.1"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
              />
              <p className="text-xs text-gray-400 mt-1">
                Minimum bond required to create a market. You&apos;ll get this back when the market resolves.
              </p>
              {balance && (
                <p className="text-xs text-gray-400 mt-1">
                  Your balance: {(Number(balance) / 1e18).toFixed(4)} BASED
                </p>
              )}
            </div>
          </div>
        )}

        {/* Review step */}
        {currentStep === 'review' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Review your market</h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-400 block mb-1">Question</label>
                <p className="text-white">{formData.question}</p>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-400 block mb-1">Description</label>
                <p className="text-white whitespace-pre-wrap">{formData.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <label className="text-sm text-gray-400 block mb-1">Category</label>
                  <p className="text-white">{formData.category}</p>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg">
                  <label className="text-sm text-gray-400 block mb-1">End Time</label>
                  <p className="text-white">
                    {new Date(formData.endTime * 1000).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <label className="text-sm text-gray-400 block mb-1">Creator Bond</label>
                <p className="text-white">{formData.creatorBond} BASED</p>
              </div>
            </div>

            {txError && (
              <div className="mt-6">
                <TransactionError error={txError} />
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
          <button
            onClick={currentStep === 'question' ? onCancel : handleBack}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 'question' ? 'Cancel' : 'Back'}
          </button>

          {currentStep === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={isLoading || isSuccess}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#3fb8bd] to-[#4ecca7] text-black font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <ButtonLoading text="Creating Market..." />
              ) : isSuccess ? (
                'Market Created! ✓'
              ) : (
                'Create Market'
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg bg-[#3fb8bd] text-black font-semibold hover:bg-[#3fb8bd]/90 transition flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
