import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import InfractionTable from '@/components/dashboard/InfractionTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle,
  RotateCw,
  ShieldAlert,
  Filter
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Infraction } from '@shared/schema';

const InfractionPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const serverId = '123456789012345678'; // For MVP we're using a fixed server ID
  const [infractionDetailsOpen, setInfractionDetailsOpen] = useState(false);
  const [selectedInfractionId, setSelectedInfractionId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  
  // Fetch infractions
  const { data: infractions, isLoading } = useQuery<Infraction[]>({
    queryKey: ['/api/servers', serverId, 'infractions'],
    enabled: !!serverId,
  });
  
  // Fetch infraction details
  const { data: selectedInfraction, isLoading: loadingDetails } = useQuery<Infraction>({
    queryKey: ['/api/servers', serverId, 'infractions', selectedInfractionId],
    enabled: !!selectedInfractionId,
  });
  
  // Delete infraction mutation
  const deleteInfractionMutation = useMutation({
    mutationFn: async (infractionId: number) => {
      await apiRequest('DELETE', `/api/servers/${serverId}/infractions/${infractionId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', serverId, 'infractions'] });
      setConfirmDeleteOpen(false);
      toast({
        title: "Infraction deleted",
        description: "The infraction has been removed from the records",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting infraction",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
  
  const handleViewDetails = (id: number) => {
    setSelectedInfractionId(id);
    setInfractionDetailsOpen(true);
  };
  
  const handleDeleteClick = (id: number) => {
    setSelectedInfractionId(id);
    setConfirmDeleteOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (selectedInfractionId) {
      deleteInfractionMutation.mutate(selectedInfractionId);
    }
  };
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };
  
  // Get badge variant based on infraction type
  const getBadgeVariant = (type: string) => {
    switch (type.toUpperCase()) {
      case 'WARNING':
        return 'warning';
      case 'TIMEOUT':
      case 'MUTE':
        return 'purple';
      case 'KICK':
        return 'warning';
      case 'BAN':
        return 'danger';
      default:
        return 'default';
    }
  };
  
  return (
    <DashboardLayout title="Infractions">
      <Card className="bg-discord-dark border-discord-darker mb-6">
        <CardHeader>
          <CardTitle className="text-white">User Infractions</CardTitle>
          <CardDescription className="text-gray-400">
            View and manage all infractions across your server
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center">
              <ShieldAlert className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-white">
                Total infractions: <strong>{infractions?.length || 0}</strong>
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter className="h-4 w-4 text-gray-400" />
                </div>
                <Input 
                  className="pl-10 bg-discord-darker text-white w-full"
                  placeholder="Filter by username..."
                />
              </div>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px] bg-discord-darker">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-discord-dark border-discord-darker">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                  <SelectItem value="mute">Mute</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Separator className="bg-discord-darker mb-4" />
          
          {isLoading ? (
            <div className="text-center py-8">
              <RotateCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-gray-400">Loading infractions...</p>
            </div>
          ) : infractions && infractions.length > 0 ? (
            <InfractionTable 
              infractions={infractions}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteClick}
            />
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-10 w-10 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-400 mb-1">No infractions found</p>
              <p className="text-xs text-gray-500">When users receive infractions, they will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Infraction Details Dialog */}
      <Dialog open={infractionDetailsOpen} onOpenChange={setInfractionDetailsOpen}>
        <DialogContent className="bg-discord-dark text-white border-discord-darker">
          <DialogHeader>
            <DialogTitle>Infraction Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Detailed information about this infraction
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-4">
              <RotateCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : selectedInfraction ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center text-white">
                  {selectedInfraction.username.charAt(0)}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium">{selectedInfraction.username}</div>
                  <div className="text-sm text-gray-400">ID: {selectedInfraction.userId}</div>
                </div>
                <Badge className="ml-auto" variant={getBadgeVariant(selectedInfraction.type)}>
                  {selectedInfraction.type}
                </Badge>
              </div>
              
              <Separator className="bg-discord-darker" />
              
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <div className="text-sm text-gray-400">Reason</div>
                  <div className="text-white">{selectedInfraction.reason}</div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <div className="text-sm text-gray-400">Moderator</div>
                    <div className="text-white">{selectedInfraction.moderatorName}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400">Date</div>
                    <div className="text-white">{formatDate(selectedInfraction.createdAt)}</div>
                  </div>
                </div>
                
                {selectedInfraction.duration && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <div className="text-sm text-gray-400">Duration</div>
                      <div className="text-white">{selectedInfraction.duration / 60} minutes</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400">Expires</div>
                      <div className="text-white">{formatDate(selectedInfraction.expiresAt)}</div>
                    </div>
                  </div>
                )}
                
                {selectedInfraction.metadata && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-400">Additional Information</div>
                    <div className="bg-discord-darker p-2 rounded-md mt-1">
                      <pre className="text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(selectedInfraction.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">
              No infraction data available
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInfractionDetailsOpen(false)}
            >
              Close
            </Button>
            {selectedInfraction && selectedInfraction.active && (
              <Button
                variant="secondary"
              >
                Mark Inactive
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                setInfractionDetailsOpen(false);
                if (selectedInfractionId) {
                  handleDeleteClick(selectedInfractionId);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="bg-discord-dark text-white border-discord-darker">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this infraction? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteInfractionMutation.isPending}
            >
              {deleteInfractionMutation.isPending ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default InfractionPage;
