export interface IWindow {
  setup(script: string): Promise<void>;
  navigate(url: string): void;
  screenshot(path: string): Promise<void>;
  close(): Promise<void>;
}

export type BrowserSettings = {
  visible: boolean;
  viewport: { width: number; height: number };
  language: string;
  secure: boolean;
  basicAuthentication: { username: string; password: string };
};

export type BrowserCapabilities = {
  screenshotFormat: string;
};

export type WindowSettings = {
  /** Unique identifier for the window */
  uid: string;
};

export interface IBrowser {
  setup(settings: BrowserSettings): Promise<BrowserCapabilities>;
  newWindow(settings: WindowSettings): Promise<IWindow>;
}
