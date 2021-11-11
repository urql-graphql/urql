import fs from 'fs';
import path from 'path';

const distTypes = path.resolve(process.cwd(), 'dist', 'types');

const contents = `import { Cache } from './types';

declare module '@urql/core' {
  export interface Client {
    cache: Cache;
  }
}
`;

// Create file
fs.writeFileSync(path.resolve(distTypes, 'core.d.ts'), contents, 'utf-8');

// Alter existing file
const existing = fs.readFileSync(path.resolve(distTypes, 'index.d.ts'));
const newContents = `import './core.d.ts';
${existing}
`;
fs.writeFileSync(path.resolve(distTypes, 'index.d.ts'), newContents, 'utf-8');
