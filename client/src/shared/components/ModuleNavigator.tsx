import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/hooks/use-toast';

interface ModuleNavigatorProps {
  currentModule: string;
  onModuleChange: (moduleId: string) => void;
}

export function ModuleNavigator({ currentModule, onModuleChange }: ModuleNavigatorProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  let portNumber = window.location.port;
  portNumber = portNumber ? `:${portNumber}` : '';
  const fullUrl = `${protocol}//${hostname}${portNumber}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex flex-col items-center justify-center w-full h-full cursor-pointer select-none">
          <div className="mb-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="#6B7280" />
              <rect x="14" y="3" width="7" height="7" rx="1" fill="#6B7280" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="#6B7280" />
              <rect x="14" y="14" width="7" height="7" rx="1" fill="#6B7280" />
            </svg>
          </div>

          <span className="text-[10px] font-normal font-['Roboto',Helvetica] text-[#4f5863]">
            {currentModule}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem
          onClick={() => {
            onModuleChange('crewing');
          }}
          className="cursor-pointer"
        >
          Module 1
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            // Placeholder for other modules
            toast({ title: 'Coming Soon', description: 'This module is not yet available.' });
          }}
          className="cursor-pointer"
        >
          Module 2
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
