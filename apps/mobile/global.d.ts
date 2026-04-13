// ============================================================================
// Fix for React 19 + React Native JSX component type error
// "'View' cannot be used as a JSX component"
// 
// Root cause: @types/react@19.1 removed 'refs' from the Component class,
// but React Native's old-style class components still reference it.
// This shim restores compatibility.
// ============================================================================

import type { JSX as ReactJSX } from 'react';

declare global {
  namespace JSX {
    interface Element extends ReactJSX.Element {}
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

export {};
