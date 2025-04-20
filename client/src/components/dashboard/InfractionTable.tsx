import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Infraction } from '@shared/schema';

interface InfractionTableProps {
  infractions: Infraction[];
  onViewDetails: (id: number) => void;
  onDelete: (id: number) => void;
}

const InfractionTable: React.FC<InfractionTableProps> = ({ 
  infractions, 
  onViewDetails, 
  onDelete 
}) => {
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today, ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return dateObj.toLocaleDateString();
    }
  };
  
  // Define badge variant based on infraction type
  const getBadgeVariant = (type: string | undefined) => {
    if (!type) return 'default';
    
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
  
  const formatType = (type: string | undefined) => {
    if (!type) return 'Unknown';
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead>
          <tr>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Reason</th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Moderator</th>
            <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-3 py-3.5 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700 bg-discord-darker">
          {infractions.map((infraction) => (
            <tr key={infraction.id} className="hover:bg-opacity-80">
              <td className="px-3 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white">
                    {infraction.username && infraction.username.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-white">{infraction.username || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">ID: {infraction.userId}</div>
                  </div>
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap">
                <Badge variant={getBadgeVariant(infraction.type)}>
                  {formatType(infraction.type)}
                </Badge>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                {infraction.reason}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                <div className="flex items-center">
                  <span>{infraction.moderatorName}</span>
                  {infraction.moderatorName === 'WickBot' && (
                    <span className="ml-1 px-1.5 text-xs bg-primary rounded text-white">BOT</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-300">
                {formatDate(infraction.createdAt)}
              </td>
              <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  className="text-primary hover:text-blue-400"
                  onClick={() => onViewDetails(infraction.id)}
                >
                  Details
                </button>
                <button 
                  className="ml-2 text-red-500 hover:text-red-400"
                  onClick={() => onDelete(infraction.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InfractionTable;
