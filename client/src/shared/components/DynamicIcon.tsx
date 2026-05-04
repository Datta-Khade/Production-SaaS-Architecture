import React from 'react';
import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface DynamicIconProps extends LucideProps {
  name: string | null;
}

/**
 * DynamicIcon — Renders a Lucide icon by its string name.
 * Falls back to HelpCircle if icon is not found or name is null.
 */
export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  if (!name) return <Icons.HelpCircle {...props} />;
  
  const Icon = (Icons as any)[name];
  
  if (!Icon) {
    return <Icons.HelpCircle {...props} />;
  }
  
  return <Icon {...props} />;
};
