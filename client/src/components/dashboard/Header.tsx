import React from 'react';
import { Menu, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  title: string;
  openSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, openSidebar }) => {
  return (
    <header className="bg-discord-dark shadow-md z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <button 
              className="lg:hidden text-gray-400 hover:text-white focus:outline-none"
              onClick={openSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-white">{title}</h1>
            </div>
          </div>
          <div className="flex items-center">
            <button className="ml-4 text-gray-400 hover:text-white focus:outline-none">
              <Bell className="h-6 w-6" />
            </button>
            <button className="ml-4 text-gray-400 hover:text-white focus:outline-none">
              <HelpCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
