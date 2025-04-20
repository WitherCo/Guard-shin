import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  changePercentage?: number;
  changeLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  changePercentage,
  changeLabel = "from last week"
}) => {
  const isPositiveChange = changePercentage !== undefined && changePercentage >= 0;
  
  return (
    <div className="bg-discord-dark rounded-lg shadow-sm p-5">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-full p-3 ${iconBgColor} bg-opacity-10`}>
          {icon}
        </div>
        <div className="ml-5">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <h3 className="text-2xl font-semibold text-white">{value}</h3>
        </div>
      </div>
      
      {changePercentage !== undefined && (
        <div className="mt-2">
          <div className="flex items-center text-sm">
            <span className={`${isPositiveChange ? 'text-green-500' : 'text-red-500'} flex items-center`}>
              {isPositiveChange ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {isPositiveChange ? '+' : ''}{changePercentage}%
            </span>
            <span className="text-gray-400 ml-2">{changeLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;
