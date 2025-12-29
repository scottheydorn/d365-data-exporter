/**
 * MSAL Authentication Configuration
 * 
 * SECURITY: 
 * - Uses MSAL.js for secure Azure AD authentication
 * - No credentials stored in code
 * - Token caching handled by MSAL
 */

import { PublicClientApplication, LogLevel } from '@azure/msal-browser';

/**
 * Get MSAL configuration from user settings
 * 
 * @param {object} settings - User-provided settings
 * @returns {object} MSAL configuration
 */
export function getMsalConfig(settings) {
  if (!settings?.clientId || !settings?.tenantId) {
    return null;
  }

  // Validate inputs
  const clientId = String(settings.clientId).trim();
  const tenantId = String(settings.tenantId).trim();

  // Basic GUID validation
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guidRegex.test(clientId) || !guidRegex.test(tenantId)) {
    console.error('Invalid Client ID or Tenant ID format');
    return null;
  }

  return {
    auth: {
      clientId: clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin + window.location.pathname,
      postLogoutRedirectUri: window.location.origin + window.location.pathname,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: 'sessionStorage', // More secure than localStorage
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Warning,
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              break;
            case LogLevel.Warning:
              console.warn(message);
              break;
            default:
              break;
          }
        },
      },
    },
  };
}

/**
 * Get login request configuration
 * 
 * @param {string} d365Url - D365 environment URL
 * @returns {object} Login request
 */
export function getLoginRequest(d365Url) {
  if (!d365Url) {
    return null;
  }

  // Normalize URL
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

/**
 * Create MSAL instance
 * 
 * @param {object} settings - User settings
 * @returns {PublicClientApplication|null} MSAL instance
 */
export function createMsalInstance(settings) {
  const config = getMsalConfig(settings);
  if (!config) {
    return null;
  }

  try {
    return new PublicClientApplication(config);
  } catch (error) {
    console.error('Failed to create MSAL instance:', error);
    return null;
  }
}

/**
 * Validate D365 URL format
 * 
 * @param {string} url - URL to validate
 * @returns {string|null} Validated URL or null
 */
export function validateD365Url(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  let normalized = url.trim().toLowerCase();
  
  // Add https if missing
  if (!normalized.startsWith('https://')) {
    if (normalized.startsWith('http://')) {
      normalized = normalized.replace('http://', 'https://');
    } else {
      normalized = 'https://' + normalized;
    }
  }

  // Remove trailing slash
  if (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  // Validate against trusted D365 domains
  const trustedDomains = [
    '.operations.dynamics.com',
    '.sandbox.operations.dynamics.com',
    '.cloudax.dynamics.com',
  ];

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    const isTrusted = trustedDomains.some(domain => hostname.endsWith(domain));
    if (!isTrusted) {
      console.warn('URL is not a recognized D365 domain');
      // Allow it anyway for flexibility, but log warning
    }

    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}
