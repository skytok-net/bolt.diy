/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    // Enable server components caching
    serverComponentsExternalPackages: [],
  },

  // Configure headers for WebContainer support
  async headers() {
    return [
      {
        // Apply headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      {
        // Specific headers for the Bolt.diy API route
        source: '/api/bolt/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Configure rewrites if needed
  async rewrites() {
    return [
      // Example: Rewrite /bolt to the API route
      // {
      //   source: '/bolt/:path*',
      //   destination: '/api/bolt/:path*',
      // },
    ];
  },

  // Configure redirects if needed
  async redirects() {
    return [
      // Example redirects can be added here
    ];
  },

  // Webpack configuration for better module resolution
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add any custom webpack configuration here
    
    // Example: Add support for importing .wasm files
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Example: Add support for SharedArrayBuffer in development
    if (dev && !isServer) {
      config.devtool = 'eval-source-map';
    }

    return config;
  },

  // Environment variables
  env: {
    // Add any environment variables needed for Bolt.diy
    BOLT_DIY_EMBEDDED: 'true',
  },

  // Image configuration
  images: {
    // Configure image domains if needed
    domains: [],
    // Disable image optimization for static exports if needed
    unoptimized: false,
  },

  // Output configuration
  output: 'standalone', // Use 'export' for static export

  // Trailing slash configuration
  trailingSlash: false,

  // Base path configuration (if deploying to a subdirectory)
  // basePath: '/my-app',

  // Asset prefix configuration (for CDN)
  // assetPrefix: 'https://cdn.example.com',

  // Compression configuration
  compress: true,

  // PoweredByHeader configuration
  poweredByHeader: false,

  // Generate build ID
  generateBuildId: async () => {
    // You can return any string here
    return 'bolt-diy-integration';
  },

  // Configure TypeScript
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript type errors.
    ignoreBuildErrors: false,
  },

  // Configure ESLint
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;