#!/usr/bin/env node

/**
 * Debug Helper Script for bolt.diy
 *
 * This script provides common debugging utilities and helpers
 * for the bolt.diy project development workflow.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const os = require('os');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to colorize console output
function colorLog(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to execute commands with error handling
function executeCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    };
  }
}

// Check if a port is available
function isPortAvailable(port) {
  try {
    const result = executeCommand(`lsof -ti:${port}`);
    return !result.success || !result.output;
  } catch {
    return true;
  }
}

// Get system information
function getSystemInfo() {
  const info = {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    npmVersion: executeCommand('npm --version').output || 'Not found',
    pnpmVersion: executeCommand('pnpm --version').output || 'Not found',
    gitVersion: executeCommand('git --version').output || 'Not found'
  };

  return info;
}

// Check project health
function checkProjectHealth() {
  colorLog('\n🔍 Checking Project Health...', 'cyan');

  const checks = [
    {
      name: 'package.json exists',
      check: () => fs.existsSync('package.json'),
      fix: 'Run: pnpm init'
    },
    {
      name: 'pnpm-lock.yaml exists',
      check: () => fs.existsSync('pnpm-lock.yaml'),
      fix: 'Run: pnpm install'
    },
    {
      name: 'node_modules exists',
      check: () => fs.existsSync('node_modules'),
      fix: 'Run: pnpm install'
    },
    {
      name: 'TypeScript config exists',
      check: () => fs.existsSync('tsconfig.json'),
      fix: 'Create tsconfig.json file'
    },
    {
      name: 'Vite config exists',
      check: () => fs.existsSync('vite.config.ts'),
      fix: 'Create vite.config.ts file'
    },
    {
      name: 'App directory exists',
      check: () => fs.existsSync('app'),
      fix: 'Create app directory structure'
    },
    {
      name: 'Port 5173 is available',
      check: () => isPortAvailable(5173),
      fix: 'Kill process using port 5173 or use different port'
    }
  ];

  let allPassed = true;

  checks.forEach(({ name, check, fix }) => {
    const passed = check();
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';

    colorLog(`  ${status} ${name}`, color);

    if (!passed) {
      colorLog(`    Fix: ${fix}`, 'yellow');
      allPassed = false;
    }
  });

  if (allPassed) {
    colorLog('\n✅ All health checks passed!', 'green');
  } else {
    colorLog('\n⚠️  Some health checks failed. Please fix the issues above.', 'yellow');
  }

  return allPassed;
}

// Display environment information
function showEnvironmentInfo() {
  colorLog('\n🌍 Environment Information', 'cyan');

  const info = getSystemInfo();

  Object.entries(info).forEach(([key, value]) => {
    const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    colorLog(`  ${formattedKey}: ${value}`, 'white');
  });

  // Check environment variables
  colorLog('\n📋 Environment Variables:', 'cyan');
  const envVars = [
    'NODE_ENV',
    'VITE_LOG_LEVEL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'GROQ_API_KEY'
  ];

  envVars.forEach(envVar => {
    const value = process.env[envVar];
    const status = value ? '✅' : '❌';
    const displayValue = value ? (envVar.includes('KEY') ? '***hidden***' : value) : 'Not set';
    colorLog(`  ${status} ${envVar}: ${displayValue}`, value ? 'green' : 'red');
  });
}

// Show available debug configurations
function showDebugConfigurations() {
  colorLog('\n🐛 Available Debug Configurations', 'cyan');

  try {
    const launchConfig = JSON.parse(fs.readFileSync('.vscode/launch.json', 'utf8'));
    const configurations = launchConfig.configurations || [];

    configurations.forEach((config, index) => {
      colorLog(`  ${index + 1}. ${config.name}`, 'white');
      colorLog(`     Type: ${config.type}`, 'blue');
      if (config.preLaunchTask) {
        colorLog(`     Pre-launch: ${config.preLaunchTask}`, 'yellow');
      }
    });

    if (launchConfig.compounds && launchConfig.compounds.length > 0) {
      colorLog('\n🔗 Compound Configurations:', 'magenta');
      launchConfig.compounds.forEach((compound, index) => {
        colorLog(`  ${index + 1}. ${compound.name}`, 'white');
        colorLog(`     Includes: ${compound.configurations.join(', ')}`, 'blue');
      });
    }
  } catch (error) {
    colorLog('  ❌ No debug configurations found (.vscode/launch.json)', 'red');
    colorLog('  Run the setup command to create debug configurations', 'yellow');
  }
}

// Kill processes on common development ports
function killDevProcesses() {
  colorLog('\n🔪 Killing Development Processes...', 'cyan');

  const ports = [5173, 3000, 8080, 9229];

  ports.forEach(port => {
    const result = executeCommand(`lsof -ti:${port}`);
    if (result.success && result.output) {
      const pids = result.output.split('\n').filter(pid => pid.trim());
      pids.forEach(pid => {
        const killResult = executeCommand(`kill -9 ${pid}`);
        if (killResult.success) {
          colorLog(`  ✅ Killed process ${pid} on port ${port}`, 'green');
        } else {
          colorLog(`  ❌ Failed to kill process ${pid} on port ${port}`, 'red');
        }
      });
    } else {
      colorLog(`  ℹ️  No process found on port ${port}`, 'blue');
    }
  });
}

// Clean development artifacts
function cleanArtifacts() {
  colorLog('\n🧹 Cleaning Development Artifacts...', 'cyan');

  const pathsToClean = [
    'node_modules/.cache',
    'build',
    'dist',
    '.wrangler',
    'coverage',
    '.nyc_output',
    '.vscode/chrome-debug-profile'
  ];

  pathsToClean.forEach(pathToClean => {
    if (fs.existsSync(pathToClean)) {
      try {
        executeCommand(`rm -rf ${pathToClean}`);
        colorLog(`  ✅ Cleaned ${pathToClean}`, 'green');
      } catch (error) {
        colorLog(`  ❌ Failed to clean ${pathToClean}: ${error.message}`, 'red');
      }
    } else {
      colorLog(`  ℹ️  ${pathToClean} doesn't exist`, 'blue');
    }
  });
}

// Start development server with debugging
function startDebugServer() {
  colorLog('\n🚀 Starting Development Server with Debugging...', 'cyan');

  // Check if pre-start script exists and run it
  if (fs.existsSync('pre-start.cjs')) {
    colorLog('  Running pre-start script...', 'yellow');
    const preStartResult = executeCommand('node pre-start.cjs');
    if (!preStartResult.success) {
      colorLog(`  ❌ Pre-start script failed: ${preStartResult.error}`, 'red');
      return;
    }
  }

  // Start the development server
  colorLog('  Starting Remix development server...', 'yellow');

  const env = {
    ...process.env,
    NODE_ENV: 'development',
    DEBUG: '*',
    NODE_OPTIONS: '--inspect=9229 --enable-source-maps'
  };

  const child = spawn('pnpm', ['run', 'dev'], {
    stdio: 'inherit',
    env
  });

  child.on('error', (error) => {
    colorLog(`  ❌ Failed to start server: ${error.message}`, 'red');
  });

  child.on('exit', (code) => {
    colorLog(`  Server exited with code ${code}`, code === 0 ? 'green' : 'red');
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    colorLog('\n  Shutting down development server...', 'yellow');
    child.kill('SIGTERM');
    process.exit(0);
  });
}

// Show help information
function showHelp() {
  colorLog('\n🛠️  bolt.diy Debug Helper', 'cyan');
  colorLog('Usage: node scripts/debug/debug-helper.js [command]', 'white');

  colorLog('\nAvailable Commands:', 'yellow');
  colorLog('  health     - Check project health and dependencies', 'white');
  colorLog('  env        - Show environment information', 'white');
  colorLog('  configs    - Show available debug configurations', 'white');
  colorLog('  kill       - Kill development processes on common ports', 'white');
  colorLog('  clean      - Clean development artifacts and caches', 'white');
  colorLog('  start      - Start development server with debugging enabled', 'white');
  colorLog('  help       - Show this help message', 'white');

  colorLog('\nExamples:', 'yellow');
  colorLog('  node scripts/debug/debug-helper.js health', 'blue');
  colorLog('  node scripts/debug/debug-helper.js clean', 'blue');
  colorLog('  node scripts/debug/debug-helper.js start', 'blue');

  colorLog('\nFor VS Code debugging:', 'yellow');
  colorLog('  1. Open the project in VS Code', 'white');
  colorLog('  2. Press F5 or go to Run and Debug panel', 'white');
  colorLog('  3. Select a debug configuration from the dropdown', 'white');
  colorLog('  4. Set breakpoints and start debugging', 'white');
}

// Main execution
function main() {
  const command = process.argv[2] || 'help';

  switch (command) {
    case 'health':
      checkProjectHealth();
      break;
    case 'env':
      showEnvironmentInfo();
      break;
    case 'configs':
      showDebugConfigurations();
      break;
    case 'kill':
      killDevProcesses();
      break;
    case 'clean':
      cleanArtifacts();
      break;
    case 'start':
      startDebugServer();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  colorLog,
  executeCommand,
  isPortAvailable,
  getSystemInfo,
  checkProjectHealth,
  showEnvironmentInfo,
  showDebugConfigurations,
  killDevProcesses,
  cleanArtifacts,
  startDebugServer
};
