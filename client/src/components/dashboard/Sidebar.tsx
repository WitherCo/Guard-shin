import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Server, 
  LineChart, 
  Shield, 
  AlertTriangle, 
  FileText, 
  UserCheck, 
  AlertOctagon, 
  Settings, 
  Terminal, 
  Database, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, closeSidebar }) => {
  const [location] = useLocation();
  
  const navItems = [
    { group: 'Overview', items: [
      { name: 'Dashboard', icon: <LayoutDashboard className="mr-3 text-lg" />, href: '/' },
      { name: 'Servers', icon: <Server className="mr-3 text-lg" />, href: '/servers' },
      { name: 'Analytics', icon: <LineChart className="mr-3 text-lg" />, href: '/analytics' },
    ]},
    { group: 'Moderation', items: [
      { name: 'Auto-Moderation', icon: <Shield className="mr-3 text-lg" />, href: '/auto-moderation' },
      { name: 'Raid Protection', icon: <AlertTriangle className="mr-3 text-lg" />, href: '/raid-protection' },
      { name: 'Logs', icon: <FileText className="mr-3 text-lg" />, href: '/logs' },
      { name: 'Verification', icon: <UserCheck className="mr-3 text-lg" />, href: '/verification' },
      { name: 'Infractions', icon: <AlertOctagon className="mr-3 text-lg" />, href: '/infractions' },
    ]},
    { group: 'Settings', items: [
      { name: 'Bot Settings', icon: <Settings className="mr-3 text-lg" />, href: '/bot-settings' },
      { name: 'Command Settings', icon: <Terminal className="mr-3 text-lg" />, href: '/command-settings' },
      { name: 'Database', icon: <Database className="mr-3 text-lg" />, href: '/database' },
    ]}
  ];

  return (
    <div 
      className={`flex flex-col w-64 bg-discord-darkest transition-all duration-300 overflow-hidden fixed inset-y-0 left-0 z-30 lg:static lg:z-auto ${
        isOpen ? '' : 'transform -translate-x-full lg:transform-none'
      }`}
    >
      <div className="h-16 flex items-center px-4 border-b border-discord-darker border-opacity-50">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">W</div>
          <span className="ml-3 font-bold text-lg text-white">Wick Bot</span>
        </div>
        <button 
          className="ml-auto lg:hidden text-gray-400 hover:text-white"
          onClick={closeSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-2">
        {navItems.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            <div className="px-2 mb-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{group.group}</h3>
            </div>
            <ul className="space-y-1 mb-6">
              {group.items.map((item, itemIndex) => {
                const isActive = location === item.href;
                return (
                  <li key={itemIndex}>
                    <Link href={item.href}>
                      <a className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive 
                          ? 'bg-primary text-white' 
                          : 'text-gray-300 hover:bg-discord-darker hover:text-white'
                      }`}>
                        {item.icon}
                        <span>{item.name}</span>
                      </a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </React.Fragment>
        ))}
      </nav>
      
      <div className="border-t border-discord-darker p-4">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">A</div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">AdminUser</p>
            <p className="text-xs text-gray-400">Bot Owner</p>
          </div>
          <button className="ml-auto text-gray-400 hover:text-white">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
