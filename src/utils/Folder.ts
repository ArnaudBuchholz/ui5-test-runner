import { FileSystem, logger } from '../platform/index.js';

const recursive = { recursive: true };

export class Folder {
  static async clean(path: string) {
    logger.debug({ source: 'job', 'message': 'Cleaning folder: ' + path });
    try {
      await FileSystem.stat(path);
      await FileSystem.rm(path, recursive);
    } catch {
      // Ignore
    }
  }

  static async create(path: string) {
    logger.debug({ source: 'job', 'message': 'Creating folder: ' + path });
    try {
      await FileSystem.mkdir(path, recursive);
    } catch (error) {
      logger.error({ source: 'job', 'message': 'Failed to create folder: ' + path, error });
      throw error;
    }
  }

  static async recreate(path: string) {
    await Folder.clean(path);
    await Folder.create(path);
  }
}
