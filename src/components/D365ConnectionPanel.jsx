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

  const handleConnect = useCallback(async () => {
    const d365Url = validateD365Url(d365Config.url);
    if (!d365Url) {
      setError('Please enter a valid D365 environment URL');
      return;
    }

    if (!d365Config.clientId || d365Config.clientId.trim().length < 10) {
      setError('Please enter a valid Azure App Client ID');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const msalConfig = getMsalConfig(d365Config.clientId.trim());
      if (!msalConfig) throw new Error('Invalid configuration');

      const msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();

      const loginRequest = getLoginRequest(d365Url);
      if (!loginRequest) throw new Error('Invalid D365 URL');

      const accounts = msalInstance.getAllAccounts();
      let tokenResponse;

      if (accounts.length > 0) {
        try {
          tokenResponse = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: accounts[0],
          });
        } catch {
          tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
        }
      } else {
        tokenResponse = await msalInstance.acquireTokenPopup(loginRequest);
      }

      if (!tokenResponse?.accessToken) throw new Error('Failed to acquire token');

      connectD365(
        { ...d365Config, url: d365Url },
        tokenResponse.accessToken,
        tokenResponse.account?.username || 'Connected'
      );
      setShowForm(false);
    } catch (error) {
      let msg = error.message || 'Failed to connect';
      if (error.errorCode === 'popup_window_error') msg = 'Popup blocked. Please allow popups.';
      if (error.errorCode === 'user_cancelled') msg = 'Authentication cancelled.';
      if (msg.includes('AADSTS50011')) msg = 'Redirect URI not registered. Add this URL to your Azure app: ' + window.location.origin + window.location.pathname;
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [d365Config, connectD365, setError]);

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
          <button onClick={() => { disconnectD365(); setShowForm(true); }} className="btn-outline text-sm py-2">
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="section-title mb-6"><span className="mr-2">🔐</span>Connect to D365</h2>
      <div className="space-y-4">
        <div>
          <label className="label">D365 Environment URL</label>
          <input
            type="url"
            value={d365Config.url}
            onChange={(e) => setD365Config(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://your-env.sandbox.operations.dynamics.com"
            className="input-field"
            disabled={isConnecting}
          />
        </div>
        <div>
          <label className="label">Azure App Client ID</label>
          <input
            type="text"
            value={d365Config.clientId}
            onChange={(e) => setD365Config(prev => ({ ...prev, clientId: e.target.value }))}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="input-field"
            disabled={isConnecting}
          />
          <p className="text-xs text-nb-gray mt-1">
            From your Azure AD App Registration
          </p>
        </div>
        <button
          onClick={handleConnect}
          disabled={isConnecting || !d365Config.url || !d365Config.clientId}
          className="btn-primary w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect to D365'}
        </button>
        <div className="bg-nb-cream p-4 mt-4 text-xs text-nb-gray">
          <p className="font-semibold text-nb-black mb-2">Azure App Setup:</p>
          <ul className="space-y-1">
            <li>• Register app in Azure AD → App registrations</li>
            <li>• Platform: Single-page application (SPA)</li>
            <li>• Redirect URI: <code className="bg-white px-1">{window.location.origin + window.location.pathname}</code></li>
            <li>• API Permission: Dynamics ERP → user_impersonation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
