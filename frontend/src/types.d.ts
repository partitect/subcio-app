declare module "react-player";

// Electron API types
interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  getVersion: () => Promise<string>;
  send: (channel: string, data?: unknown) => void;
  receive: (channel: string, func: (...args: unknown[]) => void) => void;
  openFile: () => Promise<string | null>;
  saveFile: (data: { content: string; defaultPath?: string }) => Promise<string | null>;
  exportVideo: (options: {
    projectId?: string;
    words: Array<{ start: number; end: number; text: string }>;
    style: Record<string, unknown>;
    resolution?: string;
  }) => Promise<string>;
  getBackendUrl: () => string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
