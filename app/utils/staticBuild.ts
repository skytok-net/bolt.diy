/**
 * Utility functions for static build detection and handling
 */

declare global {
  // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
  const __IS_STATIC_BUILD__: boolean;
  // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/naming-convention
  const __WEBCONTAINER_ENABLED__: boolean;
}

/**
 * Check if the current build is a static build
 */
export function isStaticBuild(): boolean {
  if (typeof window === 'undefined') {
    // Server-side: check if we're in static build mode
    // eslint-disable-next-line no-underscore-dangle
    return typeof __IS_STATIC_BUILD__ !== 'undefined' && __IS_STATIC_BUILD__;
  }

  // Client-side: check if the flag was injected during build
  // eslint-disable-next-line no-underscore-dangle
  return typeof (globalThis as any).__IS_STATIC_BUILD__ !== 'undefined' && (globalThis as any).__IS_STATIC_BUILD__;
}

/**
 * Check if the current build is a WebContainer-enabled static build
 * @deprecated WebContainer is now always enabled in static builds
 */
export function isStaticWebContainerBuild(): boolean {
  // WebContainer is now always enabled in static builds
  return isStaticBuild();
}

/**
 * Get the WebContainer instance if available
 */
export function getWebContainerInstance(): any | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // In static builds, WebContainer is always enabled
  if (isStaticBuild()) {
    return (window as any).__webcontainer || null;
  }

  return null;
}

/**
 * Check if WebContainer is supported in the current environment
 */
export function isWebContainerSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for SharedArrayBuffer support
  const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';

  // Check for cross-origin isolation
  const isCrossOriginIsolated = window.crossOriginIsolated;

  return hasSharedArrayBuffer && isCrossOriginIsolated;
}

/**
 * Get WebContainer support status with detailed information
 */
export function getWebContainerSupportStatus(): {
  supported: boolean;
  sharedArrayBuffer: boolean;
  crossOriginIsolated: boolean;
  webContainerEnabled: boolean;
  webContainerInstance: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      supported: false,
      sharedArrayBuffer: false,
      crossOriginIsolated: false,
      webContainerEnabled: false,
      webContainerInstance: false,
    };
  }

  const sharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
  const crossOriginIsolated = window.crossOriginIsolated || false;
  const webContainerEnabled = isStaticBuild(); // Always enabled in static builds
  const webContainerInstance = !!(window as any).__webcontainer;

  return {
    supported: sharedArrayBuffer && crossOriginIsolated,
    sharedArrayBuffer,
    crossOriginIsolated,
    webContainerEnabled,
    webContainerInstance,
  };
}

/**
 * Conditionally execute code only in non-static builds
 */
export function ifNotStatic<T>(fn: () => T, fallback?: T): T | undefined {
  if (isStaticBuild()) {
    return fallback;
  }

  return fn();
}

/**
 * Conditionally execute code only in static builds
 */
export function ifStatic<T>(fn: () => T, fallback?: T): T | undefined {
  if (isStaticBuild()) {
    return fn();
  }

  return fallback;
}

/**
 * Conditionally execute code only in WebContainer-enabled static builds
 * @deprecated WebContainer is now always enabled in static builds, use ifStatic instead
 */
export function ifStaticWebContainer<T>(fn: () => T, fallback?: T): T | undefined {
  // WebContainer is now always enabled in static builds
  return ifStatic(fn, fallback);
}

/**
 * Conditionally execute code only when WebContainer is supported
 */
export function ifWebContainerSupported<T>(fn: () => T, fallback?: T): T | undefined {
  if (isWebContainerSupported()) {
    return fn();
  }

  return fallback;
}

/**
 * Execute code with WebContainer instance if available
 */
export function withWebContainer<T>(fn: (webcontainer: any) => T, fallback?: T): T | undefined {
  const webcontainer = getWebContainerInstance();

  if (webcontainer) {
    return fn(webcontainer);
  }

  return fallback;
}
