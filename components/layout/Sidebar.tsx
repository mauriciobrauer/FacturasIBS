'use client';

import { Button } from '@/components/ui/Button';
import { 
  Upload, 
  Home, 
  FileText, 
  HelpCircle,
  X
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  onUploadClick: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ onUploadClick, activeSection, onSectionChange }: SidebarProps) {
  const [showFilter, setShowFilter] = useState(false);
  
  console.log('🔍 Debug Sidebar - activeSection:', activeSection);
  console.log('🔍 Debug Sidebar - showFilter:', showFilter);

  const navigationItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: Home },
  ];

  return (
    <aside className="w-full xl:w-64 bg-gray-50 p-4 sm:p-6">
      {/* Upload Button */}
      <div className="mb-2 sm:mb-4">
        <Button
          onClick={onUploadClick}
          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span className="text-sm sm:text-base">Subir Nueva Factura</span>
        </Button>
      </div>

          {/* Navigation */}
          <nav className="space-y-1">
        {navigationItems.map((item) => (
          <div key={item.id} className="relative">
            <button
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                activeSection === item.id
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm sm:text-base">{item.label}</span>
              </div>
              {item.hasFilter && showFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFilter(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </button>
          </div>
        ))}
      </nav>

    </aside>
  );
}
