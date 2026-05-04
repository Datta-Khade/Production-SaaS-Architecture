import React from 'react';
import * as Icons from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Search, ChevronDown, HelpCircle } from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const COMMON_ICONS = [
  'LayoutGrid', 'Home', 'Activity', 'Users', 'Settings', 'FileText', 'BarChart3', 
  'Shield', 'Lock', 'Menu', 'Package', 'Briefcase', 'Clock', 'Compass', 
  'Database', 'Eye', 'Gift', 'Globe', 'Heart', 'Image', 'Inbox', 'Key', 
  'LifeBuoy', 'Mail', 'Map', 'Navigation', 'Phone', 'PieChart', 'Printer', 
  'Search', 'ShoppingBag', 'Smartphone', 'Star', 'Tag', 'Trash2', 'Truck', 
  'User', 'Video', 'Zap', 'Bell', 'Calendar', 'Camera', 'Clipboard', 'Cloud', 
  'CreditCard', 'Download', 'ExternalLink', 'Flag', 'Folder', 'HelpCircle',
  'Layers', 'Link', 'List', 'LogOut', 'MessageSquare', 'MoreHorizontal',
  'Paperclip', 'Plus', 'RefreshCw', 'Send', 'Share2', 'Sliders', 'Target'
];

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);

  const filteredIcons = COMMON_ICONS.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const SelectedIcon = (Icons as any)[value] || HelpCircle;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between h-10 px-3 font-normal bg-white"
        >
          <div className="flex items-center gap-2">
            <SelectedIcon className="w-4 h-4 text-[#16569e]" />
            <span className="text-gray-700 truncate">{value || 'Select Icon'}</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px] p-0 bg-white shadow-xl border border-gray-200" align="start">
        <div className="p-2 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search icons..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="grid grid-cols-6 gap-1">
            {filteredIcons.map((iconName) => {
              const Icon = (Icons as any)[iconName];
              if (!Icon) return null;
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-center p-2 rounded-md transition-colors
                    ${value === iconName ? 'bg-blue-100 text-[#16569e]' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
            {filteredIcons.length === 0 && (
              <div className="col-span-6 p-4 text-center text-xs text-gray-400">
                No icons found
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
