import { FileSystem, logger } from '../platform/index.js';

const recursive = { recursive: true };

export const Folder = {
  async clean(path: string) {
    logger.debug({ source: 'job', message: `Cleaning folder: ${path}` });
    try {
      await FileSystem.stat(path);
      await FileSystem.rm(path, recursive);
    } catch {
      // Ignore
    }
  },

  async create(path: string) {
    logger.debug({ source: 'job', message: `Creating folder: ${path}` });
    try {
      await FileSystem.mkdir(path, recursive);
    } catch (error_) {
      const error = new Error(`Failed to create folder: ${path}`);
      error.cause = error_;
      throw error;
    }
  },

  async recreate(path: string) {
    await Folder.clean(path);
    await Folder.create(path);
  }
};
