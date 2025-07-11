/// <reference types="vite/client" />

declare const __COMMIT_HASH: string;
declare const __APP_VERSION: string;

declare global {
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}
