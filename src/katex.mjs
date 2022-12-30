import katex from 'katex';
import {splitAtDelimiters} from './splitAtDelimiters.mjs';
import { config } from './config.mjs';

function renderKatex(math) {
  return katex.renderToString(math, {
    throwOnError: true
  });
}

function renderKatexInTextEl(text) {
  const delimited = splitAtDelimiters(text, config.katex.delimiters);
  const transformed = delimited.reduce((result, block) => {
    if (block.type === 'math') {
      console.log("rendering math block...");
      return result + renderKatex(block.data);
    } else {
      return result + block.data;
    }
  }, '');
  return transformed;
}

function transformElKatex($, parentEl) {
  $(parentEl).contents().each((i, el) => {
    if (el.nodeType === 3) /* text node */ {
      const $el = $(el);
      $el.replaceWith(renderKatexInTextEl($el.text()));
    } else if (el.nodeType === 1) /* element node */ {
      if (config.katex.ignoredTags.includes(el.tagName.toUpperCase())) return;
      transformElKatex($, el);
    }
  });
}

export function transformKatex($) {
  transformElKatex($, $(config.postContentSelector));
}