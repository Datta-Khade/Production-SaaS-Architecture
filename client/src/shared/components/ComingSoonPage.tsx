import React from 'react';
import { useLocation } from 'react-router-dom';

const ComingSoonPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="p-6 h-full flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-[#f1f1f1] text-[#16569e] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-10 h-10 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Module Coming Soon</h1>
        <p className="text-gray-500 mb-8">
          The page for <code className="bg-gray-50 px-2 py-0.5 rounded font-mono text-blue-600">{location.pathname}</code> is currently being built by our engineering team.
        </p>
        
        <div className="flex flex-col gap-3">
          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#51baf4] w-[65%] animate-infinite-scroll" />
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Development in Progress</p>
        </div>

        <button 
          onClick={() => window.history.back()}
          className="mt-8 text-sm font-medium text-[#16569e] hover:underline"
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
};

export default ComingSoonPage;
