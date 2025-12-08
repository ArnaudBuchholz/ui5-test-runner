import { registerHooks, stripTypeScriptTypes } from 'node:module';
import { accessSync, constants, readFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';

registerHooks({
  resolve(path, context, next) {
    if (path.startsWith('./') || path.startsWith('../')) {
      const { parentURL } = context;
      const fileUrl = new URL(path, parentURL);
      const filePath = fileURLToPath(fileUrl);

      if (filePath.endsWith('.js')) {
        const tsPath = filePath.slice(0, -3) + '.ts';
        try {
          accessSync(tsPath, constants.R_OK);
          const url = fileUrl.toString().slice(0, -3) + '.ts';
          return {
            url,
            format: 'module',
            shortCircuit: true
          };
        } catch {
          // ignore
        }
      }
    }
    return next(path, context);
  },
  load(path, context, next) {
    if (path.endsWith('.ts')) {
      const source = readFileSync(new URL(path), 'utf8');
      const jsSource = stripTypeScriptTypes(source, {
        mode: 'strip'
      });
      return {
        format: 'module',
        source: jsSource,
        shortCircuit: true
      };
    }
    return next(path, context);
  }
});
