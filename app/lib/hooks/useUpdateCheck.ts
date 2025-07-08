import { useState, useEffect, useCallback } from 'react';
import { checkForUpdates, acknowledgeUpdate, type UpdateCheckResult } from '~/lib/api/updates';

interface UseUpdateCheckReturn {
  hasUpdate: boolean;
  updateInfo: UpdateCheckResult | null;
  isChecking: boolean;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  acknowledgeUpdate: (version: string) => Promise<void>;
  lastChecked: Date | null;
}

const UPDATE_CHECK_INTERVAL = 1000 * 60 * 60; // 1 hour
const STORAGE_KEY = 'update_check_data';
const LAST_CHECK_KEY = 'last_update_check';

interface StoredUpdateData {
  updateInfo: UpdateCheckResult;
  timestamp: number;
  acknowledged: boolean;
}

export function useUpdateCheck(): UseUpdateCheckReturn {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Load stored update data on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const lastCheckTime = localStorage.getItem(LAST_CHECK_KEY);

      if (storedData) {
        const parsed: StoredUpdateData = JSON.parse(storedData);
        setUpdateInfo(parsed.updateInfo);
      }

      if (lastCheckTime) {
        setLastChecked(new Date(parseInt(lastCheckTime)));
      }
    } catch (err) {
      console.error('Failed to load stored update data:', err);
    }
  }, []);

  const performUpdateCheck = useCallback(async () => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await checkForUpdates();
      const now = Date.now();

      setUpdateInfo(result);
      setLastChecked(new Date(now));

      // Store the result
      const dataToStore: StoredUpdateData = {
        updateInfo: result,
        timestamp: now,
        acknowledged: false,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
      localStorage.setItem(LAST_CHECK_KEY, now.toString());

      if (result.error) {
        setError(result.error.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Update check failed:', err);
    } finally {
      setIsChecking(false);
    }
  }, []);

  const handleAcknowledgeUpdate = useCallback(async (version: string) => {
    try {
      await acknowledgeUpdate(version);

      // Update stored data to mark as acknowledged
      const storedData = localStorage.getItem(STORAGE_KEY);

      if (storedData) {
        const parsed: StoredUpdateData = JSON.parse(storedData);

        parsed.acknowledged = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Failed to acknowledge update:', err);
    }
  }, []);

  // Auto-check for updates periodically
  useEffect(() => {
    const shouldCheck = () => {
      if (!lastChecked) {
        return true;
      }

      return Date.now() - lastChecked.getTime() > UPDATE_CHECK_INTERVAL;
    };

    // Initial check if needed
    if (shouldCheck()) {
      performUpdateCheck();
    }

    // Set up periodic checking
    const interval = setInterval(() => {
      if (shouldCheck()) {
        performUpdateCheck();
      }
    }, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [lastChecked, performUpdateCheck]);

  // Determine if there's an available update
  const hasUpdate = Boolean(updateInfo?.available && !updateInfo.error && !isUpdateAcknowledged(updateInfo.version));

  return {
    hasUpdate,
    updateInfo,
    isChecking,
    error,
    checkForUpdates: performUpdateCheck,
    acknowledgeUpdate: handleAcknowledgeUpdate,
    lastChecked,
  };
}

function isUpdateAcknowledged(version: string): boolean {
  try {
    const acknowledgedVersion = localStorage.getItem('last_acknowledged_update');
    return acknowledgedVersion === version;
  } catch {
    return false;
  }
}
