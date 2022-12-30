import katex from 'katex';
import {execSync} from 'child_process';
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const TMPDIR = fs.mkdtempSync('tmpblog');

// Note -- the following few functions are from 
// https://github.com/KaTeX/KaTeX/blob/main/contrib/auto-render/splitAtDelimiters.js
const findEndOfMath = function(delimiter, text, startIndex) {
  // Adapted from
  // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
  let index = startIndex;
  let braceLevel = 0;

  const delimLength = delimiter.length;

  while (index < text.length) {
      const character = text[index];

      if (braceLevel <= 0 &&
          text.slice(index, index + delimLength) === delimiter) {
          return index;
      } else if (character === "\\") {
          index++;
      } else if (character === "{") {
          braceLevel++;
      } else if (character === "}") {
          braceLevel--;
      }

      index++;
  }

  return -1;
};

const escapeRegex = function(string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

const amsRegex = /^\\begin{/;

const splitAtDelimiters = function(text, delimiters) {
  let index;
  const data = [];

  const regexLeft = new RegExp(
      "(" + delimiters.map((x) => escapeRegex(x.left)).join("|") + ")"
  );

  while (true) {
      index = text.search(regexLeft);
      if (index === -1) {
          break;
      }
      if (index > 0) {
          data.push({
              type: "text",
              data: text.slice(0, index),
          });
          text = text.slice(index); // now text starts with delimiter
      }
      // ... so this always succeeds:
      const i = delimiters.findIndex((delim) => text.startsWith(delim.left));
      index = findEndOfMath(delimiters[i].right, text, delimiters[i].left.length);
      if (index === -1) {
          break;
      }
      const rawData = text.slice(0, index + delimiters[i].right.length);
      const math = amsRegex.test(rawData)
          ? rawData
          : text.slice(delimiters[i].left.length, index);
      data.push({
          type: "math",
          data: math,
          rawData,
          display: delimiters[i].display,
      });
      text = text.slice(index + delimiters[i].right.length);
  }

  if (text !== "") {
      data.push({
          type: "text",
          data: text,
      });
  }

  return data;
};


function writeTmpFile(name, content) {
  const p = path.join(TMPDIR, name)
  fs.writeFileSync(p, content);
  return p;
}

function renderKatex(math) {
  return katex.renderToString(math, {
    throwOnError: true
  });
}

function renderMermaid(diagram) {
  // Note -- Mermaid seems to require a browser environment,
  // which is why we call mmdc instead of using mermaid as a library.
  // Also I can't get the stdin piping to work, so using a temporary file.
  const f = writeTmpFile('diagram.mmd', diagram);
  execSync(`mmdc -i ${f} -p .puppeteerrc -b transparent`, {
    encoding: 'utf8',
  });
  const output = fs.readFileSync(f + '.svg', 'utf8');
  return output;
}

function renderKatexInTextEl(text) {
  // delimiter settings from:
  // https://github.com/KaTeX/KaTeX/blob/main/contrib/auto-render/auto-render.js
  const delimiters = [
    {left: "$$", right: "$$", display: true},
    {left: "\\(", right: "\\)", display: false},
    // LaTeX uses $…$, but it ruins the display of normal `$` in text:
    // {left: "$", right: "$", display: false},
    // $ must come after $$

    // Render AMS environments even if outside $$…$$ delimiters.
    {left: "\\begin{equation}", right: "\\end{equation}", display: true},
    {left: "\\begin{align}", right: "\\end{align}", display: true},
    {left: "\\begin{alignat}", right: "\\end{alignat}", display: true},
    {left: "\\begin{gather}", right: "\\end{gather}", display: true},
    {left: "\\begin{CD}", right: "\\end{CD}", display: true},

    {left: "\\[", right: "\\]", display: true},
  ];
  const delimited = splitAtDelimiters(text, delimiters);
  const transformed = delimited.reduce((result, block) => {
    if (block.type === 'math') {
      console.log("rendering math block", block.data);
      return result + renderKatex(block.data);
    } else {
      return result + block.data;
    }
  }, '');
  return transformed;
}

const ignoredTags = ["SCRIPT", "NOSCRIPT", "STYLE", "TEXTAREA", "PRE", "CODE", "OPTION", "SVG",];

function transformElKatex($, parentEl) {
  $(parentEl).contents().each((i, el) => {
    if (el.nodeType === 3) /* text node */ {
      const $el = $(el);
      $el.replaceWith(renderKatexInTextEl($el.text()));
    } else if (el.nodeType === 1) /* element node */ {
      if (ignoredTags.includes(el.tagName.toUpperCase())) return;
      transformElKatex($, el);
    }
  });
}

function transformFile(file) {
  console.log("transforming file", file);
  const $ = cheerio.load(fs.readFileSync(file, { encoding: 'utf8' }));

  $('.post-content .mermaid').each((i, el) => {
    const $el = $(el);
    const diagram = $el.text();
    console.log("rendering mermaid diagram", diagram);
    const svg = renderMermaid(diagram);
    $el.replaceWith(svg);
  });

  transformElKatex($, $('.post-content'));

  fs.writeFileSync(file, $.html(), { encoding: 'utf8' });
}

function transformDirectory(dir) {
  for (const f of fs.readdirSync(dir, { encoding: 'utf8', withFileTypes: true })) {
    if (f.isDirectory()) {
      transformDirectory(path.join(dir, f.name));
    } else if (f.name.endsWith('.html')) {
      transformFile(path.join(dir, f.name));
    }
  }
}

transformDirectory('input');