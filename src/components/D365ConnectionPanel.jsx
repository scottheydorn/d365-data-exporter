/**
 * D365 Connection Panel
 * 
 * Handles Azure AD authentication to D365 F&O
 */

import React, { useState, useCallback } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';
import { useApp } from '../context/AppContext';
import { validateD365Url, getMsalConfig, getLoginRequest } from '../utils/msalConfig';

export default function D365ConnectionPanel() {
  const {
    d365Config,
    setD365Config,
    d365Connected,
    d365User,
    connectD365,
    disconnectD365,
    setError,
  } = useApp();

  const [isConnecting, setIsConnecting] = useState(false);
  const [showForm, setShowForm] = useState(!d365Connected);

  const handleInputChange = useCallback((field, value) => {
    setD365Config(prev => ({ ...prev, [field]: value }));
  }, [setD365Config]);

  const handleConnect = useCallback(async () => {
    // Validate inputs
    const d365Url = validateD365Url(d365Config.url);
    if (!d365Url) {
      setError('Please enter a valid D365 environment URL');
      return;
    }

    if (!d365Config.clientId || !d365Config.tenantId) {
      setError('Please enter Client ID and Tenant ID');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Create MSAL config
      const msalConfig = getMsalConfig({
        clientId: d365Config.clientId,
        tenantId: d365Config.tenantId,
      });

      if (!msalConfig) {
        throw new Error('Invalid MSAL configuration');
      }

      // Initialize MSAL
      const msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();

      // Get login request
      const loginRequest = getLoginRequest(d365Url);
      if (!loginRequest) {
        throw new Error('Invalid D365 URL for scope');
      }

      // Try to get token silently first
      const accounts = msalInstance.getAllAccounts();
      let tokenResponse;

      if (accounts.length > 0) {
        try {
          tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
        } catch {
          // Silent acquisition failed, need interactive login
          tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
        }
      } else {
        // No accounts, do interactive login
        tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
      }

      if (!tokenResponse?.accessToken) {
        throw new Error('Failed to acquire access token');
      }

      // Store connection info
      const userEmail = tokenResponse.account?.username || 'Connected';
      connectD365(
        { ...d365Config, url: d365Url },
        tokenResponse.accessToken,
        userEmail
      );

      setShowForm(false);
    } catch (error) {
      console.error('D365 connection error:', error);
      setError(error.message || 'Failed to connect to D365');
    } finally {
      setIsConnecting(false);
    }
  }, [d365Config, connectD365, setError]);

  const handleDisconnect = useCallback(() => {
    disconnectD365();
    setShowForm(true);
  }, [disconnectD365]);

  if (d365Connected && !showForm) {
    return (
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="font-semibold text-nb-black">D365 Connected</h3>
              <p className="text-sm text-nb-gray">{d365User}</p>
              <p className="text-xs text-nb-gray mt-1">{d365Config.url}</p>
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
    <div className="card">
      <h2 className="section-title mb-6">
        <span className="mr-2">🔐</span>
        Connect to D365
      </h2>

      <div className="space-y-4">
        {/* D365 Environment URL */}
        <div>
          <label className="label">D365 Environment URL</label>
          <input
            type="url"
            value={d365Config.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder="https://your-env.sandbox.operations.dynamics.com"
            className="input-field"
            disabled={isConnecting}
          />
          <p className="text-xs text-nb-gray mt-1">
            Your D365 F&O environment URL
          </p>
        </div>

        {/* Client ID */}
        <div>
          <label className="label">Azure App Client ID</label>
          <input
            type="text"
            value={d365Config.clientId}
            onChange={(e) => handleInputChange('clientId', e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="input-field"
            disabled={isConnecting}
          />
          <p className="text-xs text-nb-gray mt-1">
            From Azure Portal → App Registration
          </p>
        </div>

        {/* Tenant ID */}
        <div>
          <label className="label">Azure Tenant ID</label>
          <input
            type="text"
            value={d365Config.tenantId}
            onChange={(e) => handleInputChange('tenantId', e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="input-field"
            disabled={isConnecting}
          />
          <p className="text-xs text-nb-gray mt-1">
            Your Azure AD tenant ID
          </p>
        </div>

        {/* Connect Button */}
        <div className="pt-4">
          <button
            onClick={handleConnect}
            disabled={isConnecting || !d365Config.url || !d365Config.clientId || !d365Config.tenantId}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <span className="spinner" />
                Connecting...
              </>
            ) : (
              'Connect to D365'
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="bg-nb-cream p-4 mt-4">
          <h4 className="font-semibold text-sm text-nb-black mb-2">
            Azure App Requirements:
          </h4>
          <ul className="text-xs text-nb-gray space-y-1">
            <li>• App must be registered in Azure AD</li>
            <li>• Redirect URI: <code className="bg-white px-1">{window.location.origin + window.location.pathname}</code></li>
            <li>• API Permission: Dynamics ERP (user_impersonation)</li>
            <li>• Authentication: Enable "Single-page application"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
