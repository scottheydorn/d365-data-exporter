/**
 * Application Context
 * 
 * Manages authentication state and settings
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // D365 Authentication
  const [d365Config, setD365Config] = useState({
    url: '',
    clientId: '',
    tenantId: '',
  });
  const [d365Token, setD365Token] = useState(null);
  const [d365User, setD365User] = useState(null);
  const [d365Connected, setD365Connected] = useState(false);

  // GitHub Authentication
  const [githubConfig, setGithubConfig] = useState({
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
    path: 'exports',
  });
  const [githubUser, setGithubUser] = useState(null);
  const [githubConnected, setGithubConnected] = useState(false);

  // Entity state
  const [entities, setEntities] = useState([]);
  const [selectedEntities, setSelectedEntities] = useState(new Set());
  const [entityCounts, setEntityCounts] = useState({});

  // Export state
  const [exportFormat, setExportFormat] = useState('json');
  const [exportProgress, setExportProgress] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // D365 connection methods
  const connectD365 = useCallback((config, token, user) => {
    setD365Config(config);
    setD365Token(token);
    setD365User(user);
    setD365Connected(true);
    setError(null);
  }, []);

  const disconnectD365 = useCallback(() => {
    setD365Token(null);
    setD365User(null);
    setD365Connected(false);
    setEntities([]);
    setSelectedEntities(new Set());
    setEntityCounts({});
  }, []);

  // GitHub connection methods
  const connectGitHub = useCallback((config, user) => {
    setGithubConfig(config);
    setGithubUser(user);
    setGithubConnected(true);
    setError(null);
  }, []);

  const disconnectGitHub = useCallback(() => {
    setGithubConfig(prev => ({ ...prev, token: '' }));
    setGithubUser(null);
    setGithubConnected(false);
  }, []);

  // Entity selection methods
  const toggleEntitySelection = useCallback((entityName) => {
    setSelectedEntities(prev => {
      const next = new Set(prev);
      if (next.has(entityName)) {
        next.delete(entityName);
      } else {
        next.add(entityName);
      }
      return next;
    });
  }, []);

  const selectAllEntities = useCallback(() => {
    setSelectedEntities(new Set(entities.map(e => e.name)));
  }, [entities]);

  const clearSelection = useCallback(() => {
    setSelectedEntities(new Set());
  }, []);

  // Add to export history
  const addExportRecord = useCallback((record) => {
    setExportHistory(prev => [record, ...prev].slice(0, 50));
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    // D365 state
    d365Config,
    setD365Config,
    d365Token,
    d365User,
    d365Connected,
    connectD365,
    disconnectD365,

    // GitHub state
    githubConfig,
    setGithubConfig,
    githubUser,
    githubConnected,
    connectGitHub,
    disconnectGitHub,

    // Entity state
    entities,
    setEntities,
    selectedEntities,
    toggleEntitySelection,
    selectAllEntities,
    clearSelection,
    entityCounts,
    setEntityCounts,

    // Export state
    exportFormat,
    setExportFormat,
    exportProgress,
    setExportProgress,
    exportHistory,
    addExportRecord,

    // UI state
    isLoading,
    setIsLoading,
    error,
    setError,
    clearError,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
