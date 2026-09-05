// Regenerates the documentation diagrams in docs/diagrams/.
//
//   npm run diagrams
//
// These SVGs are committed (README embeds them), so re-run this after changing
// the schema, the module layout, or the deploy pipeline — the diagram sources in
// scripts/diagrams/ are the editable form, the .svg files are build output.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { dataModel } from './diagrams/data-model.mjs';
import { architecture } from './diagrams/architecture.mjs';
import { deployment } from './diagrams/deployment.mjs';
import { userFlow } from './diagrams/user-flow.mjs';

const outDir = fileURLToPath(new URL('../docs/diagrams/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const diagrams = [
  { file: 'data-model.svg', render: dataModel },
  { file: 'architecture.svg', render: architecture },
  { file: 'deployment.svg', render: deployment },
  { file: 'user-flow.svg', render: userFlow },
];

for (const { file, render } of diagrams) {
  const out = path.join(outDir, file);
  writeFileSync(out, render(), 'utf8');
  console.log(`wrote docs/diagrams/${file}`);
}
