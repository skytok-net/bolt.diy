import BoltDiyEmbed from '../components/BoltDiyEmbed';

/**
 * Home page demonstrating Bolt.diy embedding in Next.js
 */
export default function HomePage(): JSX.Element {
  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px', color: '#333' }}>
          Bolt.diy Next.js Integration Example
        </h1>
        <p style={{ margin: '0', color: '#666', fontSize: '16px' }}>
          This page demonstrates how to embed the full Bolt.diy editor within a Next.js application
          using API routes and proper WebContainer headers.
        </p>
      </header>

      <main>
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: '#333' }}>
            Embedded Bolt.diy Editor
          </h2>
          <p style={{ margin: '0 0 15px', color: '#666', fontSize: '14px' }}>
            The editor below includes the full Bolt.diy experience: file tree, code editor, 
            terminal, and preview pane. It supports WebContainer for running Node.js applications 
            directly in the browser.
          </p>
        </div>

        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <BoltDiyEmbed
            basePath="/api/bolt"
            width="100%"
            height="700px"
            showLoading={true}
            debug={process.env.NODE_ENV === 'development'}
            onLoad={() => {
              console.log('Bolt.diy editor loaded successfully');
            }}
            onError={(error) => {
              console.error('Failed to load Bolt.diy editor:', error);
            }}
            style={{
              borderRadius: '8px',
            }}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#333' }}>
            Features
          </h3>
          <ul style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
            <li>Full Bolt.diy editor with file tree, code editor, and terminal</li>
            <li>WebContainer support for running Node.js applications in the browser</li>
            <li>Proper COOP/COEP headers for SharedArrayBuffer support</li>
            <li>Responsive design that works on desktop and mobile</li>
            <li>Error handling and loading states</li>
            <li>Browser compatibility detection</li>
          </ul>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '16px', color: '#333' }}>
            Browser Compatibility
          </h3>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Full Support:</strong> Chrome, Edge (Chromium-based)
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>Beta Support:</strong> Firefox, Safari
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#999' }}>
              WebContainer requires SharedArrayBuffer support and cross-origin isolation.
            </p>
          </div>
        </div>
      </main>

      <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
        <p style={{ margin: '0', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          This is an example integration of Bolt.diy in Next.js. 
          See the documentation for more implementation details.
        </p>
      </footer>
    </div>
  );
}