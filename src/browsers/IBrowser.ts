import type { ISecretValue } from '../types/ISecretValue.js';

export interface IWindow {
  eval(script: string): Promise<unknown>;
  screenshot(path: string): Promise<void>;
  close(): Promise<void>;
}

export type BrowserIsolation = 'none' | 'context';

const BROWSER_ISOLATIONS: readonly BrowserIsolation[] = ['none', 'context'];

export const isBrowserIsolation = (value: string | undefined): value is BrowserIsolation =>
  (BROWSER_ISOLATIONS as readonly (string | undefined)[]).includes(value);

export type BrowserSettings = {
  visible?: boolean;
  viewport?: { width: number; height: number };
  device?: string;
  language?: string;
  secure?: boolean;
  basicAuthentication?: { username: string; password: ISecretValue };
  browser?: string;
  isolation?: BrowserIsolation;
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
