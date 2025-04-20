import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  UserCheck, 
  Save,
  RotateCw,
  AlertTriangle,
  ShieldCheck,
  Verified,
  Clock,
  Hash
} from 'lucide-react';

const Verification: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverId = '123456789012345678'; // For MVP we're using a fixed server ID
  
  // Fetch verification settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/servers', serverId, 'verification'],
    enabled: !!serverId,
  });
  
  // Update verification settings
  const mutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await apiRequest('POST', `/api/servers/${serverId}/verification`, newSettings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'verification'] });
      toast({
        title: "Settings updated",
        description: "Verification settings have been saved",
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleSaveSettings = () => {
    if (!settings) return;
    
    mutation.mutate({
      ...settings,
    });
  };
  
  const updateSetting = (key: string, value: any) => {
    if (!settings) return;
    
    queryClient.setQueryData(['/api/servers', serverId, 'verification'], {
      ...settings,
      [key]: value
    });
  };
  
  if (isLoading) {
    return (
      <DashboardLayout title="Verification">
        <div className="flex justify-center items-center h-64">
          <RotateCw className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-300">Loading settings...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title="Verification">
      <div className="mb-6">
        <Card className="bg-discord-dark border-discord-darker">
          <CardHeader>
            <CardTitle className="text-white">User Verification Settings</CardTitle>
            <CardDescription className="text-gray-400">
              Configure how new users are verified before accessing your server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-white">Enable Verification System</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Require new members to complete verification before accessing the server
                  </p>
                </div>
                <Switch 
                  checked={settings?.enabled || false}
                  onCheckedChange={(checked) => updateSetting('enabled', checked)}
                />
              </div>
              
              {settings?.enabled && (
                <>
                  <Separator className="bg-discord-darker" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">
                        Verification Requirements
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-white flex items-center">
                              <Verified className="h-4 w-4 mr-1" />
                              Captcha Required
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Require users to complete a captcha verification
                            </p>
                          </div>
                          <Switch 
                            checked={settings?.captchaRequired || false}
                            onCheckedChange={(checked) => updateSetting('captchaRequired', checked)}
                          />
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-white flex items-center mb-2">
                            <Clock className="h-4 w-4 mr-1" />
                            Minimum Account Age
                          </h3>
                          <Slider 
                            value={[settings?.minimumAccountAge || 0]}
                            onValueChange={(value) => updateSetting('minimumAccountAge', value[0])}
                            min={0} 
                            max={30} 
                            step={1} 
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0 days</span>
                            <span>{settings?.minimumAccountAge || 0} days</span>
                            <span>30 days</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Minimum age of Discord account required for verification
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-3">
                        Server Configuration
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-1 flex items-center">
                            <Hash className="h-4 w-4 mr-1" />
                            Verification Channel
                          </label>
                          <Input 
                            className="bg-discord-darker text-white"
                            placeholder="Channel ID for verification"
                            value={settings?.verificationChannelId || ''}
                            onChange={(e) => updateSetting('verificationChannelId', e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Channel where users will complete verification
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-1 flex items-center">
                            <ShieldCheck className="h-4 w-4 mr-1" />
                            Verified Role
                          </label>
                          <Input 
                            className="bg-discord-darker text-white"
                            placeholder="Role ID to assign after verification"
                            value={settings?.verifiedRoleId || ''}
                            onChange={(e) => updateSetting('verifiedRoleId', e.target.value)}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Role to assign to users after successful verification
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="bg-discord-darker" />
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">
                      Logging
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-1 flex items-center">
                        <Hash className="h-4 w-4 mr-1" />
                        Log Channel
                      </label>
                      <Input 
                        className="bg-discord-darker text-white"
                        placeholder="Channel ID for verification logs"
                        value={settings?.logChannelId || ''}
                        onChange={(e) => updateSetting('logChannelId', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Channel where verification attempts and results will be logged
                      </p>
                    </div>
                  </div>
                </>
              )}
              
              {!settings?.enabled && (
                <div className="px-4 py-5 bg-yellow-500 bg-opacity-10 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-white">Verification System Disabled</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Enable the verification system to protect your server from unauthorized users and potential raids.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={mutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {mutation.isPending ? (
                    <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-discord-dark border-discord-darker">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <UserCheck className="mr-2 h-5 w-5" />
            Verification Statistics
          </CardTitle>
          <CardDescription className="text-gray-400">
            Overview of verification activity in your server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-discord-darker rounded-lg p-4">
              <p className="text-sm text-gray-400">Total Verifications</p>
              <h3 className="text-2xl font-semibold text-white">126</h3>
              <div className="flex items-center text-sm mt-1">
                <span className="text-green-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  +24%
                </span>
                <span className="text-gray-400 ml-2">from last week</span>
              </div>
            </div>
            
            <div className="bg-discord-darker rounded-lg p-4">
              <p className="text-sm text-gray-400">Failed Verifications</p>
              <h3 className="text-2xl font-semibold text-white">18</h3>
              <div className="flex items-center text-sm mt-1">
                <span className="text-red-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  +12%
                </span>
                <span className="text-gray-400 ml-2">from last week</span>
              </div>
            </div>
            
            <div className="bg-discord-darker rounded-lg p-4">
              <p className="text-sm text-gray-400">Average Verification Time</p>
              <h3 className="text-2xl font-semibold text-white">2.8 min</h3>
              <div className="flex items-center text-sm mt-1">
                <span className="text-green-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                  -8%
                </span>
                <span className="text-gray-400 ml-2">from last week</span>
              </div>
            </div>
          </div>
          
          <Separator className="bg-discord-darker my-4" />
          
          <div className="text-center text-sm text-gray-400">
            <p>These statistics are for demonstration purposes and would be tracked in a real implementation.</p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Verification;
