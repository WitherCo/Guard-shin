import React from 'react';
import { Switch } from "@/components/ui/switch";

interface FeatureToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const FeatureToggle: React.FC<FeatureToggleProps> = ({
  icon,
  title,
  description,
  enabled,
  onToggle
}) => {
  return (
    <div className="flex items-center justify-between px-2 py-3 bg-discord-darker rounded-md">
      <div className="flex items-center">
        <div className="text-lg text-gray-400 mr-3">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={onToggle}
      />
    </div>
  );
};

export default FeatureToggle;
