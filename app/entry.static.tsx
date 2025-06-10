import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import global styles
import './styles/index.scss';
import 'virtual:uno.css';

// Import components for static build
import { BaseChat } from './components/chat/BaseChat';
import { Header } from './components/header/Header';
import { Workbench } from './components/workbench/Workbench.client';
import BackgroundRays from './components/ui/BackgroundRays';
import { ActionRunner } from './lib/runtime/action-runner';

// Import stores
import { useStore } from '@nanostores/react';
import { themeStore } from './lib/stores/theme';
import { logStore } from './lib/stores/logs';

// WebContainer types - removed unused interface

declare global {
  interface Window {
    __webcontainer?: any; // Use any to avoid type conflicts with the actual WebContainer API
    __webcontainerDebug?: {
      checkSupport: () => void;
      testFileSystem: () => Promise<void>;
    };
  }
}

/*
 * This is a WebContainer-enabled static entry point.
 * It renders the full app with WebContainer functionality for embedded usage.
 */
const StaticWebContainerApp = () => {
  const theme = useStore(themeStore);
  const [webcontainerReady, setWebcontainerReady] = useState(false);
  const [webcontainerError, setWebcontainerError] = useState<string | null>(null);
  const [actionRunner, setActionRunner] = useState<ActionRunner | null>(null);

  useEffect(() => {
    // Set theme on HTML element
    document.querySelector('html')?.setAttribute('data-theme', theme);

    // Log static WebContainer build initialization
    logStore.logSystem('Static WebContainer build initialized', {
      theme,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      buildType: 'static-webcontainer',
      crossOriginIsolated: window.crossOriginIsolated,
      sharedArrayBufferSupported: typeof SharedArrayBuffer !== 'undefined',
    });
  }, [theme]);

  useEffect(() => {
    // Initialize WebContainer with proper configuration
    const initWebContainer = async () => {
      try {
        // Check for WebContainer support
        if (typeof SharedArrayBuffer === 'undefined') {
          throw new Error('SharedArrayBuffer is not available. WebContainer requires cross-origin isolation.');
        }

        if (!window.crossOriginIsolated) {
          console.warn('⚠️ Cross-origin isolation not detected. WebContainer may not work properly.');
        }

        // Dynamic import of WebContainer to avoid issues in unsupported environments
        const { WebContainer } = await import('@webcontainer/api');

        console.log('🚀 Initializing WebContainer...');

        const webcontainer = await WebContainer.boot({
          coep: 'credentialless', // Preferred for better compatibility
          workdirName: 'project',
          forwardPreviewErrors: true,
        });

        // Store webcontainer instance globally for access
        window.__webcontainer = webcontainer;

        // Create ActionRunner for WebContainer operations
        const runner = new ActionRunner(Promise.resolve(webcontainer), () => {
          // Mock shell terminal for static build
          return {
            ready: () => Promise.resolve(),
            executeCommand: () => Promise.resolve({ exitCode: 0, output: '' }),
          } as any;
        });

        setActionRunner(runner);

        // Add debug utilities
        window.__webcontainerDebug = {
          checkSupport: () => {
            console.log('SharedArrayBuffer:', typeof SharedArrayBuffer !== 'undefined');
            console.log('Cross-origin isolated:', window.crossOriginIsolated);
            console.log('WebContainer instance:', window.__webcontainer);
          },
          testFileSystem: async () => {
            const wc = window.__webcontainer;

            if (wc) {
              try {
                await wc.fs.writeFile('/test.txt', 'Hello WebContainer!');

                const content = await wc.fs.readFile('/test.txt', 'utf-8');

                console.log('✅ File system test successful:', content);
              } catch (error) {
                console.error('❌ File system test failed:', error);
              }
            }
          },
        };

        setWebcontainerReady(true);
        console.log('✅ WebContainer initialized successfully in static build');

        logStore.logSystem('WebContainer initialized', {
          success: true,
          coep: 'credentialless',
          workdirName: 'project',
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        console.error('❌ WebContainer initialization failed:', error);
        setWebcontainerError(errorMessage);

        logStore.logSystem('WebContainer initialization failed', {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });

        // Implement fallback behavior - continue without WebContainer
        console.log('🔄 Continuing without WebContainer functionality');
      }
    };

    initWebContainer();
  }, []);

  return (
    <StrictMode>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
          <BackgroundRays />
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <BaseChat />
            {actionRunner && <Workbench actionRunner={actionRunner} />}
          </div>

          {/* WebContainer status indicator for debugging */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed bottom-4 right-4 z-50">
              <div
                className={`px-3 py-1 rounded text-xs font-mono ${
                  webcontainerReady
                    ? 'bg-green-500 text-white'
                    : webcontainerError
                      ? 'bg-red-500 text-white'
                      : 'bg-yellow-500 text-black'
                }`}
              >
                WebContainer: {webcontainerReady ? 'Ready' : webcontainerError ? 'Error' : 'Loading...'}
              </div>
            </div>
          )}
        </div>
      </DndProvider>
    </StrictMode>
  );
};

// Initialize theme before rendering
function initializeTheme() {
  let theme = localStorage.getItem('bolt_theme');

  if (!theme) {
    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.querySelector('html')?.setAttribute('data-theme', theme);
}

// Initialize theme immediately
initializeTheme();

// For static builds, use createRoot instead of hydrateRoot
const root = document.getElementById('root');

if (root) {
  createRoot(root).render(<StaticWebContainerApp />);
} else {
  console.error('Root element not found');
}
