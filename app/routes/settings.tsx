import { ClientOnly } from 'remix-utils/client-only';
import { Header } from '~/components/header/Header';
import { useState, useEffect } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'connections', label: 'Connections', icon: '🔗' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' },
  ];

  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-bolt-elements-textPrimary mb-2">Settings</h1>
            <p className="text-bolt-elements-textSecondary">Configure your Bolt preferences and connections</p>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                        : 'text-bolt-elements-textSecondary hover:bg-bolt-elements-background-depth-2 hover:text-bolt-elements-textPrimary'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-bolt-elements-background-depth-1 rounded-lg p-6">
              <ClientOnly>
                {() => (
                  <>
                    {activeTab === 'general' && <GeneralSettings />}
                    {activeTab === 'appearance' && <AppearanceSettings />}
                    {activeTab === 'connections' && <ConnectionsSettings />}
                    {activeTab === 'advanced' && <AdvancedSettings />}
                  </>
                )}
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings() {
  const [autoSave, setAutoSave] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  useEffect(() => {
    try {
      const savedAutoSave = localStorage.getItem('bolt_autoSave');
      const savedLineNumbers = localStorage.getItem('bolt_showLineNumbers');

      if (savedAutoSave !== null) {
        setAutoSave(savedAutoSave === 'true');
      }

      if (savedLineNumbers !== null) {
        setShowLineNumbers(savedLineNumbers === 'true');
      }
    } catch (error) {
      console.warn('Failed to load general settings from localStorage:', error);
    }
  }, []);

  const handleAutoSaveChange = (checked: boolean) => {
    setAutoSave(checked);

    try {
      localStorage.setItem('bolt_autoSave', checked.toString());
    } catch (error) {
      console.warn('Failed to save auto-save setting:', error);
    }
  };

  const handleLineNumbersChange = (checked: boolean) => {
    setShowLineNumbers(checked);

    try {
      localStorage.setItem('bolt_showLineNumbers', checked.toString());
    } catch (error) {
      console.warn('Failed to save line numbers setting:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">General Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <div>
              <h3 className="font-medium text-bolt-elements-textPrimary">Auto-save</h3>
              <p className="text-sm text-bolt-elements-textSecondary">Automatically save your work as you type</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={autoSave}
                onChange={(e) => handleAutoSaveChange(e.target.checked)}
                aria-label="Auto-save"
                title="Auto-save"
              />
              <div className="w-11 h-6 bg-bolt-elements-background-depth-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bolt-elements-button-primary-background"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <div>
              <h3 className="font-medium text-bolt-elements-textPrimary">Show line numbers</h3>
              <p className="text-sm text-bolt-elements-textSecondary">Display line numbers in the code editor</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={showLineNumbers}
                onChange={(e) => handleLineNumbersChange(e.target.checked)}
                aria-label="Show line numbers"
                title="Show line numbers"
              />
              <div className="w-11 h-6 bg-bolt-elements-background-depth-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bolt-elements-button-primary-background"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState('14');

  // Initialize settings from localStorage after component mounts
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('bolt_theme') as 'light' | 'dark';
      const savedFontSize = localStorage.getItem('bolt_fontSize');

      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      }

      if (savedFontSize) {
        setFontSize(savedFontSize);
      }
    } catch (error) {
      console.warn('Failed to load appearance settings from localStorage:', error);
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);

    try {
      localStorage.setItem('bolt_theme', newTheme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  };

  const handleFontSizeChange = (newFontSize: string) => {
    setFontSize(newFontSize);

    try {
      localStorage.setItem('bolt_fontSize', newFontSize);
    } catch (error) {
      console.warn('Failed to save font size to localStorage:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">Appearance</h2>
        <div className="space-y-4">
          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <h3 className="font-medium text-bolt-elements-textPrimary mb-3">Theme</h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'light'
                    ? 'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                    : 'border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                }`}
              >
                <span>☀️</span>
                Light
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  theme === 'dark'
                    ? 'border-bolt-elements-button-primary-background bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text'
                    : 'border-bolt-elements-borderColor text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary'
                }`}
              >
                <span>🌙</span>
                Dark
              </button>
            </div>
          </div>

          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <h3 className="font-medium text-bolt-elements-textPrimary mb-3">Font Size</h3>
            <label htmlFor="font-size-select" className="sr-only">
              Font Size
            </label>
            <select
              id="font-size-select"
              className="w-full px-3 py-2 bg-bolt-elements-background-depth-3 border border-bolt-elements-borderColor rounded-lg text-bolt-elements-textPrimary"
              title="Font Size"
              value={fontSize}
              onChange={(e) => handleFontSizeChange(e.target.value)}
            >
              <option value="12">12px</option>
              <option value="14">14px</option>
              <option value="16">16px</option>
              <option value="18">18px</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectionsSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">Connections</h2>
        <div className="space-y-4">
          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-bolt-elements-textPrimary">GitHub</h3>
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Connected</span>
            </div>
            <p className="text-sm text-bolt-elements-textSecondary mb-3">
              Connect your GitHub account to push projects directly to repositories
            </p>
            <button className="px-4 py-2 bg-bolt-elements-button-secondary-background text-bolt-elements-button-secondary-text rounded-lg hover:bg-bolt-elements-button-secondary-backgroundHover transition-colors">
              Manage Connection
            </button>
          </div>

          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-bolt-elements-textPrimary">Supabase</h3>
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Not Connected</span>
            </div>
            <p className="text-sm text-bolt-elements-textSecondary mb-3">
              Connect to Supabase for database operations and backend services
            </p>
            <button className="px-4 py-2 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-lg hover:bg-bolt-elements-button-primary-backgroundHover transition-colors">
              Connect Supabase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvancedSettings() {
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    try {
      const savedDebugMode = localStorage.getItem('bolt_debugMode');

      if (savedDebugMode !== null) {
        setDebugMode(savedDebugMode === 'true');
      }
    } catch (error) {
      console.warn('Failed to load debug mode setting from localStorage:', error);
    }
  }, []);

  const handleDebugModeChange = (checked: boolean) => {
    setDebugMode(checked);

    try {
      localStorage.setItem('bolt_debugMode', checked.toString());
    } catch (error) {
      console.warn('Failed to save debug mode setting:', error);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      // Optionally reload the page to reflect the cleared state
      window.location.reload();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bolt-elements-textPrimary mb-4">Advanced Settings</h2>
        <div className="space-y-4">
          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <h3 className="font-medium text-bolt-elements-textPrimary mb-3">Package Manager Priority</h3>
            <p className="text-sm text-bolt-elements-textSecondary mb-3">
              Configure the priority order for package manager detection
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                <span className="w-6 h-6 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                yarn (yarn.lock)
              </div>
              <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                <span className="w-6 h-6 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                pnpm (pnpm-lock.yaml)
              </div>
              <div className="flex items-center gap-2 text-sm text-bolt-elements-textSecondary">
                <span className="w-6 h-6 bg-bolt-elements-button-primary-background text-bolt-elements-button-primary-text rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                npm (package-lock.json or fallback)
              </div>
            </div>
          </div>

          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <h3 className="font-medium text-bolt-elements-textPrimary mb-3">Debug Mode</h3>
            <p className="text-sm text-bolt-elements-textSecondary mb-3">Enable debug logging for troubleshooting</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={debugMode}
                onChange={(e) => handleDebugModeChange(e.target.checked)}
                aria-label="Enable debug mode"
                title="Enable debug mode"
              />
              <div className="w-11 h-6 bg-bolt-elements-background-depth-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-bolt-elements-button-primary-background"></div>
            </label>
          </div>

          <div className="p-4 bg-bolt-elements-background-depth-2 rounded-lg">
            <h3 className="font-medium text-bolt-elements-textPrimary mb-3">Clear Cache</h3>
            <p className="text-sm text-bolt-elements-textSecondary mb-3">Clear application cache and stored data</p>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
