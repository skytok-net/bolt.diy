import { build } from 'vite';
import { resolve, join } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

async function buildForNextJS() {
  console.log('🚀 Building Bolt.diy for Next.js integration...');

  try {
    // Build with Vite using the existing static config
    await build({
      configFile: resolve(process.cwd(), 'vite.static.config.ts'),
      build: {
        outDir: 'dist/nextjs-static',
        emptyOutDir: true,
        rollupOptions: {
          output: {
            // Ensure consistent file naming for Next.js
            entryFileNames: 'assets/[name]-[hash].js',
            chunkFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',
          },
        },
      },
    });

    // Create assets directory if it doesn't exist
    const assetsDir = 'dist/nextjs-static/assets';

    if (!existsSync(assetsDir)) {
      mkdirSync(assetsDir, { recursive: true });
    }

    // Copy additional WebContainer assets
    const webcontainerAssets = [
      'node_modules/@webcontainer/api/dist/webcontainer-api.js',
      'node_modules/@webcontainer/api/dist/webcontainer-api.js.map',
    ];

    webcontainerAssets.forEach((asset) => {
      if (existsSync(asset)) {
        const filename = asset.split('/').pop();
        const destPath = `${assetsDir}/${filename}`;
        copyFileSync(asset, destPath);
        console.log(`📁 Copied ${asset} to ${destPath}`);
      } else {
        console.warn(`⚠️  Asset not found: ${asset}`);
      }
    });

    // Modify index.html to work with Next.js API routes
    const indexPath = 'dist/nextjs-static/index.html';

    if (existsSync(indexPath)) {
      let indexContent = readFileSync(indexPath, 'utf-8');

      // Add meta tags for cross-origin isolation
      const metaTags = `
    <meta http-equiv="Cross-Origin-Embedder-Policy" content="require-corp">
    <meta http-equiv="Cross-Origin-Opener-Policy" content="same-origin">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">`;

      indexContent = indexContent.replace('<head>', `<head>${metaTags}`);

      // Add base tag for proper asset loading
      indexContent = indexContent.replace('<head>', '<head>\n    <base href="/api/bolt/">');

      writeFileSync(indexPath, indexContent);
      console.log('📝 Modified index.html for Next.js integration');
    }

    // Create a manifest file for asset tracking
    const manifestPath = 'dist/nextjs-static/manifest.json';
    const manifest = {
      name: 'Bolt.diy Editor',
      version: '1.0.0',
      description: 'Full-featured web-based development environment',
      entryPoint: 'index.html',
      assets: {
        html: ['index.html'],
        js: [],
        css: [],
        other: [],
      },
      webcontainer: {
        required: true,
        crossOriginIsolated: true,
      },
      buildTime: new Date().toISOString(),
    };

    // Scan for built assets
    const fs = await import('fs/promises');
    const files = await fs.readdir('dist/nextjs-static', { recursive: true });

    files.forEach((file) => {
      if (typeof file === 'string') {
        if (file.endsWith('.js')) {
          manifest.assets.js.push(file);
        } else if (file.endsWith('.css')) {
          manifest.assets.css.push(file);
        } else if (!file.endsWith('.html') && !file.endsWith('.json')) {
          manifest.assets.other.push(file);
        }
      }
    });

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('📋 Created manifest.json');

    console.log('\n✅ Build completed successfully!');
    console.log('📁 Output directory: dist/nextjs-static');
    console.log('\n📋 Next steps:');
    console.log('   1. Copy dist/nextjs-static/* to your Next.js public/bolt-static/ directory');
    console.log('   2. Implement the API route: app/api/bolt/[...path]/route.ts');
    console.log('   3. Add the React component: components/BoltDiyEmbed.tsx');
    console.log('   4. Configure Next.js headers for cross-origin isolation');
    console.log('\n🔗 See docs/NEXTJS_API_ROUTE_HOSTING.md for detailed instructions');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildForNextJS();