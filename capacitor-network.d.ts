declare module '@capacitor/network' {
  import type { PluginListenerHandle } from '@capacitor/core';

  export interface NetworkStatus {
    connected: boolean;
    connectionType?: string;
  }

  export const Network: {
    getStatus(): Promise<NetworkStatus>;
    addListener: (eventName: 'networkStatusChange', listenerFunc: (status: NetworkStatus) => void) => Promise<PluginListenerHandle>;
  };
}

