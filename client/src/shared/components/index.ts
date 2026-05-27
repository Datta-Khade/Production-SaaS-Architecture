/**
 * Shared Components — Top-level barrel export
 *
 * Import from this file for any shared component:
 *
 * @example
 * import { BaseSubmoduleForm, BaseSubmoduleTable, SectionTitle } from '@/shared/components';
 * import { EmptyState, LoadingSpinner } from '@/shared/components/feedback';
 * import { TextField, SelectField } from '@/shared/components/form';
 * import { PeriodFilter } from '@/shared/components/filters';
 * import { UnsavedChangesDialog } from '@/shared/components/dialogs';
 */

// ─── Base Page Components ──────────────────────────────────────────────────
export { BaseSubmoduleForm, FormSection, FormTable, SAILFormField, SAILInput, SAILSelect, SAILButton } from './BaseSubmoduleForm';
export { BaseSubmoduleTable } from './BaseSubmoduleTable';
export type { TableColumn, TableFilter } from './BaseSubmoduleTable';
export { default as SectionTitle } from './SectionTitle';

// ─── Shell / Nav Components ───────────────────────────────────────────────
export { default as ComingSoonPage } from './ComingSoonPage';
export { DynamicIcon } from './DynamicIcon';
export { ModuleErrorBoundary } from './ErrorBoundary';
export { ModuleNavigator } from './ModuleNavigator';
export { PageSkeleton } from './PageSkeleton';
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as SideBarComponent } from './SideBarComponent';
export { default as HeaderComponent } from './HeaderComponent';

// ─── Category Re-exports ──────────────────────────────────────────────────
export * from './feedback';
export * from './dialogs';
export * from './form';
export * from './filters';
