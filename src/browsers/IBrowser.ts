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
};

export type BrowserCapabilities = {
  screenshotFormat: string;
};

export type WindowSettings = {
  scripts: string[];
  url: string;
};

export interface IBrowser {
  setup(settings: BrowserSettings): Promise<BrowserCapabilities>;
  newWindow(settings: WindowSettings): Promise<IWindow>;
  shutdown(): Promise<void>;
}
