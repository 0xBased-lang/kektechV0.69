'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { ProposalManagementPanel } from '@/components/admin/ProposalManagementPanel';
import { ActiveMarketsPanel } from '@/components/admin/ActiveMarketsPanel';
import { ResolutionControlPanel } from '@/components/admin/ResolutionControlPanel';
import { MarketOverridePanel } from '@/components/admin/MarketOverridePanel';
import { ParameterConfigPanel } from '@/components/admin/ParameterConfigPanel';
import { useAdminRole } from '@/lib/hooks/kektech';

export default function AdminDashboard() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState('proposals');

  // Check if user has admin role from AccessControlManager contract
  const { isAdmin, isLoading: isCheckingAdmin } = useAdminRole();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to access the admin dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-kek-green" />
          <p className="text-gray-400">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Alert variant="destructive" className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your wallet does not have admin permissions. Contact the system administrator.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="h-10 w-10 text-kek-green" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">
              Manage markets, resolve disputes, and configure system parameters
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Admin: {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        </div>

        {/* Admin Panels */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 gap-4 bg-gray-900 p-1">
            <TabsTrigger
              value="proposals"
              className="data-[state=active]:bg-kek-green data-[state=active]:text-white"
            >
              📋 Proposals
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="data-[state=active]:bg-kek-green data-[state=active]:text-white"
            >
              🎯 Active Markets
            </TabsTrigger>
            <TabsTrigger
              value="resolution"
              className="data-[state=active]:bg-kek-green data-[state=active]:text-white"
            >
              ⚖️ Resolutions
            </TabsTrigger>
            <TabsTrigger
              value="override"
              className="data-[state=active]:bg-kek-green data-[state=active]:text-white"
            >
              🔧 Overrides
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="data-[state=active]:bg-kek-green data-[state=active]:text-white"
            >
              ⚙️ Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-4">
            <ProposalManagementPanel />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <ActiveMarketsPanel />
          </TabsContent>

          <TabsContent value="resolution" className="space-y-4">
            <ResolutionControlPanel />
          </TabsContent>

          <TabsContent value="override" className="space-y-4">
            <MarketOverridePanel />
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <ParameterConfigPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
