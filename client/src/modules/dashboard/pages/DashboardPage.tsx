/**
 * Dashboard Page — Main landing page after login
 * 
 * Phase 1 skeleton — shows system status and placeholder metric cards.
 * Will be enhanced with real data in Phase 3.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface HealthResponse {
  status: string;
  checks: {
    masterDb: string;
    redis: string;
  };
  uptime: number;
  version: string;
  environment: string;
}

const DashboardPage: React.FC = () => {
  const { data: health, isLoading } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await fetch('/api/v2/health');
      return res.json();
    },
    refetchInterval: 30_000, // Refresh every 30 seconds
  });

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in" id="dashboard-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-sm text-neutral-500 mt-1">System overview and health status</p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-500">Server Status</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              health?.status === 'ok' ? 'bg-green-500' : 'bg-yellow-500'
            } animate-pulse`} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {isLoading ? '...' : health?.status === 'ok' ? 'Healthy' : 'Degraded'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            v{health?.version || '1.0.0'}
          </p>
        </div>

        {/* Database */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-500">Database</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              health?.checks.masterDb === 'ok' ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {isLoading ? '...' : health?.checks.masterDb === 'ok' ? 'Connected' : 'Error'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">PostgreSQL 15+</p>
        </div>

        {/* Redis */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-500">Cache (Redis)</span>
            <span className={`w-2.5 h-2.5 rounded-full ${
              health?.checks.redis === 'ok' ? 'bg-green-500' : 'bg-red-500'
            }`} />
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {isLoading ? '...' : health?.checks.redis === 'ok' ? 'Connected' : 'Error'}
          </p>
          <p className="text-xs text-neutral-400 mt-1">Redis 7+</p>
        </div>

        {/* Uptime */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-500">Uptime</span>
            <span className="text-lg">⏱️</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {isLoading ? '...' : formatUptime(health?.uptime || 0)}
          </p>
          <p className="text-xs text-neutral-400 mt-1">
            {health?.environment || 'development'}
          </p>
        </div>
      </div>

      {/* Architecture Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Phase 1 — Skeleton Complete ✅</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h3 className="font-medium text-neutral-700">✅ Infrastructure</h3>
            <ul className="space-y-1 text-neutral-500">
              <li>• Monorepo with npm workspaces</li>
              <li>• TypeScript strict mode</li>
              <li>• Zod env validation (boot gate)</li>
              <li>• Docker Compose (Postgres + Redis + PgBouncer)</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-neutral-700">✅ Backend</h3>
            <ul className="space-y-1 text-neutral-500">
              <li>• Express + Drizzle ORM</li>
              <li>• JWT auth + role-based access</li>
              <li>• Multi-tenant connection manager</li>
              <li>• Global error handler + custom errors</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-neutral-700">✅ Frontend</h3>
            <ul className="space-y-1 text-neutral-500">
              <li>• React 18 + TanStack Query</li>
              <li>• apiRequest() centralized client</li>
              <li>• Protected routes + error boundaries</li>
              <li>• React Hook Form + Zod validation</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-neutral-700">✅ Observability</h3>
            <ul className="space-y-1 text-neutral-500">
              <li>• Pino structured logging</li>
              <li>• Health check endpoint</li>
              <li>• Per-tenant rate limiting</li>
              <li>• Migration runner on startup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="card p-6 border-primary-200 bg-primary-50/50">
        <h2 className="text-lg font-semibold text-primary-900 mb-2">Next: Phase 2 — UI Design</h2>
        <p className="text-sm text-primary-700">
          Take screenshots of this skeleton, then iterate the UI design using Claude.
          Build the design system before adding feature data.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
