import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import {config} from './config.mjs';

const TMPDIR = fs.mkdtempSync('tmpblog-mermaid');

function writeTmpFile(name, content) {
  const p = path.join(TMPDIR, name)
  fs.writeFileSync(p, content);
  return p;
}

function renderMermaid(diagram) {
  // Note -- Mermaid seems to require a browser environment,
  // which is why we call mmdc instead of using mermaid as a library.
  // Also I can't get the stdin piping to work, so using a temporary file.
  const f = writeTmpFile('diagram.mmd', diagram);
  execSync(`mmdc -i ${f} -p .puppeteerrc -b ${config.mermaid.background}`, {
    encoding: 'utf8',
  });
  const output = fs.readFileSync(f + '.svg', 'utf8');
  return output;
}

export function transformMermaid($) {
  $(`${config.postContentSelector} ${config.mermaid.selector}`).each((i, el) => {
    const $el = $(el);
    const diagram = $el.text();
    console.log("rendering mermaid diagram...");
    const svg = renderMermaid(diagram);
    $el.replaceWith(svg);
  });
}
