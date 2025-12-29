/**
 * GitHub Connection Panel
 * 
 * Handles GitHub PAT authentication and repository selection
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { verifyGitHubToken, listRepositories, checkRepository } from '../utils/githubApi';

export default function GitHubConnectionPanel() {
  const {
    githubConfig,
    setGithubConfig,
    githubConnected,
    githubUser,
    connectGitHub,
    disconnectGitHub,
    setError,
  } = useApp();

  const [isConnecting, setIsConnecting] = useState(false);
  const [showForm, setShowForm] = useState(!githubConnected);
  const [repositories, setRepositories] = useState([]);
  const [tokenVerified, setTokenVerified] = useState(false);

  const handleInputChange = useCallback((field, value) => {
    setGithubConfig(prev => ({ ...prev, [field]: value }));
    if (field === 'token') {
      setTokenVerified(false);
      setRepositories([]);
    }
  }, [setGithubConfig]);

  // Verify token when entered
  const handleVerifyToken = useCallback(async () => {
    if (!githubConfig.token || githubConfig.token.length < 10) {
      setError('Please enter a valid GitHub Personal Access Token');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Verify token and get user info
      const user = await verifyGitHubToken(githubConfig.token);
      
      // List repositories with push access
      const repos = await listRepositories(githubConfig.token);
      
      setRepositories(repos);
      setTokenVerified(true);
      setGithubConfig(prev => ({ ...prev, owner: user.login }));
    } catch (error) {
      console.error('GitHub verification error:', error);
      setError(error.message || 'Failed to verify GitHub token');
      setTokenVerified(false);
    } finally {
      setIsConnecting(false);
    }
  }, [githubConfig.token, setGithubConfig, setError]);

  // Connect to selected repository
  const handleConnect = useCallback(async () => {
    if (!githubConfig.repo) {
      setError('Please select a repository');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Verify repository access
      const repoInfo = await checkRepository(
        githubConfig.owner,
        githubConfig.repo,
        githubConfig.token
      );

      // Get user info
      const user = await verifyGitHubToken(githubConfig.token);

      connectGitHub(githubConfig, user.login);
      setShowForm(false);
    } catch (error) {
      console.error('GitHub connection error:', error);
      setError(error.message || 'Failed to connect to repository');
    } finally {
      setIsConnecting(false);
    }
  }, [githubConfig, connectGitHub, setError]);

  const handleDisconnect = useCallback(() => {
    disconnectGitHub();
    setTokenVerified(false);
    setRepositories([]);
    setShowForm(true);
  }, [disconnectGitHub]);

  // Select repository from dropdown
  const handleRepoSelect = useCallback((repoFullName) => {
    if (!repoFullName) {
      setGithubConfig(prev => ({ ...prev, repo: '' }));
      return;
    }
    
    const [owner, repo] = repoFullName.split('/');
    setGithubConfig(prev => ({ ...prev, owner, repo }));
  }, [setGithubConfig]);

  if (githubConnected && !showForm) {
    return (
      <div className="card-teal">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-nb-black">GitHub Connected</h3>
              <p className="text-sm text-nb-gray">
                {githubConfig.owner}/{githubConfig.repo}
              </p>
              <p className="text-xs text-nb-gray mt-1">
                Branch: {githubConfig.branch} | Path: /{githubConfig.path}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="btn-outline text-sm py-2"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card-teal">
      <h2 className="section-title mb-6">
        <span className="mr-2">📁</span>
        Connect to GitHub
      </h2>

      <div className="space-y-4">
        {/* GitHub PAT */}
        <div>
          <label className="label">GitHub Personal Access Token</label>
          <div className="flex gap-2">
            <input
              type="password"
              value={githubConfig.token}
              onChange={(e) => handleInputChange('token', e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="input-field flex-1"
              disabled={isConnecting}
            />
            <button
              onClick={handleVerifyToken}
              disabled={isConnecting || !githubConfig.token}
              className="btn-teal whitespace-nowrap"
            >
              {isConnecting ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          <p className="text-xs text-nb-gray mt-1">
            Token needs <code>repo</code> scope for write access
          </p>
        </div>

        {/* Repository Selection */}
        {tokenVerified && (
          <>
            <div>
              <label className="label">Repository</label>
              <select
                value={githubConfig.repo ? `${githubConfig.owner}/${githubConfig.repo}` : ''}
                onChange={(e) => handleRepoSelect(e.target.value)}
                className="input-field"
                disabled={isConnecting}
              >
                <option value="">Select a repository...</option>
                {repositories.map(repo => (
                  <option key={repo.full_name} value={repo.full_name}>
                    {repo.full_name} {repo.private ? '🔒' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div>
              <label className="label">Branch</label>
              <input
                type="text"
                value={githubConfig.branch}
                onChange={(e) => handleInputChange('branch', e.target.value)}
                placeholder="main"
                className="input-field"
                disabled={isConnecting}
              />
            </div>

            {/* Export Path */}
            <div>
              <label className="label">Export Folder Path</label>
              <input
                type="text"
                value={githubConfig.path}
                onChange={(e) => handleInputChange('path', e.target.value)}
                placeholder="exports"
                className="input-field"
                disabled={isConnecting}
              />
              <p className="text-xs text-nb-gray mt-1">
                Folder where exports will be saved
              </p>
            </div>

            {/* Connect Button */}
            <div className="pt-4">
              <button
                onClick={handleConnect}
                disabled={isConnecting || !githubConfig.repo}
                className="btn-teal w-full flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <span className="spinner" />
                    Connecting...
                  </>
                ) : (
                  'Connect to Repository'
                )}
              </button>
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="bg-nb-cream p-4 mt-4">
          <h4 className="font-semibold text-sm text-nb-black mb-2">
            Creating a GitHub Token:
          </h4>
          <ul className="text-xs text-nb-gray space-y-1">
            <li>1. Go to GitHub → Settings → Developer Settings</li>
            <li>2. Personal Access Tokens → Fine-grained tokens</li>
            <li>3. Generate new token with "Contents" read/write access</li>
            <li>4. Copy and paste the token above</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
