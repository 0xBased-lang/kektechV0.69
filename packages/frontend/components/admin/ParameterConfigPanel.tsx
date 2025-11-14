/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  DollarSign,
  Clock,
  ThumbsUp,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import {
  useGetParameter,
  useGetBoolParameter,
  useGetDisputeWindow,
  useGetMinDisputeBond,
  useUpdateParameter,
  useUpdateBoolParameter,
  useUpdateDisputeWindow
} from "@/lib/hooks/kektech";

// Parameter structure from config/parameters.js
interface Parameter {
  key: string;
  value: number | bigint | boolean;
  unit?: string;
  description: string;
  category: string;
}

export function ParameterConfigPanel() {
  const [mode, setMode] = useState<'testing' | 'production'>('testing');
  const [changes, setChanges] = useState<Record<string, any>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Contract hooks for reading parameters
  const disputeWindow = useGetDisputeWindow();
  const minDisputeBond = useGetMinDisputeBond();

  // Fee parameters
  const protocolFee = useGetParameter('protocolFeeBps');
  const creatorFee = useGetParameter('creatorFeeBps');
  const stakerIncentive = useGetParameter('stakerIncentiveBps');
  const treasuryFee = useGetParameter('treasuryFeeBps');
  const winnersShare = useGetParameter('winnersShareBps');

  // Market parameters
  const minCreatorBond = useGetParameter('minCreatorBond');
  const minimumBet = useGetParameter('minimumBet');
  const maximumBet = useGetParameter('maximumBet');

  // Approval parameters
  const likesRequired = useGetParameter('likesRequired');
  const approvalWindow = useGetParameter('approvalWindow');

  // LMSR parameters
  const minB = useGetParameter('minB');
  const maxB = useGetParameter('maxB');
  const defaultB = useGetParameter('defaultB');

  // Boolean flags
  const marketCreationActive = useGetBoolParameter('marketCreationActive');
  const experimentalMarketsActive = useGetBoolParameter('experimentalMarketsActive');
  const emergencyPause = useGetBoolParameter('emergencyPause');

  // Update hooks
  const updateParameter = useUpdateParameter();
  const updateBoolParameter = useUpdateBoolParameter();
  const updateDisputeWindowHook = useUpdateDisputeWindow();

  // Determine mode from dispute window (15 min = testing, 48 hours = production)
  useEffect(() => {
    if (disputeWindow.disputeWindow) {
      const windowSeconds = Number(disputeWindow.disputeWindow);
      // 15 minutes = 900 seconds (testing), 48 hours = 172800 seconds (production)
      setMode(windowSeconds <= 1800 ? 'testing' : 'production');
    }
  }, [disputeWindow.disputeWindow]);

  const loading = disputeWindow.isLoading || protocolFee.isLoading;

  // Build parameters object from contract data
  const parameters: Record<string, Parameter> = {
    // Fees
    protocolFeeBps: {
      key: 'protocolFeeBps',
      value: protocolFee.value ? Number(protocolFee.value) : 250,
      unit: 'bps',
      description: 'Protocol fee (2.5%)',
      category: 'fees'
    },
    creatorFeeBps: {
      key: 'creatorFeeBps',
      value: creatorFee.value ? Number(creatorFee.value) : 150,
      unit: 'bps',
      description: 'Creator fee (1.5%)',
      category: 'fees'
    },
    stakerIncentiveBps: {
      key: 'stakerIncentiveBps',
      value: stakerIncentive.value ? Number(stakerIncentive.value) : 50,
      unit: 'bps',
      description: 'Staker incentive (0.5%)',
      category: 'fees'
    },
    treasuryFeeBps: {
      key: 'treasuryFeeBps',
      value: treasuryFee.value ? Number(treasuryFee.value) : 50,
      unit: 'bps',
      description: 'Treasury fee (0.5%)',
      category: 'fees'
    },
    winnersShareBps: {
      key: 'winnersShareBps',
      value: winnersShare.value ? Number(winnersShare.value) : 9500,
      unit: 'bps',
      description: 'Winners share (95%)',
      category: 'fees'
    },

    // Market limits
    minCreatorBond: {
      key: 'minCreatorBond',
      value: minCreatorBond.value ? Number(minCreatorBond.value) / 1e18 : 0.1,
      unit: 'BASED',
      description: 'Minimum creator bond (refundable)',
      category: 'market'
    },
    minimumBet: {
      key: 'minimumBet',
      value: minimumBet.value ? Number(minimumBet.value) / 1e18 : 0.01,
      unit: 'BASED',
      description: 'Minimum bet size',
      category: 'market'
    },
    maximumBet: {
      key: 'maximumBet',
      value: maximumBet.value ? Number(maximumBet.value) / 1e18 : 100,
      unit: 'BASED',
      description: 'Maximum bet size',
      category: 'market'
    },

    // Resolution (current mode)
    disputeWindow: {
      key: 'disputeWindow',
      value: disputeWindow.disputeWindow ? (mode === 'testing' ? Number(disputeWindow.disputeWindow) / 60 : Number(disputeWindow.disputeWindow) / 3600) : (mode === 'testing' ? 15 : 48),
      unit: mode === 'testing' ? 'minutes' : 'hours',
      description: `Dispute window (${mode.toUpperCase()})`,
      category: 'resolution'
    },
    minDisputeBond: {
      key: 'minDisputeBond',
      value: minDisputeBond.minDisputeBond ? Number(minDisputeBond.minDisputeBond) / 1e18 : (mode === 'testing' ? 0.01 : 0.1),
      unit: 'BASED',
      description: 'Minimum dispute bond',
      category: 'resolution'
    },
    agreementThreshold: {
      key: 'agreementThreshold',
      value: 75,
      unit: '%',
      description: 'Agreement threshold for auto-finalize',
      category: 'resolution'
    },
    disagreementThreshold: {
      key: 'disagreementThreshold',
      value: 40,
      unit: '%',
      description: 'Disagreement threshold for admin review',
      category: 'resolution'
    },

    // Approval
    likesRequired: {
      key: 'likesRequired',
      value: likesRequired.value ? Number(likesRequired.value) : 10,
      unit: 'likes',
      description: 'Likes needed for auto-approval',
      category: 'approval'
    },
    approvalWindow: {
      key: 'approvalWindow',
      value: approvalWindow.value ? Number(approvalWindow.value) / 3600 : 24,
      unit: 'hours',
      description: 'Time window for approval votes',
      category: 'approval'
    },

    // LMSR
    minB: {
      key: 'minB',
      value: minB.value ? Number(minB.value) / 1e18 : 1,
      unit: 'BASED',
      description: 'Minimum liquidity parameter',
      category: 'lmsr'
    },
    maxB: {
      key: 'maxB',
      value: maxB.value ? Number(maxB.value) / 1e18 : 1000,
      unit: 'BASED',
      description: 'Maximum liquidity parameter',
      category: 'lmsr'
    },
    defaultB: {
      key: 'defaultB',
      value: defaultB.value ? Number(defaultB.value) / 1e18 : 100,
      unit: 'BASED',
      description: 'Default liquidity parameter',
      category: 'lmsr'
    },

    // Flags
    marketCreationActive: {
      key: 'marketCreationActive',
      value: marketCreationActive.value ?? true,
      description: 'Enable market creation',
      category: 'flags'
    },
    experimentalMarketsActive: {
      key: 'experimentalMarketsActive',
      value: experimentalMarketsActive.value ?? false,
      description: 'Enable experimental market types',
      category: 'flags'
    },
    emergencyPause: {
      key: 'emergencyPause',
      value: emergencyPause.value ?? false,
      description: 'Emergency pause all markets',
      category: 'flags'
    },
  };

  const handleParameterChange = (key: string, value: any) => {
    setChanges({
      ...changes,
      [key]: value
    });
  };

  const handleSaveChanges = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Separate changes into numeric parameters, boolean parameters, and special cases
      const numericChanges: Array<[string, number]> = [];
      const booleanChanges: Array<[string, boolean]> = [];

      for (const [key, value] of Object.entries(changes)) {
        if (key === 'disputeWindow' || key === 'minDisputeBond') {
          continue; // Handle separately
        } else if (typeof value === 'boolean') {
          booleanChanges.push([key, value]);
        } else {
          // Convert BASED values to wei
          let finalValue = value;
          if (parameters[key]?.unit === 'BASED') {
            finalValue = Math.floor(value * 1e18);
          } else if (parameters[key]?.unit === 'hours') {
            finalValue = Math.floor(value * 3600); // Convert to seconds
          }
          numericChanges.push([key, finalValue]);
        }
      }

      // Update numeric parameters
      for (const [key, value] of numericChanges) {
        await updateParameter.updateParameter(key, BigInt(Math.floor(value)));
      }

      // Update boolean parameters
      for (const [key, value] of booleanChanges) {
        await updateBoolParameter.updateBoolParameter(key, value);
      }

      // Handle dispute window separately if changed
      if (changes.disputeWindow !== undefined) {
        const seconds = mode === 'testing'
          ? Math.floor(changes.disputeWindow * 60)
          : Math.floor(changes.disputeWindow * 3600);
        await updateDisputeWindowHook.updateDisputeWindow(seconds);
      }

      // Reset changes and show success
      setChanges({});
      setSaveSuccess(true);

      // Note: Hooks auto-refresh, manual refetch not needed
      // Data will update automatically after transactions confirm

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Failed to save parameters:", error);
      setSaveError(error.message || "Failed to save parameters");
    }
  };

  const handleSwitchMode = async () => {
    const newMode = mode === 'testing' ? 'production' : 'testing';
    setSaveError(null);

    try {
      // Testing: 15 minutes = 900 seconds
      // Production: 48 hours = 172800 seconds
      const newWindowSeconds = newMode === 'testing' ? 900 : 172800;

      await updateDisputeWindowHook.updateDisputeWindow(newWindowSeconds);

      // Hook will auto-refresh with new value
      // No manual refetch needed

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Failed to switch mode:", error);
      setSaveError(error.message || "Failed to switch mode");
    }
  };

  const hasChanges = Object.keys(changes).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>System Configuration</span>
              <Badge variant={mode === 'testing' ? 'secondary' : 'default'}>
                {mode.toUpperCase()} MODE
              </Badge>
            </CardTitle>
            <CardDescription>
              View and update all 29 system parameters
            </CardDescription>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwitchMode}
              disabled={hasChanges}
            >
              {mode === 'testing' ? (
                <>
                  <ToggleRight className="h-4 w-4 mr-1" />
                  Switch to Production
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  Switch to Testing
                </>
              )}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleSaveChanges}
              disabled={!hasChanges || updateParameter.isLoading || updateBoolParameter.isLoading}
            >
              <Save className="h-4 w-4 mr-1" />
              {(updateParameter.isLoading || updateBoolParameter.isLoading)
                ? "Saving..."
                : `Save ${Object.keys(changes).length} Changes`}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Success/Error Alerts */}
        {saveSuccess && (
          <Alert className="border-green-600 bg-green-50 mb-4">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✓ Parameters updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {saveError}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">Loading parameters...</p>
          </div>
        ) : (
          <Tabs defaultValue="fees" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="fees">
                <DollarSign className="h-4 w-4 mr-1" />
                Fees
              </TabsTrigger>
              <TabsTrigger value="market">
                <TrendingUp className="h-4 w-4 mr-1" />
                Markets
              </TabsTrigger>
              <TabsTrigger value="resolution">
                <Clock className="h-4 w-4 mr-1" />
                Resolution
              </TabsTrigger>
              <TabsTrigger value="approval">
                <ThumbsUp className="h-4 w-4 mr-1" />
                Approval
              </TabsTrigger>
              <TabsTrigger value="flags">
                <ToggleRight className="h-4 w-4 mr-1" />
                Flags
              </TabsTrigger>
            </TabsList>

            {/* Fee Parameters */}
            <TabsContent value="fees" className="space-y-4">
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  Fee parameters are in Basis Points (BPS). 100 BPS = 1%
                </AlertDescription>
              </Alert>

              {Object.values(parameters)
                .filter(p => p.category === 'fees')
                .map(param => (
                  <ParameterField
                    key={param.key}
                    param={param}
                    value={changes[param.key] ?? param.value}
                    onChange={(val) => handleParameterChange(param.key, val)}
                  />
                ))}
            </TabsContent>

            {/* Market Parameters */}
            <TabsContent value="market" className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Configure market creation requirements and betting limits
                </AlertDescription>
              </Alert>

              {Object.values(parameters)
                .filter(p => p.category === 'market' || p.category === 'lmsr')
                .map(param => (
                  <ParameterField
                    key={param.key}
                    param={param}
                    value={changes[param.key] ?? param.value}
                    onChange={(val) => handleParameterChange(param.key, val)}
                  />
                ))}
            </TabsContent>

            {/* Resolution Parameters */}
            <TabsContent value="resolution" className="space-y-4">
              <Alert variant={mode === 'testing' ? 'default' : 'destructive'}>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  {mode === 'testing'
                    ? "TESTING MODE: 15-minute dispute windows for rapid testing"
                    : "PRODUCTION MODE: 48-hour dispute windows for live markets"}
                </AlertDescription>
              </Alert>

              {Object.values(parameters)
                .filter(p => p.category === 'resolution')
                .map(param => (
                  <ParameterField
                    key={param.key}
                    param={param}
                    value={changes[param.key] ?? param.value}
                    onChange={(val) => handleParameterChange(param.key, val)}
                  />
                ))}
            </TabsContent>

            {/* Approval Parameters */}
            <TabsContent value="approval" className="space-y-4">
              <Alert>
                <ThumbsUp className="h-4 w-4" />
                <AlertDescription>
                  Configure market proposal approval system
                </AlertDescription>
              </Alert>

              {Object.values(parameters)
                .filter(p => p.category === 'approval')
                .map(param => (
                  <ParameterField
                    key={param.key}
                    param={param}
                    value={changes[param.key] ?? param.value}
                    onChange={(val) => handleParameterChange(param.key, val)}
                  />
                ))}
            </TabsContent>

            {/* System Flags */}
            <TabsContent value="flags" className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  System flags affect core functionality. Change with caution!
                </AlertDescription>
              </Alert>

              {Object.values(parameters)
                .filter(p => p.category === 'flags')
                .map(param => (
                  <BooleanParameterField
                    key={param.key}
                    param={param}
                    value={changes[param.key] ?? param.value}
                    onChange={(val) => handleParameterChange(param.key, val)}
                  />
                ))}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function ParameterField({
  param,
  value,
  onChange
}: {
  param: Parameter;
  value: number | bigint;
  onChange: (value: number) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <label className="text-sm font-semibold">{param.description}</label>
            <p className="text-xs text-muted-foreground mt-1">
              Key: <code className="bg-muted px-1 rounded">{param.key}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value.toString()}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-32 text-right"
              step={param.unit === 'BASED' ? '0.01' : '1'}
            />
            <span className="text-sm text-muted-foreground w-16">
              {param.unit}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BooleanParameterField({
  param,
  value,
  onChange
}: {
  param: Parameter;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const isEnabled = typeof value === 'boolean' ? value : false;

  return (
    <Card className={isEnabled ? 'border-green-500' : 'border-red-500'}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <label className="text-sm font-semibold">{param.description}</label>
            <p className="text-xs text-muted-foreground mt-1">
              Key: <code className="bg-muted px-1 rounded">{param.key}</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(!isEnabled)}
              className={isEnabled ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Enabled
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  Disabled
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
