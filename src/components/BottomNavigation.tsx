
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Eye, Target, Users, Wallet } from 'lucide-react';

interface BottomNavigationProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { page: 'home', icon: Home, label: 'Home' },
    { page: 'ad-viewer', icon: Eye, label: 'Ads' },
    { page: 'tasks', icon: Target, label: 'Tasks' },
    { page: 'referral', icon: Users, label: 'Referral' },
    { page: 'wallet', icon: Wallet, label: 'Wallet' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ page, icon: Icon, label }) => {
          const isActive = currentPage === page;
          return (
            <Button
              key={page}
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={`flex flex-col items-center space-y-1 px-3 py-2 h-auto ${
                isActive 
                  ? 'text-blue-400 bg-blue-600/20' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
