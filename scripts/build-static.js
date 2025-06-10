#!/usr/bin/env node

/**
 * Build script for generating a static version of the app
 *
 * This script builds the app using Vite's static build mode
 * Supports both regular static builds and WebContainer-enabled builds
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// WebContainer is now always enabled - no flags needed

async function buildStatic() {
  console.log('Building WebContainer-enabled static site...');

  try {
    // Use the dedicated static config file - WebContainer always enabled
    const buildCommand = 'vite build --config vite.static.config.ts';
    execSync(buildCommand, {
      stdio: 'inherit',
    });

    console.log('✅ WebContainer-enabled static build completed successfully!');
    console.log('📁 The static site is available at: dist/static');
    console.log('');
    console.log('🚀 WebContainer Features Enabled:');
    console.log('  • Full development environment');
    console.log('  • File system operations');
    console.log('  • Terminal access');
    console.log('  • Preview servers');
    console.log('  • Cross-origin isolation support');
    console.log('');
    console.log('⚠️  Note: WebContainer requires proper security headers to function.');
    console.log('   Ensure your hosting environment supports:');
    console.log('   - Cross-Origin-Embedder-Policy: credentialless');
    console.log('   - Cross-Origin-Opener-Policy: same-origin');
    console.log('   - Cross-Origin-Resource-Policy: cross-origin');
  } catch (error) {
    console.error('❌ Error during WebContainer-enabled static build:', error);
    process.exit(1);
  }
}

buildStatic();
