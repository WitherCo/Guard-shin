import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import PremiumSubscription from '@/components/dashboard/PremiumSubscription';
import { SubscriptionTier } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

interface Server {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number | null;
  ownerId: string;
  premium: boolean;
  premiumTier: string | null;
}

const PremiumSubscriptionPage = () => {
  const { serverId } = useParams();
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>(SubscriptionTier.FREE);
  
  const { data: server, isLoading } = useQuery<Server>({
    queryKey: ['/api/servers', serverId],
    enabled: !!serverId,
  });
  
  useEffect(() => {
    if (server?.premiumTier) {
      setCurrentTier(server.premiumTier as SubscriptionTier);
    }
  }, [server]);
  
  if (isLoading) {
    return (
      <DashboardLayout title="Premium Subscription">
        <div className="p-6">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-96 rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!server) {
    return (
      <DashboardLayout title="Server Not Found">
        <div className="p-6">
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-8">
            <h2 className="text-xl font-bold text-white mb-2">Server Not Found</h2>
            <p className="text-red-200">
              The server you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={`Premium - ${server.name}`}>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Premium Subscription</h1>
              <p className="text-gray-400">
                Unlock premium features for your server: {server.name}
              </p>
            </div>
            
            {server.premium && (
              <div className="mt-4 md:mt-0 bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-lg px-4 py-2">
                <span className="text-primary font-medium">
                  Current Plan: {server.premiumTier === 'premium_plus' ? 'Premium+' : 'Premium'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <PremiumSubscription 
          serverId={serverId as string} 
          currentTier={currentTier}
        />
      </div>
    </DashboardLayout>
  );
};

export default PremiumSubscriptionPage;