/**
 * KEKTECH 3.0 - Create Market Form
 * Multi-step form for creating prediction markets
 */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCreateMarket } from '@/lib/hooks/kektech';
import { useWallet } from '@/lib/hooks/kektech';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { TransactionError, InlineError } from '../ui/ErrorDisplay';
import { parseEther } from 'viem';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  FileText,
  Tag,
  AlertCircle,
  DollarSign,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryToBytes32 } from '@/lib/utils/category';
import Link from 'next/link';
import { DEPLOYMENT_INFO } from '@/lib/contracts/addresses';

type Step =
  | 'question'
  | 'description'
  | 'category'
  | 'outcomes'
  | 'timing'
  | 'economics'
  | 'review'
  | 'submit';

type CurveTypeOption = 'LMSR' | 'LINEAR' | 'EXPONENTIAL' | 'SIGMOID';

const CURVE_OPTIONS: {
  value: CurveTypeOption;
  label: string;
  helper: string;
  defaultParams: string;
}[] = [
  {
    value: 'LMSR',
    label: 'LMSR (Balanced)',
    helper: 'Balanced odds curve. Try params around 7500 for most markets.',
    defaultParams: '7500',
  },
  {
    value: 'LINEAR',
    label: 'Linear (Simple)',
    helper: 'Price grows linearly with demand. Params around 1000 feel stable.',
    defaultParams: '1000',
  },
  {
    value: 'EXPONENTIAL',
    label: 'Exponential (High Sensitivity)',
    helper: 'Aggressive curve for speculative markets. Use smaller params like 25.',
    defaultParams: '25',
  },
  {
    value: 'SIGMOID',
    label: 'Sigmoid (S-Curve)',
    helper: 'Slow start, rapid middle growth. Params around 5000 work well.',
    defaultParams: '5000',
  },
];

const CURVE_TYPE_TO_ENUM: Record<CurveTypeOption, number> = {
  LMSR: 0,
  LINEAR: 1,
  EXPONENTIAL: 2,
  SIGMOID: 3,
};

interface MarketFormData {
  question: string;
  description: string;
  category: string;
  outcome1: string;
  outcome2: string;
  endTime: number;
  creatorBond: string;
  curveType: CurveTypeOption;
  curveParams: string;
}

const STEPS: { id: Step; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'question', title: 'Question', icon: FileText },
  { id: 'description', title: 'Description', icon: FileText },
  { id: 'category', title: 'Category', icon: Tag },
  { id: 'outcomes', title: 'Outcomes', icon: Check },
  { id: 'timing', title: 'End Time', icon: Calendar },
  { id: 'economics', title: 'Curve & Fees', icon: DollarSign },
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
  onSuccess?: (result: { txHash: string; marketAddress?: string }) => void;
  onCancel?: () => void;
}

/**
 * Multi-step form for creating prediction markets
 */
export function CreateMarketForm({ onSuccess, onCancel }: CreateMarketFormProps) {
  const { isConnected, connect, balance } = useWallet();
  const [currentStep, setCurrentStep] = useState<Step>('question');
  const [errors, setErrors] = useState<Partial<Record<keyof MarketFormData, string>>>({});
  const endTimeSetRef = useRef(false); // Track if user has set timing
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastReportedTxRef = useRef<{ hash: string | null; address: string | null }>({
    hash: null,
    address: null,
  });
  const [copiedField, setCopiedField] = useState<'hash' | 'address' | null>(null);

  const [formData, setFormData] = useState<MarketFormData>({
    question: '',
    description: '',
    category: '',
    outcome1: 'Yes',      // Default positive outcome
    outcome2: 'No',       // Default negative outcome
    endTime: Math.floor(Date.now() / 1000) + 86400, // Default: 24 hours from now
    creatorBond: '0.1', // Default 0.1 BASED
    curveType: CURVE_OPTIONS[0].value,
    curveParams: CURVE_OPTIONS[0].defaultParams,
  });

  const { createMarket, isLoading, isSuccess, hash, error: txError, marketAddress } =
    useCreateMarket();
  const explorerBaseUrl = DEPLOYMENT_INFO.explorerUrl || 'https://explorer.bf1337.org';

  // Reset on success
  useEffect(() => {
    if (!isSuccess || !hash || !onSuccess) return;

    const normalizedAddress = marketAddress ?? null;
    const alreadyReported =
      lastReportedTxRef.current.hash === hash &&
      lastReportedTxRef.current.address === normalizedAddress;

    if (alreadyReported) return;

    onSuccess({ txHash: hash, marketAddress: marketAddress ?? undefined });
    lastReportedTxRef.current = { hash, address: normalizedAddress };
  }, [isSuccess, hash, marketAddress, onSuccess]);

  const clearCopyTimeout = useCallback(() => {
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearCopyTimeout();
    };
  }, [clearCopyTimeout]);

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

      case 'outcomes':
        // Validate outcome1
        if (!formData.outcome1.trim()) {
          newErrors.outcome1 = 'Outcome 1 is required';
        } else if (formData.outcome1.length < 2) {
          newErrors.outcome1 = 'Outcome 1 must be at least 2 characters';
        } else if (formData.outcome1.length > 50) {
          newErrors.outcome1 = 'Outcome 1 must be less than 50 characters';
        }

        // Validate outcome2
        if (!formData.outcome2.trim()) {
          newErrors.outcome2 = 'Outcome 2 is required';
        } else if (formData.outcome2.length < 2) {
          newErrors.outcome2 = 'Outcome 2 must be at least 2 characters';
        } else if (formData.outcome2.length > 50) {
          newErrors.outcome2 = 'Outcome 2 must be less than 50 characters';
        }

        // Check if outcomes are different
        if (formData.outcome1.trim().toLowerCase() === formData.outcome2.trim().toLowerCase()) {
          newErrors.outcome1 = 'Outcomes must be different';
          newErrors.outcome2 = 'Outcomes must be different';
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

      case 'economics': {
        if (!formData.curveParams.trim()) {
          newErrors.curveParams = 'Curve parameter is required';
        } else {
          try {
            const val = BigInt(formData.curveParams.trim());
            if (val <= 0n) {
              newErrors.curveParams = 'Curve parameter must be greater than 0';
            }
          } catch {
            newErrors.curveParams = 'Curve parameter must be a whole number';
          }
        }
        break;
      }
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

    // Ensure user actually set timing (not just relying on initial value)
    if (!endTimeSetRef.current) {
      setErrors({ endTime: 'Please select an end date and time' });
      setCurrentStep('timing');
      return;
    }

    // Check balance
    const bondAmount = parseEther(formData.creatorBond);
    if (balance && bondAmount > balance) {
      setErrors({ creatorBond: 'Insufficient balance for creator bond' });
      return;
    }

    // Defensive BigInt conversion with clear error handling
    const safeEndTime = formData.endTime && formData.endTime > 0
      ? BigInt(formData.endTime)
      : null;

    if (!safeEndTime) {
      console.error('[CreateMarket] Invalid endTime at submission:', {
        endTime: formData.endTime,
        endTimeType: typeof formData.endTime,
        endTimeSetRef: endTimeSetRef.current,
        formData: formData,
      });
      setErrors({ endTime: 'Invalid end time value. Please select date and time again.' });
      setCurrentStep('timing');
      return;
    }

    // Convert category to bytes32 for contract
    const categoryBytes32 = categoryToBytes32(formData.category);

    // Create market config matching ABI exactly ✅
    const config = {
      question: formData.question,
      description: formData.description,
      resolutionTime: safeEndTime,      // ✅ Correct field name (not endTime)
      creatorBond: bondAmount,           // ✅ Correct field name (not minBond)
      category: categoryBytes32,         // ✅ bytes32 type (not string)
      outcome1: formData.outcome1,       // ✅ Added (required by ABI)
      outcome2: formData.outcome2,       // ✅ Added (required by ABI)
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[CreateMarket] Config:', config);
      console.log('[CreateMarket] Category bytes32:', categoryBytes32);
      console.log('[CreateMarket] Bond:', bondAmount.toString());
    }

    let curveParamsValue: bigint;
    try {
      curveParamsValue = BigInt(formData.curveParams.trim());
    } catch {
      setErrors({ curveParams: 'Curve parameter must be a whole number' });
      setCurrentStep('economics');
      return;
    }

    if (curveParamsValue <= 0n) {
      setErrors({ curveParams: 'Curve parameter must be greater than 0' });
      setCurrentStep('economics');
      return;
    }

    // Create market (bond sent as msg.value, not in struct)
    await createMarket(config, bondAmount, {
      curveType: CURVE_TYPE_TO_ENUM[formData.curveType],
      curveParams: curveParamsValue,
    });
  };

  const handleCopy = (value: string, field: 'hash' | 'address') => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      clearCopyTimeout();
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedField((current) => (current === field ? null : current));
        copyTimeoutRef.current = null;
      }, 2000);
    });
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
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
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

        {/* Outcomes step */}
        {currentStep === 'outcomes' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Define the outcomes</h3>
            <p className="text-gray-400 mb-6">
              What are the possible outcomes for this market? (e.g., &ldquo;Yes&rdquo; and &ldquo;No&rdquo;)
            </p>

            <div className="space-y-4">
              {/* Outcome 1 (Affirmative) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Outcome 1 (Affirmative) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.outcome1}
                  onChange={(e) => setFormData(prev => ({ ...prev, outcome1: e.target.value }))}
                  placeholder="Yes"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The positive or affirmative outcome (max 50 characters)
                </p>
              </div>

              {/* Outcome 2 (Negative) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Outcome 2 (Negative) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.outcome2}
                  onChange={(e) => setFormData(prev => ({ ...prev, outcome2: e.target.value }))}
                  placeholder="No"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
                  maxLength={50}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The negative or opposite outcome (max 50 characters)
                </p>
              </div>

              {/* Info box */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Outcome Guidelines</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-400/80">
                      <li>Outcomes should be clear and mutually exclusive</li>
                      <li>Use simple, unambiguous language</li>
                      <li>Examples: &ldquo;Yes/No&rdquo;, &ldquo;Happens/Doesn&apos;t Happen&rdquo;, &ldquo;Above/Below&rdquo;</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {(errors.outcome1 || errors.outcome2) && (
              <div className="mt-4">
                <InlineError message={errors.outcome1 || errors.outcome2 || ''} />
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
            {/* Stable date and time inputs - no jumping! */}
            <div className="space-y-4">
              {/* Date selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  defaultValue={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  onBlur={(e) => {
                    const dateInput = e.target;
                    const timeInput = document.getElementById('endTime') as HTMLInputElement;
                    const dateStr = dateInput.value;
                    const timeStr = timeInput?.value || '12:00';

                    if (dateStr) {
                      const combined = new Date(`${dateStr}T${timeStr}`);
                      setFormData(prev => ({
                        ...prev,
                        endTime: Math.floor(combined.getTime() / 1000)
                      }));
                      endTimeSetRef.current = true; // Mark as user-set
                    }
                  }}
                  min={new Date(Date.now() + 3600000).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
                />
              </div>

              {/* Time selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  defaultValue="12:00"
                  onBlur={(e) => {
                    const timeInput = e.target;
                    const dateInput = document.getElementById('endDate') as HTMLInputElement;
                    const dateStr = dateInput?.value || new Date(Date.now() + 86400000).toISOString().split('T')[0];
                    const timeStr = timeInput.value;

                    if (dateStr && timeStr) {
                      const combined = new Date(`${dateStr}T${timeStr}`);
                      setFormData(prev => ({
                        ...prev,
                        endTime: Math.floor(combined.getTime() / 1000)
                      }));
                      endTimeSetRef.current = true; // Mark as user-set
                    }
                  }}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
                />
              </div>

              {/* Display selected datetime for confirmation */}
              {formData.endTime > 0 && (
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <p className="text-sm text-gray-400">
                    Selected: <span className="text-[#3fb8bd] font-medium">
                      {new Date(formData.endTime * 1000).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </p>
                </div>
              )}
            </div>
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
                onChange={(e) => setFormData(prev => ({ ...prev, creatorBond: e.target.value }))}
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

        {currentStep === 'economics' && (
          <div>
            <h3 className="text-2xl font-bold text-white mb-6">Curve & Fee Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bonding Curve
                </label>
                <div className="grid gap-3 md:grid-cols-2">
                  {CURVE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          curveType: option.value,
                          curveParams:
                            prev.curveType === option.value ? prev.curveParams : option.defaultParams,
                        }))
                      }
                      className={cn(
                        'p-4 text-left rounded-lg border transition',
                        formData.curveType === option.value
                          ? 'border-[#3fb8bd] bg-[#3fb8bd]/10'
                          : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                      )}
                    >
                      <p className="font-semibold text-white">{option.label}</p>
                      <p className="text-sm text-gray-400 mt-1">{option.helper}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Curve Parameter
                </label>
                <input
                  type="number"
                  value={formData.curveParams}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, curveParams: e.target.value }))
                  }
                  min="1"
                  step="1"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#3fb8bd]"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Each curve interprets this value differently. Stick with the suggested defaults
                  above unless you are experimenting with custom liquidity.
                </p>
                {errors.curveParams && (
                  <div className="mt-2">
                    <InlineError message={errors.curveParams} />
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Need a refresher?</span> LMSR is the
                  safest default. Linear offers predictable growth, Exponential is best for high-risk
                  speculative markets, and Sigmoid provides an S-curve experience.
                </p>
              </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <label className="text-sm text-gray-400 block mb-1">Curve Type</label>
                  <p className="text-white">
                    {CURVE_OPTIONS.find((c) => c.value === formData.curveType)?.label ||
                      formData.curveType}
                  </p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <label className="text-sm text-gray-400 block mb-1">Curve Parameter</label>
                  <p className="text-white">{formData.curveParams}</p>
                </div>
              </div>
            </div>

            {txError && (
              <div className="mt-6">
                <TransactionError error={txError} />
              </div>
            )}
          </div>
        )}

        {hash && (
          <div className="mt-8 p-4 bg-gray-900/70 rounded-lg border border-gray-800 space-y-4">
            <div>
              <p className="text-sm text-gray-400">
                Transaction submitted. Save these details while the contract finalizes on-chain.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Transaction Hash</p>
                  <p className="font-mono text-white break-all">{hash}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(hash, 'hash')}
                    className="px-4 py-2 rounded-md bg-gray-800 text-sm text-gray-200 hover:bg-gray-700 transition"
                  >
                    {copiedField === 'hash' ? 'Copied!' : 'Copy Hash'}
                  </button>
                  <Link
                    href={`${explorerBaseUrl}/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[#3fb8bd] hover:text-[#7fd8cf]"
                  >
                    View Tx <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Market Contract</p>
                  {marketAddress ? (
                    <p className="font-mono text-white break-all">{marketAddress}</p>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Waiting for the factory receipt to confirm the new market address. This can
                      take a few seconds.
                    </p>
                  )}
                </div>
                {marketAddress && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(marketAddress, 'address')}
                      className="px-4 py-2 rounded-md bg-gray-800 text-sm text-gray-200 hover:bg-gray-700 transition"
                    >
                      {copiedField === 'address' ? 'Copied!' : 'Copy Address'}
                    </button>
                    <Link
                      href={`${explorerBaseUrl}/address/${marketAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#3fb8bd] hover:text-[#7fd8cf]"
                    >
                      View Contract <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
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
