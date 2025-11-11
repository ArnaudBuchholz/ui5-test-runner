import { logger } from './logger.js';
import { ChildProcess } from './ChildProcess.js';

type Roots = {
  local: string;
  global: string;
};

let roots: Promise<Roots> | undefined;

const getRoots = async () => {
  if (!roots) {
    const localRoot = ChildProcess.spawn('npm', ['root']);
    const globalRoot = ChildProcess.spawn('npm', ['root', '--global']);
    roots = Promise.all([ localRoot.closed, globalRoot.closed ]).then(() => {
      return {
        local: localRoot.stdout,
        global: globalRoot.stdout
      };
    });
  }
  return roots;
}

export const Npm = {
  /** Locate the module or install it globally then import it */
  async import(moduleName: string): Promise<unknown> {
    logger.debug({ source: 'npm', message: `Npm.import(${moduleName})` });
    try {
      const module = await this.import(moduleName);
      logger.debug({ source: 'npm', message: `Npm.import(${moduleName})` });
      return module;
    } catch (reason) {
      
    }



  }
};
