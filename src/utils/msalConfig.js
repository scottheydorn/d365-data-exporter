/**
 * MSAL Authentication Configuration
 * 
 * Accepts Client ID at runtime - no hardcoded app registration
 */

import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

export function getMsalConfig(clientId) {
  if (!clientId) return null;
  
  return {
    auth: {
      clientId: clientId,
      authority: 'https://login.microsoftonline.com/organizations',
      redirectUri: window.location.origin + window.location.pathname,
      postLogoutRedirectUri: window.location.origin + window.location.pathname,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          if (level === LogLevel.Error) console.error(message);
          if (level === LogLevel.Warning) console.warn(message);
        },
      },
    },
  };
}

export function getLoginRequest(d365Url) {
  if (!d365Url) return null;

  let normalizedUrl = d365Url.trim();
  if (!normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }

  return {
    scopes: [`${normalizedUrl}/.default`],
  };
}

export function validateD365Url(url) {
  if (!url || typeof url !== 'string') return null;

  let normalized = url.trim().toLowerCase();
  if (!normalized.startsWith('https://')) {
    normalized = normalized.startsWith('http://') 
      ? normalized.replace('http://', 'https://') 
      : 'https://' + normalized;
  }
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  try {
    const parsed = new URL(normalized);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}
