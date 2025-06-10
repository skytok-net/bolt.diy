import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import { viteSingleFile } from 'vite-plugin-singlefile';
import * as dotenv from 'dotenv';
import pkg from './package.json';

// Mock git info for static builds
const gitInfo = {
  commitHash: 'static-build',
};

// Load environment variables from .env files
dotenv.config();

// WebContainer security headers plugin
function webcontainerHeadersPlugin() {
  return {
    name: 'webcontainer-headers',
    configureServer(server: any) {
      return () => {
        server.middlewares.use((req: any, res: any, next: any) => {
          // Always set WebContainer security headers
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          next();
        });
      };
    },
  };
}

export default defineConfig((config) => {
  // Always use WebContainer configuration - single build path
  const buildConfig = {
    target: 'esnext',
    outDir: 'dist/static',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
        inlineDynamicImports: true,
      },
    },
    minify: true,
    ssr: false,
    ssrManifest: false,
  };

  return {
    define: {
      __COMMIT_HASH: JSON.stringify(gitInfo.commitHash),
      __IS_STATIC_BUILD__: true,
      __WEBCONTAINER_ENABLED__: true,
      __APP_VERSION__: JSON.stringify(pkg.version),
      'process.env.NODE_ENV': JSON.stringify(config.mode),
    },
    build: buildConfig,
    plugins: [
      // Add polyfills for node modules
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
        protocolImports: true,
        exclude: [], // Always include all polyfills for WebContainer
      }),

      // Add UnoCSS
      UnoCSS(),

      // Add tsconfig paths
      tsconfigPaths(),

      // Add WebContainer headers plugin (replaces Chrome 129 issue plugin)
      webcontainerHeadersPlugin(),

      // Add CSS modules optimization
      optimizeCssModules({ apply: 'build' }),

      // Add singlefile plugin for static builds
      viteSingleFile(),
    ],
    css: {
      preprocessorOptions: {
        scss: {
          /* Don't add additionalData for static builds since index.scss already uses @use */
          // additionalData: '@import "./app/styles/variables.scss";',
        },
      },
    },
    envPrefix: ['VITE_', 'PUBLIC_'],
    optimizeDeps: {
      include: ['@webcontainer/api'], // Always include WebContainer API
    },
  };
});
