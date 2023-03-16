import * as url from 'url';
import * as path from 'path';
import { createRequire } from 'node:module';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
export const workspaceRoot = path.resolve(__dirname, '../../../');

export const workspaces = [
  'packages/*',
  'exchanges/*',
];

export const require = createRequire(import.meta.url);
