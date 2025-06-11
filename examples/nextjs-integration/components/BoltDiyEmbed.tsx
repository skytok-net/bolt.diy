'use client';

import React, { useEffect, useRef, useState } from 'react';

interface BoltDiyEmbedProps {
  /** Base URL where the Bolt.diy API route is mounted (e.g., '/api/bolt') */
  basePath?: string;
  /** Width of the embedded editor */
  width?: string | number;
  /** Height of the embedded editor */
  height?: string | number;
  /** CSS class name for the container */
  className?: string;
  /** Custom styles for the container */
  style?: React.CSSProperties;
  /** Callback when the editor is loaded */
  onLoad?: () => void;
  /** Callback when an error occurs */
  onError?: (error: Error) => void;
  /** Whether to show a loading indicator */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Whether to enable debug mode */
  debug?: boolean;
}

interface BoltDiyEmbedState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  supportsWebContainer: boolean;
}

/**
 * BoltDiyEmbed - React component for embedding Bolt.diy editor
 * 
 * This component creates an iframe-free embedding of the Bolt.diy editor
 * by dynamically loading the static files through the Next.js API route.
 * 
 * Features:
 * - Full Bolt.diy editor with file tree, terminal, and preview
 * - WebContainer support with proper headers
 * - Responsive design
 * - Error handling and loading states
 * - Browser compatibility detection
 */
export default function BoltDiyEmbed({
  basePath = '/api/bolt',
  width = '100%',
  height = '600px',
  className = '',
  style = {},
  onLoad,
  onError,
  showLoading = true,
  loadingComponent,
  debug = false,
}: BoltDiyEmbedProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<BoltDiyEmbedState>({
    isLoading: true,
    isLoaded: false,
    error: null,
    supportsWebContainer: false,
  });

  // Check browser compatibility for WebContainer
  const checkWebContainerSupport = (): boolean => {
    try {
      // Check for SharedArrayBuffer support
      if (typeof SharedArrayBuffer === 'undefined') {
        if (debug) {
          console.warn('BoltDiyEmbed: SharedArrayBuffer not available');
        }
        return false;
      }

      // Check for cross-origin isolation
      if (!crossOriginIsolated) {
        if (debug) {
          console.warn('BoltDiyEmbed: Cross-origin isolation not enabled');
        }
        return false;
      }

      // Check browser support
      const userAgent = navigator.userAgent.toLowerCase();
      const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
      const isEdge = userAgent.includes('edge');
      const isFirefox = userAgent.includes('firefox');
      const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');

      if (isChrome || isEdge) {
        return true; // Full support
      }

      if (isFirefox || isSafari) {
        if (debug) {
          console.warn('BoltDiyEmbed: Limited WebContainer support in this browser');
        }
        return true; // Beta support
      }

      return false;
    } catch (error) {
      if (debug) {
        console.error('BoltDiyEmbed: Error checking WebContainer support:', error);
      }
      return false;
    }
  };

  // Load the Bolt.diy editor
  const loadEditor = async (): Promise<void> => {
    try {
      if (!containerRef.current) {
        throw new Error('Container ref not available');
      }

      // Check WebContainer support
      const supportsWebContainer = checkWebContainerSupport();
      
      setState(prev => ({
        ...prev,
        supportsWebContainer,
      }));

      if (debug) {
        console.log('BoltDiyEmbed: Loading editor from', basePath);
        console.log('BoltDiyEmbed: WebContainer support:', supportsWebContainer);
      }

      // Fetch the main HTML file
      const response = await fetch(`${basePath}/`);
      
      if (!response.ok) {
        throw new Error(`Failed to load Bolt.diy: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();

      // Parse and modify the HTML to work in the embedded context
      const modifiedHtml = modifyHtmlForEmbedding(html, basePath);

      // Create a new document in the container
      const container = containerRef.current;
      container.innerHTML = '';

      // Create an iframe-like container with proper isolation
      const editorFrame = document.createElement('div');
      editorFrame.style.width = '100%';
      editorFrame.style.height = '100%';
      editorFrame.style.border = 'none';
      editorFrame.style.overflow = 'hidden';
      editorFrame.innerHTML = modifiedHtml;

      container.appendChild(editorFrame);

      // Wait for the editor to initialize
      await waitForEditorLoad(editorFrame);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        error: null,
      }));

      if (onLoad) {
        onLoad();
      }

      if (debug) {
        console.log('BoltDiyEmbed: Editor loaded successfully');
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: false,
        error: errorObj,
      }));

      if (onError) {
        onError(errorObj);
      }

      if (debug) {
        console.error('BoltDiyEmbed: Failed to load editor:', errorObj);
      }
    }
  };

  // Modify HTML for embedding context
  const modifyHtmlForEmbedding = (html: string, basePath: string): string => {
    // Update all relative paths to use the API route
    let modifiedHtml = html
      .replace(/src="\/([^"]+)"/g, `src="${basePath}/$1"`)
      .replace(/href="\/([^"]+)"/g, `href="${basePath}/$1"`)
      .replace(/url\(\/([^)]+)\)/g, `url(${basePath}/$1)`);

    // Add base tag for proper resource loading
    const baseTag = `<base href="${basePath}/">`;
    modifiedHtml = modifiedHtml.replace('<head>', `<head>${baseTag}`);

    // Add embedding-specific styles
    const embeddingStyles = `
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        #root {
          height: 100vh;
          width: 100vw;
        }
      </style>
    `;
    modifiedHtml = modifiedHtml.replace('</head>', `${embeddingStyles}</head>`);

    return modifiedHtml;
  };

  // Wait for the editor to fully load
  const waitForEditorLoad = async (container: HTMLElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Editor load timeout'));
      }, 30000); // 30 second timeout

      const checkLoad = (): void => {
        // Check if React root is mounted
        const reactRoot = container.querySelector('#root');
        if (reactRoot && reactRoot.children.length > 0) {
          clearTimeout(timeout);
          resolve();
          return;
        }

        // Check if there are any error messages
        const errorElement = container.querySelector('[data-error]');
        if (errorElement) {
          clearTimeout(timeout);
          reject(new Error('Editor failed to load'));
          return;
        }

        // Continue checking
        setTimeout(checkLoad, 100);
      };

      checkLoad();
    });
  };

  // Load editor on mount
  useEffect(() => {
    loadEditor();
  }, [basePath]);

  // Render loading state
  if (state.isLoading) {
    const defaultLoading = (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#1e1e1e',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid #333',
              borderTop: '3px solid #007acc',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <div>Loading Bolt.diy Editor...</div>
          {!state.supportsWebContainer && (
            <div style={{ fontSize: '12px', color: '#ffa500', marginTop: '8px' }}>
              Limited browser support detected
            </div>
          )}
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );

    return (
      <div
        className={className}
        style={{
          width,
          height,
          ...style,
        }}
      >
        {showLoading && (loadingComponent || defaultLoading)}
      </div>
    );
  }

  // Render error state
  if (state.error) {
    return (
      <div
        className={className}
        style={{
          width,
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1e1e1e',
          color: '#ff6b6b',
          fontFamily: 'system-ui, sans-serif',
          padding: '20px',
          boxSizing: 'border-box',
          ...style,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#ff6b6b' }}>
            Failed to Load Bolt.diy Editor
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#cccccc' }}>
            {state.error.message}
          </p>
          <button
            onClick={loadEditor}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007acc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render the editor
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width,
        height,
        border: '1px solid #333',
        borderRadius: '4px',
        overflow: 'hidden',
        backgroundColor: '#1e1e1e',
        ...style,
      }}
    />
  );
}

// Export types for external use
export type { BoltDiyEmbedProps, BoltDiyEmbedState };