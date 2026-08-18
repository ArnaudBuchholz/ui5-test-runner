import type { IWindow } from '../../browsers/IBrowser.js';
import type { PageProgressData } from '../../platform/logger/types.js';

export type PageContext = {
  pageId: number;
  urls: string[];
  url: string;
  page: IWindow;
  loopDelay: number;
  type: PageProgressData['type'];
  lastExecuted: number;
  errors: number;
  lastTotal: number;
  isSuite: boolean;
  lastUncaughtErrorsCount: number;
};
