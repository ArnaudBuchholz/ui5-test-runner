import { Host, Process } from './platform/index.js';

export const sendToParentProcess = (message: unknown) => {
  if (Host.env['UI5TR_BATCH_MODE']) {
    Process.sendToParent(message);
  }
};
