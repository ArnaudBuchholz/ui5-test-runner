export interface IWindow {
  eval(script: string): Promise<unknown>;
  screenshot(path: string): Promise<void>;
  close(): Promise<void>;
}

export type BrowserSettings = {
  visible?: boolean;
  viewport?: { width: number; height: number };
  language?: string;
  secure?: boolean;
  basicAuthentication?: { username: string; password: string };
  browser?: string;
  options?: Record<string, unknown>;
};

export type BrowserCapabilities = {
  browserName: string;
  browserVersion: string;
};

export interface BrowserDriverDescriptor {
  readonly supportedBrowsers: readonly string[];
  readonly defaultBrowser: string;
  readonly screenshotFormat: string;
}

export type WindowSettings = {
  pageId: number;
  scripts: readonly string[];
  url: string;
};

export interface IBrowser {
  setup(settings: BrowserSettings): Promise<BrowserCapabilities>;
  newWindow(settings: WindowSettings): Promise<IWindow>;
  shutdown(): Promise<void>;
}
