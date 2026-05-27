import React from 'react';

interface SectionTitleProps {
  title: string;
  children?: React.ReactNode;
}

/**
 * SectionTitle
 *
 * Standard page/section header with title on the left and optional
 * action slots (buttons, filters, etc.) on the right.
 *
 * Usage:
 * ```tsx
 * <SectionTitle title="Contracts">
 *   <Button onClick={openForm}>+ Add Contract</Button>
 * </SectionTitle>
 * ```
 */
export default function SectionTitle({ title, children }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-black" data-testid="text-page-title">
        {title}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
