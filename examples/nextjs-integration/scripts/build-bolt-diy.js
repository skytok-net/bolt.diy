#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Build script for Bolt.diy static files
 * This script builds the static version of Bolt.diy optimized for Next.js integration
 */

const BOLT_DIY_ROOT = path.resolve(__dirname, '../../..');
const DIST_DIR = path.resolve(BOLT_DIY_ROOT, 'dist-static');

console.log('🔨 Building Bolt.diy for Next.js integration...\n');

// Check if we're in the correct directory structure
if (!fs.existsSync(path.join(BOLT_DIY_ROOT, 'package.json'))) {
  console.error('❌ Error: Could not find Bolt.diy root directory');
  console.error('   Make sure this script is run from within the Bolt.diy project structure');
  process.exit(1);
}

try {
  // Change to Bolt.diy root directory
  process.chdir(BOLT_DIY_ROOT);
  
  // Step 1: Install dependencies if needed
  console.log('📦 Checking dependencies...');
  if (!fs.existsSync(path.join(BOLT_DIY_ROOT, 'node_modules'))) {
    console.log('📥 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  } else {
    console.log('✅ Dependencies already installed');
  }

  // Step 2: Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }

  // Step 3: Build the static version
  console.log('🏗️  Building static version...');
  
  try {
    // Try the Next.js specific build script first
    execSync('npm run build:static-nextjs', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  build:static-nextjs script not found, trying build:static...');
    try {
      execSync('npm run build:static', { stdio: 'inherit' });
    } catch (fallbackError) {
      console.log('⚠️  build:static script not found, trying regular build...');
      execSync('npm run build', { stdio: 'inherit' });
    }
  }

  // Step 4: Verify the build
  console.log('🔍 Verifying build...');
  
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error('Build directory not found. The build may have failed.');
  }

  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build output');
  }

  // Count files in the build directory
  const fileCount = countFiles(DIST_DIR);
  const buildSize = getBuildSize(DIST_DIR);
  
  console.log('✅ Build completed successfully!\n');
  console.log('📊 Build statistics:');
  console.log(`   Files: ${fileCount}`);
  console.log(`   Size: ${formatBytes(buildSize)}`);
  console.log(`   Output: ${path.relative(process.cwd(), DIST_DIR)}\n`);

  // Step 5: Display next steps
  console.log('🎉 Build ready for Next.js integration!\n');
  console.log('Next steps:');
  console.log('1. Copy the build files to your Next.js public directory:');
  console.log(`   cp -r ${path.relative(process.cwd(), DIST_DIR)} /path/to/nextjs/public/bolt-diy`);
  console.log('2. Or use the setup script: npm run setup-bolt');
  console.log('3. Start your Next.js development server\n');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure all dependencies are installed (npm install)');
  console.error('2. Check that the build scripts exist in package.json');
  console.error('3. Verify that you have sufficient disk space');
  console.error('4. Check the console output above for specific error details');
  process.exit(1);
}

/**
 * Count files in a directory recursively
 */
function countFiles(dir) {
  let count = 0;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += countFiles(path.join(dir, entry.name));
      } else {
        count++;
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }

  return count;
}

/**
 * Get total size of a directory in bytes
 */
function getBuildSize(dir) {
  let size = 0;
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        size += getBuildSize(fullPath);
      } else {
        try {
          const stats = fs.statSync(fullPath);
          size += stats.size;
        } catch (error) {
          // Ignore errors for inaccessible files
        }
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible directories
  }

  return size;
}

/**
 * Format bytes as human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}