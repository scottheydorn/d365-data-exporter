/**
 * Header Component
 * 
 * New Balance branded header
 */

import React from 'react';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { d365Connected, githubConnected, d365User } = useApp();

  return (
    <header className="bg-nb-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📦</span>
              <div>
                <h1 className="text-lg font-bold tracking-wider uppercase">
                  D365 Data Exporter
                </h1>
                <p className="text-xs text-nb-opal tracking-wide">
                  Entity Data Export Tool
                </p>
              </div>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {/* D365 Status */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${d365Connected ? 'bg-green-400' : 'bg-nb-gray'}`} />
              <span className="text-sm text-nb-opal">
                {d365Connected ? (d365User || 'D365 Connected') : 'D365'}
              </span>
            </div>

            {/* GitHub Status */}
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${githubConnected ? 'bg-green-400' : 'bg-nb-gray'}`} />
              <span className="text-sm text-nb-opal">
                {githubConnected ? 'GitHub' : 'GitHub'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Red accent bar */}
      <div className="h-1 bg-nb-red" />
    </header>
  );
}
