import { app, BrowserWindow } from 'electron';
import { URL } from 'node:url';
import log from 'electron-log';

// Deep linking constants
export const PROTOCOL_NAME = 'bolt';
export const PROTOCOL_SCHEME = `${PROTOCOL_NAME}://`;

// Allowed actions for security
export const ALLOWED_ACTIONS = ['open', 'chat', 'project', 'settings', 'help', 'import', 'export'] as const;

export type DeepLinkAction = (typeof ALLOWED_ACTIONS)[number];

export interface DeepLinkData {
  protocol: string;
  action?: DeepLinkAction;
  path?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
  isValid: boolean;
  error?: string;
}

/**
 * Validates and parses a deep link URL
 * @param url - The URL to parse
 * @returns Parsed deep link data with validation status
 */
export function parseDeepLink(url: string): DeepLinkData {
  const result: DeepLinkData = {
    protocol: '',
    isValid: false,
  };

  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      result.error = 'Invalid URL: URL must be a non-empty string';
      return result;
    }

    // Trim whitespace and normalize
    const normalizedUrl = url.trim();

    // Check if it starts with our protocol
    if (!normalizedUrl.startsWith(PROTOCOL_SCHEME)) {
      result.error = `Invalid protocol: URL must start with ${PROTOCOL_SCHEME}`;
      return result;
    }

    // Parse the URL
    const parsedUrl = new URL(normalizedUrl);
    result.protocol = parsedUrl.protocol.slice(0, -1); // Remove trailing ':'

    // Validate protocol matches exactly
    if (result.protocol !== PROTOCOL_NAME) {
      result.error = `Invalid protocol: Expected '${PROTOCOL_NAME}', got '${result.protocol}'`;
      return result;
    }

    // Parse hostname as action (if present)
    if (parsedUrl.hostname) {
      const action = parsedUrl.hostname.toLowerCase() as DeepLinkAction;

      // Validate action against allowlist
      if (!ALLOWED_ACTIONS.includes(action)) {
        result.error = `Invalid action: '${action}' is not allowed. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}`;
        return result;
      }

      result.action = action;
    }

    // Parse pathname (remove leading slash)
    if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
      result.path = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.slice(1) : parsedUrl.pathname;
    }

    // Parse query parameters
    if (parsedUrl.search) {
      result.query = {};
      parsedUrl.searchParams.forEach((value, key) => {
        // Sanitize parameter names and values
        const sanitizedKey = sanitizeString(key);
        const sanitizedValue = sanitizeString(value);

        if (sanitizedKey && sanitizedValue) {
          result.query![sanitizedKey] = sanitizedValue;
        }
      });
    }

    // Parse path parameters (split by '/')
    if (result.path) {
      const pathParts = result.path.split('/').filter((part) => part.length > 0);

      if (pathParts.length > 0) {
        result.params = {};
        pathParts.forEach((part, index) => {
          const sanitizedPart = sanitizeString(part);

          if (sanitizedPart) {
            result.params![`param${index}`] = sanitizedPart;
          }
        });
      }
    }

    result.isValid = true;
    log.info('Deep link parsed successfully:', {
      protocol: result.protocol,
      action: result.action,
      path: result.path,
      params: result.params,
      query: result.query,
    });
  } catch (error) {
    result.error = `URL parsing failed: ${error instanceof Error ? error.message : String(error)}`;
    log.error('Deep link parsing error:', result.error);
  }

  return result;
}

/**
 * Sanitizes a string to prevent injection attacks
 * @param input - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove potentially dangerous characters and limit length
  return input
    .replace(/[<>'"&]/g, '') // Remove HTML/XML special characters
    .replace(/[`${}]/g, '') // Remove template literal and shell injection characters
    .replace(/[\r\n\t]/g, '') // Remove line breaks and tabs
    .trim()
    .slice(0, 1000); // Limit length to prevent DoS
}

/**
 * Handles a deep link by processing the URL and taking appropriate action
 * @param url - The deep link URL to handle
 * @param mainWindow - The main application window
 */
export function handleDeepLink(url: string, mainWindow?: BrowserWindow): void {
  log.info('Handling deep link:', url);

  const deepLinkData = parseDeepLink(url);

  if (!deepLinkData.isValid) {
    log.error('Invalid deep link:', deepLinkData.error);
    return;
  }

  // Focus the main window if it exists
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.focus();
    mainWindow.show();

    // Send the deep link data to the renderer process
    mainWindow.webContents.send('deep-link-received', deepLinkData);
  } else {
    log.warn('No main window available to handle deep link');
  }

  // Log the successful handling
  log.info('Deep link handled successfully:', {
    action: deepLinkData.action,
    path: deepLinkData.path,
    hasParams: !!deepLinkData.params,
    hasQuery: !!deepLinkData.query,
  });
}

/**
 * Registers the custom protocol for deep linking
 * @returns Whether registration was successful
 */
export function registerProtocol(): boolean {
  try {
    // Register the protocol
    const success = app.setAsDefaultProtocolClient(PROTOCOL_NAME);

    if (success) {
      log.info(`Protocol '${PROTOCOL_NAME}' registered successfully`);
    } else {
      log.warn(`Failed to register protocol '${PROTOCOL_NAME}'`);
    }

    return success;
  } catch (error) {
    log.error('Error registering protocol:', error);
    return false;
  }
}

/**
 * Unregisters the custom protocol
 * @returns Whether unregistration was successful
 */
export function unregisterProtocol(): boolean {
  try {
    const success = app.removeAsDefaultProtocolClient(PROTOCOL_NAME);

    if (success) {
      log.info(`Protocol '${PROTOCOL_NAME}' unregistered successfully`);
    } else {
      log.warn(`Failed to unregister protocol '${PROTOCOL_NAME}'`);
    }

    return success;
  } catch (error) {
    log.error('Error unregistering protocol:', error);
    return false;
  }
}

/**
 * Gets the deep link URL from command line arguments
 * @param argv - Command line arguments
 * @returns Deep link URL if found, null otherwise
 */
export function getDeepLinkFromArgs(argv: string[]): string | null {
  if (!Array.isArray(argv)) {
    return null;
  }

  // Look for URLs that start with our protocol
  for (const arg of argv) {
    if (typeof arg === 'string' && arg.startsWith(PROTOCOL_SCHEME)) {
      return arg;
    }
  }

  return null;
}

/**
 * Validates if the current environment supports deep linking
 * @returns Whether deep linking is supported
 */
export function isDeepLinkingSupported(): boolean {
  try {
    // Check if we're in a supported environment
    return process.platform === 'darwin' || process.platform === 'win32' || process.platform === 'linux';
  } catch {
    return false;
  }
}
