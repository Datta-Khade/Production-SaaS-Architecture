/**
 * Page Skeleton — Loading fallback for Suspense
 *
 * Shown while lazy-loaded modules are loading.
 * Mimics the general page layout with animated placeholders.
 */
import React from 'react';

export const PageSkeleton: React.FC = () => {
  return (
    <div className="p-6 space-y-6 animate-fade-in" id="page-skeleton">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-neutral-200 rounded animate-skeleton" />
          <div className="h-4 w-72 bg-neutral-100 rounded animate-skeleton" />
        </div>
        <div className="h-10 w-32 bg-neutral-200 rounded animate-skeleton" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-6">
            <div className="h-4 w-24 bg-neutral-200 rounded animate-skeleton mb-3" />
            <div className="h-8 w-16 bg-neutral-100 rounded animate-skeleton" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card p-6">
        <div className="space-y-4">
          {/* Table header */}
          <div className="flex gap-4 pb-4 border-b border-neutral-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 flex-1 bg-neutral-200 rounded animate-skeleton" />
            ))}
          </div>
          {/* Table rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex gap-4 py-2">
              {[1, 2, 3, 4, 5].map((col) => (
                <div key={col} className="h-4 flex-1 bg-neutral-100 rounded animate-skeleton" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
