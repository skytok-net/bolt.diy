#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Setup script for Bolt.diy Next.js integration
 * This script builds the static version of Bolt.diy and copies it to the public directory
 */

const BOLT_DIY_ROOT = path.resolve(__dirname, '../../..');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const BOLT_DIY_PUBLIC_DIR = path.resolve(PUBLIC_DIR, 'bolt-diy');

console.log('🚀 Setting up Bolt.diy for Next.js integration...\n');

// Check if we're in the correct directory structure
if (!fs.existsSync(path.join(BOLT_DIY_ROOT, 'package.json'))) {
  console.error('❌ Error: Could not find Bolt.diy root directory');
  console.error('   Make sure this script is run from within the Bolt.diy project structure');
  process.exit(1);
}

try {
  // Step 1: Build the static version of Bolt.diy
  console.log('📦 Building static version of Bolt.diy...');
  process.chdir(BOLT_DIY_ROOT);
  
  try {
    execSync('npm run build:static-nextjs', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  build:static-nextjs script not found, trying build:static...');
    execSync('npm run build:static', { stdio: 'inherit' });
  }
  
  console.log('✅ Static build completed\n');

  // Step 2: Create public directory if it doesn't exist
  console.log('📁 Creating public directory...');
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  
  // Step 3: Remove existing bolt-diy directory if it exists
  if (fs.existsSync(BOLT_DIY_PUBLIC_DIR)) {
    console.log('🗑️  Removing existing bolt-diy directory...');
    fs.rmSync(BOLT_DIY_PUBLIC_DIR, { recursive: true, force: true });
  }

  // Step 4: Copy the built files
  console.log('📋 Copying static files to public directory...');
  
  const staticBuildDir = path.join(BOLT_DIY_ROOT, 'dist-static');
  if (!fs.existsSync(staticBuildDir)) {
    throw new Error('Static build directory not found. Make sure the build completed successfully.');
  }

  // Copy the entire dist-static directory to public/bolt-diy
  copyDirectory(staticBuildDir, BOLT_DIY_PUBLIC_DIR);
  
  console.log('✅ Files copied successfully\n');

  // Step 5: Verify the setup
  console.log('🔍 Verifying setup...');
  
  const indexPath = path.join(BOLT_DIY_PUBLIC_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in the copied files');
  }
  
  const stats = fs.statSync(BOLT_DIY_PUBLIC_DIR);
  if (!stats.isDirectory()) {
    throw new Error('bolt-diy directory was not created properly');
  }
  
  // Count files in the directory
  const fileCount = countFiles(BOLT_DIY_PUBLIC_DIR);
  console.log(`✅ Setup verified: ${fileCount} files copied\n`);

  // Step 6: Display next steps
  console.log('🎉 Setup completed successfully!\n');
  console.log('Next steps:');
  console.log('1. Run "npm run dev" to start the development server');
  console.log('2. Open http://localhost:3000 to see the embedded Bolt.diy editor');
  console.log('3. The editor will be available at the /api/bolt route\n');
  
  console.log('📁 Files structure:');
  console.log(`   ${path.relative(process.cwd(), BOLT_DIY_PUBLIC_DIR)}/`);
  console.log(`   ├── index.html`);
  console.log(`   ├── assets/`);
  console.log(`   └── ... (${fileCount} total files)\n`);

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.error('\nTroubleshooting:');
  console.error('1. Make sure you have built Bolt.diy at least once');
  console.error('2. Check that you have write permissions to the public directory');
  console.error('3. Ensure all dependencies are installed (npm install)');
  process.exit(1);
}

/**
 * Recursively copy a directory
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Count files in a directory recursively
 */
function countFiles(dir) {
  let count = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      count += countFiles(path.join(dir, entry.name));
    } else {
      count++;
    }
  }

  return count;
}