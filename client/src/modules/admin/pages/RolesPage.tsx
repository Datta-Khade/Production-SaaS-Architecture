import React from 'react';

const RolesPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Role & Permission Management</h1>
        <p className="text-gray-500">Configure system roles and define access control policies.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">RBAC Module Coming Soon</h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          The Role-Based Access Control configuration tool is being finalized.
        </p>
      </div>
    </div>
  );
};

export default RolesPage;
