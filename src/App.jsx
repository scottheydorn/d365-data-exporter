/**
 * D365 Data Exporter - Main Application
 * 
 * New Balance branded D365 entity data export tool
 * 
 * SECURITY:
 * - Checkmarx SAST compliant
 * - MSAL for Azure AD authentication
 * - No credentials stored in code
 * - All API URLs validated against hardcoded allowlists
 */

import React from 'react';
import { useApp } from './context/AppContext';

// Components
import Header from './components/Header';
import D365ConnectionPanel from './components/D365ConnectionPanel';
import GitHubConnectionPanel from './components/GitHubConnectionPanel';
import EntityListPanel from './components/EntityListPanel';
import EntityPresets from './components/EntityPresets';
import ExportPanel from './components/ExportPanel';

function App() {
  const { error, clearError, d365Connected, githubConnected } = useApp();

  return (
    <div className="min-h-screen bg-nb-cream">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-nb-red p-4 flex items-start gap-3 animate-fade-in">
            <span className="text-nb-red text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-semibold text-nb-red">Error</p>
              <p className="text-sm text-nb-black">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-nb-gray hover:text-nb-black"
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Connection Section */}
        <section className="mb-8">
          <h2 className="text-xs font-bold text-nb-gray uppercase tracking-widest mb-4">
            Step 1: Connect Services
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <D365ConnectionPanel />
            <GitHubConnectionPanel />
          </div>
        </section>

        {/* Entity Selection Section */}
        {d365Connected && (
          <section className="mb-8 animate-slide-in">
            <h2 className="text-xs font-bold text-nb-gray uppercase tracking-widest mb-4">
              Step 2: Select Entities
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <EntityListPanel />
              </div>
              <div className="lg:col-span-1">
                <EntityPresets />
              </div>
            </div>
          </section>
        )}

        {/* Export Section */}
        {d365Connected && githubConnected && (
          <section className="mb-8 animate-slide-in">
            <h2 className="text-xs font-bold text-nb-gray uppercase tracking-widest mb-4">
              Step 3: Export Data
            </h2>
            <div className="max-w-2xl">
              <ExportPanel />
            </div>
          </section>
        )}

        {/* Help Section */}
        <section className="mt-12 pt-8 border-t border-nb-opal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-bold text-nb-black uppercase tracking-wider mb-3">
                About This Tool
              </h3>
              <p className="text-nb-gray">
                Export D365 F&O data entities to JSON or CSV format and 
                automatically save them to a GitHub repository for version 
                control and collaboration.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-nb-black uppercase tracking-wider mb-3">
                Azure App Setup
              </h3>
              <ul className="text-nb-gray space-y-1">
                <li>• Register app in Azure AD</li>
                <li>• Add Dynamics ERP API permission</li>
                <li>• Enable SPA authentication</li>
                <li>• Set redirect URI to this app</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-nb-black uppercase tracking-wider mb-3">
                Security
              </h3>
              <ul className="text-nb-gray space-y-1">
                <li>• No credentials stored</li>
                <li>• Tokens in session only</li>
                <li>• Direct API connections</li>
                <li>• Open source code</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-nb-black text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-nb-opal">
              D365 Data Exporter v1.0.0
            </p>
            <p className="text-sm text-nb-opal">
              Checkmarx Security Compliant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
