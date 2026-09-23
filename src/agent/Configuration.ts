export type Configuration = {
  agentDetectionInterval: number;
  agentDetectionMaxInterval: number;
  agentDetectionTimeout: number;
  agentNoTestsTimeout: number;
  agentScreenshotTimeout: number;
  driver: string;
  parallel: number;
  screenshot: boolean;
  splitOpa: boolean;
  pageId: number;
};
