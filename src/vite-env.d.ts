/// <reference types="vite/client" />

declare global {
  interface Window {
    Adsgram: {
      init: (config: { blockId: string }) => {
        show: () => Promise<{ done: boolean; state: string; description?: string }>;
      };
    };
  }
}
