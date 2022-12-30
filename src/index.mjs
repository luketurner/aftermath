import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { transformMermaid } from './mermaid.mjs';
import { transformKatex } from './katex.mjs';

const INPUT_DIR = process.argv[2];
if (!INPUT_DIR) {
  console.error('usage: node src/index.mjs INPUT-DIR');
  process.exit(1);
}

transformDirectory(INPUT_DIR);

function transformDirectory(dir) {
  for (const f of fs.readdirSync(dir, { encoding: 'utf8', withFileTypes: true })) {
    if (f.isDirectory()) {
      transformDirectory(path.join(dir, f.name));
    } else if (f.name.endsWith('.html')) {
      transformFile(path.join(dir, f.name));
    }
  }
}

function transformFile(file) {
  try {
    console.log('transforming file', file);
    const doc = cheerio.load(fs.readFileSync(file, { encoding: 'utf8' }));

    transformMermaid(doc);
    transformKatex(doc);

    fs.writeFileSync(file, doc.html(), { encoding: 'utf8' });
  } catch (e) {
    console.error('error transforming file', file, e);
  }
}