/**
 * Package manager detection utility
 * Prioritizes: yarn > pnpm > npm based on lock files
 */

export type PackageManager = 'yarn' | 'pnpm' | 'npm';

export interface PackageManagerInfo {
  name: PackageManager;
  lockFile: string;
  installCommand: string;
  runCommand: string;
}

const PACKAGE_MANAGERS: Record<PackageManager, PackageManagerInfo> = {
  yarn: {
    name: 'yarn',
    lockFile: 'yarn.lock',
    installCommand: 'yarn install',
    runCommand: 'yarn',
  },
  pnpm: {
    name: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    installCommand: 'pnpm install',
    runCommand: 'pnpm',
  },
  npm: {
    name: 'npm',
    lockFile: 'package-lock.json',
    installCommand: 'npm install',
    runCommand: 'npm run',
  },
};

/**
 * Detect package manager based on lock files
 * Priority: yarn > pnpm > npm
 */
export function detectPackageManager(files: Array<{ path: string; content?: string }>): PackageManagerInfo {
  const hasFile = (filename: string) => files.some((f) => f.path.endsWith(filename));

  // Check in priority order: yarn > pnpm > npm
  if (hasFile('yarn.lock')) {
    return PACKAGE_MANAGERS.yarn;
  }

  if (hasFile('pnpm-lock.yaml')) {
    return PACKAGE_MANAGERS.pnpm;
  }

  if (hasFile('package-lock.json')) {
    return PACKAGE_MANAGERS.npm;
  }

  // Default to npm if no lock files found
  return PACKAGE_MANAGERS.npm;
}

/**
 * Detect package manager from File objects (for folder imports)
 */
export function detectPackageManagerFromFiles(files: File[]): PackageManagerInfo {
  const hasFile = (filename: string) => files.some((f) => f.webkitRelativePath.endsWith(filename));

  // Check in priority order: yarn > pnpm > npm
  if (hasFile('yarn.lock')) {
    return PACKAGE_MANAGERS.yarn;
  }

  if (hasFile('pnpm-lock.yaml')) {
    return PACKAGE_MANAGERS.pnpm;
  }

  if (hasFile('package-lock.json')) {
    return PACKAGE_MANAGERS.npm;
  }

  // Default to npm if no lock files found
  return PACKAGE_MANAGERS.npm;
}

/**
 * Get install command for detected package manager
 */
export function getInstallCommand(files: Array<{ path: string; content?: string }>): string {
  const pm = detectPackageManager(files);
  return pm.installCommand;
}

/**
 * Get run command for detected package manager
 */
export function getRunCommand(files: Array<{ path: string; content?: string }>, script: string): string {
  const pm = detectPackageManager(files);
  return `${pm.runCommand} ${script}`;
}

/**
 * Get setup and start commands for a project
 */
export function getProjectCommands(
  files: Array<{ path: string; content?: string }>,
  script?: string,
): { setupCommand: string; startCommand?: string } {
  const pm = detectPackageManager(files);

  const setupCommand = pm.installCommand;
  const startCommand = script ? `${pm.runCommand} ${script}` : undefined;

  return { setupCommand, startCommand };
}
