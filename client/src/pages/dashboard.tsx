import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server } from '@shared/schema';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import InfractionTable from '@/components/dashboard/InfractionTable';
import FeatureToggle from '@/components/dashboard/FeatureToggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  ShieldAlert, 
  Workflow, 
  UserCheck,
  MessageSquareOff, 
  AlertCircle,
  Link,
  Copy,
  ImageOff
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [selectedServerId, setSelectedServerId] = useState<string>('123456789012345678');
  
  // Fetch servers
  const { data: servers, isLoading: loadingServers } = useQuery<Server[]>({ 
    queryKey: ['/api/servers'], 
  });
  
  // Fetch server details
  const { data: server } = useQuery<Server>({ 
    queryKey: ['/api/servers', selectedServerId], 
    enabled: !!selectedServerId,
  });
  
  // Fetch auto-mod settings
  const { data: autoModSettings } = useQuery<AutoModSetting>({ 
    queryKey: ['/api/servers', selectedServerId, 'automod'], 
    enabled: !!selectedServerId,
  });
  
  // Fetch raid protection settings
  const { data: raidSettings } = useQuery<RaidProtectionSetting>({ 
    queryKey: ['/api/servers', selectedServerId, 'raid-protection'], 
    enabled: !!selectedServerId,
  });
  
  // Fetch infractions
  const { data: infractions, isLoading: loadingInfractions } = useQuery<Infraction[]>({ 
    queryKey: ['/api/servers', selectedServerId, 'infractions'], 
    enabled: !!selectedServerId,
  });
  
  const handleServerChange = (value: string) => {
    setSelectedServerId(value);
  };
  
  const handleViewInfractionDetails = (id: number) => {
    toast({
      title: "Viewing infraction details",
      description: `Viewing details for infraction #${id}`,
    });
  };
  
  const handleDeleteInfraction = (id: number) => {
    toast({
      title: "Delete infraction",
      description: `Infraction #${id} would be deleted`,
      variant: "destructive",
    });
  };
  
  const handleDisableLockdown = () => {
    toast({
      title: "Lockdown disabled",
      description: "Server lockdown has been disabled",
    });
  };
  
  return (
    <DashboardLayout title="Dashboard">
      {/* Server selection */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="relative rounded-md w-full sm:w-64">
              <Select 
                value={selectedServerId} 
                onValueChange={handleServerChange}
              >
                <SelectTrigger className="pl-10 w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent className="bg-discord-dark border-discord-darker">
                  {!loadingServers && servers?.map(server => (
                    <SelectItem key={server.id} value={server.id}>{server.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button className="bg-primary hover:bg-opacity-90 text-white">
              <Users className="mr-2 h-4 w-4" />
              Add to Server
            </Button>
          </div>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Members" 
          value={server?.memberCount || 0}
          icon={<Users className="h-5 w-5 text-blue-500" />}
          iconBgColor="bg-blue-500"
          iconColor="text-blue-500"
          changePercentage={12}
        />
        
        <StatCard 
          title="Infractions" 
          value={infractions?.length || 0}
          icon={<ShieldAlert className="h-5 w-5 text-red-500" />}
          iconBgColor="bg-red-500"
          iconColor="text-red-500"
          changePercentage={5}
        />
        
        <StatCard 
          title="Auto-Mod Events" 
          value={82}
          icon={<Workflow className="h-5 w-5 text-yellow-500" />}
          iconBgColor="bg-yellow-500"
          iconColor="text-yellow-500"
          changePercentage={-8}
        />
        
        <StatCard 
          title="Verifications" 
          value={126}
          icon={<UserCheck className="h-5 w-5 text-green-500" />}
          iconBgColor="bg-green-500"
          iconColor="text-green-500"
          changePercentage={24}
        />
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Auto-moderation section */}
        <div className="xl:col-span-2 bg-discord-dark rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Auto-Moderation</h2>
            <Button variant="link" className="text-primary hover:underline p-0">Configure</Button>
          </div>
          
          <div className="space-y-4">
            <FeatureToggle
              icon={<MessageSquareOff />}
              title="Profanity Filter"
              description="Automatically delete messages containing profanity"
              enabled={autoModSettings?.profanityFilterEnabled || false}
              onToggle={() => {}}
            />
            
            <FeatureToggle
              icon={<Workflow />}
              title="Spam Detection"
              description="Timeout users who send messages too quickly"
              enabled={autoModSettings?.spamDetectionEnabled || false}
              onToggle={() => {}}
            />
            
            <FeatureToggle
              icon={<Link />}
              title="Link Filter"
              description="Block messages containing suspicious links"
              enabled={autoModSettings?.linkFilterEnabled || false}
              onToggle={() => {}}
            />
            
            <FeatureToggle
              icon={<Copy />}
              title="Duplicate Messages"
              description="Prevent users from sending the same message repeatedly"
              enabled={autoModSettings?.duplicateMessagesEnabled || false}
              onToggle={() => {}}
            />
            
            <FeatureToggle
              icon={<ImageOff />}
              title="Media Scanning"
              description="Scan images for inappropriate content"
              enabled={autoModSettings?.mediaScanningEnabled || false}
              onToggle={() => {}}
            />
          </div>
        </div>
        
        {/* Raid protection section */}
        <div className="bg-discord-dark rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Raid Protection</h2>
            <Button variant="link" className="text-primary hover:underline p-0">Configure</Button>
          </div>
          
          {raidSettings?.lockdownActive && (
            <div className="px-4 py-5 bg-red-500 bg-opacity-10 rounded-md mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-white">Anti-Raid Mode: <span className="text-red-500">Active</span></h3>
                  <p className="text-xs text-gray-400 mt-1">Raid detected 2 hours ago. New joins are temporarily restricted.</p>
                  <Button 
                    size="sm" 
                    className="mt-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded"
                    onClick={handleDisableLockdown}
                  >
                    Disable Lockdown
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white">Auto-Lockdown</h3>
                <p className="text-xs text-gray-400 mt-0.5">Automatically restrict server when raid detected</p>
              </div>
              <Switch 
                checked={raidSettings?.autoLockdown || false} 
                onCheckedChange={() => {}}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Join Rate Threshold</label>
              <Slider 
                defaultValue={[raidSettings?.joinRateThreshold || 20]} 
                min={5} 
                max={50} 
                step={1} 
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 joins/min</span>
                <span>{raidSettings?.joinRateThreshold || 20} joins/min</span>
                <span>50 joins/min</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Verification Level During Raids</label>
              <Select defaultValue={raidSettings?.verificationLevel || "HIGH"}>
                <SelectTrigger className="w-full bg-discord-darker">
                  <SelectValue placeholder="Select verification level" />
                </SelectTrigger>
                <SelectContent className="bg-discord-dark border-discord-darker">
                  <SelectItem value="LOW">Low - Email Verified</SelectItem>
                  <SelectItem value="MEDIUM">Medium - Registered for 5+ minutes</SelectItem>
                  <SelectItem value="HIGH">High - Member of server for 10+ minutes</SelectItem>
                  <SelectItem value="HIGHEST">Highest - Verified Phone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-1">Alert Channels</label>
              <div className="flex items-center space-x-2 px-3 py-2 bg-discord-darker rounded-md">
                <span className="flex items-center text-sm text-white">
                  <span className="text-gray-400 mr-1">#</span>mod-logs
                </span>
                <button className="ml-auto text-gray-400 hover:text-white">
                  <Users className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent infractions */}
      <div className="mt-6 bg-discord-dark rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Recent Infractions</h2>
          <Button variant="link" className="text-primary hover:underline p-0">View All</Button>
        </div>
        
        {loadingInfractions ? (
          <div className="text-center py-4 text-gray-400">Loading infractions...</div>
        ) : (
          <InfractionTable 
            infractions={infractions || []}
            onViewDetails={handleViewInfractionDetails}
            onDelete={handleDeleteInfraction}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
